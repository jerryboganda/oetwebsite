// Promotional banners: ONE ordered list (assets/img/promotional-banners/promotional-banners.json) feeds both the
// pricing-page hero slider (partials/pricing/main.html, marker <!--oet:promo-slides-->) and the homepage promo
// popup (partials/index/tail.html, same marker), so the two can never drift apart (Final Master brief, owner
// 30 Oct 2026: "the first posters occur in the SAME order on Website Homepage and Website Pricing").
// Used by pages/pricing.astro, pages/index.astro and scripts/verify.mjs. Paths resolve from the site/ folder
// (npm run build and the verify scripts both run there), like blog.mjs and bundles.mjs.
import fs from 'node:fs';
import path from 'node:path';

const SITE = process.cwd();
const ROOT = path.dirname(SITE);
const MANIFEST = path.join(ROOT, 'assets', 'img', 'promotional-banners', 'promotional-banners.json');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ARROW = '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
const LEGACY_SIZES = '(max-width: 767px) 300px, 490px';

export function loadPromo() {
  const data = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  if (!data.base || !data.base.startsWith('/') || !data.base.endsWith('/')) throw new Error('promo: base must be a root-absolute folder ending in /');
  if (!Array.isArray(data.slides) || !data.slides.length) throw new Error('promo: no slides');
  const ids = new Set();
  for (const s of data.slides) {
    if (!s.id || ids.has(s.id)) throw new Error(`promo: missing or duplicate slide id ${s.id}`);
    ids.add(s.id);
    for (const k of ['href', 'cta', 'alt', 'src', 'width', 'height']) {
      if (!s[k]) throw new Error(`promo: slide ${s.id} has no ${k}`);
    }
    if (/\bAI\b/.test(`${s.alt} ${s.cta}`)) throw new Error(`promo: slide ${s.id} must not use the term "AI" in customer-facing text`);
    const files = [s.src, ...(s.srcset || []).map((x) => x[0]), ...(s.mobile ? [s.mobile.src] : [])];
    for (const f of files) {
      if (!fs.existsSync(path.join(ROOT, data.base.slice(1), f))) throw new Error(`promo: slide ${s.id} image missing on disk: ${f}`);
    }
  }
  return data;
}

function picture(data, s, cls, eager) {
  const url = (f) => data.base + f;
  const mobile = s.mobile
    ? `<source media="(max-width: 639px)" srcset="${url(s.mobile.src)}" width="${s.mobile.width}" height="${s.mobile.height}">`
    : '';
  const srcset = s.srcset ? ` srcset="${s.srcset.map(([f, w]) => `${url(f)} ${w}w`).join(', ')}" sizes="${LEGACY_SIZES}"` : '';
  const loading = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  return `<picture>${mobile}<img class="${cls}" src="${url(s.src)}"${srcset} alt="${esc(s.alt)}" width="${s.width}" height="${s.height}" ${loading} decoding="async"></picture>`;
}

// data-oet-poster (a pricing-page element id) is what assets/js/oet-bundles.js uses to scroll to, focus and mark the
// target; external links (Ask SAMI) carry none and simply navigate.
function linkAttrs(s) {
  return `href="${esc(s.href)}"${s.target ? ` data-oet-poster="${esc(s.target)}"` : ''} data-oet-cta="poster_${esc(s.id)}"`;
}

/** Pricing hero slider: every slide is a whole-image link with a visible call to action. */
export function pricingSlides(data) {
  return data.slides.map((s, i) =>
    `<div class="swiper-slide"><div class="oet-pricing-hero-slide oet-pricing-hero-slide--poster"><a class="oet-poster-link" ${linkAttrs(s)}>` +
    `${picture(data, s, 'oet-poster-img', i === 0)}<span class="oet-poster-cta">${esc(s.cta)} ${ARROW}</span></a></div></div>`,
  ).join('\n                            ');
}

/** Homepage popup carousel: same slides, same order. */
export function popupSlides(data) {
  return data.slides.map((s) =>
    `<div class="swiper-slide">\n                                <a class="oet-promo-popup__slide-link" ${linkAttrs(s)} aria-label="${esc(`${s.cta}: ${s.alt}`)}">\n` +
    `                                    <span class="oet-promo-popup__image-wrap">${picture(data, s, 'oet-promo-popup__image', false)}</span>\n` +
    `                                    <span class="oet-promo-popup__cta">${esc(s.cta)} ${ARROW}</span>\n` +
    `                                </a>\n                            </div>`,
  ).join('\n                            ');
}

const MARKER = '<!--oet:promo-slides-->';

function replaceOnce(html, label) {
  const parts = html.split(MARKER);
  if (parts.length !== 2) throw new Error(`promo: ${label} marker ${MARKER} found ${parts.length - 1} time(s), expected 1`);
  return parts;
}

export function applyPromoToPricing(parts, data = loadPromo()) {
  const [a, b] = replaceOnce(parts.main, 'pricing main');
  return { ...parts, main: a + pricingSlides(data) + b };
}

export function applyPromoToHome(parts, data = loadPromo()) {
  const [a, b] = replaceOnce(parts.tail, 'index tail');
  return { ...parts, tail: a + popupSlides(data) + b };
}
