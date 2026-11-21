// Announcement bar (every page, layouts/Base.astro via components/Announcement.astro) and the homepage news card
// (<!--oet:news-card--> in partials/index/main.html and partials/ar/main.html, filled by src/lib/page.mjs). One data
// file, src/data/announcement.json, feeds both so wording, link and expiry date cannot drift apart.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join(process.cwd(), 'src', 'data', 'announcement.json');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let cache;
export function loadAnnouncement() {
  if (cache) return cache;
  const a = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (!/^[a-z0-9-]+$/.test(a.id || '')) throw new Error('announce: id must be a slug');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.until || '')) throw new Error('announce: until must be YYYY-MM-DD');
  for (const lang of ['en', 'ar']) {
    for (const k of ['bar', 'href', 'badge', 'title', 'summary', 'cta']) if (!a[lang]?.[k]) throw new Error(`announce: ${lang}.${k} is missing`);
    if (!a[lang].href.startsWith('/')) throw new Error(`announce: ${lang}.href must be root-absolute`);
    if (/\bAI\b/.test(Object.values(a[lang]).join(' '))) throw new Error('announce: no "AI" in customer-facing copy');
  }
  cache = a;
  return a;
}

/** The slim bar. Rendered visible; the head script in Base.astro hides it before first paint when dismissed or expired. */
export function barHtml(lang) {
  const a = loadAnnouncement();
  const t = a[lang === 'ar' ? 'ar' : 'en'];
  const ar = lang === 'ar';
  return `<aside class="oet-announce" data-oet-announce="${a.id}" lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}" aria-label="${ar ? 'إعلان' : 'Announcement'}">` +
    `<a class="oet-announce__link" href="${esc(t.href)}">${esc(t.bar)}</a>` +
    `<button class="oet-announce__close" type="button" aria-label="${ar ? 'إغلاق الإعلان' : 'Dismiss announcement'}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>` +
    `</aside>`;
}

/** The card directly under the homepage hero (English homepage / Arabic homepage). */
export function newsCardHtml(lang) {
  const a = loadAnnouncement();
  const t = a[lang === 'ar' ? 'ar' : 'en'];
  const ar = lang === 'ar';
  return `<section class="oet-news" data-oet-news="${a.id}" aria-label="${ar ? 'آخر الأخبار' : 'Latest news'}"${ar ? ' lang="ar" dir="rtl"' : ''}><div class="container">` +
    `<a class="oet-news-card" href="${esc(t.href)}"><span class="oet-news-card__badge">${esc(t.badge)}</span>` +
    `<span class="oet-news-card__body"><strong>${esc(t.title)}</strong><span>${esc(t.summary)}</span></span>` +
    `<span class="oet-news-card__cta">${esc(t.cta)}</span></a></div></section>`;
}
