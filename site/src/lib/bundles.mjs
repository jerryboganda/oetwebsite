// Full OET Course and Full Crash Course tiers (owner brief 28 Oct 2026).
// Build-time half of the bundles feature: site/src/data/bundles.json holds the defaults and
// assets/js/oet-bundles.js holds the renderers. That file is evaluated here in a vm sandbox (it has no
// `document` there, so it does not boot) and its pure render functions write the static HTML, which means the
// markup the browser re-renders after a live catalog refresh is produced by the very same code.
// Used by pages/pricing.astro, the five profession course pages and scripts/verify.mjs. Paths resolve from the
// site/ folder (npm run build and the verify scripts both run there), like blog.mjs.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const SITE = process.cwd();
const ROOT = path.dirname(SITE);
const ORIGIN = 'https://oetwithdrhesham.co.uk';

export function loadBundles() {
  const data = JSON.parse(fs.readFileSync(path.join(SITE, 'src', 'data', 'bundles.json'), 'utf8'));
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets', 'js', 'oet-bundles.js'), 'utf8'), sandbox);
  const kit = sandbox.module.exports;
  return { data, kit, defaults: kit.expandDefaults(data) };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function replaceOnce(html, marker, replacement, label) {
  const parts = html.split(marker);
  if (parts.length !== 2) throw new Error(`bundles: ${label} marker ${marker} found ${parts.length - 1} time(s), expected 1`);
  return parts[0] + replacement + parts[1];
}

// The defaults, embedded for the browser (expanded there by the same kit). `</` is escaped so the JSON can
// never close its own <script>.
function dataScript(data) {
  const { _comment, ...rest } = data;
  const json = JSON.stringify(rest).replace(/</g, '\\u003c');
  return `<script type="application/json" id="oet-bundles-data">${json}</script>`;
}

// group: 'profession' | 'format'. Radio names are unique per section (one browser radio group each);
// assets/js/oet-bundles.js keeps the sections in sync through data-bundle-radio.
function radios(data, group, famId) {
  const list = group === 'profession' ? data.professions : data.formats;
  const checked = group === 'profession' ? data.professions[0].id : 'computer';
  const legend = group === 'profession' ? 'Your profession' : 'Your exam format';
  const inputs = list.map((o) =>
    `<label class="oet-bundle-choice"><input type="radio" name="oet-bundle-${group}-${famId}" value="${esc(o.id)}" data-bundle-radio="${group}"${o.id === checked ? ' checked' : ''}><span>${esc(o.label)}</span></label>`,
  ).join('');
  return `<fieldset class="oet-bundle-field"><legend>${legend}</legend><div class="oet-bundle-choices">${inputs}</div></fieldset>`;
}

function controls(data, famId) {
  return `<div class="oet-bundle-controls" data-bundle-controls hidden>${famId === 'full' ? radios(data, 'profession', famId) : ''}${radios(data, 'format', famId)}</div>`;
}

const STALE = 'Live prices could not be loaded, so these are the last published prices. The price is confirmed again at checkout in the Candidates App.';

function section(kit, data, defaults, fam, copyText) {
  const ctx = kit.makeCtx(data, data.professions[0].id, 'computer');
  const grid = kit.renderGrid(kit.slotCodes(data, fam.id, data.professions[0].id), defaults, ctx);
  const isFull = fam.id === 'full';
  const status = kit.statusText(data, { profession: data.professions[0].id, format: 'computer' }, fam.id);
  return `        <section id="${isFull ? 'full-oet-courses' : 'crash-courses'}" class="oet-bundles oet-bundles--${fam.id}" data-oet-bundles data-family="${fam.id}" data-profession="${data.professions[0].id}" data-format="computer" data-catalog="static" aria-labelledby="oet-bundles-${fam.id}-title">
            <div class="container">
                <div class="oet-bundles-head">
                    <span class="oet-bundles-eyebrow"><i class="fa-solid fa-${isFull ? 'graduation-cap' : 'bolt'}" aria-hidden="true"></i> ${esc(fam.title)}</span>
                    <h2 id="oet-bundles-${fam.id}-title">${esc(copyText.title)}</h2>
                    <p>${esc(copyText.lead)}</p>
                </div>
                ${controls(data, fam.id)}
                <noscript><p class="oet-bundle-note">Turn on JavaScript to switch ${isFull ? 'profession or ' : ''}exam format.</p></noscript>
                <p class="oet-bundle-status" role="status" aria-live="polite" data-bundle-status>${esc(status)}</p>
                ${isFull ? '' : `<p class="oet-bundle-callout">${esc(copyText.callout)}</p>`}
                <p class="oet-bundle-stale" data-bundle-stale hidden>${STALE}</p>
                <div class="oet-bundle-grid" data-bundle-grid>${grid}</div>
                <p class="oet-bundle-foot">All prices are in GBP (&pound;). Checkout happens securely inside the Candidates App, where the price is confirmed again.</p>
            </div>
        </section>
`;
}

// Headline copy follows the owner brief mock-ups (28 Oct 2026, pages 1 and 8)
const COPY = {
  full: {
    title: 'Find your perfect OET course',
    lead: 'Select your profession and exam format to compare complete preparation options.',
  },
  crash: {
    title: 'Full Crash Course packages',
    lead: 'Exam-focused recorded learning + limited website practice.',
    callout: 'No private Speaking session is included in these Crash tiers.',
  },
};

// JSON-LD Product/Offer entries for the six tiers, appended to the pricing ItemList
function ldItems(data, startPosition) {
  let pos = startPosition;
  const out = [];
  for (const fam of data.families) {
    for (const t of fam.tiers) {
      pos += 1;
      const url = `${ORIGIN}/pricing.html#${fam.id === 'full' ? 'full-oet-courses' : 'crash-courses'}`;
      const body = {
        '@type': 'ListItem',
        position: pos,
        item: {
          '@type': 'Product',
          name: t.name,
          description: t.description,
          image: `${ORIGIN}/assets/img/og/og-pricing.png`,
          brand: { '@type': 'Brand', name: 'OET with Dr Hesham' },
          offers: {
            '@type': 'Offer',
            price: String(t.price),
            priceCurrency: data.currency,
            availability: 'https://schema.org/InStock',
            url,
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'GB',
              returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 14,
              returnFees: 'https://schema.org/FreeReturn',
              merchantReturnLink: `${ORIGIN}/refund-policy/`,
              name: 'OET with Dr Hesham Refund Policy',
            },
          },
        },
      };
      out.push(JSON.stringify(body, null, 1).replace(/^/gm, '    ').replace(/</g, '\\u003c'));
    }
  }
  return out.join(',\n');
}

/**
 * pricing.html: the two top sections (#full-oet-courses, #crash-courses), the embedded defaults and the six
 * JSON-LD offers. Call AFTER applyPricing (that one matches the legacy packages by name).
 */
export function applyBundlesToPricing(parts, bundles = loadBundles()) {
  const { data, kit, defaults } = bundles;
  const html = data.families.map((f) => section(kit, data, defaults, f, COPY[f.id])).join('\n') + '        ' + dataScript(data) + '\n';
  const main = replaceOnce(parts.main, '<!--oet:bundles-->', html, 'pricing main');

  // append the offers after the last ListItem of the "OET course packages" ItemList
  const end = /\}\s*\]\s*\}\s*,\s*\{\s*"@type"\s*:\s*"EducationalOrganization"/.exec(parts.headExtra);
  if (!end) throw new Error('bundles: could not find the end of the pricing ItemList in head-extra.html');
  const before = parts.headExtra.slice(0, end.index + 1);
  const positions = [...before.matchAll(/"position"\s*:\s*(\d+)/g)].map((m) => Number(m[1]));
  const items = ldItems(data, Math.max(...positions));
  const headExtra = before + ',\n' + items + parts.headExtra.slice(end.index + 1);
  return { ...parts, main, headExtra };
}

const PAGE_PROFESSION = {
  'oet-course-for-doctors': 'medicine',
  'oet-course-for-nurses': 'nursing',
  'oet-course-for-pharmacists': 'pharmacy',
  'oet-course-for-physiotherapists': 'physiotherapy',
  'oet-for-allied-health': 'other-allied-health',
};

/**
 * Profession course pages: the "Choose your course" block (the three Full tiers for that profession, same data
 * and renderer as pricing.html) goes where the page partial carries <!--oet:choose-course-->.
 */
export function applyChooseBlock(parts, page, bundles = loadBundles()) {
  const profId = PAGE_PROFESSION[page];
  if (!profId) throw new Error(`bundles: no profession mapped for ${page}`);
  const { data, kit, defaults } = bundles;
  const prof = data.professions.find((p) => p.id === profId);
  const ctx = kit.makeCtx(data, profId, 'computer');
  const cards = kit.renderMiniGrid(kit.slotCodes(data, 'full', profId), defaults, ctx);
  const link = `/pricing.html?profession=${encodeURIComponent(profId)}#full-oet-courses`;
  const note = prof.note ? ` ${prof.note}` : '';
  const html = `<section class="oet-resource-section oet-choose" id="choose-your-course" data-oet-bundles-mini data-profession="${profId}" data-catalog="static"><div class="container"><div class="oet-resource-heading"><h2 id="sec-choose">Choose your course</h2><p>Three Full OET Courses for ${esc(prof.label)}. The price is the same for Paper-Based and Computer-Based candidates.${esc(note)}</p></div><p class="oet-bundle-stale" data-bundle-stale hidden>${STALE}</p><div class="oet-choose-grid" data-bundle-mini-grid>${cards}</div><div class="oet-resource-actions"><a class="oet-resource-btn" href="${link}">Compare the three courses <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a><a class="oet-resource-btn oet-resource-btn--light" href="/pricing.html#crash-courses">See Crash Courses</a></div></div></section>
        ${dataScript(data)}`;
  return { ...parts, main: replaceOnce(parts.main, '<!--oet:choose-course-->', html, `${page} main`) };
}
