// Post-build sanity checks for dist/. Fails CI loudly on structural drift.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
  // SEO + GEO plan (2 Nov 2026): landing pages, the dentists course page, seven articles and three Arabic twins
  'oet-mock-test.html', 'oet-speaking-practice-online.html', 'oet-course-for-dentists.html', 'oet-vs-pte.html', 'oet-study-plan.html',
  'oet-reading-part-b-workplace-texts.html', 'oet-listening-parts-b-c.html', 'oet-writing-nursing-discharge-letter.html',
  'oet-speaking-angry-anxious-patient.html', 'oet-retake-after-near-miss.html',
  'ar/oet-course-for-pharmacists.html', 'ar/oet-course-for-physiotherapists.html', 'ar/gulf-pathway-guide.html',
  // SEO pass of 7 Nov 2026: pages for queries Search Console showed landing on the wrong page, plus the two hubs
  'what-is-oet.html', 'oet-exam-fees.html', 'oet-cancellation-refund-policy.html', 'oet-passing-score.html', 'oet-writing-samples.html', 'oet-speaking-role-play-cards.html',
  'ar/what-is-oet.html', 'ar/oet-exam-fees.html', 'ar/oet-passing-score.html', 'official-information.html', 'ar/official-information.html', 'oet-course-egypt.html', 'ar/oet-course-egypt.html', 'oet-course-saudi-arabia.html', 'ar/oet-course-saudi-arabia.html', 'oet-course-uae.html', 'ar/oet-course-uae.html', 'oet-course-qatar.html', 'ar/oet-course-qatar.html', 'oet-course-kuwait.html', 'ar/oet-course-kuwait.html', 'oet-course-oman.html', 'ar/oet-course-oman.html',
  // SEO brief of 21 Nov 2026: the January 2027 paper-test news (EN + AR) and the Arabic section expansion
  'oet-paper-test-2027-changes.html', 'ar/oet-paper-test-2027-changes.html', 'ar/pricing.html', 'ar/success-stories.html',
  'ar/oet-writing-sample-nursing-referral.html', 'ar/oet-writing-sample-nursing.html', 'ar/oet-writing-sample-medicine.html',
  'ar/oet-writing-sample-medicine-discharge.html', 'ar/oet-writing-sample-pharmacy.html', 'ar/oet-writing-sample-physiotherapy.html',
  'ar/oet-speaking-role-play-cards.html', 'ar/oet-mock-test.html', 'ar/oet-score-calculator.html',
  // OET Recalls (owner brief v2, 21 Nov 2026)
  'oet-recalls.html', 'ar/oet-recalls.html',
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
  if (urls.length !== PAGES.length - 1) fail(`sitemap has ${urls.length} URLs, expected ${PAGES.length - 1} (every page but 404)`);
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
    // a final full stop is not content: the Recalls FAQ (owner brief) marks up an answer that the page continues past its full stop
    const answer = visibleText(q.acceptedAnswer?.text || '').replace(/\.$/, '');
    if (!vis.includes(visibleText(q.name || '')) || !vis.includes(answer))
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

// Full OET Course and Full Crash Course bundles (owner brief 28 Oct 2026 + final v4 pricing brief 29 Oct 2026; contract docs/FULL-CRASH-BUNDLES-2026-10-29.md in
// the web app repo): pricing.html top sections, the profession course pages' "Choose your course" block, one price source
// (src/data/bundles.json), the format rules, the live-catalog contract and TutorBook = 10 recall-based exams everywhere.
{
  const { loadBundles } = await import('../src/lib/bundles.mjs');
  const { data, kit, defaults } = loadBundles();
  const PRICES = { 'full-practice': 140, 'full-tutorbook': 165, ultimate: 220, 'crash-essential': 75, 'crash-letters': 100, 'crash-complete': 125 };
  // owner 30 Oct 2026 (names brief): the Full and Complete tiers say what they add, and the two upper Crash tiers say what the personal part is
  const NAMES = { 'full-practice': 'Full OET Course + Website Practice', 'full-tutorbook': 'Complete OET Bundle + TutorBook', ultimate: 'Ultimate OET Course', 'crash-essential': 'Full Crash Essential', 'crash-letters': 'Full Crash + 5 Personal Writing Assessments', 'crash-complete': 'Full Crash + 5 Personal Assessments + TutorBook' };
  // owner v4 (29 Oct 2026): the exact default descriptions; **x** marks the benefit phrases that render bold
  const DESCRIPTIONS = {
    'full-practice': 'A complete recorded OET course with **5 personal Writing letters by Dr Ahmed Hesham**, **1 private Speaking session with an Expert Tutor** and **website practice** (Writing, Speaking and, for Computer-Based candidates, Listening and Reading exams).',
    'full-tutorbook': 'Everything in the Full OET Course, PLUS the 2026 TutorBook with 10 Recall-Based Exams, model answers and **permanent updates**: a £25 upgrade.',
    ultimate: 'Everything in the Complete OET Bundle, plus **unlimited eligible website practice**, the **Basic English Course as a free gift** and **SAMI 24/7** for **12 months**.',
    'crash-essential': 'Full recorded Crash Course plus **website practice**: 4 Writing assessments, 4 Speaking Cards and, for Computer-Based candidates, 6 Listening and 6 Reading exams.',
    'crash-letters': 'Everything in Full Crash Essential, PLUS **5 personal Writing letters assessed by Dr Ahmed Hesham**.',
    'crash-complete': 'Everything in Full Crash + 5 Personal Writing Assessments, PLUS the **2026 TutorBook of Recalls** with **10 full recall-based exams**.',
  };
  const MONTHS = { 'full-practice': 6, 'full-tutorbook': 6, ultimate: 12, 'crash-essential': 6, 'crash-letters': 6, 'crash-complete': 6 };
  const SUFFIX = { medicine: 'medicine', nursing: 'nursing', pharmacy: 'pharmacy', physiotherapy: 'physiotherapy', 'other-allied-health': 'allied-health' };
  const CATALOG_URL = 'https://api.oetwithdrhesham.co.uk/v1/catalog/bundles';
  const tiers = data.families.flatMap((f) => f.tiers);

  // data file: the six approved tiers, prices, access, the Recommended middle tiers, the five professions
  if (tiers.map((t) => t.key).join() !== Object.keys(PRICES).join()) fail('bundles.json: tiers must be the six approved tiers in order');
  for (const t of tiers) {
    if (t.price !== PRICES[t.key]) fail(`bundles.json: ${t.key} must cost GBP ${PRICES[t.key]}`);
    if (t.accessMonths !== MONTHS[t.key]) fail(`bundles.json: ${t.key} must give ${MONTHS[t.key]} months of access`);
    if (t.recommended !== (t.key === 'full-tutorbook' || t.key === 'crash-complete')) fail(`bundles.json: only Complete OET Bundle + TutorBook and Full Crash + 5 Personal Assessments + TutorBook are Recommended (${t.key})`);
    if (t.name !== NAMES[t.key]) fail(`bundles.json: ${t.key} must be named "${NAMES[t.key]}" (owner v4), found "${t.name}"`);
    if (t.description !== DESCRIPTIONS[t.key]) fail(`bundles.json: ${t.key} description must be the owner v4 text verbatim, **markers** included`);
    if (/\bAI\b/.test(t.name + ' ' + t.description)) fail(`bundles.json: ${t.key} must not use the term "AI" in customer-facing text`);
    if (t.recommended && t.badge !== 'Recommended') fail(`bundles.json: ${t.key} must carry the Recommended badge`);
    if (/<|>/.test(t.description) || (t.description.match(/\*\*/g) || []).length % 2) fail(`bundles.json: ${t.key} has markup or an unbalanced ** marker in its description`);
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

  // included lines: the API's order (course, personal_letters, private_session, website_*, paper_*, tutorbook, basic_english, sami);
  // Basic English is a free gift ONLY with Ultimate (final v4 brief 29 Oct 2026: removed from the GBP 165 Complete OET Bundle + TutorBook); SAMI 24/7 is on ALL SIX tiers
  // (Final Master brief, owner 30 Oct 2026: Full 140 / Complete 165 / Ultimate 220 and Crash 75 / 100 / 125; the API sends the same item key "sami", label "SAMI 24/7").
  // The v4 labels, the bold human lines and the Practice chip are asserted here too.
  {
    const ORDER = ['course', 'personal_letters', 'private_session', 'website_writing', 'website_speaking', 'website_listening', 'website_reading', 'paper_resources', 'handwritten_upload', 'tutorbook', 'basic_english', 'sami'];
    for (const b of Object.values(defaults)) {
      const keys = b.included.map((l) => l.key);
      if (keys.some((k, i) => ORDER.indexOf(k) < 0 || (i && ORDER.indexOf(k) <= ORDER.indexOf(keys[i - 1])))) fail(`bundles: ${b.code} lines are not in the catalog order (${keys.join(',')})`);
      if (keys.includes('basic_english') !== (b.key === 'ultimate')) fail(`bundles: ${b.code}: the Basic English Course (gift) belongs to Ultimate ONLY`);
      if (!keys.includes('sami') || b.included.find((l) => l.key === 'sami').label !== 'SAMI 24/7') fail(`bundles: ${b.code}: SAMI 24/7 is included in all six tiers (Full 140/165/220 and Crash 75/100/125)`);
      const be = b.included.find((l) => l.key === 'basic_english');
      const V4 = { personal_letters: ['Personal Writing Letters', 'Personally assessed by Dr Ahmed Hesham'], private_session: ['Private Speaking Session with an Expert Tutor', null], website_writing: ['Website Writing Assessments', null], website_speaking: ['Website Speaking Cards', 'Live Virtual Patient Speaking Practice'], website_listening: ['Website Listening Exams', 'Computer-Based'], website_reading: ['Website Reading Exams', 'Computer-Based'] };
      for (const l of b.included) if (V4[l.key] && (l.label !== V4[l.key][0] || l.detail !== V4[l.key][1])) fail(`bundles: ${b.code}: line ${l.key} must read "${V4[l.key][0]}"${V4[l.key][1] ? ` with detail "${V4[l.key][1]}"` : ' with no detail'}`);
      for (const l of b.included) if (/\bAI\b/.test(`${l.label} ${l.detail || ''}`)) fail(`bundles: ${b.code}: line ${l.key} must not use the term "AI"`);
      if (b.key !== 'ultimate' && /basic english/i.test(b.description)) fail(`bundles: ${b.code}: only Ultimate may mention the Basic English gift`);
      if (be && (be.label !== 'Basic English Course (gift)' || be.value !== null || be.formats.join() !== 'computer,paper')) fail(`bundles: ${b.code}: basic_english must read "Basic English Course (gift)", carry no value and show for both formats`);
    }
  }

  // format rules, every profession x format: computer = website L/R numbers, paper = W/S + handwritten upload + paper L/R
  // resources, never a negative "No online Listening or Reading" line, every website count says "on our website"
  const lineKeys = (html) => [...html.matchAll(/<li data-key="([a-z_]+)"[^>]*>/g)].map((m) => m[1]);
  for (const prof of data.professions) {
    for (const fmt of ['computer', 'paper']) {
      const ctx = kit.makeCtx(data, prof.id, fmt);
      for (const fam of data.families) {
        const codes = kit.slotCodes(data, fam.id, prof.id);
        // Nursing is sold none of the six tiers (Final Master brief, owner 30 Oct 2026): no card, no link, only the explanation of its two packages
        if (prof.id === 'nursing') {
          const nurse = kit.renderFamilyGrid(data, fam.id, defaults, ctx);
          if (kit.isSold(prof, fam.id) || codes.length || /oet-bundle-card|Enrol now|bundle_(?:full|ultimate|crash)|data-key="/.test(nurse)) fail(`bundles ${fam.id} nursing/${fmt}: Nursing must not be shown or linked any Ultimate, Full OET Course + Website Practice, Complete OET Bundle + TutorBook or Full Crash tier`);
          if (fam.id === 'crash' && nurse !== '') fail(`bundles crash nursing/${fmt}: the Crash section renders nothing for Nursing`);
          if (fam.id === 'full' && (!nurse.includes('data-nursing-panel') || !nurse.includes('href="#pkg-nursing-classic"') || !nurse.includes('href="#pkg-nursing-premium"')
              || !nurse.includes('>&pound;65</span>') || !nurse.includes('>&pound;105</span>') || (nurse.match(/is-recommended/g) || []).length !== 1))
            fail(`bundles full nursing/${fmt}: the explanation must point at the Classic Nursing OET Course (GBP 65) and the Nursing Premium Bundle (GBP 105, Recommended), each linking its own card`);
          continue;
        }
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
          // Ultimate premium frame (owner 30 Oct 2026): gold frame class + permanent crown (inline SVG, never an icon-font glyph) + ULTIMATE badge on every
          // non-Nursing profession's Ultimate card, and on no other card; Recommended stays off it
          const ult = /^ultimate-/.test(code);
          if (ult !== card.includes('class="oet-bundle-card is-ultimate"') || ult !== card.includes('<span class="oet-bundle-ultimate-badge"><svg class="oet-bundle-crown" viewBox="0 0 24 24" aria-hidden="true" focusable="false">') || ult !== card.includes('ULTIMATE</span>'))
            fail(`${label} ${code}: the gold frame, crown and ULTIMATE badge belong to Ultimate cards only, on all four professions in both formats`);
          if (ult && (card.includes('is-recommended') || /fa-crown/.test(card))) fail(`${label} ${code}: Ultimate is not Recommended and its crown is an inline SVG, not the icon font`);
          // one consistent upsell line under the card (owner 30 Oct 2026), linking the next tier's own card
          const UPSELL = { 'full-practice': ['bundle-full-tutorbook', 'Upgrade to Complete', 25], 'full-tutorbook': ['bundle-ultimate', 'Upgrade to Ultimate', 55], 'crash-essential': ['bundle-crash-letters', 'Upgrade to Full Crash + 5 Personal Writing Assessments', 25], 'crash-letters': ['bundle-crash-complete', 'Add TutorBook', 25] };
          const up = UPSELL[code.replace(/-(medicine|nursing|pharmacy|physiotherapy|allied-health)$/, '')];
          if (up && (!card.includes(`<a class="oet-bundle-upgrade__link" href="#${up[0]}" data-oet-poster="${up[0]}">${up[1]}</a>`) || !card.includes(`<span>&pound;${up[2]} more`))) fail(`${label} ${code}: upsell must read "${up[1]}" with the GBP ${up[2]} difference and link #${up[0]}`);
          if (!up && card.includes('oet-bundle-upgrade')) fail(`${label} ${code}: Ultimate and Full Crash + 5 Personal Assessments + TutorBook carry no upsell`);
          if (/wa\.me|whatsapp|pay only the difference/i.test(card)) fail(`${label} ${code}: no WhatsApp link and no promised discount on a card`);
          if (!has('website_writing') || !has('website_speaking')) fail(`${label} ${code}: Writing and Speaking on our website must always be listed`);
          if (has('basic_english') !== /^ultimate-/.test(code)) fail(`${label} ${code}: the Basic English Course (gift) is shown on Ultimate only, in both formats`);
          // personal human service is bold weight (is-human); website assessments are not
          for (const m of card.matchAll(/<li data-key="([a-z_]+)"([^>]*)>/g)) {
            const human = /^(personal_letters|private_session|tutorbook|basic_english|sami)$/.test(m[1]);
            if (human !== /class="is-human"/.test(m[2])) fail(`${label} ${code}: line ${m[1]} ${human ? 'must' : 'must not'} carry the is-human (bold) class`);
          }
          // Practice chip on every card: Unlimited Website Practice when a website_* line is unlimited (Ultimate), else Website Practice Included
          if (!card.includes(`<li class="is-practice">${/^ultimate-/.test(code) ? 'Unlimited Website Practice' : 'Website Practice Included'}</li>`)) fail(`${label} ${code}: wrong or missing Practice chip`);
          if (!card.includes('<h3>' + NAMES[code.replace(/-(medicine|nursing|pharmacy|physiotherapy|allied-health)$/, '')].replace(/&/g, '&amp;') + '</h3>')) fail(`${label} ${code}: card must carry the v4 tier name`);
          if (fmt === 'computer' && (!has('website_listening') || !has('website_reading') || has('paper_resources') || has('handwritten_upload')))
            fail(`${label} ${code}: Computer-Based shows the website Listening/Reading numbers and no paper-only lines`);
          if (fmt === 'paper' && (has('website_listening') || has('website_reading') || !has('paper_resources') || !has('handwritten_upload')))
            fail(`${label} ${code}: Paper-Based lists the handwritten upload and paper L/R resources, not website L/R exams`);
          for (const m of card.matchAll(/<li data-key="website_[a-z]+"[^>]*>([\s\S]*?)<\/li>/g))
            if (!/^<span class="oet-bundle-line">(<b>[^<]+<\/b> )?Website /.test(m[1])) fail(`${label} ${code}: a website count line must say "Website ..." (website assessments are never presented as human-marked)`);
          if (/no online|online listening or reading/i.test(card.replace(/<[^>]+>/g, ' '))) fail(`${label} ${code}: no negative "No online Listening or Reading" line`);
          if (/\bAI\b/.test(card.replace(/<[^>]+>/g, ' '))) fail(`${label} ${code}: the term "AI" must not appear on a card`);
          if (/\*\*/.test(card)) fail(`${label} ${code}: a raw ** marker leaked into a card`);
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
    // the upsell quotes the live difference, and a target an admin hid renders no upsell at all
    if (ok && !kit.renderCard(ok.bundles['full-practice-medicine'], kit.makeCtx(data, 'medicine', 'computer')).includes('<span>&pound;29 more &middot; TutorBook included</span>')) fail('bundles: the Full OET Course + Website Practice upsell must quote the live GBP difference to the Complete OET Bundle + TutorBook');
    const hid = kit.mergeLive(defaults, { families: [{ id: 'full', bundles: [pick('full-practice-medicine', { price: 140, recommended: false, badge: null })] }] });
    if (hid && kit.renderCard(hid.bundles['full-practice-medicine'], kit.makeCtx(data, 'medicine', 'computer')).includes('oet-bundle-upgrade')) fail('bundles: an upsell whose target tier is not on sale must not render');
    // the live description (same ** markers as the defaults) goes through the same renderer: bold phrases, never markup
    const rich = ok && kit.mergeLive(defaults, { families: [{ bundles: [pick('full-tutorbook-medicine', { description: 'Plus **permanent updates** <b>x</b> & more **' })] }] });
    if (kit.rich('A **bold** and <i>raw</i> & **x**') !== 'A <strong>bold</strong> and &lt;i&gt;raw&lt;/i&gt; &amp; <strong>x</strong>') fail('bundles: rich() must escape first, then turn **x** into <strong>x</strong>');
    if (kit.rich('stray ** marker') !== 'stray  marker') fail('bundles: rich() must drop an unmatched ** marker');
    if (rich) {
      const html = kit.renderCard(rich.bundles['full-tutorbook-medicine'], kit.makeCtx(data, 'medicine', 'computer'));
      if (!html.includes('<strong>permanent updates</strong> &lt;b&gt;x&lt;/b&gt; &amp; more') || html.includes('<b>x</b>')) fail('bundles: a live description must render ** as bold and escape any markup through the same renderer');
    }
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
    if (!new RegExp(`class="oet-bundle-herolink[^"]*" href="${dest}"`).test(ph) || !ph.includes(dest === '#crash-courses' ? '<li data-oet-crash-link><a href="#crash-courses">' : `<li><a href="${dest}">`)) fail(`pricing.html: hero shortcut and quick-nav link to ${dest} required`);
  // Nursing is not sold the Crash tiers: every link to #crash-courses (hero shortcut, quick nav) carries data-oet-crash-link, so the script hides it with the section
  if ((ph.match(/href="#crash-courses"/g) || []).length !== 2 || (ph.match(/data-oet-crash-link/g) || []).length !== 2) fail('pricing.html: exactly the hero shortcut and the quick-nav item link #crash-courses, both marked data-oet-crash-link (hidden for Nursing)');
  if ((ph.match(/<article class="oet-bundle-card/g) || []).length !== 6) fail('pricing.html: expected 6 default tier cards (3 Full for Medicine + 3 Crash)');
  if ((ph.match(/data-bundle-stale hidden/g) || []).length !== 2) fail('pricing.html: each bundle section needs a hidden "live prices could not be loaded" note');
  const blob = (ph.match(/<script type="application\/json" id="oet-bundles-data">([\s\S]*?)<\/script>/) || [])[1];
  try { if (JSON.parse(blob).catalogUrl !== CATALOG_URL) fail('pricing.html: embedded bundle data has the wrong catalogUrl'); } catch { fail('pricing.html: embedded bundle data is missing or invalid JSON'); }
  for (const t of tiers) {
    const code = t.key.startsWith('crash') ? t.key : `${t.key}-medicine`;
    const card = (ph.match(new RegExp(`<article class="oet-bundle-card[^"]*" id="bundle-${t.key}" data-key="${t.key}" data-code="${code}"[\\s\\S]*?</article>`)) || [''])[0];
    if (!card) { fail(`pricing.html: no card for plan ${code}`); continue; }
    if (!card.includes(`<strong data-field="price">&pound;${t.price}</strong>`)) fail(`pricing.html: ${code} must show GBP ${t.price}`);
    if (!card.includes(`<h3>${t.name.replace(/&/g, '&amp;')}</h3>`) || !card.includes(`<p class="oet-bundle-desc">${kit.rich(t.description)}</p>`)) fail(`pricing.html: ${code} name/description drifted from bundles.json`);
    if (t.recommended !== card.includes('is-recommended')) fail(`pricing.html: ${code} Recommended badge mismatch`);
    for (const kind of ['register', 'sign-in'])
      if (!card.includes(`href="https://app.oetwithdrhesham.co.uk/${kind}?next=%2Fsubscriptions%3Fpackage%3D${code}%26profession%3Dmedicine%26format%3Dcomputer"`)) fail(`pricing.html: ${code} needs the ${kind} deep link with package, profession and format inside next`);
    if (!card.includes(`data-oet-cta="bundle_${t.key}"`)) fail(`pricing.html: ${code} must keep the data-oet-cta analytics attribute`);
    if (card.includes('TutorBook of Recalls') !== t.included.some((l) => l.key === 'tutorbook')) fail(`pricing.html: ${code} TutorBook line mismatch`);
    if (card.includes('Basic English Course (gift)') !== (t.key === 'ultimate')) fail(`pricing.html: ${code} Basic English gift line belongs to Ultimate only`);
    // JSON-LD offer for the tier
    const prod = nodesOfType(ldBlocks(ph), 'Product').find((p) => p.name === t.name && p.offers?.url?.endsWith(t.key.startsWith('crash') ? '#crash-courses' : '#full-oet-courses'));
    if (prod && /\*\*/.test(prod.description || '')) fail(`pricing.html: JSON-LD description for ${t.name} must not carry ** markers`);
    if (!prod) fail(`pricing.html: JSON-LD Product missing for ${t.name}`);
    else if (String(prod.offers.price) !== String(t.price) || prod.offers.priceCurrency !== 'GBP') fail(`pricing.html: JSON-LD offer for ${t.name} must be GBP ${t.price}`);
  }
  if (!ph.includes('No private Speaking session is included in these Crash tiers.')) fail('pricing.html: the Crash section must say "No private Speaking session is included in these Crash tiers."');
  if (!ph.includes('<noscript>')) fail('pricing.html: the bundle sections need a no-JavaScript note');
  if (!ph.includes('/assets/css/oet-bundles.css?v=') || !ph.includes('/assets/js/oet-bundles.js?v=')) fail('pricing.html: oet-bundles.css/js must be linked and hashed');

  // course pages: the "Choose your course" block with the page's own profession, same data
  for (const [page, prof] of [['oet-course-for-doctors.html', 'medicine'], ['oet-course-for-nurses.html', 'nursing'], ['oet-course-for-pharmacists.html', 'pharmacy'], ['oet-course-for-physiotherapists.html', 'physiotherapy'], ['oet-for-allied-health.html', 'other-allied-health'], ['oet-course-for-dentists.html', 'other-allied-health']]) {
    const h = distHtml[page] || '';
    const sec = (h.match(/<section class="oet-resource-section oet-choose" id="choose-your-course"[\s\S]*?<\/section>/) || [''])[0];
    if (!sec) { fail(`${page}: "Choose your course" block missing`); continue; }
    if (!sec.includes(`data-oet-bundles-mini data-profession="${prof}" data-catalog="static"`)) fail(`${page}: block must be for ${prof} and start as data-catalog="static"`);
    if (!sec.includes(`href="/pricing.html?profession=${prof}#full-oet-courses"`)) fail(`${page}: block must link /pricing.html?profession=${prof}#full-oet-courses`);
    kit.slotCodes(data, 'full', prof).forEach((code, i) => {
      if (!new RegExp(`data-code="${code}"[\\s\\S]*?<strong data-field="price">&pound;${tiers[i].price}</strong>`).test(sec)) fail(`${page}: ${code} must show GBP ${tiers[i].price}`);
    });
    if (prof === 'nursing') {
      // Nursing is sold none of the six tiers (owner 30 Oct 2026): its block shows the two Nursing packages, prices from pricing.json, and no Crash link
      const cards = sec.split('<article class="oet-choose-card').slice(1);
      const priceOf = (kicker) => pricing.find((c) => c.kicker === kicker).price;
      if (cards.length !== 2 || (sec.match(/is-recommended/g) || []).length !== 1 || !cards[0].includes('<h3>Classic Nursing OET Course</h3>') || !cards[0].includes(`<strong data-field="price">&pound;${priceOf('Package 05')}</strong>`)
          || !cards[1].startsWith(' is-recommended') || !cards[1].includes('<h3>Nursing Premium Bundle</h3>') || !cards[1].includes(`<strong data-field="price">&pound;${priceOf('Package 07')}</strong>`))
        fail(`${page}: the Nursing block must show the Classic Nursing OET Course (GBP ${priceOf('Package 05')}) and the Nursing Premium Bundle (GBP ${priceOf('Package 07')}, Recommended) and nothing else`);
      if (/crash-courses|oet-bundle-card|Ultimate OET Course|Complete OET Bundle|data-bundle-stale/.test(sec.replace(/<p>Choose your Nursing package[\s\S]*?<\/p>/, ''))) fail(`${page}: the Nursing block must not show or link any Crash, Ultimate, Full or Complete tier`);
    } else if ((sec.match(/<article class="oet-choose-card/g) || []).length !== 3 || (sec.match(/is-recommended/g) || []).length !== 1) fail(`${page}: three Full tiers expected, the middle one Recommended`);
    if (prof !== 'nursing' && ((sec.match(/<article class="oet-choose-card is-ultimate"/g) || []).length !== 1 || !sec.includes('<span class="oet-bundle-ultimate-badge"><svg class="oet-bundle-crown"'))) fail(`${page}: the Ultimate card carries the gold frame and the crown + ULTIMATE badge`);
    // Doctors page (owner follow-up, 30 Oct 2026): "What is included" describes the Classic Full Course + SAMI and the two upgrade tiers with today's prices (one source:
    // pricing.json Package 01 and bundles.json), the second card is the Complete OET Bundle + TutorBook linking its own pricing card, and the retired Full Condensed Recorded Course + TutorBook is gone
    if (prof === 'medicine') {
      const inc = (h.match(/<section class="oet-resource-section" id="included">[\s\S]*?<\/section>/) || [''])[0];
      const classicPrice = pricing.find((c) => c.kicker === 'Package 01').price;
      const intro = `Medicine has the Classic Full Course + SAMI (&pound;${classicPrice}), a recorded course with its original benefits, and two upgrade tiers: the ${tiers[0].name} (&pound;${tiers[0].price}) and the ${tiers[1].name} (&pound;${tiers[1].price}, Recommended).`;
      if (!inc.includes(`<p>${intro} Each includes 6 months of course access.</p>`)) fail(`${page}: the "What is included" intro must name the Classic Full Course + SAMI (GBP ${classicPrice}) and the ${tiers[0].name} (GBP ${tiers[0].price}) and ${tiers[1].name} (GBP ${tiers[1].price}, Recommended)`);
      if ((inc.match(/<article class="oet-resource-card"/g) || []).length !== 2 || !inc.includes('<h3>Classic Full Course + SAMI - Medicine</h3>') || !inc.includes(`<h3>${tiers[1].name}</h3>`)) fail(`${page}: "What is included" must show exactly two cards, the Classic Full Course + SAMI - Medicine and the ${tiers[1].name}`);
      if (!inc.includes('<a class="oet-resource-btn oet-resource-btn--light" href="/pricing.html#bundle-full-tutorbook">') || !inc.includes('href="/pricing.html#full-recorded-courses"') || !inc.includes('href="/pricing.html#tutor-book"')) fail(`${page}: the included section must link the Complete OET Bundle card (#bundle-full-tutorbook), the medicine packages (#full-recorded-courses) and TutorBook (#tutor-book)`);
      if (/Condensed Recorded|TutorBook bundle|two Medicine packages|the recorded Medicine course or/i.test(h)) fail(`${page}: the retired Full Condensed Recorded Course + TutorBook (old GBP 140) must not be advertised any more`);
    }
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

  // ---- final v4 pricing brief (29 Oct 2026) ----
  // every tier card is a stable poster target (#bundle-<key>) and carries its Practice chip
  for (const t of tiers) {
    const code = t.key.startsWith('crash') ? t.key : t.key + '-medicine';
    const card = (ph.match(new RegExp('<article class="oet-bundle-card[^"]*" id="bundle-' + t.key + '" data-key="' + t.key + '" data-code="' + code + '"[\\s\\S]*?</article>')) || [''])[0];
    if (!card) fail('pricing.html: card for ' + code + ' must carry id="bundle-' + t.key + '" and data-key (the hero poster target)');
    if (card && !card.includes('<li class="is-practice">' + (t.key === 'ultimate' ? 'Unlimited Website Practice' : 'Website Practice Included') + '</li>')) fail('pricing.html: ' + code + ' needs its Practice chip');
  }

  // ---- Final Master brief (owner, 30 Oct 2026) ----

  // Promotional carousel: ONE ordered list (assets/img/promotional-banners/promotional-banners.json) feeds the pricing hero slider AND the homepage popup, in the same order.
  // Slides 1-5 are the approved posters 01-05, then 06-10 (06 Digital Practice was published on the owner's instruction of 31 Oct 2026), then the still-relevant older banners
  // promo-04, 11, 15, 16, 17, 18, 19 (promo-07 Mock Exams and promo-13 Nursing recorded course were retired on 30 Oct 2026: their artwork prints a 'Passing Score Guaranteed' seal
  // and 'Free 3 letters assessment', claims the products do not make). 10 + 7 = 17 slides. The approved artwork is byte-identical to the owner's files (SHA-256 below), every slide is a whole-image link with a visible
  // call to action and real alt text without "AI", and the three tier posters swap to the portrait files below 640px.
  {
    const manifest = JSON.parse(readFileSync(path.join(ROOT, 'assets/img/promotional-banners/promotional-banners.json'), 'utf8'));
    const BASE = '/assets/img/promotional-banners/';
    const EXPECT = [
      ['path-to-success', '/pricing.html#full-oet-courses', 'poster-01-path-to-oet-success.png'],
      ['ultimate', '/pricing.html#bundle-ultimate', 'poster-02-ultimate-wide-1920x1080.png'],
      ['complete', '/pricing.html#bundle-full-tutorbook', 'poster-03-complete-wide-1920x1080.png'],
      ['full', '/pricing.html#bundle-full-practice', 'poster-04-full-wide-1920x1080.png'],
      ['ask-sami', 'https://app.oetwithdrhesham.co.uk/companion', 'poster-05-ask-sami.jpg'],
      ['digital-practice', '/pricing.html#ai-grading-packages', 'poster-06-digital-practice.png'],
      ['writing-assessments', '/pricing.html#writing-packages', 'poster-07-website-writing-assessments.png'],
      ['virtual-speaking', '/pricing.html#speaking-packages', 'poster-08-live-virtual-patient-speaking.png'],
      ['medicine-classic', '/pricing.html#pkg-medicine-classic', 'poster-09-medicine-classic-full-course.png'],
      ['crash-tutorbook', '/pricing.html#bundle-crash-complete', 'poster-10-full-crash-tutorbook.png'],
      ['tutorbook-pharmacy', '/pricing.html#tutor-book', 'promo-04-img-20260522-wa0010.webp'],
      ['basic-english', '/pricing.html#pkg-basic-english', 'promo-11-picsart-26-06-21-01-45-35-187.webp'],
      ['speaking-crash', '/pricing.html#pkg-speaking-crash', 'promo-15-picsart-26-06-22-00-53-29-763.webp'],
      ['private-speaking', '/pricing.html#pkg-private-speaking', 'promo-16-picsart-26-06-22-00-54-15-072.webp'],
      ['mega-special', '/pricing.html#pkg-mega-special', 'promo-17-picsart-26-06-22-00-54-52-208.webp'],
      ['writing-crash', '/pricing.html#pkg-writing-crash', 'promo-18-picsart-26-06-22-00-55-28-608.webp'],
      ['double-special', '/pricing.html#pkg-double-special', 'promo-19-picsart-26-06-22-00-56-00-318.webp'],
    ];
    // owner-approved artwork: SHA-256 from 03_FINAL_SPEC_AND_CATALOGUE/POSTER_FILE_SHA256.txt (the three mobile files are the owner's 02_EXISTING_SIMPLE_HERO_MOBILE files)
    const SHA = {
      'poster-01-path-to-oet-success.png': 'fb35c6326fee4f4ef4e5a057eeaaedbeedc5d1aaed560eea93142a4954ffca15',
      'poster-02-ultimate-wide-1920x1080.png': 'c072b883df40d695fbcdeefddc199323f51fd8e17b2be9e32759e7e07fb7a0fc',
      'poster-03-complete-wide-1920x1080.png': 'a40528c8d785d56147c31258ae75f53402e80338e1a8a647bfac2fb603c01562',
      'poster-04-full-wide-1920x1080.png': 'f3d5c5e2613322066963978d59fc60f096bc8795f8e1677e43604becd71dcf65',
      'poster-05-ask-sami.jpg': '13ca90a0cf5122b01ec054e24ce564fa3921b927dee210cc5ca714b97a1e24bd',
      'poster-06-digital-practice.png': '22fff0f24009b0a6c33550275057e3e0da82e7ae1d8646907a30bbc364bee72b',
      'poster-07-website-writing-assessments.png': '362a57576d398474f22ff6ff6c35170ae746f491c0411e4ad6a4356ea230a425',
      'poster-08-live-virtual-patient-speaking.png': 'be29dbc59de2f003ae5a98009c5e0c416100526eea166bd11a9cad8ffd0e11d4',
      'poster-09-medicine-classic-full-course.png': 'd5346aaabb43f6328bc1e61f567ae34dcb92532a406df864924bf19f686febc3',
      'poster-10-full-crash-tutorbook.png': 'f7d8c9716d6ec5ad9f44f19aab01d1110c2faaa44816373d10bfa0eab0f7884c',
      'poster-02-ultimate-mobile-1080x1350.png': '17784726e555edbda326896061ce0624600cd5ed36b414b6a426f683f49c391a',
      'poster-03-complete-mobile-1080x1350.png': 'fce8004018a9a1811ef38dd8628f878e4b9e739d77cbca846d4b3a8e24f3e544',
      'poster-04-full-mobile-1080x1350.png': '3396bc5bf8852959b06b33ad8dbc51d30349c5d119bd19a428afe73696484994',
    };
    if (manifest.slides.length !== EXPECT.length) fail(`promotional-banners.json: expected ${EXPECT.length} slides (posters 01-10, then promo-04, 11, 15, 16, 17, 18, 19), found ${manifest.slides.length}`);
    EXPECT.forEach(([id, href, src], i) => {
      const s = manifest.slides[i] || {};
      if (s.id !== id || s.href !== href || s.src !== src) fail(`promotional-banners.json: slide ${i + 1} must be ${id} -> ${href} (${src})`);
      if (!s.cta || !/^(View this course|Explore packages|Ask SAMI)$/.test(s.cta)) fail(`promotional-banners.json: slide ${id} needs a visible call to action ("View this course" / "Explore packages")`);
      if (!s.alt || /\bAI\b/.test(s.alt) || /^OET promotional banner/.test(s.alt)) fail(`promotional-banners.json: slide ${id} needs real alt text without the term "AI"`);
      if (!existsSync(path.join(ROOT, BASE.slice(1), s.src || "-missing-"))) fail(`promotional-banners.json: ${s.src} missing on disk`);
      if (href.startsWith('/pricing.html#') !== !!s.target || (s.target && href !== '/pricing.html#' + s.target)) fail(`promotional-banners.json: slide ${id} target must equal its pricing-page anchor`);
    });
    for (const [file, sha] of Object.entries(SHA)) {
      const f = path.join(ROOT, BASE.slice(1), file);
      if (!existsSync(f)) { fail(`${file}: approved poster missing on disk`); continue; }
      if (createHash('sha256').update(readFileSync(f)).digest('hex') !== sha) fail(`${file}: the approved artwork must stay byte-identical to the owner's file (SHA-256 mismatch: never re-crop, convert or optimise it)`);
    }
    // posters 02-04 carry the portrait file below 640px; the others scale with object-fit: contain
    for (const [id, mobile] of [['ultimate', 'poster-02-ultimate-mobile-1080x1350.png'], ['complete', 'poster-03-complete-mobile-1080x1350.png'], ['full', 'poster-04-full-mobile-1080x1350.png']])
      if (manifest.slides.find((s) => s.id === id)?.mobile?.src !== mobile) fail(`promotional-banners.json: poster ${id} needs its approved mobile file ${mobile}`);
    // retired banners are gone from disk and from the manifest
    for (const n of ['01', '02', '03', '05', '06', '07', '08', '09', '10', '12', '13', '14', '20']) {
      if (readdirSync(path.join(ROOT, BASE.slice(1))).some((f) => f.startsWith('promo-' + n + '-'))) fail(`assets/img/promotional-banners: promo-${n} was retired (30 Oct 2026) and must not come back`);
    }

    // the rendered slides: the pricing hero and the homepage popup, same list and order
    const slidesOf = (html, opener, closer) => {
      const at = html.indexOf(opener);
      if (at < 0) return [];
      const end = html.indexOf(closer, at); // the slider's prev/next buttons follow the slides
      return html.slice(at, end < 0 ? undefined : end).split('<div class="swiper-slide">').slice(1);
    };
    const check = (page, slides, hrefOf, kind) => {
      if (slides.length !== EXPECT.length) fail(`${page}: the carousel must hold ${EXPECT.length} slides (found ${slides.length})`);
      EXPECT.forEach(([id, href, src], i) => {
        const sl = slides[i] || '';
        const s = manifest.slides[i];
        const link = (sl.match(/<a class="[^"]*" [^>]*>/) || [''])[0];
        if (!link.includes(`href="${href}"`)) fail(`${page}: slide ${i + 1} must link ${href}`);
        if (s.target ? !link.includes(`data-oet-poster="${s.target}"`) : link.includes('data-oet-poster')) fail(`${page}: slide ${i + 1} (${id}) data-oet-poster must be its pricing-page target`);
        if (/target="_blank"/.test(link)) fail(`${page}: slide ${i + 1} (${id}) opens in the same tab`);
        if (!sl.includes(`src="${BASE}${src}"`) || !sl.includes(`alt="${s.alt}"`)) fail(`${page}: slide ${i + 1} must show ${src} with its manifest alt text`);
        if (!new RegExp(`${kind === 'pricing' ? 'oet-poster-cta' : 'oet-promo-popup__cta'}">${s.cta} <i class="fa-solid fa-arrow-right"`).test(sl)) fail(`${page}: slide ${i + 1} must show the visible call to action "${s.cta}"`);
        // the homepage popup defers every poster (data-src / data-srcset, hydrated when it opens: SEO + GEO plan 2 Nov 2026)
        const set = kind === 'popup' ? 'data-srcset' : 'srcset';
        if (s.mobile ? !sl.includes(`<source media="(max-width: 639px)" ${set}="${BASE}${s.mobile.src}"`) : sl.includes('<source')) fail(`${page}: slide ${i + 1} (${id}) portrait source for phones: ${s.mobile ? 'required' : 'not expected'}`);
        if (kind === 'popup' && (/ (?:src|srcset)="\/assets\/img\/promotional-banners\//.test(sl) || !sl.includes(`data-src="${BASE}${src}"`))) fail(`${page}: popup slide ${i + 1} (${id}) must defer its image (data-src / data-srcset) until the popup opens`);
        if (s.srcset && !sl.includes(`srcset="${s.srcset.map(([f, w]) => `${BASE}${f} ${w}w`).join(', ')}"`)) fail(`${page}: slide ${i + 1} (${id}) srcset drifted from the manifest`);
        if (/\bAI\b/.test(sl.replace(/<[^>]+>/g, ' '))) fail(`${page}: slide ${i + 1} must not use the term "AI"`);
      });
      if (slides.some((sl) => /promo-(?:01|02|03|05|06|07|08|09|10|12|13|14|20)-|poster-(?:ultimate|complete|full)-/.test(sl))) fail(`${page}: a retired banner is still in the carousel`);
    };
    check('pricing.html', slidesOf(ph, '<div class="swiper oet-pricing-hero-swiper">', '</button>'), null, 'pricing');
    check('index.html', slidesOf(distHtml['index.html'] || '', '<div class="swiper oet-promo-popup__swiper">', '</button>'), null, 'popup');
    for (const id of ['full-oet-courses', 'bundle-ultimate', 'bundle-full-tutorbook', 'bundle-full-practice', 'bundle-crash-complete', 'writing-packages', 'speaking-packages', 'pkg-medicine-classic', 'tutor-book', 'full-mock-exam-packages', 'pkg-basic-english', 'pkg-nursing-classic', 'pkg-nursing-premium', 'pkg-speaking-crash', 'pkg-private-speaking', 'pkg-mega-special', 'pkg-writing-crash', 'pkg-double-special'])
      if (!ph.includes(` id="${id}"`)) fail(`pricing.html: carousel / upsell / link target #${id} is missing (#full-mock-exam-packages and #pkg-nursing-classic lost their banners on 30 Oct 2026 but other pages and the Nursing panel still link them)`);
    // no duplicate ids on the pricing page (every poster and upsell lands on exactly one element)
    {
      const ids = [...ph.replace(/<script[\s\S]*?<\/script>/g, '').matchAll(/\sid="((?:pkg|bundle)-[^"]+)"/g)].map((m) => m[1]);
      const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dup.length) fail(`pricing.html: duplicate ids ${[...new Set(dup)].join(', ')}`);
    }

    // behaviour: 7 seconds (never 3), an accessible Pause / Play button with aria-pressed, hover and focus hold, none under reduced motion, no stale hint
    const helper = readFileSync(path.join(ROOT, 'assets/js/oet-promo-carousel.js'), 'utf8');
    if (!/var DELAY = 7000;/.test(helper) || !helper.includes('prefers-reduced-motion: reduce') || !helper.includes("'aria-pressed'") || !helper.includes("'focusin'") || !helper.includes("'mouseenter'")) fail('oet-promo-carousel.js: autoplay must be 7000 ms with a Pause / Play toggle (aria-pressed), hover + focus hold and reduced-motion handling');
    // the homepage popup script is an external deferred file since P6 (SEO brief 21 Nov 2026); the pricing slider script is still inline
    const popupJs = readFileSync(path.join(ROOT, 'assets/js/oet-promo-popup.js'), 'utf8');
    for (const [page, html, code] of [['pricing.html', ph, ph], ['index.html', distHtml['index.html'] || '', popupJs]]) {
      if (!/<button class="oet-carousel-toggle" type="button" data-oet-carousel-toggle aria-pressed="false" hidden>/.test(html) || !html.includes('/assets/js/oet-promo-carousel.js?v=') || !html.includes('/assets/css/oet-promo-carousel.css?v=')) fail(`${page}: the carousel needs the Pause / Play button (aria-pressed) and the shared oet-promo-carousel.js / .css`);
      if (/delay:\s*3000|every 3 seconds|Hover to pause/.test(html + code)) fail(`${page}: the 3-second autoplay and its hint text are gone (owner 30 Oct 2026: 7 seconds, pausable)`);
      if (!code.includes('window.OetPromoCarousel') || !/\.DELAY\b/.test(code) || !/\.attach\(/.test(code)) fail(`${page}: the carousel script must take its delay and pause control from OetPromoCarousel`);
    }
    if (!/keyboard: \{ enabled: true/.test(ph) || !ph.includes('pagination:') || !ph.includes('navigation:')) fail('pricing.html: hero slider must keep keyboard control, dots and arrows');
    const js = readFileSync(path.join(ROOT, 'assets/js/oet-bundles.js'), 'utf8');
    if (!js.includes('data-oet-poster') || !js.includes('focusCard') || !js.includes("doc.getElementById('full-oet-courses')")) fail('oet-bundles.js: a poster must scroll to and focus its target, and land on #full-oet-courses when the target is not rendered (Nursing, hidden plan)');
    if (!/matchMedia\('\(prefers-reduced-motion: reduce\)'\)/.test(js)) fail('oet-bundles.js: the poster scroll must respect prefers-reduced-motion');
    // the gold Ultimate frame, exactly as briefed, and no icon-font crown
    const css = readFileSync(path.join(ROOT, 'assets/css/oet-bundles.css'), 'utf8');
    if (!/\.oet-bundle-card\.is-ultimate[\s\S]*?border: 3px solid #D4AF37;[\s\S]*?box-shadow: 0 0 0 1px rgba\(212, 175, 55, \.35\), 0 10px 30px rgba\(212, 175, 55, \.30\);/.test(css) || !css.includes('.oet-bundle-ultimate-badge')) fail('oet-bundles.css: Ultimate needs the 3px solid #D4AF37 frame with the gold glow and the crown badge');
    if (/fa-crown/.test(css + js)) fail('the Ultimate crown must be an inline SVG, not the icon font (fa-crown is not in the subset)');
  }

  // Classic recorded courses (legacy catalogue). Final Master brief (owner 30 Oct 2026): Medicine / Physiotherapy / Allied Health / Pharmacy are GBP 105 and carry SAMI,
  // Classic Nursing OET Course is GBP 65, Nursing Premium Bundle GBP 105 (Recommended). Each Classic Full card says "Enhance your preparation with website practice" and
  // links the Full OET Course + Website Practice card of ITS profession, quoting that tier's own live price (never a promised discount).
  {
    // display names (owner 30 Oct 2026, names brief): "Classic Full Course + SAMI - <profession>" for 01 / 02 / 03 / 08, "Classic Nursing OET Course" for 05
    const CLASSIC = { '01': ['Classic Full Course + SAMI - Medicine', 'pkg-medicine-classic', 'medicine', 105], '02': ['Classic Full Course + SAMI - Physiotherapy', 'pkg-physiotherapy-classic', 'physiotherapy', 105], '03': ['Classic Full Course + SAMI - Modified Allied Health', 'pkg-allied-health-classic', 'other-allied-health', 105], '05': ['Classic Nursing OET Course', 'pkg-nursing-classic', null, 65], '08': ['Classic Full Course + SAMI - Pharmacy', 'pkg-pharmacy-classic', 'pharmacy', 105] };
    for (const [n, [title, id, prof, price]] of Object.entries(CLASSIC)) {
      const card = (ph.match(new RegExp('<article class="oet-pricing-card" id="' + id + '">\\s*<div class="oet-card-kicker">Package ' + n + '</div>[\\s\\S]*?</article>')) || [''])[0];
      if (!card.includes(title)) { fail('pricing.html: Classic card Package ' + n + ' (' + title + ') with id ' + id + ' not found'); continue; }
      if (!card.includes('<div class="oet-pricing-price"><strong>&pound;' + price + '</strong></div>')) fail('pricing.html: Package ' + n + ' (' + title + ') must cost GBP ' + price);
      if (!card.includes('<span class="oet-chip-support">Course + Personal Support</span>')) fail('pricing.html: Package ' + n + ' needs the "Course + Personal Support" chip');
      if (!card.includes('<span class="oet-chip-classic">Classic ' + (prof ? 'Full' : 'Nursing') + ' Course</span>')) fail('pricing.html: Package ' + n + ' carries the Classic label');
      if (!card.includes('<p class="oet-classic-note">Additional Website Practice Exams Not Included</p>')) fail('pricing.html: Package ' + n + ' needs "Additional Website Practice Exams Not Included"');
      if (!/<li[^>]*>SAMI 24\/7 learning companion included<\/li>/.test(card)) fail('pricing.html: Package ' + n + ' must say SAMI is included');
      if (prof) {
        const want = `<a class="oet-upsell__link" href="/pricing.html?profession=${prof}#bundle-full-practice" data-oet-poster="bundle-full-practice" data-profession="${prof}">Enhance your preparation with website practice</a>`;
        if (!card.includes(want) || !card.includes(`<span class="oet-tier-price" data-tier="full-practice" data-profession="${prof}">&pound;140</span>`)) fail('pricing.html: Package ' + n + ' must link the Full OET Course + Website Practice card of its profession and quote that tier price (GBP 140)');
      } else if (!card.includes('<a class="oet-upsell__link" href="#pkg-nursing-premium" data-oet-poster="pkg-nursing-premium">Upgrade to the Nursing Premium Bundle</a>') || !card.includes('Basic English Course: &pound;105.</span>')) fail('pricing.html: the Classic Nursing OET Course card must upsell the Nursing Premium Bundle at its own price (GBP 105)');
      if (/wa\.me|whatsapp|pay only the difference|ai-grading-packages/i.test(card)) fail('pricing.html: Package ' + n + ' upsell is a link to the actual card, with no WhatsApp and no promised discount');
    }
    if ((ph.match(/class="oet-classic-note"/g) || []).length !== Object.keys(CLASSIC).length) fail('pricing.html: only the five Classic Full cards carry the Classic note (not the Nursing Premium Bundle or Basic English)');
    const premium = (ph.match(/<article class="oet-pricing-card is-featured" id="pkg-nursing-premium">[\s\S]*?<\/article>/) || [''])[0];
    if (!premium.includes('<h3>Nursing Premium Bundle</h3>') || !premium.includes('<span>Recommended</span>') || !premium.includes('<div class="oet-pricing-price"><strong>&pound;105</strong></div>') || !premium.includes('SAMI 24/7')) fail('pricing.html: the Nursing Premium Bundle is GBP 105, Recommended, and includes SAMI');
    if (!ph.includes('id="ai-grading-packages"')) fail('pricing.html: the website practice packages anchor #ai-grading-packages is missing');
    // one selector for the Full / Crash tiers: no second discipline filter competing with it
    if (/data-discipline|data-filter|oet-discipline-filter|oet-filter-chip/i.test(ph)) fail('pricing.html: the profession + Paper/Computer selector is the only filter for the Full / Crash tiers');

    // prices: pricing.json is the single source; the three that moved and the ones that must not
    const PRICE = { 'Package 01': 105, 'Package 02': 105, 'Package 03': 105, 'Package 05': 65, 'Package 07': 105, 'Package 08': 105, 'Package 30': 15, 'Package 31': 32, 'Package 32': 75 };
    for (const [kicker, price] of Object.entries(PRICE)) {
      if (pricing.find((c) => c.kicker === kicker)?.price !== price) fail(`pricing.json: ${kicker} must cost GBP ${price} (owner 30 Oct 2026)`);
      const card = (ph.match(new RegExp('<div class="oet-card-kicker">' + kicker + '</div>[\\s\\S]*?</article>')) || [''])[0];
      if (!card.includes('<div class="oet-pricing-price"><strong>&pound;' + price + '</strong>')) fail(`pricing.html: ${kicker} must show GBP ${price}`);
    }
    // Quick Check / Exam Prep Pro / OET Mastery (owner QA 31 Oct 2026): checkout price 15 / 32 / 75 with the comparison price 30 / 64 / 150 drawn
    // as ONE thin diagonal slash (`oet-price-slash`), never an X, a horizontal line-through, <del>/<s> or a second slash. Every other card has none.
    const WAS = { 'Package 30': 30, 'Package 31': 64, 'Package 32': 150 };
    for (const [kicker, was] of Object.entries(WAS)) {
      const card = (ph.match(new RegExp('<div class="oet-card-kicker">' + kicker + '</div>[\\s\\S]*?</article>')) || [''])[0];
      const slash = `<span class="oet-price-slash"><span class="oet-price-slash__label">Was </span>&pound;${was}</span>`;
      if ((card.match(/oet-price-slash"/g) || []).length !== 1 || !card.includes(slash)) fail(`pricing.html: ${kicker} must show exactly one slashed comparison price of GBP ${was}`);
      if (/oet-pricing-was|<del\b|<s>|<strike\b|line-through|previous price/i.test(card)) fail(`pricing.html: ${kicker} comparison price is a single diagonal slash only (no X, no horizontal strike)`);
    }
    if ((ph.match(/oet-price-slash"/g) || []).length !== 3) fail('pricing.html: only Quick Check, Exam Prep Pro and OET Mastery carry a slashed comparison price');
    if (!/\.oet-price-slash::after\s*\{[^}]*height:\s*1px[^}]*rotate\(-12deg\)/.test(ph) || /\.oet-price-slash::before/.test(ph)) fail('pricing.css: the comparison price is ONE thin diagonal slash (a single ::after line, no ::before, no X)');
    // sold: the Writing and Speaking Crash products, Basic English, TutorBook, mocks and the special packages stay
    for (const [kicker, title] of [['Package 09', 'Basic English Course - Preparation for OET'], ['Package 17', 'Recorded Writing Crash Course'], ['Package 23', 'Recorded Speaking Crash Course'], ['Package 26', 'Double Special Package - Writing + Speaking'], ['Package 27', 'Mega Special Package'], ['Package 46', 'TutorBook - First Edition 2026'], ['Package 48', '1 Full Mock']])
      if (!pricing.some((c) => c.kicker === kicker && c.title === title) || !new RegExp('<div class="oet-card-kicker">' + kicker + '</div>\\s*<h3>' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</h3>').test(ph)) fail(`pricing.html: ${title} (${kicker}) stays on sale`);
    // the Writing Crash / personal-letter and Speaking Crash / private-session cards point at the website packages
    for (let n = 13; n <= 22; n++) {
      const card = (ph.match(new RegExp('<div class="oet-card-kicker">Package ' + n + '</div>[\\s\\S]*?</article>')) || [''])[0];
      if (!card.includes('<a class="oet-upsell__link" href="#writing-packages" data-oet-poster="writing-packages">Enhance your preparation with website practice</a>')) fail(`pricing.html: Package ${n} must link the website Writing packages (#writing-packages)`);
    }
    for (let n = 23; n <= 25; n++) {
      const card = (ph.match(new RegExp('<div class="oet-card-kicker">Package ' + n + '</div>[\\s\\S]*?</article>')) || [''])[0];
      if (!card.includes('<a class="oet-upsell__link" href="#speaking-packages" data-oet-poster="speaking-packages">Enhance your preparation with website practice</a>')) fail(`pricing.html: Package ${n} must link the website Speaking packages (#speaking-packages)`);
    }
    // REMOVED FROM SALE (owner 30 Oct 2026): the Nursing Course + Assessment Package (GBP 75) and the legacy Full Crash GBP 65 / 75 / 85. Nothing may name them, link them or price them.
    const REMOVED = [['Package 06', 'Nursing Course + Assessment Package'], ['Package 10', 'Full Crash Course - General OET'], ['Package 11', 'Full Crash Course + 3 Writing Assessments'], ['Package 12', 'Full Crash Course + 5 Writing Assessments']];
    for (const [kicker, title] of REMOVED) {
      if (pricing.some((c) => c.kicker === kicker || c.title.startsWith(title))) fail(`pricing.json: ${title} (${kicker}) was removed from sale`);
      if (ph.includes('<div class="oet-card-kicker">' + kicker + '</div>')) fail(`pricing.html: ${title} (${kicker}) was removed from sale`);
    }
    for (const [page, html] of Object.entries(distHtml)) {
      if (/Nursing Course \+ Assessment|nursing-course-plus-assessment|Full Crash Course (?:-|&ndash;|\+) ?(?:General|3 Writing|5 Writing)|full-crash-course-(?:general|plus)|View the Crash Course\b|crash-course options/i.test(html.replace(/&amp;/g, '&')))
        fail(`${page}: the Nursing Course + Assessment Package and the legacy Full Crash GBP 65 / 75 / 85 were removed from sale and must not be named, linked or priced`);
      if (/<!--oet:|\\u003c!--oet:/.test(html)) fail(`${page}: an unreplaced <!--oet:...--> build marker leaked into the page (also checked in its JSON-LD-escaped form \\u003c!--oet:)`);
      // the former GBP 140 Full Condensed Recorded Course + TutorBook (Medicine) was retired; its place is the Complete OET Bundle + TutorBook (the legacy Classic Medicine keeps its own sign-in slug, which is not matched here)
      // (2 Nov 2026: also the "Full condensed recorded Medicine" Course description; bare "condensed" stays legal on the Classic cards)
      if (/Condensed Recorded Course|Full condensed recorded|Medicine Condensed|full-condensed-medicine-tbook/i.test(html.replace(/&amp;/g, '&'))) fail(`${page}: the retired Full Condensed Recorded Course + TutorBook must not be named or linked (the Complete OET Bundle + TutorBook replaces it)`);
    }
  }

  // Wording (owner, 30 Oct 2026): no candidate-facing "AI" on the pricing, homepage, service and profession course pages (Sami is "your study assistant"). The legal pages keep
  // their provider disclosures and the internal #ai-grading-packages anchor is not visible copy, so neither is scanned.
  for (const page of ['pricing.html', 'index.html', 'service.html', 'oet-course-for-doctors.html', 'oet-course-for-nurses.html', 'oet-course-for-pharmacists.html', 'oet-course-for-physiotherapists.html', 'oet-for-allied-health.html', 'oet-course-for-dentists.html', 'oet-mock-test.html', 'oet-speaking-practice-online.html']) {
    const copy = ((distHtml[page] || '').match(/<main[\s\S]*<\/main>/) || [''])[0].replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');
    if (/\bAI\b/.test(copy)) fail(`${page}: the term "AI" must not appear in candidate-facing copy (owner 30 Oct 2026)`);
  }

  // Website Writing Assessment wording (owner brief 1 Nov 2026): within 15 minutes, never the old review-window, quality-review or mentor promises.
  for (const [page, html] of Object.entries(distHtml)) {
    if (/minimum 15|review window|second quality review|human mentor review/i.test(html)) fail(`${page}: the retired Writing assessment wording is back (use "Detailed Writing Assessment Within 15 Minutes")`);
  }

  // Arabic pages carry no bundle cards, so no English-only tier name or Basic English gift on the 165 tier can sit there
  for (const [page, h] of Object.entries(distHtml)) {
    if (page === 'ar/oet-course-for-doctors.html' && /الكورس \+ TutorBook|باقة TutorBook|المختصر للطب/.test(h)) fail(page + ': the retired course + TutorBook / Condensed wording is back (Classic, Full + practice and the Complete bundle are the tiers)');
    if (page.startsWith('ar/') && /oet-bundle-card|oet-choose-card|Complete OET Bundle|Ultimate OET Course|Full Crash Essential/.test(h)) fail(page + ': English-only bundle strings must not appear on an Arabic page');
  }

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
  // OET Recalls (owner brief v2, 21 Nov 2026): one language-matched link after "OET Blog" in the shared header nav (and so in the mobile menu
  // main.js clones from it) and in the footer Resources & Guides group. The two landing pages are FROZEN: they must carry no Recalls link at all.
  const { RECALLS_LINKS } = await import('../src/lib/recalls.mjs');
  const FROZEN_HOME = ['index.html', 'ar/index.html'];
  const recallsOf = (page) => RECALLS_LINKS[page.startsWith('ar/') ? 'ar' : 'en'];
  for (const page of FROZEN_HOME) if (/oet-recalls/.test(distHtml[page] || '')) fail(`${page}: the landing page is frozen (owner brief 21 Nov 2026): it must not link or mention the Recalls page`);
  for (const [page, html] of Object.entries(distHtml)) {
    if ((html.match(/id="vl-offcanvas-menu"/g) || []).length !== 1) fail(`${page}: expected exactly one offcanvas drawer`);
    const nav = (html.match(/<nav class="vl-mobile-menu-active"[\s\S]*?<\/nav>/) || [''])[0];
    const rl = recallsOf(page);
    const wantTop = FROZEN_HOME.includes(page) ? TOP : [...TOP.slice(0, TOP.indexOf('OET Blog') + 1), rl.nav, ...TOP.slice(TOP.indexOf('OET Blog') + 1)];
    // top-level items = the first link text of each <li> directly inside the nav's outer <ul>
    const found = [];
    let depth = 0;
    for (const m of nav.matchAll(/<(\/?)ul\b|<li\b[^>]*>\s*<a\b[^>]*>([^<]*)/g)) {
      if (m[2] === undefined) depth += m[1] ? -1 : 1;
      else if (depth === 1 && wantTop.includes(m[2].trim())) found.push(m[2].trim());
    }
    if (found.join('|') !== wantTop.join('|')) fail(`${page}: main nav must be ${wantTop.join(' / ')} (found ${found.join(' / ')})`);
    if (!FROZEN_HOME.includes(page) && !nav.includes(`<li><a href="/blog/">OET Blog</a></li><li><a href="${rl.href}"${rl.lang}>${rl.nav}</a></li>`)) fail(`${page}: the Recalls nav link (${rl.nav} -> ${rl.href}) must follow "OET Blog" directly`);
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
    // the Recalls footer link lives in Resources & Guides on every page except the frozen landing pages
    const groupsHere = FROZEN_HOME.includes(page) ? FOOTER_GROUPS
      : FOOTER_GROUPS.map(([t, l]) => (t === 'Resources & Guides' ? [t, [...l, [rl.footer, rl.href]]] : [t, l]));
    groupsHere.forEach(([title, links], i) => {
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

// ---- SEO + AI-search (GEO) plan, 2 Nov 2026 ----------------------------------------------------------------------
// hreflang pairs, title lengths, entity data (person.json), dates, author box, related articles, internal links,
// Course offers, the crawlable score-card sample, llms.txt / llms-full.txt / feed.xml, robots.txt, IndexNow, the
// bundled core stylesheet and the derived head tags.
{
  const ORIGIN = 'https://oetwithdrhesham.co.uk';
  const { loadBlog, pageDates } = await import('../src/lib/blog.mjs');
  const { posts } = loadBlog();
  const { loadPerson, personNode, organizationNode, yearsCoaching, numberWord } = await import('../src/lib/schema.mjs');
  const { courseOffers } = await import('../src/lib/bundles.mjs');
  const person = loadPerson();
  const urlOf = (page) => (page === 'index.html' ? '/' : page.endsWith('/index.html') ? `/${page.slice(0, -10)}`
    : page === 'english-placement-test.html' ? '/english-placement-test' : `/${page}`);
  const pageOfUrl = (u) => (u === '/' ? 'index.html' : u.endsWith('/') ? `${u.slice(1)}index.html` : u === '/english-placement-test' ? 'english-placement-test.html' : u.slice(1));
  const mainOf = (html) => (html.match(/<main[\s\S]*<\/main>/) || [''])[0];
  const decoded = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&([a-z]+);/gi, (m, e) => NAMED[e] ?? m);
  const postPages = new Set(posts.map((p) => p.url.slice(1)));
  const COURSE_PAGES = { 'oet-course-for-doctors.html': 'medicine', 'oet-course-for-nurses.html': 'nursing', 'oet-course-for-pharmacists.html': 'pharmacy',
    'oet-course-for-physiotherapists.html': 'physiotherapy', 'oet-for-allied-health.html': 'other-allied-health', 'oet-course-for-dentists.html': 'other-allied-health' };

  // hreflang: an explicit table of English <-> Arabic twins (the homepage pairs with the Arabic entry page /ar/).
  // Each side declares en, ar and x-default (= the English page); no other page declares hreflang.
  const HREFLANG_PAIRS = [
    ['index.html', 'ar/index.html'], ['oet-course-for-doctors.html', 'ar/oet-course-for-doctors.html'], ['oet-course-for-nurses.html', 'ar/oet-course-for-nurses.html'],
    ['oet-course-for-pharmacists.html', 'ar/oet-course-for-pharmacists.html'], ['oet-course-for-physiotherapists.html', 'ar/oet-course-for-physiotherapists.html'],
    ['oet-score-requirements.html', 'ar/oet-score-requirements.html'], ['oet-test-dates-and-fees.html', 'ar/oet-test-dates-and-fees.html'], ['oet-vs-ielts.html', 'ar/oet-vs-ielts.html'],
    ['oet-writing-tips.html', 'ar/oet-writing-tips.html'], ['oet-speaking-tips.html', 'ar/oet-speaking-tips.html'], ['oet-sample-tests.html', 'ar/oet-sample-tests.html'],
    ['gulf-pathway-guide.html', 'ar/gulf-pathway-guide.html'],
    ['what-is-oet.html', 'ar/what-is-oet.html'], ['oet-exam-fees.html', 'ar/oet-exam-fees.html'], ['oet-passing-score.html', 'ar/oet-passing-score.html'], ['official-information.html', 'ar/official-information.html'], ['oet-course-egypt.html', 'ar/oet-course-egypt.html'], ['oet-course-saudi-arabia.html', 'ar/oet-course-saudi-arabia.html'], ['oet-course-uae.html', 'ar/oet-course-uae.html'], ['oet-course-qatar.html', 'ar/oet-course-qatar.html'], ['oet-course-kuwait.html', 'ar/oet-course-kuwait.html'], ['oet-course-oman.html', 'ar/oet-course-oman.html'],
    // SEO brief of 21 Nov 2026
    ['oet-paper-test-2027-changes.html', 'ar/oet-paper-test-2027-changes.html'], ['pricing.html', 'ar/pricing.html'], ['success-stories.html', 'ar/success-stories.html'],
    ['oet-writing-sample-nursing-referral.html', 'ar/oet-writing-sample-nursing-referral.html'], ['oet-writing-sample-nursing.html', 'ar/oet-writing-sample-nursing.html'],
    ['oet-writing-sample-medicine.html', 'ar/oet-writing-sample-medicine.html'], ['oet-writing-sample-medicine-discharge.html', 'ar/oet-writing-sample-medicine-discharge.html'],
    ['oet-writing-sample-pharmacy.html', 'ar/oet-writing-sample-pharmacy.html'], ['oet-writing-sample-physiotherapy.html', 'ar/oet-writing-sample-physiotherapy.html'],
    ['oet-speaking-role-play-cards.html', 'ar/oet-speaking-role-play-cards.html'], ['oet-mock-test.html', 'ar/oet-mock-test.html'], ['oet-score-calculator.html', 'ar/oet-score-calculator.html'],
    // OET Recalls (owner brief v2, 21 Nov 2026)
    ['oet-recalls.html', 'ar/oet-recalls.html'],
  ];
  const paired = new Map(HREFLANG_PAIRS.flatMap(([en, ar]) => [[en, [en, ar]], [ar, [en, ar]]]));
  for (const [page, html] of Object.entries(distHtml)) {
    const alts = [...html.matchAll(/<link rel="alternate" hreflang="([a-zA-Z-]+)" href="([^"]+)"/g)].map((m) => `${m[1]}=${m[2]}`).sort();
    const pair = paired.get(page);
    const want = pair ? [`ar=${ORIGIN}${urlOf(pair[1])}`, `en=${ORIGIN}${urlOf(pair[0])}`, `x-default=${ORIGIN}${urlOf(pair[0])}`] : [];
    if (alts.join() !== want.join()) fail(`${page}: hreflang must be ${want.length ? want.join(', ') : 'absent (not an English/Arabic pair)'}; found ${alts.join(', ') || 'none'}`);
  }

  // titles: at most 60 characters in English, 70 in Arabic (entities decoded)
  for (const [page, html] of Object.entries(distHtml)) {
    const title = decoded((html.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]);
    const max = page.startsWith('ar/') ? 70 : 60;
    if ([...title].length > max) fail(`${page}: <title> is ${[...title].length} characters (max ${max}): ${title}`);
  }

  // pricing.html: the visible pricing FAQ has its FAQPage twin (the systemic check above proves each answer is verbatim)
  {
    const ph = distHtml['pricing.html'] || '';
    const visibleQs = ((ph.match(/<div class="oet-pfaq">[\s\S]*?<\/div>\s*<div class="oet-pchooser"/) || [''])[0].match(/<details>/g) || []).length;
    const ldQs = nodesOfType(ldBlocks(ph).filter((b) => JSON.stringify(b).includes('"FAQPage"')), 'Question').length;
    if (!visibleQs || ldQs !== visibleQs) fail(`pricing.html: FAQPage JSON-LD has ${ldQs} questions for ${visibleQs} visible pricing FAQs`);
  }

  // breadcrumbs: EVERY page with BreadcrumbList JSON-LD shows the same trail (blog style nav or the theme's breadcrumb-text list)
  for (const [page, html] of Object.entries(distHtml)) {
    const crumbs = nodesOfType(ldBlocks(html), 'BreadcrumbList')[0];
    if (!crumbs) continue;
    const list = (html.match(/<nav class="oet-breadcrumbs" aria-label="[^"]+"><ol>([\s\S]*?)<\/ol><\/nav>/) || html.match(/<div class="breadcrumb-text">[\s\S]*?<ul>([\s\S]*?)<\/ul>/) || [])[1];
    if (!list) { fail(`${page}: BreadcrumbList JSON-LD without a visible breadcrumb`); continue; }
    const names = [...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => visibleText(m[1])).filter(Boolean);
    const ldNames = crumbs.itemListElement.map((i) => visibleText(i.name));
    if (names.join(' > ') !== ldNames.join(' > ')) fail(`${page}: visible breadcrumb "${names.join(' > ')}" != JSON-LD "${ldNames.join(' > ')}"`);
  }
  for (const page of ['pricing.html', 'faq.html', 'success-stories.html', 'english-placement-test.html'])
    if (!(distHtml[page] || '').includes('<nav class="oet-breadcrumbs" aria-label="Breadcrumb">')) fail(`${page}: needs the visible breadcrumb above its H1`);

  // entity data: every typed #drhesham / #organization node is the person.json node, everywhere
  const same = (a, b) => { const { '@context': _x, ...ra } = a; return JSON.stringify(ra) === JSON.stringify(b); };
  const P = personNode(person);
  const O = organizationNode(person);
  for (const [page, html] of Object.entries(distHtml)) {
    for (const b of ldBlocks(html)) walk(b, (n) => {
      if (!n['@type']) return;
      if (n['@id'] === person.id && !same(n, P)) fail(`${page}: Person #drhesham differs from src/data/person.json (rebuilt by src/lib/schema.mjs)`);
      if (n['@id'] === person.organization.id && !same(n, O)) fail(`${page}: Organization #organization differs from src/data/person.json`);
    });
    // a visible "coached … since YYYY" claim must use the owner-confirmed year
    for (const m of visibleText(mainOf(html)).matchAll(/(?:coach|coached|coaching|teach|teaching)[^.]{0,120}?since (\d{4})/g))
      if (Number(m[1]) !== person.coachingSince) fail(`${page}: says coaching "since ${m[1]}", person.json says ${person.coachingSince}`);
    if (/"description":\s*"[^"]*since (?!\d{4}\b)|since 2020\./.test(html)) fail(`${page}: a stale "since 2020" entity description is back`);
  }
  {
    const years = yearsCoaching(person);
    const home = (distHtml['index.html'] || '').replace(/\r\n?/g, '\n');
    const about = (distHtml['about.html'] || '').replace(/\r\n?/g, '\n');
    if (!home.includes(`<span class="counter">${years}</span><span>+</span></strong>\n                                        <span class="oet-hero__stat-label">Years coaching</span>`)) fail(`index.html: the "Years coaching" stat must read ${years}+ (completed years since ${person.coachingSince})`);
    if (!home.includes(`With over ${numberWord(years)} years of dedicated experience`)) fail(`index.html: "With over ${numberWord(years)} years" must follow person.json coachingSince`);
    if (!about.includes(`<span class="counter">${years}</span><span>+</span></h3>\n                            <p>Years of healthcare education and coaching experience</p>`)) fail(`about.html: the years counter must read ${years}+`);
    const firstTab = (about.match(/aria-selected="true">(\d{4})<\/button>/) || [])[1];
    if (Number(firstTab) !== person.coachingSince) fail(`about.html: the timeline starts in ${firstTab}, person.json coachingSince is ${person.coachingSince}`);
  }

  // dates: the visible byline shows the JSON-LD dates; dateModified >= datePublished; the sitemap is never older
  const lastmod = new Map([...readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map((m) => [m[1], m[2]]));
  for (const [page, html] of Object.entries(distHtml)) {
    const head = html.slice(0, html.indexOf('</head>'));
    const { published, modified } = pageDates(head);
    if (published && modified && modified < published) fail(`${page}: dateModified ${modified} is before datePublished ${published}`);
    if (modified && lastmod.has(ORIGIN + urlOf(page)) && lastmod.get(ORIGIN + urlOf(page)) < modified) fail(`${page}: sitemap lastmod ${lastmod.get(ORIGIN + urlOf(page))} is older than dateModified ${modified}`);
    const byline = (mainOf(html).match(/<p class="(?:oet-guide-meta|pathway-byline)">By <a href="\/about\.html">Dr Ahmed Hesham<\/a>[\s\S]*?<\/p>/) || [])[0];
    if (postPages.has(page) && !byline) fail(`${page}: articles show the "By Dr Ahmed Hesham · Published · Updated" byline (<!--oet:dates-->)`);
    if (byline) {
      const times = [...byline.matchAll(/<time datetime="(\d{4}-\d{2}-\d{2})">/g)].map((m) => m[1]);
      if (!times.length) fail(`${page}: the byline must carry <time datetime> dates (<!--oet:dates-->), not typed text`);
      else if (times[times.length - 1] !== modified) fail(`${page}: visible updated date ${times[times.length - 1]} != JSON-LD dateModified ${modified}`);
    }
  }

  // author box on every article; "Related articles" on every article, the six course pages and the tips hub
  for (const page of postPages) {
    const html = distHtml[page] || '';
    if ((html.match(/<section class="oet-resource-section oet-author-bio" aria-label="About the author">/g) || []).length !== 1) fail(`${page}: needs exactly one author box (<!--oet:author-box-->)`);
    if (!html.includes(`coached doctors, nurses and allied health professionals preparing for OET since ${person.coachingSince}`)) fail(`${page}: the author box must come from person.json`);
  }
  for (const page of [...postPages, ...Object.keys(COURSE_PAGES), 'oet-tips.html']) {
    const sec = ((distHtml[page] || '').match(/<section class="oet-related oet-related--articles" aria-label="Related articles">[\s\S]*?<\/section>/) || [''])[0];
    const n = (sec.match(/class="oet-related-card"/g) || []).length;
    if (n < 3) fail(`${page}: "Related articles" needs at least 3 cards (found ${n})`);
    if (sec.includes(`href="${urlOf(page)}"`)) fail(`${page}: "Related articles" links the page itself`);
  }

  // internal links: every article has >= 3 inbound <main> links from other pages, every profession course page >= 10
  {
    const inbound = new Map();
    for (const [page, html] of Object.entries(distHtml)) {
      for (const t of new Set([...mainOf(html).matchAll(/href="(\/[^"#?]*)/g)].map((m) => pageOfUrl(m[1])))) {
        if (t !== page) inbound.set(t, (inbound.get(t) || 0) + 1);
      }
    }
    for (const page of postPages) if ((inbound.get(page) || 0) < 3) fail(`${page}: only ${inbound.get(page) || 0} inbound links from other pages (min 3)`);
    for (const page of Object.keys(COURSE_PAGES)) if ((inbound.get(page) || 0) < 10) fail(`${page}: only ${inbound.get(page) || 0} inbound links from other pages (min 10)`);
    for (const page of ['oet-mock-test.html', 'oet-speaking-practice-online.html', 'ar/oet-course-for-pharmacists.html', 'ar/oet-course-for-physiotherapists.html', 'ar/gulf-pathway-guide.html'])
      if ((inbound.get(page) || 0) < 3) fail(`${page}: only ${inbound.get(page) || 0} inbound links from other pages (min 3)`);
  }

  // Course JSON-LD: offers (Classic card + Full tiers, prices from the data files), instructor #drhesham, image = og:image
  for (const page of [...Object.keys(COURSE_PAGES), 'service.html']) {
    const html = distHtml[page] || '';
    const og = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
    const courses = nodesOfType(ldBlocks(html), 'Course').filter((c) => COURSE_PAGES[(c.url || String(c['@id'] || '').replace(/#.*$/, '')).replace(`${ORIGIN}/`, '')]);
    if (!courses.length) fail(`${page}: no profession Course node`);
    for (const c of courses) {
      const prof = COURSE_PAGES[(c.url || String(c['@id']).replace(/#.*$/, '')).replace(`${ORIGIN}/`, '')];
      const want = courseOffers(prof).map((o) => `${o.name}=${o.price}`).sort().join('|');
      const got = (c.offers || []).map((o) => `${o.name}=${o.price}`).sort().join('|');
      if (got !== want) fail(`${page}: Course "${c.name}" offers ${got || 'none'}, expected ${want}`);
      if ((c.offers || []).some((o) => o.priceCurrency !== 'GBP' || o.category !== 'Paid' || !o.url)) fail(`${page}: Course "${c.name}" offers need GBP, category Paid and a url`);
      if (c.instructor?.['@id'] !== person.id) fail(`${page}: Course "${c.name}" instructor must be #drhesham`);
      if (c.image !== og) fail(`${page}: Course "${c.name}" image must be the page og:image`);
      if (c.aggregateRating || c.review) fail(`${page}: Course "${c.name}" must not carry a self-made rating or review`);
    }
  }

  // success stories: a crawlable sample of real score cards, mirrored in associatedMedia; no stale "1,600+"
  {
    const html = distHtml['success-stories.html'] || '';
    const gallery = (html.match(/<div class="success-masonry" id="success-gallery">([\s\S]*?)<\/div>\s*<nav class="success-pagination"/) || [, ''])[1];
    const imgs = [...gallery.matchAll(/<img src="([^"]+)" alt="([^"]+)" width="\d+" height="\d+" loading="lazy"/g)];
    if (imgs.length < 24) fail(`success-stories.html: expected at least 24 score cards in the HTML (found ${imgs.length})`);
    for (const [, src, alt] of imgs) {
      if (!existsSync(path.join(ROOT, src.slice(1)))) fail(`success-stories.html: sample image missing on disk ${src}`);
      if (!/^Verified OET score card shared in \d{4} \(\d+ of [\d,]+ that year\)$/.test(alt)) fail(`success-stories.html: sample alt text must be the honest description, found "${alt}"`);
    }
    const gal = nodesOfType(ldBlocks(html), 'ImageGallery')[0];
    if (!gal || (gal.associatedMedia || []).length !== imgs.length) fail(`success-stories.html: ImageGallery associatedMedia must list the ${imgs.length} sample images`);
    for (const [page, h] of Object.entries(distHtml)) if (/1,600\+|\+1,600|1,600 /.test(h)) fail(`${page}: stale "1,600" score-card count (use <!--oet:story-count-->)`);
  }

  // discovery files: llms.txt, llms-full.txt and feed.xml are built, committed to the webroot, complete and free of "AI"
  {
    const sitemapUrls = [...lastmod.keys()].sort();
    for (const f of ['llms.txt', 'llms-full.txt', 'feed.xml']) {
      const d = path.join(DIST, f);
      const r = path.join(ROOT, f);
      if (!existsSync(d) || !existsSync(r)) { fail(`${f}: missing from dist or the repo root`); continue; }
      if (readFileSync(d, 'utf8').replace(/\r\n?/g, '\n') !== readFileSync(r, 'utf8').replace(/\r\n?/g, '\n')) fail(`${f}: root copy differs from the build`);
      if (/\bAI\b/.test(readFileSync(d, 'utf8'))) fail(`${f}: must not use the term "AI"`);
    }
    const llms = existsSync(path.join(DIST, 'llms.txt')) ? readFileSync(path.join(DIST, 'llms.txt'), 'utf8') : '';
    const listed = [...llms.matchAll(/^- \[[^\]]+\]\((https:\/\/[^)]+)\): /gm)].map((m) => m[1]);
    if (listed.slice().sort().join() !== sitemapUrls.join()) fail(`llms.txt: must list every sitemap URL exactly once (${listed.length} listed, ${sitemapUrls.length} in the sitemap)`);
    if (!llms.startsWith('# OET with Dr Ahmed Hesham\n\n> ') || !llms.includes(`since ${person.coachingSince}`)) fail('llms.txt: needs the H1, the summary blockquote and the person.json facts');
    const full = existsSync(path.join(DIST, 'llms-full.txt')) ? readFileSync(path.join(DIST, 'llms-full.txt'), 'utf8') : '';
    for (const u of sitemapUrls) if (!/\/(terms|privacy|refund-policy|cookie-policy)\/$/.test(u) && !full.includes(`URL: ${u}\n`)) fail(`llms-full.txt: missing ${u}`);
    const feed = existsSync(path.join(DIST, 'feed.xml')) ? readFileSync(path.join(DIST, 'feed.xml'), 'utf8') : '';
    if ((feed.match(/<entry>/g) || []).length !== posts.length) fail(`feed.xml: ${(feed.match(/<entry>/g) || []).length} entries for ${posts.length} blog posts`);
    const newest = posts.reduce((m, p) => (p.dateModified > m ? p.dateModified : m), '');
    if (!feed.includes(`<updated>${newest}T00:00:00Z</updated>\n  <author>`)) fail(`feed.xml: <updated> must be the newest dateModified (${newest})`);
    for (const p of posts) if (!feed.includes(`<id>${ORIGIN}${p.url}</id>`)) fail(`feed.xml: no entry for ${p.url}`);
  }
  {
    const robots = readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
    for (const ua of ['*', 'OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'OAI-AdsBot', 'Googlebot', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Bingbot', 'Applebot-Extended'])
      if (!new RegExp(`^User-agent: ${ua.replace('*', '\\*')}$`, 'm').test(robots)) fail(`robots.txt: no group for ${ua}`);
    if (/^Disallow:\s*\/\s*$/m.test(robots) || !robots.includes('Sitemap: https://oetwithdrhesham.co.uk/sitemap.xml') || !robots.includes('https://oetwithdrhesham.co.uk/llms.txt')) fail('robots.txt: everything stays allowed, with the Sitemap line and the llms.txt pointer');
    const keys = readdirSync(ROOT).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
    if (keys.length !== 1) fail(`IndexNow: expected exactly one <32-hex>.txt key file in the repo root, found ${keys.length}`);
    else if (readFileSync(path.join(ROOT, keys[0]), 'utf8').trim() !== keys[0].slice(0, 32)) fail(`IndexNow: ${keys[0]} must contain its own key`);
    const ht = readFileSync(path.join(ROOT, '.htaccess'), 'utf8');
    if (!ht.includes('RewriteRule ^(privacy|terms|refund-policy|cookie-policy|ar|blog)/index\\.html$ https://%{HTTP_HOST}/$1/ [R=301,L]')) fail('.htaccess: /<folder>/index.html must 301 to /<folder>/');
    if (!ht.includes('ExpiresByType text/plain "access plus 1 day"') || !ht.includes('application/atom+xml')) fail('.htaccess: text/plain caching and the Atom feed type are required');
  }

  // Growth brief 15 Nov 2026: one primary brand name, one page of official links and facts, store clicks measured
  {
    const org = person.organization;
    if (org.name !== 'OET with Dr Ahmed Hesham' || !(org.alternateName || []).includes('OET with Dr Hesham')) fail('person.json: the primary brand is "OET with Dr Ahmed Hesham", with "OET with Dr Hesham" as an alternateName');
    for (const [page, html] of Object.entries(distHtml)) {
      const site = (html.match(/<meta property="og:site_name" content="([^"]*)"/) || [])[1];
      if (site !== undefined && site !== org.name) fail(`${page}: og:site_name must be "${org.name}"`);
      if (/testflight/i.test(html)) fail(`${page}: no TestFlight link (the App Store listing is the only iOS link)`);
    }
    const OFFICIAL = ['https://wa.me/447961725989', 'https://apps.apple.com/app/oet-with-dr-ahmed-hesham/id6827749987', 'https://play.google.com/store/apps/details?id=com.oetwithdrhesham.app',
      'https://app.oetwithdrhesham.co.uk/', 'mailto:support@oetwithdrhesham.co.uk', 'ProHealth Digital LLC', ...org.sameAs.map((u) => u.replace(/\/$/, ''))];
    for (const page of ['official-information.html', 'ar/official-information.html']) {
      const html = distHtml[page] || '';
      for (const need of OFFICIAL) if (!html.includes(need)) fail(`${page}: the official links page must carry ${need}`);
      if (!/"dateModified": "\d{4}-\d{2}-\d{2}"/.test(html)) fail(`${page}: the official facts page must be dated (dateModified)`);
    }
    const linked = ['about.html', 'contact.html', 'success-stories.html', 'teaching-approach.html', 'service.html', 'oet-course-for-doctors.html', 'oet-course-for-nurses.html',
      'oet-course-for-pharmacists.html', 'oet-course-for-physiotherapists.html', 'oet-course-for-dentists.html', 'oet-for-allied-health.html'];
    for (const page of linked) {
      const html = distHtml[page] || '';
      if (!html.includes('href="/official-information.html"') || !html.includes('play.google.com/store/apps/details?id=com.oetwithdrhesham.app') || !html.includes('apps.apple.com/app/oet-with-dr-ahmed-hesham/id6827749987'))
        fail(`${page}: the trust and course pages link the official information page and both app stores`);
    }
    for (const page of ['ar/index.html', 'ar/oet-course-for-doctors.html', 'ar/oet-course-for-nurses.html'])
      if (!(distHtml[page] || '').includes('href="/ar/official-information.html"')) fail(`${page}: Arabic pages link the Arabic official information page`);
    const analytics = readFileSync(path.join(ROOT, 'assets/js/oet-analytics.js'), 'utf8');
    for (const ev of ['ios_download_click', 'android_download_click', 'click_whatsapp', 'app_cta_click', 'generate_lead']) if (!analytics.includes(`"${ev}"`)) fail(`oet-analytics.js: the ${ev} event is required`);
    if (!/^User-agent: OAI-AdsBot$/m.test(readFileSync(path.join(ROOT, 'robots.txt'), 'utf8'))) fail('robots.txt: OAI-AdsBot must be allowed (ad landing-page validation)');
  }

  // one bundled render-blocking stylesheet; head tags derived by src/lib/head.mjs
  const CORE = ['plugins/bootstrap.purged.min.css', 'oet-icons.css', 'style.min.css', 'oet-common.css', 'oet-mobile.css', 'oet-cookie-consent.css', 'oet-polish.css', 'oet-redesign.css'];
  if (!existsSync(path.join(ROOT, 'assets/css/oet-core.css'))) fail('assets/css/oet-core.css missing (npm run build)');
  for (const [page, html] of Object.entries(distHtml)) {
    if ((html.match(/<link rel="stylesheet" href="\/assets\/css\/oet-core\.css\?v=[0-9a-f]{10}">/g) || []).length !== 1) fail(`${page}: must link the bundled /assets/css/oet-core.css once`);
    for (const c of CORE) if (html.includes(`href="/assets/css/${c}`)) fail(`${page}: ${c} must come from oet-core.css, not its own <link>`);
    if (!html.includes('<link rel="alternate" type="application/atom+xml" title="OET Blog by Dr Hesham" href="/feed.xml">')) fail(`${page}: Atom feed link missing`);
    if (/<meta property="og:image" /.test(html) && !/<meta property="og:image:alt" content="[^"]+">/.test(html)) fail(`${page}: og:image without og:image:alt`);
    if (postPages.has(page)) {
      const { published, modified } = pageDates(html.slice(0, html.indexOf('</head>')));
      if (!html.includes('<meta property="og:type" content="article">') || !html.includes(`<meta property="article:published_time" content="${published}">`)
        || !html.includes(`<meta property="article:modified_time" content="${modified}">`) || !html.includes(`<meta name="author" content="${person.name}">`))
        fail(`${page}: articles need og:type article, article:published_time / modified_time from the JSON-LD and the author meta`);
    }
  }
}

// ---- SEO implementation brief, 21 Nov 2026 ------------------------------------------------------------------------------
// P1 counters, P4 honest "free" wording, P5 Arabic section, P6 homepage weight, P7 HSTS, and the January 2027 paper-test news
// (two posts, the announcement bar on every page, the homepage cards). P2 (the public recalls page) was reversed by the owner on
// 21 Nov 2026 (brief v2) and is built: see the "OET Recalls page" block at the end of this file.
{
  const ORIGIN = 'https://oetwithdrhesham.co.uk';
  const { loadBlog } = await import('../src/lib/blog.mjs');
  const { loadAnnouncement } = await import('../src/lib/announce.mjs');
  const { arabicPosts } = loadBlog();
  const ann = loadAnnouncement();
  const mainOf = (html) => (html.match(/<main[\s\S]*<\/main>/) || [''])[0];
  const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
  const srcOf = (rel) => readFileSync(path.join(SITE, 'src', rel), 'utf8');

  // P1: every animated counter carries its final value as text (crawlers and no-JS visitors), never "0"
  for (const [page, html] of Object.entries(distHtml)) {
    for (const m of html.matchAll(/<span class="oet-countup" data-count="(\d+)"[^>]*>([^<]*)<\/span>/g))
      if (m[2] !== Number(m[1]).toLocaleString('en-GB')) fail(`${page}: counter data-count="${m[1]}" must render "${Number(m[1]).toLocaleString('en-GB')}" as text, found "${m[2]}"`);
  }
  for (const page of ['success-stories.html', 'ar/success-stories.html']) {
    const html = distHtml[page] || '';
    const cards = html.match(/<span class="oet-countup" data-count="(\d+)">/g) || [];
    if (cards.length !== 2) fail(`${page}: expected the two success counters (score cards, latest additions), found ${cards.length}`);
  }

  // Arabic success stories: a crawlable sample of real score cards with honest Arabic alt text, mirrored in associatedMedia
  {
    const html = distHtml['ar/success-stories.html'] || '';
    const gallery = (html.match(/<div class="success-masonry" id="success-gallery">([\s\S]*?)<\/div>\s*<nav class="success-pagination"/) || [, ''])[1];
    const imgs = [...gallery.matchAll(/<img src="([^"]+)" alt="([^"]+)" width="\d+" height="\d+" loading="lazy"/g)];
    if (imgs.length < 24) fail(`ar/success-stories.html: expected at least 24 score cards in the HTML (found ${imgs.length})`);
    for (const [, src, alt] of imgs) {
      if (!existsSync(path.join(ROOT, src.slice(1)))) fail(`ar/success-stories.html: sample image missing on disk ${src}`);
      if (!/^بطاقة درجات OET موثقة شاركها أحد الطلاب في \d{4} \(\d+ من [\d,]+ في ذلك العام\)$/.test(alt)) fail(`ar/success-stories.html: sample alt text must be the honest Arabic description, found "${alt}"`);
    }
    const gal = nodesOfType(ldBlocks(html), 'ImageGallery')[0];
    if (!gal || (gal.associatedMedia || []).length !== imgs.length) fail('ar/success-stories.html: ImageGallery associatedMedia must list the sample images');
  }

  // announcement bar: on EVERY page, in flow before the header, language-matched, verbatim, dismissible; the state script is in <head>
  for (const [page, html] of Object.entries(distHtml)) {
    const ar = page.startsWith('ar/');
    const t = ar ? ann.ar : ann.en;
    const bars = html.match(/<aside class="oet-announce"[^>]*>[\s\S]*?<\/aside>/g) || [];
    if (bars.length !== 1) { fail(`${page}: expected exactly one announcement bar, found ${bars.length}`); continue; }
    const want = `<a class="oet-announce__link" href="${t.href}">${t.bar}</a>`;
    if (!bars[0].includes(want)) fail(`${page}: the announcement bar must read "${t.bar}" and link ${t.href}`);
    if (!/<button class="oet-announce__close" type="button" aria-label="[^"]+">/.test(bars[0])) fail(`${page}: the announcement bar needs its dismiss button`);
    if (!new RegExp(`lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}"`).test(bars[0])) fail(`${page}: the announcement bar must carry lang/dir for its language`);
    if (html.indexOf('<aside class="oet-announce"') > html.indexOf('<header>')) fail(`${page}: the announcement bar must sit before the header`);
    const head = html.slice(0, html.indexOf('</head>'));
    if (!head.includes(`Date.parse('${ann.until}T23:59:59Z')`) || !head.includes(`oet_announce_${ann.id}`)) fail(`${page}: the head script that hides the bar after ${ann.until} or when dismissed is missing`);
    if (!html.includes('/assets/js/oet-announce.js?v=')) fail(`${page}: oet-announce.js (dismiss button) is not loaded`);
  }
  if (ann.until !== '2027-01-15') fail('announcement.json: the bar runs until 15 January 2027 (owner brief)');
  // homepage news cards: directly under the hero, language-matched
  for (const [page, t, hero] of [['index.html', ann.en, '<section class="oet-hero">'], ['ar/index.html', ann.ar, '<section class="oet-resource-hero oet-skill-hero">']]) {
    const html = distHtml[page] || '';
    const cards = html.match(/<section class="oet-news"[^>]*>[\s\S]*?<\/section>/g) || [];
    if (cards.length !== 1 || !cards[0].includes(`href="${t.href}"`) || !cards[0].includes(t.title)) fail(`${page}: expected one homepage news card linking ${t.href}`);
    if (!(html.indexOf(hero) !== -1 && html.indexOf(hero) < html.indexOf('<section class="oet-news"'))) fail(`${page}: the news card must come right after the hero`);
  }
  for (const [page, html] of Object.entries(distHtml)) if (!['index.html', 'ar/index.html'].includes(page) && html.includes('class="oet-news"')) fail(`${page}: only the two homepages carry the news card`);

  // the two paper-test posts: the 16 countries (owner-confirmed list, verbatim from the OET customer-care email) in a table, the video slot, the sources
  {
    const COUNTRIES = { en: ['Australia', 'Canada', 'Egypt', 'Ghana', 'India', 'Ireland', 'Kenya', 'Nepal', 'New Zealand', 'Pakistan', 'Philippines', 'Saudi Arabia', 'Sri Lanka', 'Turkey', 'United Arab Emirates', 'United Kingdom'],
      ar: ['أستراليا', 'كندا', 'مصر', 'غانا', 'الهند', 'أيرلندا', 'كينيا', 'نيبال', 'نيوزيلندا', 'باكستان', 'الفلبين', 'السعودية', 'سريلانكا', 'تركيا', 'الإمارات', 'المملكة المتحدة'] };
    for (const [page, lang] of [['oet-paper-test-2027-changes.html', 'en'], ['ar/oet-paper-test-2027-changes.html', 'ar']]) {
      const html = distHtml[page] || '';
      const cells = [...((html.match(/<table class="pathway-table">[\s\S]*?<\/table>/) || [''])[0].matchAll(/<td>([^<]*)<\/td>/g))].map((m) => m[1]);
      if (cells.join('|') !== COUNTRIES[lang].join('|')) fail(`${page}: the 16-country table must list exactly ${COUNTRIES[lang].join(', ')} (found ${cells.length} cells)`);
      if (!html.includes('<!-- VIDEO SLOT')) fail(`${page}: the video embed slot under the H1 must stay until the video is added`);
      if (!html.includes('https://oet.com/post/oet-test-on-paper-update-2027')) fail(`${page}: must cite the official OET announcement`);
      if (!/nursing and medicine only|التمريض والطب/.test(visibleText(mainOf(html)))) fail(`${page}: must state that paper continues for Nursing and Medicine only`);
      if (!/Cambridge Boxhill Language Assessment/.test(html)) fail(`${page}: the country list must be attributed to the OET customer-care email (Cambridge Boxhill Language Assessment)`);
    }
    if (!/<h1[^>]*>OET on Paper ends for 10 professions in January 2027: what changes for you<\/h1>/.test(distHtml['oet-paper-test-2027-changes.html'] || '')) fail('oet-paper-test-2027-changes.html: H1 is the owner-approved headline');
    if (!blogHtmlFor('blog/index.html').includes('href="/ar/oet-paper-test-2027-changes.html"') || !blogHtmlFor('blog/index.html').includes('href="/oet-paper-test-2027-changes.html"')) fail('blog/index.html: must list both paper-test posts');
    function blogHtmlFor(p) { return distHtml[p] || ''; }
  }
  // Arabic articles in blog.json "arabicPosts": thumbnail, feed entry (xml:lang="ar"), article head tags
  {
    const feed = existsSync(path.join(DIST, 'feed.xml')) ? readFileSync(path.join(DIST, 'feed.xml'), 'utf8') : '';
    if ((feed.match(/<entry[ >]/g) || []).length !== loadBlog().posts.length + arabicPosts.length) fail(`feed.xml: ${(feed.match(/<entry[ >]/g) || []).length} entries for ${loadBlog().posts.length + arabicPosts.length} posts (English + Arabic)`);
    for (const p of arabicPosts) {
      const html = distHtml[p.url.slice(1)] || '';
      if (!existsSync(path.join(ROOT, p.image.slice(1)))) fail(`blog: thumbnail missing ${p.image}`);
      if (!feed.includes(`<entry xml:lang="ar">`) || !feed.includes(`<id>${ORIGIN}${p.url}</id>`)) fail(`feed.xml: no Arabic entry for ${p.url}`);
      if (!html.includes('<meta property="og:type" content="article">') || !html.includes(`<meta property="article:published_time" content="${p.datePublished}">`)) fail(`${p.url}: Arabic articles need og:type article and article:published_time`);
      if (!nodesOfType(ldBlocks(html), 'BlogPosting').length) fail(`${p.url}: BlogPosting JSON-LD missing`);
    }
  }

  // inbound links: every new page has >= 3 links from other pages' <main> (SEO brief checklist item 6)
  {
    const NEW = ['oet-paper-test-2027-changes.html', 'ar/oet-paper-test-2027-changes.html', 'ar/pricing.html', 'ar/success-stories.html', 'ar/oet-writing-sample-nursing-referral.html',
      'ar/oet-writing-sample-nursing.html', 'ar/oet-writing-sample-medicine.html', 'ar/oet-writing-sample-medicine-discharge.html', 'ar/oet-writing-sample-pharmacy.html',
      'ar/oet-writing-sample-physiotherapy.html', 'ar/oet-speaking-role-play-cards.html', 'ar/oet-mock-test.html', 'ar/oet-score-calculator.html'];
    const inbound = new Map();
    for (const [page, html] of Object.entries(distHtml))
      for (const t of new Set([...mainOf(html).matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1].slice(1)))) if (t !== page) inbound.set(t, (inbound.get(t) || 0) + 1);
    for (const page of NEW) if ((inbound.get(page) || 0) < 3) fail(`${page}: only ${inbound.get(page) || 0} inbound links from other pages (min 3)`);
  }

  // P5: every Arabic page links the Arabic sample-tests page with one of the four keyword anchors (homepage, what-is-oet and passing-score first)
  {
    const ANCHORS = ['اختبار OET تجريبي مجاني', 'نموذج امتحان OET مجاني', 'حمل نماذج OET الرسمية', 'جرب نفسك في OET قبل الحجز'];
    const used = new Set();
    for (const page of Object.keys(distHtml)) {
      // ar/oet-recalls.html keeps the exact four-block format the owner approved (brief v2, 21 Nov 2026)
      if (!page.startsWith('ar/') || page === 'ar/oet-sample-tests.html' || page === 'ar/oet-recalls.html') continue;
      const hit = ANCHORS.find((a) => mainOf(distHtml[page]).includes(`<a href="/ar/oet-sample-tests.html">${a}</a>`));
      if (!hit) fail(`${page}: must link /ar/oet-sample-tests.html with one of the four rotating keyword anchors`);
      else used.add(hit);
    }
    if (used.size !== ANCHORS.length) fail('the four Arabic sample-tests anchors must all be in use (rotate them)');
  }

  // P5: the Arabic pricing page shows every package price from the data files (markers, never typed) and no struck-out comparison prices
  {
    const src = srcOf('partials/ar/pricing/main.html');
    const pricing = JSON.parse(srcOf('data/pricing.json'));
    for (const c of pricing) if ((src.split(`<!--oet:price:${c.kicker}-->`).length - 1) < 1) fail(`ar/pricing.html: ${c.kicker} (${c.title}) is missing from the Arabic pricing page`);
    for (const key of ['full-practice', 'full-tutorbook', 'ultimate', 'crash-essential', 'crash-letters', 'crash-complete'])
      if (!src.includes(`<!--oet:bundle-price:${key}-->`)) fail(`ar/pricing.html: the ${key} tier price is missing`);
    if (/£\s?\d|&pound;\s?\d/.test(src.replace(/<!--[\s\S]*?-->/g, ''))) fail('ar/pricing.html: no price may be typed (use the build markers)');
    if (/oet-price-slash|line-through|<del\b/.test(distHtml['ar/pricing.html'] || '')) fail('ar/pricing.html: no struck-out comparison prices on the Arabic page');
  }

  // P4: "free" is only claimed where it is true (the full mocks are paid packages); the page leads with the genuinely free material
  {
    const html = distHtml['oet-mock-test.html'] || '';
    const title = (html.match(/<title>([^<]*)<\/title>/) || [, ''])[1];
    if (/\bfree\b/i.test(title)) fail(`oet-mock-test.html: the title must not say "free" (the full mocks are paid): ${title}`);
    if (!html.includes('id="free-first"') || !html.includes('Is there a free OET mock test online?')) fail('oet-mock-test.html: the "Start free" section and the honest free-mock FAQ are required');
    if (/مجاني|مجانا|مجاناً/.test((distHtml['ar/oet-mock-test.html'] || '').match(/<title>([^<]*)<\/title>/)[1])) fail('ar/oet-mock-test.html: the title must not claim a free mock');
  }

  // P6: the homepage no longer inlines its popup / motion scripts or styles, and GSAP is not loaded with document.write
  {
    const html = distHtml['index.html'] || '';
    if (/document\.write/.test(html)) fail('index.html: document.write is gone (GSAP loads through assets/js/oet-motion.js)');
    if (/oet-promo-popup-script|oet-community-popup-script/.test(html)) fail('index.html: the popup scripts must be external deferred files');
    for (const f of ['oet-promo-popup.js', 'oet-community-popup.js', 'oet-home-motion.js', 'oet-motion.js']) if (!html.includes(`<script defer src="/assets/js/${f}?v=`)) fail(`index.html: must load /assets/js/${f} deferred`);
    if (!html.includes('<link rel="stylesheet" href="/assets/css/oet-home.css?v=') || /<style>\s*body\.oet-live-site \.oet-services-tone/.test(html)) fail('index.html: the homepage styles must come from /assets/css/oet-home.css');
    if (!/<script type="text\/plain" data-oet-motion src="\/assets\/js\/plugins\/gsap\.min\.js\?v=[0-9a-f]{10}"><\/script>\s*<script type="text\/plain" data-oet-motion src="\/assets\/js\/plugins\/ScrollTrigger\.min\.js\?v=[0-9a-f]{10}"><\/script>/.test(html)) fail('index.html: the inert gsap / ScrollTrigger tags (data-oet-motion) are missing');
    for (const [page, h] of Object.entries(distHtml)) if (/oet-community-popup-script/.test(h)) fail(`${page}: the community popup script must be external (assets/js/oet-community-popup.js)`);
    // regression guard: 223,380 bytes before the brief. The brief's 100 KB target cannot be met without removing crawlable content (the nav, footer
    // and sections are server-rendered on purpose); this keeps what was won.
    if (Buffer.byteLength(html) > 195000) fail(`index.html: ${Buffer.byteLength(html)} bytes (guard 195000; was 223,380 before the brief)`);
    const motion = read('assets/js/main.js');
    if (!motion.includes('window.oetWhenMotionReady')) fail('main.js: GSAP-dependent code must wait for oetWhenMotionReady');
  }

  // P7: HSTS is sent once, by the proxy (NPM); the Apache config must not add a second, different value
  if (/Strict-Transport-Security/i.test(read('.htaccess').replace(/^\s*#.*$/gm, ''))) fail('.htaccess: must not set Strict-Transport-Security (the proxy already does; a second value made two conflicting headers)');
}

// ---- OET Recalls page (owner brief v2, 21 Nov 2026) --------------------------------------------------------------------------
// /oet-recalls.html + /ar/oet-recalls.html. The expected strings below are the brief's verbatim copy (sections 2, 4, 5, appendices A-C);
// the apex origin replaces the brief's "www." host, which 301-redirects to the apex (a www canonical would point at a redirect).
{
  const ORIGIN = 'https://oetwithdrhesham.co.uk';
  const { loadRecalls } = await import('../src/lib/recalls.mjs');
  const data = loadRecalls(); // validates src/data/recalls.json (newest first, <= 3 month groups, known skills and professions)
  const total = data.months.reduce((n, m) => n + m.entries.length, 0);
  if (!total) console.warn('WARN recalls: src/data/recalls.json has no entries yet, so Block B shows its holding line. Do NOT publish until the first batch from Dr Hesham is added (docs/recalls-page-2026-11-21.md).');
  const mainOf = (html) => (html.match(/<main[\s\S]*<\/main>/) || [''])[0];
  const vis = (html) => visibleText(html);

  const EXPECT = {
    en: {
      page: 'oet-recalls.html', url: '/oet-recalls.html', sibling: '/ar/oet-recalls.html', locale: 'en_GB', alt: 'ar_EG',
      title: 'OET Recalls: Recent Exam Topics | Dr Hesham',
      desc: 'Read the latest OET recalls: recent Writing and Speaking exam topics reported by our students, updated after every OET test date. Register for the full recall library and audio word banks.',
      h1: 'OET Recalls: Recent Exam Topics',
      intro: 'Preparing for OET? This page collects recent OET recalls: the exam topics our students report right after their test dates. Read the latest Writing and Speaking topics from roughly the last two months, free. New recalls are added after every test date.',
      ctaH: 'Want more recalls and more words?',
      ctaP: 'Registered students get the complete recall library, audio word banks, full courses, and writing corrections.',
      ctaBtn: 'Register on our platform',
      faq: [
        ['What are OET recalls?', 'Recalls are the exam topics that candidates remember and report after their test. They show the real topics being asked right now, so you can practise with material that matches the current exam, not old question banks.'],
        ['How often is this page updated?', 'After every OET test date. The page keeps roughly the last two months of topics, so what you see here reflects the current exam.'],
        ['Are these official OET questions?', 'No. They are topics reported by our students from their own exam experience, shared for practice purposes. They are not official OET content and are not endorsed by OET.'],
        ['Where can I find more recalls and word banks?', 'The free page shows recent Writing and Speaking topics. Registered students get the complete recall library, audio word recalls, full courses, and writing corrections on our platform — tap "Register on our platform" above to join.'],
      ],
      disclaimer: 'Disclaimer. All topics on this page are reported by our students from their own exam experience and are shared for practice purposes only. This is not official OET content, and it has not been reviewed, approved, or endorsed by OET or Cambridge Boxhill Language Assessment.',
      crumbs: [['Home', `${ORIGIN}/`], ['OET Recalls', `${ORIGIN}/oet-recalls.html`]],
    },
    ar: {
      page: 'ar/oet-recalls.html', url: '/ar/oet-recalls.html', sibling: '/oet-recalls.html', locale: 'ar_EG', alt: 'en_GB',
      title: 'ريكولز OET: مواضيع الامتحان الأخيرة | دكتور هشام',
      desc: 'اقرأ أحدث ريكولز OET: مواضيع الكتابة والمحادثة الأخيرة من الامتحان الحقيقي، منقولة عن طلابنا ومحدّثة بعد كل موعد امتحان. سجّل للوصول إلى مكتبة الريكولز الكاملة وبنوك الكلمات الصوتية.',
      h1: 'ريكولز OET: مواضيع الامتحان الأخيرة',
      intro: 'بتحضّر لامتحان OET؟ الصفحة دي بتجمّع أحدث الريكولز: مواضيع الامتحان اللي طلابنا بينقلوها فوراً بعد كل موعد. اقرأ آخر مواضيع الكتابة والمحادثة من آخر شهرين تقريباً، مجاناً. بنضيف ريكولز جديدة بعد كل موعد امتحان.',
      ctaH: 'عايز ريكولز أكتر وكلمات أكتر؟',
      ctaP: 'الطلاب المسجلين عندهم مكتبة الريكولز الكاملة، وبنوك الكلمات الصوتية، والكورسات الكاملة، وتصحيح الكتابة.',
      ctaBtn: 'سجّل على منصتنا',
      faq: [
        ['إيه هي ريكولز OET؟', 'الريكولز هي مواضيع الامتحان اللي الطلاب بيفتكروها وبينقلوها بعد امتحانهم. بتوريك المواضيع الحقيقية المطلوبة دلوقتي، فبتتدرب على مادة شبه الامتحان الحالي، مش بنوك أسئلة قديمة.'],
        ['الصفحة بتتحدث كل قد إيه؟', 'بعد كل موعد امتحان OET. الصفحة بتحتفظ بمواضيع آخر شهرين تقريباً، عشان اللي تشوفه هنا يعكس الامتحان الحالي.'],
        ['هل دي أسئلة رسمية من OET؟', 'لأ. دي مواضيع منقولة عن طلابنا من تجربتهم الشخصية في الامتحان، ومشاركتها لأغراض التدريب. مش محتوى رسمي من OET ولا معتمد منهم.'],
        ['ألاقي ريكولز وبنوك كلمات أكتر فين؟', 'الصفحة المجانية بتعرض مواضيع الكتابة والمحادثة الأخيرة. الطلاب المسجلين عندهم مكتبة الريكولز الكاملة، وريكولز الكلمات الصوتية، والكورسات الكاملة، وتصحيح الكتابة على منصتنا — دوس على «سجّل على منصتنا» فوق عشان تشترك.'],
      ],
      disclaimer: 'إخلاء مسؤولية. جميع المواضيع في هذه الصفحة مُبلَّغة من طلابنا من تجربتهم الشخصية في الامتحان، ومشاركتها لأغراض التدريب فقط. هذا ليس محتوى رسمياً من OET، ولم تتم مراجعته أو اعتماده أو دعمه من OET أو Cambridge Boxhill Language Assessment.',
      crumbs: [['الرئيسية', `${ORIGIN}/ar/`], ['ريكولز OET', `${ORIGIN}/ar/oet-recalls.html`]],
    },
  };

  for (const [lang, x] of Object.entries(EXPECT)) {
    const html = distHtml[x.page] || '';
    const main = mainOf(html);
    const head = html.slice(0, html.indexOf('</head>'));
    const meta = (re) => (head.match(re) || [, ''])[1];
    const label = x.page;

    // head metadata exactly as section 4 (canonical on the apex origin)
    if (meta(/<title>([^<]*)<\/title>/) !== x.title) fail(`${label}: title must be "${x.title}"`);
    if (meta(/<meta name="description" content="([^"]*)"/) !== x.desc) fail(`${label}: meta description must be the brief's verbatim text`);
    if (meta(/<link rel="canonical" href="([^"]*)"/) !== ORIGIN + x.url) fail(`${label}: canonical must be ${ORIGIN + x.url}`);
    if (meta(/<meta name="robots" content="([^"]*)"/) !== 'index, follow') fail(`${label}: robots must be "index, follow"`);
    if (meta(/<meta property="og:title" content="([^"]*)"/) !== x.title) fail(`${label}: og:title must equal the title tag`);
    if (meta(/<meta property="og:description" content="([^"]*)"/) !== x.desc) fail(`${label}: og:description must equal the meta description`);
    if (meta(/<meta property="og:locale" content="([^"]*)"/) !== x.locale || meta(/<meta property="og:locale:alternate" content="([^"]*)"/) !== x.alt) fail(`${label}: og:locale must be ${x.locale} with alternate ${x.alt}`);
    if (meta(/<meta property="og:image" content="([^"]*)"/) !== `${ORIGIN}/assets/img/og/og-recalls.png` || meta(/<meta property="og:image:width" content="([^"]*)"/) !== '1200' || meta(/<meta property="og:image:height" content="([^"]*)"/) !== '630') fail(`${label}: og:image must be og-recalls.png at 1200x630`);

    // language and direction: Arabic is genuinely RTL on <html> and on <main>; English stays untouched
    if (lang === 'ar') {
      if (!/<html lang="ar" dir="rtl"/.test(html)) fail(`${label}: <html> must carry lang="ar" dir="rtl"`);
      if (!/<main\b[^>]*\bdir="rtl"[^>]*\blang="ar"/.test(main)) fail(`${label}: <main> must be dir="rtl" lang="ar"`);
    } else if (/<html\b[^>]*\bdir=/.test(html)) fail(`${label}: the English page must not set dir on <html>`);

    // Block A: H1 and the verbatim intro
    if ((main.match(/<h1\b/g) || []).length !== 1 || vis((main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1]) !== visibleText(x.h1)) fail(`${label}: the single H1 must read "${x.h1}"`);
    if (!vis(main).includes(visibleText(x.intro))) fail(`${label}: the hero intro must be the brief's verbatim text`);

    // Block order: A hero, B topics, C registration box, D FAQ, then the disclaimer last, directly above the shared footer
    const at = (s) => main.indexOf(s);
    const order = ['class="oet-resource-hero', 'id="recent-topics"', 'class="oet-recalls-cta-section"', 'id="faq"', 'class="oet-recalls-disclaimer-section"'].map(at);
    if (order.some((i) => i < 0) || order.some((v, i) => i && v <= order[i - 1])) fail(`${label}: blocks must run hero, topics, registration box, FAQ, disclaimer`);
    if (!/<p class="oet-recalls-disclaimer">[\s\S]*?<\/p>\s*<\/div>\s*<\/section>\s*<\/main>/.test(main)) fail(`${label}: the disclaimer must close the page content, directly above the footer`);
    const disc = (main.match(/<p class="oet-recalls-disclaimer">([\s\S]*?)<\/p>/) || [, ''])[1];
    if (vis(disc) !== visibleText(x.disclaimer)) fail(`${label}: the disclaimer must be the brief's verbatim text`);

    // Block C: one in-flow box, verbatim copy, the button to the app registration with the conversion event hook
    const box = (main.match(/<div class="oet-recalls-cta">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/) || [, ''])[1];
    if (vis((box.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [, ''])[1]) !== visibleText(x.ctaH)) fail(`${label}: registration box headline must read "${x.ctaH}"`);
    if (vis((box.match(/<p>([\s\S]*?)<\/p>/) || [, ''])[1]) !== visibleText(x.ctaP)) fail(`${label}: registration box line must be the brief's verbatim text`);
    const btn = (box.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) || []);
    if (btn.length !== 1 || !btn[0].includes('href="https://app.oetwithdrhesham.co.uk/register"') || vis(btn[0]) !== visibleText(x.ctaBtn) || !btn[0].includes('data-oet-event="recalls_cta_register"')) fail(`${label}: one button "${x.ctaBtn}" to https://app.oetwithdrhesham.co.uk/register carrying data-oet-event="recalls_cta_register"`);
    if (!html.includes('<script defer src="/assets/js/oet-recalls.js?v=') || !html.includes('<link rel="stylesheet" href="/assets/css/oet-recalls.css?v=')) fail(`${label}: must load oet-recalls.css and oet-recalls.js`);

    // Block D: four FAQs in order, with FAQPage and BreadcrumbList JSON-LD in the page's language (the generic check proves each answer is visible)
    const items = [...main.matchAll(/<div class="oet-faq-item"><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/div>/g)];
    if (items.length !== 4 || items.some((m, i) => vis(m[1]) !== visibleText(x.faq[i][0]) || vis(m[2]) !== visibleText(x.faq[i][1]))) fail(`${label}: the four FAQs must be the brief's verbatim copy, in order`);
    const faqLd = nodesOfType(ldBlocks(html), 'FAQPage')[0];
    const qs = faqLd ? faqLd.mainEntity : [];
    if (!faqLd || qs.length !== 4 || qs.some((q, i) => q.name !== x.faq[i][0])) fail(`${label}: FAQPage JSON-LD must carry the four questions`);
    if (lang === 'ar' && faqLd && faqLd.inLanguage !== 'ar') fail(`${label}: the Arabic FAQPage JSON-LD must set inLanguage "ar"`);
    const crumb = nodesOfType(ldBlocks(html), 'BreadcrumbList')[0];
    const got = crumb ? crumb.itemListElement.map((i) => [i.name, i.item]) : [];
    if (JSON.stringify(got) !== JSON.stringify(x.crumbs)) fail(`${label}: BreadcrumbList must be ${JSON.stringify(x.crumbs)}`);
    const wp = nodesOfType(ldBlocks(html), 'WebPage')[0];
    if (!wp || wp.datePublished !== data.published || wp.dateModified !== data.updated) fail(`${label}: WebPage JSON-LD dates must be recalls.json published/updated (${data.published} / ${data.updated})`);

    // language switcher: a visible link to the sibling version
    if (!new RegExp(`<a\\b[^>]*href="${x.sibling.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*hreflang="`).test(main)) fail(`${label}: needs a visible link to its sibling ${x.sibling}`);

    // Block B: every entry of recalls.json renders as a card, tagged with skill + profession, grouped newest month first; no audio on the public page
    if ((main.match(/class="oet-recalls-card"/g) || []).length !== total) fail(`${label}: ${(main.match(/class="oet-recalls-card"/g) || []).length} cards for ${total} entries in recalls.json`);
    if ((main.match(/class="oet-recalls-month-title"/g) || []).length !== data.months.length) fail(`${label}: one heading per month group expected`);
    if (lang === 'ar' && (main.match(/class="oet-recalls-topic"/g) || []).length !== (main.match(/class="oet-recalls-topic" lang="en" dir="ltr"/g) || []).length) fail(`${label}: Arabic page topics stay English and must be marked lang="en" dir="ltr"`);
    if (lang === 'en' && /oet-recalls-hint/.test(main)) fail(`${label}: the Arabic hint belongs to the Arabic page only`);
    if (/<audio\b|<video\b|<source\b|\.(mp3|wav|m4a|ogg)\b/i.test(main)) fail(`${label}: text topics only: no audio on the public page`);
  }

  // one intrusion rule: the page CSS has no fixed or sticky element (no pop-up, no sticky bar)
  if (/position\s*:\s*(fixed|sticky)/.test(readFileSync(path.join(ROOT, 'assets/css/oet-recalls.css'), 'utf8'))) fail('oet-recalls.css: the registration box must stay in flow (no fixed or sticky positioning)');

  // sitemap: both versions, weekly, 0.8, mutual hreflang annotations with x-default = the English page
  {
    const sm = readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
    if (!sm.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"')) fail('sitemap.xml: the xhtml namespace is required for the hreflang annotations');
    for (const x of Object.values(EXPECT)) {
      const row = (sm.match(new RegExp(`<url><loc>${ORIGIN}${x.url.replace(/\./g, '\\.')}</loc>[\\s\\S]*?</url>`)) || [''])[0];
      const want = ['<changefreq>weekly</changefreq>', '<priority>0.8</priority>', `<xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/oet-recalls.html"/>`,
        `<xhtml:link rel="alternate" hreflang="ar" href="${ORIGIN}/ar/oet-recalls.html"/>`, `<xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/oet-recalls.html"/>`];
      if (!row || want.some((w) => !row.includes(w))) fail(`sitemap.xml: ${x.url} needs weekly, 0.8 and the en / ar / x-default xhtml:link annotations`);
    }
  }

  // /oet-recalls and /ar/oet-recalls 301 to the .html pages through the existing .htaccess rule "a page URL shared without .html goes to the real page"
  {
    const ht = readFileSync(path.join(ROOT, '.htaccess'), 'utf8');
    const rule = ht.match(/RewriteCond %\{DOCUMENT_ROOT\}\/\$1\.html -f\s*\n\s*RewriteRule (\^\(\[a-z0-9-\]\+\(\?:\/\[a-z0-9-\]\+\)\?\)\/\?\$) https:\/\/%\{HTTP_HOST\}\/\$1\.html \[R=301,L\]/);
    if (!rule) fail('.htaccess: the extensionless-URL 301 rule (RewriteCond -f + RewriteRule ... [R=301,L]) is missing, so /oet-recalls would not redirect');
    else for (const p of ['oet-recalls', 'ar/oet-recalls']) {
      if (!new RegExp(rule[1]).test(p) || !existsSync(path.join(ROOT, `${p}.html`))) fail(`.htaccess: /${p} would not 301 to /${p}.html`);
    }
  }

  // the share card exists at 1200x630 (PNG header)
  {
    const f = path.join(ROOT, 'assets/img/og/og-recalls.png');
    if (!existsSync(f)) fail('assets/img/og/og-recalls.png is missing');
    else { const b = readFileSync(f); if (b.readUInt32BE(16) !== 1200 || b.readUInt32BE(20) !== 630) fail('og-recalls.png must be 1200x630'); }
  }
}

if (failures) {
  console.error(`\nverify: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`verify: ${PAGES.length} pages + sitemap + pricing data OK`);
