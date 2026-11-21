// OET Recalls page (owner brief v2, 21 Nov 2026): /oet-recalls.html + /ar/oet-recalls.html.
// ONE data file (src/data/recalls.json) feeds both languages. Adding a month is a small edit to that file:
//   { "month": "2026-12", "entries": [ { "skill": "writing", "profession": "nursing", "topic": "...", "hintAr": "..." } ] }
// Newest month first; "updated" = the date of the edit. It becomes dateModified in the JSON-LD (via the marker below), and
// the sitemap lastmod follows the file's git date (postbuild.mjs lastmodFor). hintAr is the optional one-line Arabic hint
// shown only on the Arabic page; the topic text stays English on both versions (it mirrors the real exam).
//
// Markers the two page partials carry (replaced by applyRecalls; none may survive into dist, verify.mjs checks):
//   <!--oet:recalls-topics-->     Block B, the month groups and entry cards
//   <!--oet:recalls-published-->  the ISO datePublished inside the JSON-LD
//   <!--oet:recalls-modified-->   the ISO dateModified inside the JSON-LD
import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml } from './blog.mjs';

const FILE = path.join(process.cwd(), 'src', 'data', 'recalls.json');
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_GROUPS = 3; // "roughly the last two months": the current month, the previous two at most

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

// Shown only while the data file has no entries yet. Temporary: the page is not publish-ready in that state (docs/recalls-page-2026-11-21.md).
const EMPTY = {
  en: 'The first recalls are being prepared. Check back soon.',
  ar: 'بنجهّز أول ريكولز دلوقتي. ارجع شوفها قريب.',
};

/** The shared header and footer link, one per language. The homepage pair is frozen and never receives it (layouts/Base.astro). */
export const RECALLS_LINKS = {
  en: { href: '/oet-recalls.html', nav: 'Recalls', footer: 'OET Recalls', lang: '' },
  ar: { href: '/ar/oet-recalls.html', nav: 'الريكولز', footer: 'ريكولز OET', lang: ' lang="ar"' },
};
const BLOG_ITEM = '<li><a href="/blog/">OET Blog</a></li>';

/** Add the Recalls <li> directly after the "OET Blog" <li> of a chrome partial (header nav or footer Resources group). */
export function addRecallsLink(html, lang, where) {
  if (html.split(BLOG_ITEM).length !== 2) throw new Error(`recalls: expected exactly one "OET Blog" item in the ${where} partial`);
  const l = RECALLS_LINKS[lang];
  return html.replace(BLOG_ITEM, () => `${BLOG_ITEM}<li><a href="${l.href}"${l.lang}>${where === 'header' ? l.nav : l.footer}</a></li>`);
}

const monthIndex = (ym) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;

export function loadRecalls() {
  const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const bad = (m) => { throw new Error(`recalls.json: ${m}`); };
  if (!ISO_DAY.test(d.published) || !ISO_DAY.test(d.updated)) bad('"published" and "updated" must be YYYY-MM-DD');
  if (d.updated < d.published) bad('"updated" is before "published"');
  for (const k of ['skills', 'professions']) {
    for (const [id, v] of Object.entries(d[k] || {})) if (!v.en || !v.ar) bad(`${k}.${id} needs an "en" and an "ar" label`);
  }
  if (!Array.isArray(d.months)) bad('"months" must be an array');
  const now = monthIndex(d.updated);
  if (d.months.length > MAX_GROUPS) bad(`at most ${MAX_GROUPS} month groups (about the last two months): drop the oldest`);
  let prev = Infinity;
  for (const m of d.months) {
    if (!ISO_MONTH.test(m.month)) bad(`month "${m.month}" must be YYYY-MM`);
    const i = monthIndex(m.month);
    if (i >= prev) bad(`months must be newest first, once each (${m.month})`);
    prev = i;
    if (i > now) bad(`month ${m.month} is after "updated" (${d.updated})`);
    if (now - i > MAX_GROUPS - 1) bad(`month ${m.month} is older than about two months: drop it`);
    if (!Array.isArray(m.entries) || !m.entries.length) bad(`month ${m.month} has no entries`);
    for (const e of m.entries) {
      if (!d.skills[e.skill]) bad(`${m.month}: unknown skill "${e.skill}"`);
      if (!d.professions[e.profession]) bad(`${m.month}: unknown profession "${e.profession}" (add it to "professions" with an en and an ar label)`);
      if (typeof e.topic !== 'string' || !e.topic.trim()) bad(`${m.month}: an entry has no topic`);
      if (e.hintAr !== undefined && (typeof e.hintAr !== 'string' || !e.hintAr.trim())) bad(`${m.month}: hintAr must be a non-empty string when present`);
    }
  }
  return d;
}

const monthTitle = (ym, lang) => `${MONTHS[lang][Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

function card(e, d, lang) {
  // the topic stays English on the Arabic page: mark it so its punctuation and numbers keep their order inside the RTL card
  const topic = `<p class="oet-recalls-topic"${lang === 'ar' ? ' lang="en" dir="ltr"' : ''}>${escapeHtml(e.topic.trim())}</p>`;
  const hint = lang === 'ar' && e.hintAr ? `<p class="oet-recalls-hint">${escapeHtml(e.hintAr.trim())}</p>` : '';
  return `<li class="oet-recalls-card"><div class="oet-recalls-tags"><span class="oet-recalls-tag oet-recalls-tag--${e.skill}">${d.skills[e.skill][lang]}</span>`
    + `<span class="oet-recalls-tag">${d.professions[e.profession][lang]}</span></div>${topic}${hint}</li>`;
}

export function renderTopics(d, lang) {
  if (!d.months.length) return `<p class="oet-recalls-empty">${EMPTY[lang]}</p>`;
  return d.months.map((m) => `<div class="oet-recalls-month"><h3 class="oet-recalls-month-title" id="recalls-${m.month}">${monthTitle(m.month, lang)}</h3>`
    + `<ul class="oet-recalls-list">${m.entries.map((e) => card(e, d, lang)).join('')}</ul></div>`).join('\n');
}

/** Page wrapper injection: fills the topics and the JSON-LD dates. A marker missing from the partials is a build error. */
export function applyRecalls(lang, parts) {
  const d = loadRecalls();
  const out = { ...parts };
  const fill = (marker, value, keys) => {
    let hits = 0;
    for (const k of keys) if (out[k].includes(marker)) { out[k] = out[k].split(marker).join(value); hits += 1; }
    if (!hits) throw new Error(`recalls: the ${lang} partials have no ${marker} marker`);
  };
  fill('<!--oet:recalls-topics-->', renderTopics(d, lang), ['main']);
  fill('<!--oet:recalls-published-->', d.published, ['meta', 'headExtra']);
  fill('<!--oet:recalls-modified-->', d.updated, ['meta', 'headExtra']);
  return out;
}
