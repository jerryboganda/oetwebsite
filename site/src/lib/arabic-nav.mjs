// Arabic pages keep the site chrome inside the Arabic site (SEO handoff #2 of 25 Nov 2026, item 1.1; handoff #3 of 27 Nov 2026,
// items 2.1 and 2.2). On every page under /ar/ (the Arabic home page included) each header, drawer and footer link whose target has
// an Arabic twin opens the twin, and the logo opens /ar/. The set of twins is read from src/pages/ar/, so a new Arabic page is
// picked up without a code change. Links with no Arabic version (About, FAQ, Contact, Reading/Listening tips, ECFMG, non-Gulf
// pathway guides, the English blog) keep their English target. The visible labels are untouched.
import fs from 'node:fs';
import path from 'node:path';

const AR_PAGES = path.join(process.cwd(), 'src', 'pages', 'ar');

let twins;
/** Slugs (without .html) that exist as /ar/<slug>.html. */
export function arabicTwins() {
  if (!twins) twins = new Set(fs.readdirSync(AR_PAGES).filter((f) => f.endsWith('.astro') && f !== 'index.astro').map((f) => f.slice(0, -'.astro'.length)));
  return twins;
}

/** Retarget root-level page links (`/slug.html`, no fragment) to their Arabic twin, and the header / drawer logo to /ar/. */
export function localiseNav(html) {
  const set = arabicTwins();
  return html
    .replace(/href="\/([a-z0-9-]+)\.html"/g, (m, slug) => (set.has(slug) ? `href="/ar/${slug}.html"` : m))
    .replaceAll('<a href="/" title="OET with Dr Hesham | The Pathway to UK"', '<a href="/ar/" title="OET with Dr Hesham | The Pathway to UK"');
}

// The Arabic free-resources page (handoff #3, item 2.2): it had no internal link, so every Arabic page now carries one in the
// Free Resources menu (directly after the Arabic library item, so the mobile drawer has it too) and one in the footer
// Resources & Guides group (directly after "Free Resources").
export const ARABIC_FREE = { href: '/ar/oet-free-resources.html', label: 'مصادر OET المجانية' };
export const ARABIC_FREE_NAV_ITEM = `<li><a href="${ARABIC_FREE.href}" lang="ar"><span class="submenu-icon"><i class="fa-solid fa-book-open-reader" aria-hidden="true"></i></span><span class="submenu-text" dir="rtl">${ARABIC_FREE.label}</span></a></li>`;
export const ARABIC_FREE_FOOTER_ITEM = `<li><a href="${ARABIC_FREE.href}" lang="ar" dir="rtl">${ARABIC_FREE.label}</a></li>`;

function insertAfterOnce(html, anchor, item, what) {
  if (html.split(anchor).length !== 2) throw new Error(`arabic-nav: expected exactly one ${what}`);
  return html.replace(anchor, `${anchor}${item}`);
}

/** Header nav of an Arabic page: the free-resources item directly after the Arabic library item (first two of Free Resources). */
export function addArabicFreeNav(html, libraryItem) {
  return insertAfterOnce(html, libraryItem, ARABIC_FREE_NAV_ITEM, 'Arabic library item in the header nav');
}

const FOOTER_FREE = '<li><a href="/oet-materials-support.html">Free Resources</a></li>';
const FOOTER_APP = '<li><a href="/pricing.html#download-app">Download Candidates App</a></li>';
const FOOTER_LOGO = '<a href="/"><img width="320" height="90" loading="lazy" decoding="async" src="/assets/img/logo/footer-logo.webp"';

/** Footer of an Arabic page: every link with an Arabic twin opens the twin, the logo opens /ar/, "Download Candidates App" opens the
 *  Arabic pricing page, and the Arabic free-resources link follows "Free Resources". */
export function localiseFooter(html) {
  for (const [needle, what] of [[FOOTER_FREE, '"Free Resources" footer link'], [FOOTER_APP, '"Download Candidates App" footer link'], [FOOTER_LOGO, 'footer logo link']])
    if (html.split(needle).length !== 2) throw new Error(`arabic-nav: expected exactly one ${what}`);
  const out = localiseNav(html.replace(FOOTER_FREE, `${FOOTER_FREE}${ARABIC_FREE_FOOTER_ITEM}`))
    .replace(FOOTER_APP, FOOTER_APP.replace('/pricing.html', '/ar/pricing.html'))
    .replace(FOOTER_LOGO, FOOTER_LOGO.replace('href="/"', 'href="/ar/"'));
  const left = out.match(/href="\/(?!ar\/)[a-z0-9-]+\.html#[^"]*"/g) || [];
  for (const l of left) if (arabicTwins().has(l.slice(7, l.indexOf('.html')))) throw new Error(`arabic-nav: footer link ${l} has an Arabic twin; map its anchor to one that exists on the Arabic page`);
  return out;
}
