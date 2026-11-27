// Arabic pages keep the main menu inside the Arabic site (SEO handoff #2 of 25 Nov 2026, item 1.1).
// On every page under /ar/ (the Arabic home page included) each header link whose target has an Arabic twin opens the twin,
// and the logo opens /ar/. The set of twins is read from src/pages/ar/, so a new Arabic page is picked up without a code change.
// Links with no Arabic version (About, FAQ, Contact, Reading/Listening tips, ECFMG, non-Gulf pathway guides, the English blog)
// keep their English target. The visible labels are untouched.
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
