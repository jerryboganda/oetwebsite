// Post-build sanity checks for dist/. Fails CI loudly on structural drift.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SITE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ROOT = path.dirname(SITE);
const DIST = path.join(SITE, 'dist');

const PAGES = [
  '404.html', 'about.html', 'australia-pathway-guide.html', 'contact.html',
  'faq.html', 'gulf-pathway-guide.html', 'index.html', 'oet-listening-tips.html',
  'oet-materials-support.html', 'oet-reading-tips.html', 'oet-speaking-tips.html',
  'oet-tips.html', 'oet-writing-tips.html', 'pricing.html', 'service.html',
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
}

// sitemap: well-formed, all URLs map to built pages
const sitemapFile = path.join(DIST, 'sitemap.xml');
if (!existsSync(sitemapFile)) fail('sitemap.xml missing from dist');
else {
  const sm = readFileSync(sitemapFile, 'utf8');
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length !== 22) fail(`sitemap has ${urls.length} URLs, expected 22`);
  for (const u of urls) {
    const rel = u.replace('https://oetwithdrhesham.co.uk/', '');
    const target = rel === '' ? 'index.html' : rel.endsWith('/') ? rel + 'index.html' : rel;
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
