// Post-build pipeline:
//   1. add content-hash ?v= cache busters to /assets/css|js refs in dist HTML
//   2. regenerate sitemap.xml (lastmod = last git commit touching the page's partials)
//   3. copy dist HTML (+ sitemap) onto the repo root, which is the deployable webroot
//      (assets/, PHP endpoints, .htaccess, robots.txt, login.html live there already)
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ROOT = path.dirname(SITE);
const DIST = path.join(SITE, 'dist');

const PAGES = [
  // [dist-relative html, site URL path or null (not in sitemap), changefreq, priority]
  ['index.html', '/', 'weekly', '1.0'],
  ['pricing.html', '/pricing.html', 'weekly', '0.9'],
  ['success-stories.html', '/success-stories.html', 'weekly', '0.9'],
  ['service.html', '/service.html', 'weekly', '0.8'],
  ['about.html', '/about.html', 'monthly', '0.8'],
  ['contact.html', '/contact.html', 'monthly', '0.8'],
  ['faq.html', '/faq.html', 'monthly', '0.8'],
  ['oet-tips.html', '/oet-tips.html', 'weekly', '0.8'],
  ['oet-writing-tips.html', '/oet-writing-tips.html', 'monthly', '0.7'],
  ['oet-speaking-tips.html', '/oet-speaking-tips.html', 'monthly', '0.7'],
  ['oet-listening-tips.html', '/oet-listening-tips.html', 'monthly', '0.7'],
  ['oet-reading-tips.html', '/oet-reading-tips.html', 'monthly', '0.7'],
  ['oet-materials-support.html', '/oet-materials-support.html', 'monthly', '0.7'],
  ['uk-pathway-guide.html', '/uk-pathway-guide.html', 'monthly', '0.7'],
  ['usa-pathway-guide.html', '/usa-pathway-guide.html', 'monthly', '0.7'],
  ['australia-pathway-guide.html', '/australia-pathway-guide.html', 'monthly', '0.7'],
  ['gulf-pathway-guide.html', '/gulf-pathway-guide.html', 'monthly', '0.7'],
  ['teaching-approach.html', '/teaching-approach.html', 'monthly', '0.7'],
  ['privacy/index.html', '/privacy/', 'yearly', '0.3'],
  ['terms/index.html', '/terms/', 'yearly', '0.3'],
  ['refund-policy/index.html', '/refund-policy/', 'yearly', '0.3'],
  ['cookie-policy/index.html', '/cookie-policy/', 'yearly', '0.3'],
  ['404.html', null, null, null],
];

const ORIGIN = 'https://oetwithdrhesham.co.uk';

// --- 1. cache busting -------------------------------------------------------
const hashCache = new Map();
function assetHash(assetPath) {
  if (!hashCache.has(assetPath)) {
    const file = path.join(ROOT, assetPath.replace(/^\//, ''));
    if (!fs.existsSync(file)) throw new Error(`hash: missing asset ${assetPath}`);
    hashCache.set(assetPath, createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 10));
  }
  return hashCache.get(assetPath);
}

function addHashes(html, name) {
  let count = 0;
  const out = html.replace(
    /(href|src)="(\/assets\/(?:css|js)\/[^"?]+\.(?:css|js))(\?[^"]*)?"/g,
    (_, attr, asset) => {
      count += 1;
      return `${attr}="${asset}?v=${assetHash(asset)}"`;
    },
  );
  if (count === 0) throw new Error(`hash: no css/js refs found in ${name}`);
  return out;
}

// --- 2. sitemap --------------------------------------------------------------
function lastmodFor(distRel) {
  const key = distRel === '404.html' ? '404' : distRel.replace(/\/index\.html$|\.html$/, '');
  const partials = path.join(SITE, 'src', 'partials', key);
  try {
    const out = execSync(`git log -1 --format=%cs -- "${path.relative(ROOT, partials)}"`, {
      cwd: ROOT, encoding: 'utf8',
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
  } catch { /* fall through */ }
  const files = fs.readdirSync(partials).map((f) => fs.statSync(path.join(partials, f)).mtime);
  return new Date(Math.max(...files)).toISOString().slice(0, 10);
}

function buildSitemap() {
  const rows = PAGES.filter(([, url]) => url).map(([rel, url, freq, prio]) =>
    `  <url><loc>${ORIGIN}${url}</loc><lastmod>${lastmodFor(rel)}</lastmod>` +
    `<changefreq>${freq}</changefreq><priority>${prio}</priority></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

// --- 3. run -------------------------------------------------------------------
const checkRoot = process.argv.includes('--check-root');
const copyToRoot = !checkRoot && !process.argv.includes('--no-copy');
let written = 0;
const drifted = [];
for (const [rel] of PAGES) {
  const distFile = path.join(DIST, rel);
  if (!fs.existsSync(distFile)) throw new Error(`postbuild: missing ${rel} in dist/`);
  const html = addHashes(fs.readFileSync(distFile, 'utf8'), rel);
  fs.writeFileSync(distFile, html);
  if (copyToRoot) {
    fs.writeFileSync(path.join(ROOT, rel), html);
    written += 1;
  } else if (checkRoot) {
    // Compare content modulo line endings: sources carry CRLF (committed from
    // Windows) so dist picks it up, while root blobs were normalized to LF by
    // core.autocrlf on commit. Raw byte comparison fails on CI for every page;
    // the gate exists to catch content drift, not EOL noise.
    const norm = (s) => s.replace(/\r\n?/g, '\n');
    const rootFile = path.join(ROOT, rel);
    if (!fs.existsSync(rootFile) || norm(fs.readFileSync(rootFile, 'utf8')) !== norm(html)) drifted.push(rel);
  }
}

if (checkRoot) {
  if (drifted.length) {
    console.error(`postbuild --check-root: root pages differ from build output:\n  ${drifted.join('\n  ')}` +
      `\nRun "npm run build" in site/ and commit the regenerated root pages.`);
    process.exit(1);
  }
  console.log(`postbuild --check-root: ${PAGES.length} root pages match build output`);
} else {
  const sitemap = buildSitemap();
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
  if (copyToRoot) fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

  console.log(`postbuild: hashed ${PAGES.length} pages, sitemap generated` +
    (copyToRoot ? `, ${written} pages + sitemap copied to repo root` : ' (dist only)'));
}
