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
  'oet-sample-tests.html', 'oet-for-allied-health.html', 'ar/oet-speaking-tips.html', 'ar/oet-sample-tests.html',
  'oet-writing-sample-nursing-referral.html', 'oet-writing-sample-medicine-discharge.html', 'oet-writing-sample-occupational-therapy.html',
  'oet-course-for-pharmacists.html', 'oet-course-for-physiotherapists.html', 'oet-speaking-role-play-pharmacy.html', 'oet-speaking-role-play-physiotherapy.html',
  'success-stories.html', 'teaching-approach.html', 'uk-pathway-guide.html',
  'usa-pathway-guide.html', 'cookie-policy/index.html', 'privacy/index.html',
  'refund-policy/index.html', 'terms/index.html',
  'blog/index.html', 'oet-practice.html',
  'oet-writing-referral-letter-structure.html', 'oet-writing-physiotherapy-referral-vs-discharge.html',
  'oet-reading-part-a-scanning.html', 'oet-reading-part-c-inference.html', 'oet-listening-part-a-note-taking.html',
  'oet-speaking-empathy-signposting.html', 'oet-computer-vs-paper.html',
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
  // carry the signed-in retarget (data-dashboard-href); neither may carry an id (the drawer clones the
  // nav); the action-item link sits before the hamburger; the oet_signed_in hint script ships in <head>.
  // Owner brief 28 Oct 2026: the visible label is ALWAYS "Login / Register" (no "My Dashboard" swap, no
  // guest/user label spans). The hint cookie only retargets the href; the label text is checked in the
  // chrome block below (visibleText is defined later).
  const ctaLinks = html.match(/<a\b[^>]*\bdata-dashboard-href="https:\/\/app\.oetwithdrhesham\.co\.uk\/"[^>]*>/g) || [];
  if (ctaLinks.length !== 2) fail(`${page}: expected 2 header Login / Register CTA links (nav pill + action item), found ${ctaLinks.length}`);
  if (ctaLinks.some((tag) => /\sid=/.test(tag))) fail(`${page}: header Login / Register CTA link must not carry an id (nav is cloned into the drawer)`);
  if (!/vl-header-action-item[^"]*">\s*<a class="oet-header-login"[^>]*>[\s\S]*?<button[^>]*vl-offcanvas-toggle/.test(html))
    fail(`${page}: header CTA must sit before the hamburger inside .vl-header-action-item`);
  if (!html.includes('oet_signed_in=1')) fail(`${page}: signed-in hint head script missing`);
  if (!html.includes('a[data-dashboard-href]') || !html.includes('data-login-href')) fail(`${page}: signed-in hint script no longer retargets a[data-dashboard-href] (session behaviour must be preserved)`);
  if (/My Dashboard|oet-auth-cta__(?:guest|user)|oet-signed-in/.test(html)) fail(`${page}: the "My Dashboard" label swap is back (the CTA always reads Login / Register)`);

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
  // WhatsApp prefills carry no user-visible technical labels such as "[page: …]" (postbuild prefillWhatsApp)
  for (const m of html.matchAll(/href="(https:\/\/wa\.me\/[^"]*)"/g)) {
    if (!m[1].includes('?text=') || /%5Bpage%3A|\[page:/i.test(m[1]))
      fail(`${page}: WhatsApp link without a clean prefill (no [page: …] labels): ${m[1].slice(0, 90)}`);
  }
  // Pricing: package choice goes to the app (free registration -> chosen destination), never WhatsApp
  if (page === 'pricing.html') {
    for (const dest of ['%2Fsubscriptions', '%2Fcompanion'])
      if (!html.includes(`href="https://app.oetwithdrhesham.co.uk/register?next=${dest}"`))
        fail(`pricing.html: missing app-first CTA register?next=${dest}`);
    const stickyBar = html.match(/<div class="oet-mobile-ctabar"[\s\S]*?<\/div>/);
    if (!stickyBar || stickyBar[0].includes('wa.me')) fail('pricing.html: mobile sticky CTA missing or links to WhatsApp');
  }
}

// sitemap: well-formed, all URLs map to built pages
const sitemapFile = path.join(DIST, 'sitemap.xml');
if (!existsSync(sitemapFile)) fail('sitemap.xml missing from dist');
else {
  const sm = readFileSync(sitemapFile, 'utf8');
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length !== 65) fail(`sitemap has ${urls.length} URLs, expected 65`);
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
const bundleTierCount = JSON.parse(readFileSync(path.join(SITE, 'src/data/bundles.json'), 'utf8')).families.reduce((n, f) => n + f.tiers.length, 0);
const structuredCount = pricing.filter((p) => p.structuredData).length + bundleTierCount; // + the Full / Crash bundle offers (src/data/bundles.json)
if (distHtml['pricing.html'] && nodesOfType(ldBlocks(distHtml['pricing.html']), 'Product').length !== structuredCount)
  fail(`pricing: JSON-LD Product count drifted from pricing.json structuredData entries plus bundles.json tiers (${structuredCount})`);
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

// Full OET Course and Full Crash Course bundles (owner brief 28 Oct 2026; contract docs/FULL-CRASH-BUNDLES-2026-10-29.md in
// the web app repo): pricing.html top sections, the profession course pages' "Choose your course" block, one price source
// (src/data/bundles.json), the format rules, the live-catalog contract and TutorBook = 10 recall-based exams everywhere.
{
  const { loadBundles } = await import('../src/lib/bundles.mjs');
  const { data, kit, defaults } = loadBundles();
  const PRICES = { 'full-practice': 140, 'full-tutorbook': 165, ultimate: 220, 'crash-essential': 75, 'crash-letters': 100, 'crash-complete': 125 };
  const MONTHS = { 'full-practice': 6, 'full-tutorbook': 6, ultimate: 12, 'crash-essential': 6, 'crash-letters': 6, 'crash-complete': 6 };
  const SUFFIX = { medicine: 'medicine', nursing: 'nursing', pharmacy: 'pharmacy', physiotherapy: 'physiotherapy', 'other-allied-health': 'allied-health' };
  const CATALOG_URL = 'https://api.oetwithdrhesham.co.uk/v1/catalog/bundles';
  const tiers = data.families.flatMap((f) => f.tiers);

  // data file: the six approved tiers, prices, access, the Recommended middle tiers, the five professions
  if (tiers.map((t) => t.key).join() !== Object.keys(PRICES).join()) fail('bundles.json: tiers must be the six approved tiers in order');
  for (const t of tiers) {
    if (t.price !== PRICES[t.key]) fail(`bundles.json: ${t.key} must cost GBP ${PRICES[t.key]}`);
    if (t.accessMonths !== MONTHS[t.key]) fail(`bundles.json: ${t.key} must give ${MONTHS[t.key]} months of access`);
    if (t.recommended !== (t.key === 'full-tutorbook' || t.key === 'crash-complete')) fail(`bundles.json: only Full Course + TutorBook and Crash + TutorBook are Recommended (${t.key})`);
    if (t.recommended && t.badge !== 'Recommended') fail(`bundles.json: ${t.key} must carry the Recommended badge`);
    if (/<|>/.test(t.description)) fail(`bundles.json: ${t.key} has markup in its description`);
  }
  if (data.professions.map((p) => p.id).join() !== Object.keys(SUFFIX).join() || data.professions.some((p) => p.suffix !== SUFFIX[p.id]))
    fail('bundles.json: professions must be medicine, nursing, pharmacy, physiotherapy, other-allied-health (Modified Allied Health)');
  if (data.professions.find((p) => p.id === 'other-allied-health')?.label !== 'Modified Allied Health') fail('bundles.json: other-allied-health is shown as "Modified Allied Health"');
  if (data.formats.map((f) => f.id).join() !== 'computer,paper') fail('bundles.json: formats must be computer and paper');
  if (data.catalogUrl !== CATALOG_URL) fail(`bundles.json: catalogUrl must be ${CATALOG_URL}`);
  if (Object.keys(defaults).length !== 18) fail(`bundles.json: expected 18 plan codes (15 Full + 3 Crash), found ${Object.keys(defaults).length}`);
  for (const [fam, tier, price] of [['full', 1, 25], ['full', 2, 55], ['crash', 1, 25], ['crash', 2, 25]]) {
    const code = kit.slotCodes(data, fam, 'medicine')[tier - 1];
    if (!defaults[code].upgrades.some((u) => u.difference === price)) fail(`bundles: ${code} must offer an upgrade that costs the GBP ${price} difference`);
  }
  if (defaults['full-practice-medicine'].upgrades.map((u) => u.difference).join() !== '25,80' || defaults['crash-essential'].upgrades.map((u) => u.difference).join() !== '25,50')
    fail('bundles: upgrade differences must be 25/80 (Full 140) and 25/50 (Crash 75)');

  // format rules, every profession x format: computer = website L/R numbers, paper = W/S + handwritten upload + paper L/R
  // resources, never a negative "No online Listening or Reading" line, every website count says "on our website"
  const lineKeys = (html) => [...html.matchAll(/<li data-key="([a-z_]+)">/g)].map((m) => m[1]);
  for (const prof of data.professions) {
    for (const fmt of ['computer', 'paper']) {
      const ctx = kit.makeCtx(data, prof.id, fmt);
      for (const fam of data.families) {
        const codes = kit.slotCodes(data, fam.id, prof.id);
        codes.forEach((code, i) => {
          const want = fam.id === 'full' ? `${fam.tiers[i].key}-${SUFFIX[prof.id]}` : fam.tiers[i].key;
          if (code !== want) fail(`bundles: plan code ${code} should be ${want}`);
        });
        const html = kit.renderGrid(codes, defaults, ctx);
        const label = `bundles ${fam.id} ${prof.id}/${fmt}`;
        for (const card of html.split('<article ').slice(1)) {
          const code = (card.match(/data-code="([^"]+)"/) || [])[1];
          const keys = lineKeys(card);
          const has = (k) => keys.includes(k);
          if (!has('website_writing') || !has('website_speaking')) fail(`${label} ${code}: Writing and Speaking on our website must always be listed`);
          if (fmt === 'computer' && (!has('website_listening') || !has('website_reading') || has('paper_resources') || has('handwritten_upload')))
            fail(`${label} ${code}: Computer-Based shows the website Listening/Reading numbers and no paper-only lines`);
          if (fmt === 'paper' && (has('website_listening') || has('website_reading') || !has('paper_resources') || !has('handwritten_upload')))
            fail(`${label} ${code}: Paper-Based lists the handwritten upload and paper L/R resources, not website L/R exams`);
          for (const m of card.matchAll(/<li data-key="website_[a-z]+">([\s\S]*?)<\/li>/g))
            if (!/on our website/.test(m[1])) fail(`${label} ${code}: a website count line must say "on our website"`);
          if (/no online|online listening or reading/i.test(card.replace(/<[^>]+>/g, ' '))) fail(`${label} ${code}: no negative "No online Listening or Reading" line`);
          for (const kind of ['register', 'sign-in'])
            if (!card.includes(`href="https://app.oetwithdrhesham.co.uk/${kind}?next=%2Fsubscriptions%3Fpackage%3D${code}%26profession%3D${prof.id}%26format%3D${fmt}"`)) fail(`${label} ${code}: ${kind} link must carry package, profession and format INSIDE next`);
        }
      }
    }
  }
  if (/no online/i.test(readFileSync(path.join(ROOT, 'assets/js/oet-bundles.js'), 'utf8')) || /no online/i.test(JSON.stringify(data)))
    fail('bundles: a negative "No online Listening or Reading" line must never be authored');

  // live catalog contract (pure functions): overwrite by plan code, hide what is not on sale, ignore junk, never invent a card
  {
    const pick = (code, over = {}) => ({ code, family: 'full', tier: 2, profession: 'medicine', price: 170, accessMonths: 6, recommended: true, badge: 'Recommended', ...over });
    const ok = kit.mergeLive(defaults, { catalogVersion: 'abc', families: [{ id: 'full', bundles: [pick('full-tutorbook-medicine', { price: 170 }), pick('full-practice-medicine', { price: 141, recommended: false, badge: null }), pick('does-not-exist', { price: 1 })] }] });
    if (!ok || ok.bundles['full-tutorbook-medicine'].price !== 170 || ok.bundles['full-practice-medicine'].price !== 141) fail('bundles: a live catalog must overwrite price by plan code');
    if (ok && (ok.bundles['ultimate-medicine'] !== null || ok.bundles['does-not-exist'] !== undefined)) fail('bundles: plans missing from a live catalog are hidden and unknown codes never create a card');
    if (ok && ok.bundles['full-practice-medicine'].upgrades.map((u) => u.difference).join() !== '29') fail('bundles: live upgrade hints are derived from live prices for the plans on sale');
    if (kit.mergeLive(defaults, {}) !== null || kit.mergeLive(defaults, { families: [{ bundles: [pick('full-tutorbook-medicine', { price: 'x' })] }] }) !== null || kit.mergeLive(defaults, null) !== null)
      fail('bundles: an empty or malformed live catalog must leave the build-time defaults alone');
  }

  // pricing.html: the two top sections, one data blob, CTAs, JSON-LD offers, hero and nav links
  const ph = distHtml['pricing.html'] || '';
  for (const [id, fam] of [['full-oet-courses', 'full'], ['crash-courses', 'crash']]) {
    if (!new RegExp(`<section id="${id}"[^>]*data-oet-bundles data-family="${fam}"[^>]*data-catalog="static"`).test(ph)) fail(`pricing.html: section #${id} must be a data-oet-bundles section starting as data-catalog="static"`);
    if (!ph.includes(`name="oet-bundle-format-${fam}"`)) fail(`pricing.html: #${id} needs its own exam-format selector`);
  }
  if (!ph.includes('name="oet-bundle-profession-full"')) fail('pricing.html: the Full section needs the profession selector');
  for (const label of ['Medicine', 'Nursing', 'Pharmacy', 'Physiotherapy', 'Modified Allied Health', 'Computer-Based', 'Paper-Based'])
    if (!ph.includes(`<span>${label}</span></label>`)) fail(`pricing.html: selector option "${label}" missing`);
  if (ph.indexOf('id="full-oet-courses"') > ph.indexOf('id="full-recorded-courses"')) fail('pricing.html: the new Full/Crash sections must sit above the existing catalogue');
  for (const dest of ['#full-oet-courses', '#crash-courses'])
    if (!new RegExp(`class="oet-bundle-herolink[^"]*" href="${dest}"`).test(ph) || !ph.includes(`<li><a href="${dest}">`)) fail(`pricing.html: hero shortcut and quick-nav link to ${dest} required`);
  if ((ph.match(/<article class="oet-bundle-card/g) || []).length !== 6) fail('pricing.html: expected 6 default tier cards (3 Full for Medicine + 3 Crash)');
  if ((ph.match(/data-bundle-stale hidden/g) || []).length !== 2) fail('pricing.html: each bundle section needs a hidden "live prices could not be loaded" note');
  const blob = (ph.match(/<script type="application\/json" id="oet-bundles-data">([\s\S]*?)<\/script>/) || [])[1];
  try { if (JSON.parse(blob).catalogUrl !== CATALOG_URL) fail('pricing.html: embedded bundle data has the wrong catalogUrl'); } catch { fail('pricing.html: embedded bundle data is missing or invalid JSON'); }
  for (const t of tiers) {
    const code = t.key.startsWith('crash') ? t.key : `${t.key}-medicine`;
    const card = (ph.match(new RegExp(`<article class="oet-bundle-card[^"]*" data-code="${code}"[\\s\\S]*?</article>`)) || [''])[0];
    if (!card) { fail(`pricing.html: no card for plan ${code}`); continue; }
    if (!card.includes(`<strong data-field="price">&pound;${t.price}</strong>`)) fail(`pricing.html: ${code} must show GBP ${t.price}`);
    if (!card.includes(`<h3>${t.name.replace(/&/g, '&amp;')}</h3>`) || !card.includes(t.description.replace(/&/g, '&amp;'))) fail(`pricing.html: ${code} name/description drifted from bundles.json`);
    if (t.recommended !== card.includes('is-recommended')) fail(`pricing.html: ${code} Recommended badge mismatch`);
    for (const kind of ['register', 'sign-in'])
      if (!card.includes(`href="https://app.oetwithdrhesham.co.uk/${kind}?next=%2Fsubscriptions%3Fpackage%3D${code}%26profession%3Dmedicine%26format%3Dcomputer"`)) fail(`pricing.html: ${code} needs the ${kind} deep link with package, profession and format inside next`);
    if (!card.includes(`data-oet-cta="bundle_${t.key}"`)) fail(`pricing.html: ${code} must keep the data-oet-cta analytics attribute`);
    if (card.includes('TutorBook of Recalls') !== t.included.some((l) => l.key === 'tutorbook')) fail(`pricing.html: ${code} TutorBook line mismatch`);
    // JSON-LD offer for the tier
    const prod = nodesOfType(ldBlocks(ph), 'Product').find((p) => p.name === t.name && p.offers?.url?.endsWith(t.key.startsWith('crash') ? '#crash-courses' : '#full-oet-courses'));
    if (!prod) fail(`pricing.html: JSON-LD Product missing for ${t.name}`);
    else if (String(prod.offers.price) !== String(t.price) || prod.offers.priceCurrency !== 'GBP') fail(`pricing.html: JSON-LD offer for ${t.name} must be GBP ${t.price}`);
  }
  if (!ph.includes('No private Speaking session is included in these Crash tiers.')) fail('pricing.html: the Crash section must say "No private Speaking session is included in these Crash tiers."');
  if (!ph.includes('<noscript>')) fail('pricing.html: the bundle sections need a no-JavaScript note');
  if (!ph.includes('/assets/css/oet-bundles.css?v=') || !ph.includes('/assets/js/oet-bundles.js?v=')) fail('pricing.html: oet-bundles.css/js must be linked and hashed');

  // course pages: the "Choose your course" block with the page's own profession, same data
  for (const [page, prof] of [['oet-course-for-doctors.html', 'medicine'], ['oet-course-for-nurses.html', 'nursing'], ['oet-course-for-pharmacists.html', 'pharmacy'], ['oet-course-for-physiotherapists.html', 'physiotherapy'], ['oet-for-allied-health.html', 'other-allied-health']]) {
    const h = distHtml[page] || '';
    const sec = (h.match(/<section class="oet-resource-section oet-choose" id="choose-your-course"[\s\S]*?<\/section>/) || [''])[0];
    if (!sec) { fail(`${page}: "Choose your course" block missing`); continue; }
    if (!sec.includes(`data-oet-bundles-mini data-profession="${prof}" data-catalog="static"`)) fail(`${page}: block must be for ${prof} and start as data-catalog="static"`);
    if (!sec.includes(`href="/pricing.html?profession=${prof}#full-oet-courses"`)) fail(`${page}: block must link /pricing.html?profession=${prof}#full-oet-courses`);
    kit.slotCodes(data, 'full', prof).forEach((code, i) => {
      if (!new RegExp(`data-code="${code}"[\\s\\S]*?<strong data-field="price">&pound;${tiers[i].price}</strong>`).test(sec)) fail(`${page}: ${code} must show GBP ${tiers[i].price}`);
    });
    if ((sec.match(/<article class="oet-choose-card/g) || []).length !== 3 || (sec.match(/is-recommended/g) || []).length !== 1) fail(`${page}: three Full tiers expected, the middle one Recommended`);
    if (!h.includes('href="#sec-choose"')) fail(`${page}: the on-page contents must link the Choose your course block`);
    if (!h.includes('/assets/css/oet-bundles.css?v=') || !h.includes('/assets/js/oet-bundles.js?v=')) fail(`${page}: oet-bundles.css/js must be linked and hashed`);
    if (!h.includes('id="oet-bundles-data"')) fail(`${page}: embedded bundle data missing`);
  }
  if (!(distHtml['oet-for-allied-health.html'] || '').includes('Radiography, Optometry, Veterinary Science')) fail('oet-for-allied-health.html: the Modified Allied Health block must say who it covers');

  // TutorBook is 10 recall-based exams, never 8, on every page (English and Arabic)
  for (const [page, h] of Object.entries(distHtml)) {
    if (/\b8 full\b|\beight full\b|ثمانية امتحانات/i.test(h.replace(/<script type="application\/json"[\s\S]*?<\/script>/g, ''))) fail(`${page}: TutorBook is 10 full recall-based exams (found the old 8-exam wording)`);
  }
  if (!ph.includes('10 full recall-based exams')) fail('pricing.html: TutorBook must read "10 full recall-based exams"');

  // CSP lets the browser reach the catalog origin
  const htaccess = readFileSync(path.join(ROOT, '.htaccess'), 'utf8');
  const connect = (htaccess.match(/Content-Security-Policy "[^"]*connect-src ([^;"]*)/) || [, ''])[1].split(/\s+/);
  if (!connect.includes(new URL(CATALOG_URL).origin)) fail('.htaccess: CSP connect-src must allow https://api.oetwithdrhesham.co.uk (live catalog refresh)');
}

// 2026-10 redesign brief: navigation, footer, OET Blog and SEO quality gates
{
  const ORIGIN = 'https://oetwithdrhesham.co.uk';
  const urlOf = (page) => (page === 'index.html' ? '/' : page.endsWith('/index.html') ? `/${page.slice(0, -10)}`
    : page === 'english-placement-test.html' ? '/english-placement-test' : `/${page}`);
  const pageOf = (p) => (p === '/' ? 'index.html' : p.endsWith('/') ? `${p.slice(1)}index.html`
    : p === '/english-placement-test' ? 'english-placement-test.html' : p.slice(1));
  const idsOf = new Map(Object.entries(distHtml).map(([page, html]) => [page, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));

  // no dead ends: every internal link resolves to a built page / file, and every #fragment to an element
  for (const [page, html] of Object.entries(distHtml)) {
    for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)) {
      const href = m[1].replace(/&amp;/g, '&');
      if (href === '' || href === '#') { fail(`${page}: empty or "#" link`); continue; }
      if (/^javascript:/i.test(href)) { fail(`${page}: javascript: link`); continue; }
      if (/^(https?:|mailto:|tel:|\/\/)/i.test(href)) continue;
      const [pathPart, frag] = href.split('#');
      const clean = pathPart.split('?')[0];
      let target = page;
      if (clean) {
        if (!clean.startsWith('/')) { fail(`${page}: relative link ${href} (site links are root-absolute)`); continue; }
        target = pageOf(clean);
        if (!distHtml[target]) {
          if (!existsSync(path.join(ROOT, clean.slice(1))) || /\.html$/.test(clean)) { fail(`${page}: broken internal link ${href}`); continue; }
          target = null; // a real non-page file (asset, php)
        }
      }
      if (frag && target && !idsOf.get(target).has(frag)) fail(`${page}: link ${href} points at a missing #${frag}`);
    }
  }

  // unique <title> and meta description; self-referencing canonical on the apex https origin
  const seenTitle = new Map();
  const seenDesc = new Map();
  for (const [page, html] of Object.entries(distHtml)) {
    if (page === '404.html') continue;
    const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (!title) fail(`${page}: no <title>`);
    else if (seenTitle.has(title)) fail(`${page}: <title> duplicates ${seenTitle.get(title)}`);
    else seenTitle.set(title, page);
    if (!desc) fail(`${page}: no meta description`);
    else if (seenDesc.has(desc)) fail(`${page}: meta description duplicates ${seenDesc.get(desc)}`);
    else seenDesc.set(desc, page);
    if (canon !== ORIGIN + urlOf(page)) fail(`${page}: canonical ${canon} should be ${ORIGIN + urlOf(page)}`);
  }

  // chrome = the ORIGINAL owner-approved header and drawer (V3 brief, 27 Oct 2026), plus the approved
  // "OET Blog" item as a plain top-level link inside that original menu, plus (owner brief 28 Oct 2026)
  // the owner-approved GROUPED footer. Guards against the withdrawn 26 Oct redesign (6-item nav, drawer
  // actions, its footer markup, short login label) coming back.
  const TOP = ['About', 'Pricing', 'Download App', 'OET Courses', 'Free Resources', 'OET Blog', 'Free Placement Test', 'Contact'];
  // The footer groups, in order, and EVERY link each must keep as a real anchor (text -> href). The inventory
  // is the former Support + Top Links lists plus the Resources entry "OET Blog"; none may be dropped.
  const FOOTER_GROUPS = [
    ['Courses & Practice', [['OET Courses', '/service.html'], ['OET Course for Nurses', '/oet-course-for-nurses.html'], ['OET Course for Doctors', '/oet-course-for-doctors.html'],
      ['OET Writing Correction', '/oet-writing-correction.html'], ['Pricing', '/pricing.html'], ['كورس OET بالعربية', '/ar/'], ['Download Candidates App', '/pricing.html#download-app']]],
    ['Resources & Guides', [['OET Blog', '/blog/'], ['Free OET Sample Tests', '/oet-sample-tests.html'], ['Free Resources', '/oet-materials-support.html'], ['Speaking Tips', '/oet-speaking-tips.html'],
      ['OET Score Calculator', '/oet-score-calculator.html'], ['OET Score Requirements', '/oet-score-requirements.html'], ['Telegram Materials', 'https://t.me/Oet_with_Hesham'],
      ['UK Pathway Guide', '/uk-pathway-guide.html'], ['USA Pathway Guide', '/usa-pathway-guide.html']]],
    ['About & Support', [['About Dr. Hesham', '/about.html'], ['Teaching Approach', '/teaching-approach.html'], ['OET Programs', 'https://www.youtube.com/watch?v=hlD1BXfijWs'],
      ['WhatsApp Support', 'https://wa.me/447961725989'], ['Email Support', 'mailto:support@oetwithdrhesham.co.uk'], ['FAQ', '/faq.html'], ['Contact', '/contact.html'], ['Success Stories', '/success-stories.html']]],
    ['Stay Connected', [['Join Telegram Channel', 'https://t.me/Oet_with_Hesham'], ['Subscribe on YouTube', 'https://www.youtube.com/@drhesham222'], ['Join Facebook Community', 'https://www.facebook.com/groups/649430742699879/?ref=share']]],
  ];
  const SOCIAL = ['Facebook Group', 'YouTube Channel', 'Telegram Channel', 'WhatsApp Support', 'Instagram', 'LinkedIn'];
  const LEGAL = [['Terms & Conditions', '/terms/'], ['Privacy Policy', '/privacy/'], ['Refund Policy', '/refund-policy/'], ['Cookie Policy', '/cookie-policy/']];
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const mainJs = readFileSync(path.join(ROOT, 'assets/js/main.js'), 'utf8');
  const commonCss = readFileSync(path.join(ROOT, 'assets/css/oet-common.css'), 'utf8');
  if (!/querySelectorAll\("\.oet-nav-desktop-only"\)[\s\S]{0,80}\.remove\(\)/.test(mainJs)) fail('main.js must remove .oet-nav-desktop-only (the Contact row) from the cloned side menu');
  if (!mainJs.includes('footer .oet-footer-group') || !mainJs.includes('(min-width: 768px)')) fail('main.js must open the footer groups from 768px up');
  if (!/\.oet-footer-cols\{[^}]*display:grid/.test(commonCss) || !/footer\.vl-footer-10\.oet-footer\{padding-bottom:calc\(100px/.test(commonCss))
    fail('oet-common.css: the grouped footer grid or the contact-bubble clearance (footer bottom padding) is missing');
  for (const [page, html] of Object.entries(distHtml)) {
    if ((html.match(/id="vl-offcanvas-menu"/g) || []).length !== 1) fail(`${page}: expected exactly one offcanvas drawer`);
    const nav = (html.match(/<nav class="vl-mobile-menu-active"[\s\S]*?<\/nav>/) || [''])[0];
    // top-level items = the first link text of each <li> directly inside the nav's outer <ul>
    const found = [];
    let depth = 0;
    for (const m of nav.matchAll(/<(\/?)ul\b|<li\b[^>]*>\s*<a\b[^>]*>([^<]*)/g)) {
      if (m[2] === undefined) depth += m[1] ? -1 : 1;
      else if (depth === 1 && TOP.includes(m[2].trim())) found.push(m[2].trim());
    }
    if (found.join('|') !== TOP.join('|')) fail(`${page}: main nav must be the original ${TOP.join(' / ')} (found ${found.join(' / ')})`);
    if (!nav.includes('<li><a href="/blog/">OET Blog</a></li>')) fail(`${page}: main nav must keep the plain "OET Blog" link to /blog/`);
    // the side menu is this nav cloned by main.js; only the inline desktop nav keeps the Contact row
    if (!nav.includes('<li class="oet-nav-desktop-only"><a href="/contact.html">Contact</a></li>')) fail(`${page}: the inline nav's Contact row must carry oet-nav-desktop-only (main.js removes it from the side menu)`);
    if (/oet-drawer-actions|oet-footer-group-toggle|oet-footer-grid|oet-auth-cta__long/.test(html)) fail(`${page}: withdrawn 26 Oct redesign chrome is back (drawer actions / its footer markup / short login label)`);
    // header and drawer-clone CTA: the label is exactly Login / Register; signed-out it opens the existing sign-in entry
    const ctaTexts = [...html.matchAll(/<a\b[^>]*\bdata-dashboard-href="[^"]*"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => visibleText(m[1]));
    if (ctaTexts.length !== 2 || ctaTexts.some((t) => t !== 'login / register')) fail(`${page}: header CTA label must be exactly "Login / Register" (found ${JSON.stringify(ctaTexts)})`);
    if ((html.match(/href="https:\/\/app\.oetwithdrhesham\.co\.uk\/sign-in\?next=%2F"/g) || []).length < 2) fail(`${page}: the signed-out CTA must open the existing sign-in entry (sign-in?next=%2F)`);
    // drawer: "Support & Community" (not "Contact & Community") with the real support channels intact
    const drawer = (html.match(/<div id="vl-offcanvas-menu"[\s\S]*?<div class="vl-offcanvas-overlay">/) || [''])[0];
    if (!drawer.includes('<h3 class="vl-offcanvas-sm-title mb-20">Support &amp; Community</h3>') || html.includes('Contact &amp; Community')) fail(`${page}: drawer group heading must be "Support & Community"`);
    for (const label of ['Join Free Community', 'WhatsApp Support', 'Telegram Channel', 'Follow the Journey']) if (!drawer.includes(label)) fail(`${page}: drawer must keep "${label}"`);
    if ((drawer.match(/aria-label="(?:Facebook Group|YouTube Channel|Telegram Channel|WhatsApp Support|Instagram|LinkedIn)"/g) || []).length < 6) fail(`${page}: drawer must keep its six social icons`);
    // footer: the original brand/social/legal, links re-grouped into four closed-by-default <details>
    const footer = (html.match(/<footer\b[\s\S]*?<\/footer>/) || [''])[0];
    const groups = [...footer.matchAll(/<details class="oet-footer-group[^"]*">\s*<summary><h3[^>]*>([^<]*)<\/h3><\/summary>([\s\S]*?)<\/details>/g)];
    if (groups.map((g) => visibleText(g[1])).join('|') !== FOOTER_GROUPS.map(([t]) => t.toLowerCase()).join('|')) fail(`${page}: footer must have the groups ${FOOTER_GROUPS.map(([t]) => t).join(' / ')}`);
    if (/<details\b[^>]*\bopen\b/.test(footer)) fail(`${page}: footer groups must be closed in the markup (phone accordions; main.js opens them from 768px)`);
    FOOTER_GROUPS.forEach(([title, links], i) => {
      const body = groups[i] ? groups[i][2] : '';
      for (const [text, href] of links) {
        // postbuild appends a clean ?text= prefill to bare wa.me links
        const target = esc(href).replace(/&/g, '(?:&|&amp;)') + (href.startsWith('https://wa.me/') ? '(?:\\?text=[^"]*)?' : '');
        const re = new RegExp(`<a\\b[^>]*\\bhref="${target}"[^>]*>(?:\\s*<[^>]+>)*\\s*${esc(text)}\\s*(?:</[^>]+>\\s*)*</a>`);
        if (!re.test(body)) fail(`${page}: footer group "${title}" must keep the link "${text}" -> ${href}`);
      }
    });
    if (!footer.includes('src="/assets/img/logo/footer-logo.webp"') || !footer.includes('alt="OET with Dr Hesham"')) fail(`${page}: footer must keep the OET logo`);
    if (!footer.includes('We help nurses, doctors, pharmacists, and allied health professionals prepare for OET')) fail(`${page}: footer must keep its brand copy`);
    const social = (footer.match(/<div class="social-area-footer-10">[\s\S]*?<\/div>/) || [''])[0];
    for (const label of SOCIAL) if (!social.includes(`aria-label="${label}"`)) fail(`${page}: footer must keep the ${label} social icon`);
    for (const [text, href] of LEGAL) if (!footer.includes(`<a href="${href}">${text.replace('&', '&amp;')}</a>`)) fail(`${page}: footer legal row must keep "${text}" -> ${href}`);
    if (!footer.includes('Cookie settings') || !footer.includes('&copy; Copyright 2026 - OET with Dr Hesham. All Rights Reserved')) fail(`${page}: footer must keep Cookie settings and the copyright line`);
    if ((footer.match(/<a\b[^>]*\bhref=/g) || []).length < 24 + 3 + 6 + 5) fail(`${page}: footer link inventory shrank (24 group links, 3 subscribe buttons, 6 social icons and 5 legal links expected)`);
  }
  if (!/<main[\s\S]*href="\/blog\/"[\s\S]*<\/main>/.test(distHtml['index.html'] || '')) fail('index.html: homepage must link the OET Blog (/blog/)');
  if ((distHtml['index.html'] || '').includes('7+ OET Skills')) fail('index.html: OET has 4 core skills, not "7+"');

  // OET Blog: every listed post is built, linked from /blog/, links back to /blog/, has a thumbnail,
  // valid Article/BlogPosting data and a BreadcrumbList that matches the visible breadcrumb
  const { loadBlog } = await import('../src/lib/blog.mjs');
  const { posts } = loadBlog();
  const blogHtml = distHtml['blog/index.html'] || '';
  for (const post of posts) {
    const page = post.url.slice(1);
    const html = distHtml[page];
    if (!html) { fail(`blog: ${post.url} is listed in blog.json but not built/verified`); continue; }
    if (!blogHtml.includes(`href="${post.url}"`)) fail(`blog: /blog/ does not link ${post.url}`);
    if (!existsSync(path.join(ROOT, post.image.slice(1)))) fail(`blog: thumbnail missing ${post.image} (npm run thumbs)`);
    if (!html.includes('href="/blog/"')) fail(`${page}: article must link back to /blog/`);
    const article = [...nodesOfType(ldBlocks(html), 'Article'), ...nodesOfType(ldBlocks(html), 'BlogPosting')][0];
    if (!article) fail(`${page}: no Article/BlogPosting JSON-LD`);
    else for (const k of ['headline', 'datePublished', 'author', 'image']) if (!article[k]) fail(`${page}: Article JSON-LD missing ${k}`);
    const crumbs = nodesOfType(ldBlocks(html), 'BreadcrumbList')[0];
    const visible = (html.match(/<nav class="oet-breadcrumbs" aria-label="Breadcrumb"><ol>([\s\S]*?)<\/ol><\/nav>/) || [])[1];
    if (!crumbs || !visible) { fail(`${page}: needs a visible breadcrumb and BreadcrumbList JSON-LD`); continue; }
    const names = [...visible.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => visibleText(m[1]));
    const ldNames = crumbs.itemListElement.map((i) => visibleText(i.name));
    if (names.join(' > ') !== ldNames.join(' > ')) fail(`${page}: breadcrumb "${names.join(' > ')}" != JSON-LD "${ldNames.join(' > ')}"`);
    if (ldNames[1] !== 'oet blog') fail(`${page}: breadcrumb must go Home > OET Blog > ${post.categoryLabel}`);
  }
  if (!nodesOfType(ldBlocks(blogHtml), 'Blog').length) fail('blog/index.html: Blog JSON-LD missing');
  const cards = (blogHtml.match(/class="oet-blog-card"/g) || []).length;
  if (cards < posts.length) fail(`blog/index.html: ${cards} cards for ${posts.length} posts`);
}

if (failures) {
  console.error(`\nverify: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`verify: ${PAGES.length} pages + sitemap + pricing data OK`);
