// Post-build sanity checks for dist/. Fails CI loudly on structural drift.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const SITE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ROOT = path.dirname(SITE);
const DIST = path.join(SITE, 'dist');

const PAGES = [
  '404.html', 'about.html', 'australia-pathway-guide.html', 'contact.html',
  'english-placement-test.html', 'faq.html', 'gulf-pathway-guide.html', 'index.html', 'oet-listening-tips.html',
  'oet-materials-support.html', 'oet-reading-tips.html', 'oet-speaking-tips.html',
  'oet-tips.html', 'oet-writing-tips.html', 'pricing.html', 'service.html',
  'oet-course-for-nurses.html', 'oet-course-for-doctors.html', 'oet-writing-correction.html',
  'oet-score-calculator.html', 'oet-score-requirements.html', 'oet-test-dates-and-fees.html', 'oet-vs-ielts.html', 'oet-for-ecfmg.html', 'oet-writing-sample-nursing.html', 'oet-writing-sample-medicine.html',
  'oet-writing-sample-pharmacy.html', 'oet-writing-sample-physiotherapy.html', 'oet-writing-sample-nursing-transfer.html', 'oet-speaking-role-play-nursing.html', 'oet-speaking-role-play-medicine.html',
  'ar/index.html', 'ar/oet-course-for-nurses.html', 'ar/oet-course-for-doctors.html',
  'ar/oet-score-requirements.html', 'ar/oet-test-dates-and-fees.html', 'ar/oet-vs-ielts.html', 'ar/oet-writing-tips.html',
  'oet-sample-tests.html', 'oet-for-allied-health.html',
  'oet-course-for-pharmacists.html', 'oet-course-for-physiotherapists.html', 'oet-speaking-role-play-pharmacy.html', 'oet-speaking-role-play-physiotherapy.html',
  'success-stories.html', 'teaching-approach.html', 'uk-pathway-guide.html',
  'usa-pathway-guide.html', 'cookie-policy/index.html', 'privacy/index.html',
  'refund-policy/index.html', 'terms/index.html',
];

let failures = 0;
const fail = (msg) => { failures += 1; console.error('FAIL ' + msg); };

for (const page of PAGES) {
  const file = path.join(DIST, page);
  if (!existsSync(file)) { fail(`${page}: missing from dist`); continue; }
  const html = readFileSync(file, 'utf8');

  if (!html.includes('</head>')) fail(`${page}: no </head>`);
  if (!/<header\b/.test(html)) fail(`${page}: no <header>`);
  if (!/<footer\b/.test(html)) fail(`${page}: no <footer>`);
  if (!html.includes('oet-community-popup')) fail(`${page}: community popup missing`);
  if (/\$\d(?![\d.])/.test(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')))
    fail(`${page}: literal $n backreference leaked into markup`);
  if (html.includes('<base ')) fail(`${page}: <base> tag present (root-absolute policy)`);

  // header Login / Register CTA: the nav pill (>=1500px) and the action-item link (below 1500px) both
  // carry the signed-in swap target; neither may carry an id (the drawer clones the nav); the action-item
  // link sits before the hamburger; the oet_signed_in hint script ships in <head>
  const ctaLinks = html.match(/<a\b[^>]*\bdata-dashboard-href="https:\/\/app\.oetwithdrhesham\.co\.uk\/"[^>]*>/g) || [];
  if (ctaLinks.length !== 2) fail(`${page}: expected 2 header Login/Dashboard CTA links (nav pill + action item), found ${ctaLinks.length}`);
  if (ctaLinks.some((tag) => /\sid=/.test(tag))) fail(`${page}: header Login/Dashboard CTA link must not carry an id (nav is cloned into the drawer)`);
  if (!/vl-header-action-item[^"]*">\s*<a class="oet-header-login"[^>]*>[\s\S]*?<button[^>]*vl-offcanvas-toggle/.test(html))
    fail(`${page}: header CTA must sit before the hamburger inside .vl-header-action-item`);
  if (!html.includes('oet_signed_in=1')) fail(`${page}: signed-in hint head script missing`);

  // every hashed local asset must exist on disk
  for (const m of html.matchAll(/(?:href|src)="(\/assets\/(?:css|js)\/[^"?]+)\?v=[0-9a-f]{10}"/g)) {
    if (!existsSync(path.join(ROOT, m[1].slice(1)))) fail(`${page}: hashed asset missing on disk: ${m[1]}`);
  }
  // unhashed local css/js refs mean postbuild missed them
  for (const m of html.matchAll(/(?:href|src)="(\/assets\/(?:css|js)\/[^"?]+\.(?:css|js))"(?!\?)/g)) {
    fail(`${page}: unhashed asset ref: ${m[1]}`);
  }
  // JSON-LD must parse
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { fail(`${page}: invalid JSON-LD`); }
  }

  // SEO: one H1 per page; links use the canonical placement-test URL
  const h1s = html.match(/<h1\b/g) || [];
  if (h1s.length !== 1) fail(`${page}: expected exactly 1 <h1>, found ${h1s.length}`);
  if (html.includes('href="/english-placement-test.html"')) fail(`${page}: link /english-placement-test (canonical), not .html`);
  // every WhatsApp link carries exactly one [page: …] tag naming this page (postbuild tagWhatsApp)
  const tag = encodeURIComponent(`[page: ${page === 'index.html' ? 'home' : page.replace(/\/index\.html$|\.html$/, '')}]`);
  for (const m of html.matchAll(/href="(https:\/\/wa\.me\/[^"]*)"/g)) {
    if (!m[1].includes('?text=') || m[1].split('%5Bpage%3A').length !== 2 || !m[1].endsWith(tag))
      fail(`${page}: WhatsApp link not tagged with ${decodeURIComponent(tag)}: ${m[1].slice(0, 90)}`);
  }
}

// sitemap: well-formed, all URLs map to built pages
const sitemapFile = path.join(DIST, 'sitemap.xml');
if (!existsSync(sitemapFile)) fail('sitemap.xml missing from dist');
else {
  const sm = readFileSync(sitemapFile, 'utf8');
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length !== 51) fail(`sitemap has ${urls.length} URLs, expected 51`);
  // Clean URLs served via .htaccess rewrites map to their built .html file.
  const CLEAN_URL_ALIASES = { 'english-placement-test': 'english-placement-test.html' };
  for (const u of urls) {
    const rel = u.replace('https://oetwithdrhesham.co.uk/', '');
    const target = CLEAN_URL_ALIASES[rel]
      ?? (rel === '' ? 'index.html' : rel.endsWith('/') ? rel + 'index.html' : rel);
    if (!existsSync(path.join(DIST, target))) fail(`sitemap URL has no built page: ${u}`);
  }
}

// pricing totals stay consistent with the data file
const pricing = JSON.parse(readFileSync(path.join(SITE, 'src/data/pricing.json'), 'utf8'));
const pricingHtml = readFileSync(path.join(DIST, 'pricing.html'), 'utf8');
const rendered = pricingHtml.match(/<div class="oet-pricing-price"><strong>&pound;\d+<\/strong>/g) || [];
if (rendered.length !== pricing.length)
  fail(`pricing: ${rendered.length} rendered cards vs ${pricing.length} in pricing.json`);

// structured data (Google Search Console repair): every VideoObject site-wide
// must carry a real, timezone-aware ISO 8601 uploadDate; every merchant
// Product must carry a real absolute image and a valid Brand object.
// Optional merchant fields (shippingDetails, aggregateRating, review) must
// never be fabricated, so their absence is asserted, not their presence.
const ISO8601_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const PLACEHOLDER_DATES = ['2024-01-01T00:00:00+00:00'];
function ldBlocks(html) {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { out.push(JSON.parse(m[1])); } catch { /* reported by the parse check above */ }
  }
  return out;
}
function walk(node, cb) {
  if (Array.isArray(node)) { node.forEach((n) => walk(n, cb)); return; }
  if (node && typeof node === 'object') {
    cb(node);
    for (const v of Object.values(node)) walk(v, cb);
  }
}
function nodesOfType(blocks, type) {
  const found = [];
  for (const b of blocks) walk(b, (n) => { if (n['@type'] === type) found.push(n); });
  return found;
}
const distHtml = {};
for (const page of PAGES) {
  const file = path.join(DIST, page);
  if (existsSync(file)) distHtml[page] = readFileSync(file, 'utf8');
}

// systemic: no VideoObject anywhere may miss uploadDate or use a placeholder
for (const [page, html] of Object.entries(distHtml)) {
  for (const v of nodesOfType(ldBlocks(html), 'VideoObject')) {
    const label = `${page} video "${String(v.name || '').slice(0, 60)}"`;
    if (typeof v.uploadDate !== 'string' || !ISO8601_TZ.test(v.uploadDate))
      fail(`${label}: uploadDate missing or not timezone-aware ISO 8601`);
    else if (PLACEHOLDER_DATES.includes(v.uploadDate))
      fail(`${label}: uploadDate is a placeholder, not the real publish date`);
    const thumbs = Array.isArray(v.thumbnailUrl) ? v.thumbnailUrl : [v.thumbnailUrl];
    if (!thumbs.length || !thumbs.every((t) => typeof t === 'string' && t.startsWith('https://')))
      fail(`${label}: thumbnailUrl must be absolute https`);
    if (typeof v.embedUrl !== 'string' && typeof v.contentUrl !== 'string')
      fail(`${label}: needs embedUrl or contentUrl`);
  }
  // no dynamic timestamps may leak into static JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    if (m[1].includes('Date.now(') || m[1].includes('new Date('))
      fail(`${page}: JSON-LD must use fixed publish dates, not dynamic timestamps`);
  }
}

// systemic: every merchant Product (Product with offers) needs image + Brand
for (const [page, html] of Object.entries(distHtml)) {
  for (const p of nodesOfType(ldBlocks(html), 'Product')) {
    if (!p.offers) continue;
    const label = `${page} product "${String(p.name || '').slice(0, 60)}"`;
    const imgs = Array.isArray(p.image) ? p.image : [p.image];
    if (!imgs.length || !imgs.every((u) => typeof u === 'string' && u.startsWith('https://oetwithdrhesham.co.uk/')))
      fail(`${label}: image must be an absolute production URL`);
    if (!p.brand || p.brand['@type'] !== 'Brand' || typeof p.brand.name !== 'string' || !p.brand.name)
      fail(`${label}: brand must be a Brand object with a real name`);
    const offers = Array.isArray(p.offers) ? p.offers : [p.offers];
    for (const o of offers) {
      if (!o.price || !o.priceCurrency || !o.url)
        fail(`${label}: offer needs price/priceCurrency/url`);
    }
    for (const forbidden of ['aggregateRating', 'review', 'shippingDetails']) {
      let seen = false;
      walk(p, (n) => { if (Object.prototype.hasOwnProperty.call(n, forbidden)) seen = true; });
      if (seen) fail(`${label}: ${forbidden} must not be fabricated`);
    }
  }
}

// systemic: FAQPage questions/answers must match visible page text (Google policy)
const NAMED = { amp: '&', nbsp: ' ', ndash: '–', mdash: '—', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', quot: '"', hellip: '…', pound: '£', middot: '·', lt: '<', gt: '>' };
const visibleText = (s) => s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, e) => NAMED[e] ?? ' ')
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();
for (const [page, html] of Object.entries(distHtml)) {
  const vis = visibleText((html.match(/<main[\s\S]*<\/main>/) || [''])[0]);
  for (const q of nodesOfType(ldBlocks(html), 'Question')) {
    if (!vis.includes(visibleText(q.name || '')) || !vis.includes(visibleText(q.acceptedAnswer?.text || '')))
      fail(`${page}: FAQ JSON-LD not visible verbatim on the page: "${String(q.name).slice(0, 60)}"`);
  }
}

// icons: the icon font is subset, so every fa-* class used must be mapped in oet-icons.css
{
  const mapped = new Set([...readFileSync(path.join(ROOT, 'assets/css/oet-icons.css'), 'utf8').matchAll(/\.(fa-[a-z0-9-]+):+before/g)].map((m) => m[1]));
  const STYLE = new Set(['fa-solid', 'fa-regular', 'fa-brands', 'fa-fw', 'fa-spin', 'fa-lg', 'fa-xs', 'fa-sm', 'fa-2x']);
  for (const [page, html] of Object.entries(distHtml)) {
    for (const cls of new Set([...html.matchAll(/class="([^"]*\bfa-[^"]*)"/g)].flatMap((m) => m[1].match(/\bfa-[a-z0-9-]+/g)))) {
      if (!STYLE.has(cls) && !mapped.has(cls)) fail(`${page}: icon ${cls} is not in the subset icon font (assets/css/oet-icons.css)`);
    }
  }
}

// hreflang: every alternate exists and links back; Arabic pages declare lang="ar"
{
  const toPage = (u) => { const rel = u.replace('https://oetwithdrhesham.co.uk/', ''); return rel === '' ? 'index.html' : rel.endsWith('/') ? rel + 'index.html' : rel; };
  const alts = (html) => [...html.matchAll(/<link rel="alternate" hreflang="([a-zA-Z-]+)" href="([^"]+)"/g)].map((m) => ({ lang: m[1], href: m[2] }));
  for (const [page, html] of Object.entries(distHtml)) {
    if (page.startsWith('ar/') && !/<html lang="ar"/.test(html)) fail(`${page}: Arabic page must declare <html lang="ar">`);
    for (const a of alts(html)) {
      const target = distHtml[toPage(a.href)];
      if (!target) fail(`${page}: hreflang ${a.lang} points to a page that is not built: ${a.href}`);
      else if (!alts(target).some((b) => toPage(b.href) === page)) fail(`${page}: hreflang ${a.lang} target ${a.href} does not link back`);
    }
  }
}

// score calculator logic (assets/js/oet-score-calculator.js) — grade bands and regulator checks
{
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(readFileSync(path.join(ROOT, 'assets/js/oet-score-calculator.js'), 'utf8'), sandbox);
  const calc = sandbox.OetScoreCalc;
  const bands = [[500, 'A'], [450, 'A'], [440, 'B'], [350, 'B'], [340, 'C+'], [300, 'C+'], [290, 'C'], [200, 'C'], [190, 'D'], [100, 'D'], [90, 'E'], [0, 'E']];
  for (const [s, g] of bands) if (calc.grade(s) !== g) fail(`score calculator: grade(${s}) should be ${g}, got ${calc.grade(s)}`);
  const byName = (res, prefix) => res.find((r) => r.rule.name.startsWith(prefix));
  const nurse = calc.check({ L: 350, R: 350, W: 300, S: 350 });
  if (!byName(nurse, 'NMC').ok || byName(nurse, 'GMC').short.join() !== 'W') fail('score calculator: NMC/GMC check for L350 R350 W300 S350 is wrong');
  if (byName(nurse, 'Ahpra').short.join() !== 'R,W,S') fail('score calculator: Ahpra 2026 minimums (L350 R360 W350 S360) not applied');
}

// page-level: exactly one JSON-LD block on schema-heavy pages (no duplicates)
for (const page of ['pricing.html', 'teaching-approach.html', 'success-stories.html']) {
  if (distHtml[page] && ldBlocks(distHtml[page]).length !== 1)
    fail(`${page}: expected exactly 1 JSON-LD block, found ${ldBlocks(distHtml[page]).length}`);
}
// page-level: expected entity counts catch silent drops during edits
const structuredCount = pricing.filter((p) => p.structuredData).length;
if (distHtml['pricing.html'] && nodesOfType(ldBlocks(distHtml['pricing.html']), 'Product').length !== structuredCount)
  fail(`pricing: JSON-LD Product count drifted from pricing.json structuredData entries (${structuredCount})`);
if (distHtml['teaching-approach.html'] && nodesOfType(ldBlocks(distHtml['teaching-approach.html']), 'VideoObject').length !== 8)
  fail('teaching-approach: expected 8 VideoObject entries');
if (distHtml['success-stories.html'] && nodesOfType(ldBlocks(distHtml['success-stories.html']), 'VideoObject').length !== 3)
  fail('success-stories: expected 3 VideoObject entries');
// pricing offers must reference the genuine refund policy page
if (distHtml['pricing.html']) {
  for (const p of nodesOfType(ldBlocks(distHtml['pricing.html']), 'Product')) {
    const offers = Array.isArray(p.offers) ? p.offers : [p.offers];
    for (const o of offers) {
      const rp = o.hasMerchantReturnPolicy;
      if (!rp || rp.merchantReturnLink !== 'https://oetwithdrhesham.co.uk/refund-policy/')
        fail(`pricing product "${String(p.name || '').slice(0, 50)}": offer must link the real refund policy`);
      // Google's merchant listings accept only these returnMethod enum values.
      // returnMethod is recommended (not required), so omitting it is valid;
      // this guards against reintroducing an invented value like KeepProduct.
      const VALID_RETURN_METHODS = ['https://schema.org/ReturnByMail', 'https://schema.org/ReturnInStore', 'https://schema.org/ReturnAtKiosk'];
      if (rp && Object.prototype.hasOwnProperty.call(rp, 'returnMethod')) {
        const methods = Array.isArray(rp.returnMethod) ? rp.returnMethod : [rp.returnMethod];
        if (!methods.every((m) => VALID_RETURN_METHODS.includes(m)))
          fail(`pricing product "${String(p.name || '').slice(0, 50)}": returnMethod must be a Google-accepted enum or omitted`);
      }
    }
  }
  const pricingImage = path.join(ROOT, 'assets/img/og/og-pricing.png');
  if (!existsSync(pricingImage)) fail('pricing: schema image asset missing on disk: assets/img/og/og-pricing.png');
}

if (failures) {
  console.error(`\nverify: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`verify: ${PAGES.length} pages + sitemap + pricing data OK`);
