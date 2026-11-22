// OET Blog data: site/src/data/blog.json lists the articles (slug, category,
// summary, featured); everything else (title, dates, reading time) is read from
// the article's own partials so the blog index can never drift from the pages.
// Used by pages/blog/index.astro, the homepage "Latest from the OET Blog" block
// (pages/index.astro) and scripts/verify.mjs. Paths resolve from the site/
// folder (npm run build and the verify scripts both run there).
import fs from 'node:fs';
import path from 'node:path';

const SITE = process.cwd();
const PARTIALS = path.join(SITE, 'src', 'partials');
const DATA = path.join(SITE, 'src', 'data', 'blog.json');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ICONS = {
  writing: 'pen-nib',
  speaking: 'comments',
  reading: 'book-open-reader',
  listening: 'headphones',
  'exam-format': 'desktop',
  pathways: 'route',
};

function read(slug, part) {
  const file = path.join(PARTIALS, slug, `${part}.html`);
  if (!fs.existsSync(file)) throw new Error(`blog: ${slug} has no ${part}.html (looked in ${file})`);
  return fs.readFileSync(file, 'utf8');
}

function text(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function loadBlog() {
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const categories = new Map(data.categories.map((c) => [c.id, c]));
  const seen = new Set();
  const posts = data.posts.map((p, order) => {
    if (seen.has(p.slug)) throw new Error(`blog: duplicate slug ${p.slug}`);
    seen.add(p.slug);
    const category = categories.get(p.category);
    if (!category) throw new Error(`blog: ${p.slug} has unknown category ${p.category}`);
    const meta = read(p.slug, 'meta');
    const headExtra = read(p.slug, 'head-extra');
    const main = read(p.slug, 'main');
    const all = `${meta}\n${headExtra}\n${main}`;
    const h1 = main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
    if (!h1) throw new Error(`blog: ${p.slug} has no <h1>`);
    const published = all.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
    const modified = all.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
    if (!published) throw new Error(`blog: ${p.slug} has no datePublished in its JSON-LD`);
    // reading time counts the article body only: no TOC, related cards or breadcrumbs
    const body = main
      .replace(/<nav\b[\s\S]*?<\/nav>/g, ' ')
      .replace(/<section class="oet-related"[\s\S]*?<\/section>/g, ' ');
    const words = text(body).split(' ').filter(Boolean).length;
    return {
      ...p,
      order,
      lang: 'en',
      url: `/${p.slug}.html`,
      title: text(h1[1]),
      categoryLabel: category.label,
      icon: ICONS[p.category],
      datePublished: published[1],
      dateModified: modified ? modified[1] : published[1],
      minutes: Math.max(1, Math.round(words / 200)),
      image: `/assets/img/blog/${p.slug}.webp`,
    };
  });
  // Arabic guides (blog.json "arabicPosts"): ONE inventory for the /blog/ Arabic section, the Arabic library (/ar/blog/), the
  // English pages' "read in Arabic" switch (page.mjs) and feed.xml. Each entry stores its language (always "ar" here) and its
  // topic (`category`, one of the blog.json categories) separately. Title, dates and reading time come from the page itself; the
  // summary defaults to the page's own meta description and the image to /assets/img/blog/ar-<slug>.webp (an Arabic card drawn by
  // npm run thumbs), so nothing is typed twice.
  // Kept apart from `posts` so the English-only article rules (byline, author box, related articles, homepage cards) never apply.
  const twins = new Map(posts.map((p) => [p.slug, p]));
  const arabicPosts = (data.arabicPosts || []).map((p, order) => {
    const category = categories.get(p.category);
    if (!category) throw new Error(`blog: ${p.slug} has unknown category ${p.category}`);
    if (!category.labelAr) throw new Error(`blog: category ${category.id} needs a labelAr`);
    if (!p.slug.startsWith('ar/')) throw new Error(`blog: the Arabic guide ${p.slug} must live under ar/`);
    if (seen.has(p.slug)) throw new Error(`blog: duplicate slug ${p.slug}`);
    seen.add(p.slug);
    if (p.twin && !twins.has(p.twin)) throw new Error(`blog: ${p.slug} names the twin ${p.twin}, which is not an English post in blog.json`);
    const meta = read(p.slug, 'meta');
    const all = `${meta}\n${read(p.slug, 'head-extra')}\n${read(p.slug, 'main')}`;
    const h1 = all.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
    const published = all.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
    const modified = [...all.matchAll(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]).sort().pop();
    if (!h1 || !published) throw new Error(`blog: ${p.slug} needs an <h1> and a datePublished in its JSON-LD`);
    const description = (meta.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    const summary = p.summary || (description && text(description));
    if (!summary) throw new Error(`blog: ${p.slug} needs a summary (or a meta description)`);
    // every Arabic guide has its own Arabic-titled card image (npm run thumbs draws it), not the English twin's
    const image = p.image || `/assets/img/blog/ar-${p.slug.slice(3)}.webp`;
    const body = read(p.slug, 'main').replace(/<nav\b[\s\S]*?<\/nav>/g, ' ').replace(/<section class="oet-related"[\s\S]*?<\/section>/g, ' ');
    return {
      ...p,
      order,
      lang: 'ar',
      url: `/${p.slug}.html`,
      twinUrl: p.twin ? `/${p.twin}.html` : null,
      title: text(h1[1]),
      summary,
      image,
      category: p.category,
      categoryLabel: category.label,
      categoryLabelAr: category.labelAr,
      icon: ICONS[p.category],
      datePublished: published[1],
      dateModified: modified || published[1],
      minutes: Math.max(1, Math.round(text(body).split(' ').filter(Boolean).length / 200)),
    };
  });
  return { categories: data.categories, posts, arabicPosts, arabicPages: loadArabicPages(data, arabicPosts) };
}

/**
 * The Arabic pages that are NOT guides (courses, country pages, tools, pricing, results), listed apart on the Arabic library so
 * commercial, location and tool pages never inflate the article count. blog.json "arabicPages": [{group, labelAr, pages: [slug]}];
 * each link label is the page's own <h1>. Every Arabic page must be in exactly one of arabicPosts / arabicPages (verify.mjs).
 */
function loadArabicPages(data, arabicPosts) {
  const guides = new Set(arabicPosts.map((p) => p.slug));
  const seen = new Set();
  return (data.arabicPages || []).map((g) => {
    if (!g.group || !g.labelAr || !Array.isArray(g.pages) || !g.pages.length) throw new Error('blog: every arabicPages group needs group, labelAr and pages');
    return {
      group: g.group,
      labelAr: g.labelAr,
      pages: g.pages.map((slug) => {
        if (!slug.startsWith('ar/')) throw new Error(`blog: arabicPages ${slug} must live under ar/`);
        if (guides.has(slug) || seen.has(slug)) throw new Error(`blog: ${slug} is listed twice (arabicPages / arabicPosts)`);
        seen.add(slug);
        const dir = slug === 'ar/index' ? 'ar' : slug;
        const h1 = read(dir, 'main').match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
        if (!h1) throw new Error(`blog: ${slug} has no <h1>`);
        return { slug, url: slug === 'ar/index' ? '/ar/' : `/${slug}.html`, title: text(h1[1]) };
      }),
    };
  });
}

// ---- Search (the /blog/ and /ar/blog/ boxes) ----------------------------------------------------------------------
// Arabic is matched after the usual spelling folds (hamza forms of alef, alef maqsura, taa marbuta, diacritics, tatweel), so a
// reader who types "اسعار" finds "أسعار". The same function runs in the browser: SEARCH_NORMALIZE_JS is its source text.
export function normalizeSearch(s) {
  return String(s)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}
export const SEARCH_NORMALIZE_JS = `function oetNorm(s){return String(s).toLowerCase().replace(/[\\u064B-\\u065F\\u0670\\u0640]/g,'').replace(/[\\u0622\\u0623\\u0625\\u0671]/g,'\\u0627').replace(/\\u0649/g,'\\u064A').replace(/\\u0629/g,'\\u0647').replace(/\\s+/g,' ').trim();}function oetTerms(q){return oetNorm(q).split(' ').filter(Boolean).map(function(t){return t.replace(/^(?:[\\u0648\\u0641\\u0628\\u0643]?\\u0627\\u0644|\\u0644\\u0644)(?=[\\u0621-\\u064A]{2})/,'');});}`;
// The words a reader types: folded as above, and each loses a leading Arabic article (ال, وال, بال, فال, كال, لل) when two or
// more letters remain, so "الحجز" finds "حجز" and "بالحجز" (cards keep their full words; matching is a substring match).
// oetTerms in SEARCH_NORMALIZE_JS is the browser twin; verify.mjs checks that both agree.
export function searchTerms(q) {
  return normalizeSearch(q).split(' ').filter(Boolean).map((t) => t.replace(/^(?:[وفبك]?ال|لل)(?=[ء-ي]{2})/, ''));
}

// ---- The Arabic library link in the shared chrome (brief of 22 Nov 2026) -----------------------------------------
// Header: the FIRST item of the "Free Resources" dropdown (desktop dropdown, and the mobile menu main.js clones from the same nav).
// It is not a top-level item because the owner-approved inline nav has no room left at 1500px (qa-redesign.mjs measured an 83px
// overflow). Footer: "مقالات OET بالعربي" in Resources & Guides, after Recalls. Like the Recalls link, neither is rendered on the two
// frozen landing pages (layouts/Base.astro).
export const ARABIC_LIBRARY = { href: '/ar/blog/', label: 'مقالات OET بالعربي' };
export const ARABIC_LIBRARY_NAV_ITEM = `<li><a href="${ARABIC_LIBRARY.href}" lang="ar"><span class="submenu-icon"><i class="fa-solid fa-language" aria-hidden="true"></i></span><span class="submenu-text" dir="rtl">${ARABIC_LIBRARY.label}</span></a></li>`;
export const ARABIC_LIBRARY_FOOTER_ITEM = `<li><a href="${ARABIC_LIBRARY.href}" lang="ar" dir="rtl">${ARABIC_LIBRARY.label}</a></li>`;
const FREE_RESOURCES = /(<li class="has-dropdown"><a href="\/oet-tips\.html">Free Resources\b[\s\S]*?<ul class="sub-menu">)/;
const RECALLS_ITEM = /<li><a href="\/(?:ar\/)?oet-recalls\.html"[^>]*>[^<]*<\/a><\/li>/;

/** Header: first item of the Free Resources dropdown. Footer: directly after the Recalls <li> of Resources & Guides. */
export function addArabicLibraryLink(html, where) {
  const anchor = where === 'header' ? FREE_RESOURCES : RECALLS_ITEM;
  const hits = (html.match(new RegExp(anchor.source, 'g')) || []).length;
  if (hits !== 1) throw new Error(`blog: expected exactly one ${where === 'header' ? '"Free Resources" dropdown' : 'Recalls item'} in the ${where} partial, found ${hits}`);
  return html.replace(anchor, (m) => `${m}${where === 'header' ? ARABIC_LIBRARY_NAV_ITEM : ARABIC_LIBRARY_FOOTER_ITEM}`);
}

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/** A card for an Arabic guide (/blog/ Arabic section and /ar/blog/): same markup as renderCard, right-to-left, Arabic labels.
 *  Language and topic are separate attributes: data-lang="ar" and data-category="<topic id>". */
export function renderArabicCard(post, { headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  const [y, m, d] = post.datePublished.split('-').map(Number);
  const mins = post.minutes >= 3 && post.minutes <= 10 ? 'دقائق' : 'دقيقة';
  return `<article class="oet-blog-card" data-lang="ar" data-category="${post.category}" lang="ar" dir="rtl" data-search="${escapeHtml(
    normalizeSearch(`${post.title} ${post.summary} ${post.categoryLabelAr} ${post.categoryLabel} arabic عربي العربية`),
  )}">
  <a class="oet-blog-card__media" href="${post.url}" tabindex="-1" aria-hidden="true"><img src="${post.image}" width="1200" height="630" alt="" loading="lazy" decoding="async"></a>
  <div class="oet-blog-card__body">
    <span class="oet-blog-card__tag"><i class="fa-solid fa-${post.icon}" aria-hidden="true"></i> ${escapeHtml(post.categoryLabelAr)}</span>
    <${h} class="oet-blog-card__title"><a href="${post.url}">${escapeHtml(post.title)}</a></${h}>
    <p class="oet-blog-card__summary">${escapeHtml(post.summary)}</p>
    <p class="oet-blog-card__meta">د. أحمد هشام &middot; <time datetime="${post.datePublished}">${d} ${MONTHS_AR[m - 1]} ${y}</time> &middot; ${post.minutes} ${mins} قراءة</p>
    <a class="oet-blog-card__link" href="${post.url}" aria-label="اقرأ المقال: ${escapeHtml(post.title)}">اقرأ المقال <i class="fa-solid fa-arrow-left" aria-hidden="true"></i></a>
  </div>
</article>`;
}

/** Newest first; featured posts win ties so the homepage picks are stable. */
export function latestPosts(posts, count = 3) {
  return [...posts]
    .sort((a, b) =>
      (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
      b.datePublished.localeCompare(a.datePublished) ||
      a.order - b.order)
    .slice(0, count);
}

export function renderCard(post, { headingLevel = 3, eager = false, library = false } = {}) {
  const h = `h${headingLevel}`;
  // `library` (the /blog/ index) adds data-lang and the folded search text; the frozen homepage cards keep their exact markup.
  const search = library ? normalizeSearch(`${post.title} ${post.summary} ${post.categoryLabel}`) : `${post.title} ${post.summary} ${post.categoryLabel}`.toLowerCase();
  return `<article class="oet-blog-card"${library ? ' data-lang="en"' : ''} data-category="${post.category}" data-search="${escapeHtml(search)}">
  <a class="oet-blog-card__media" href="${post.url}" tabindex="-1" aria-hidden="true"><img src="${post.image}" width="1200" height="630" alt="" ${eager ? '' : 'loading="lazy" '}decoding="async"></a>
  <div class="oet-blog-card__body">
    <span class="oet-blog-card__tag"><i class="fa-solid fa-${post.icon}" aria-hidden="true"></i> ${escapeHtml(post.categoryLabel)}</span>
    <${h} class="oet-blog-card__title"><a href="${post.url}">${escapeHtml(post.title)}</a></${h}>
    <p class="oet-blog-card__summary">${escapeHtml(post.summary)}</p>
    <p class="oet-blog-card__meta">Dr Ahmed Hesham &middot; <time datetime="${post.datePublished}">${formatDate(post.datePublished)}</time> &middot; ${post.minutes} min read</p>
    <a class="oet-blog-card__link" href="${post.url}" aria-label="Read article: ${escapeHtml(post.title)}">Read article <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
  </div>
</article>`;
}

/** Homepage: replace the <!--oet:latest-posts--> marker with the 3 latest cards. */
export function applyLatestPosts(parts, posts) {
  const marker = '<!--oet:latest-posts-->';
  const hits = Object.values(parts).reduce((n, html) => n + html.split(marker).length - 1, 0);
  if (hits !== 1) throw new Error(`blog: ${marker} found ${hits} time(s), expected 1`);
  const cards = latestPosts(posts).map((p) => renderCard(p)).join('\n');
  return Object.fromEntries(Object.entries(parts).map(([k, html]) => [k, html.replace(marker, cards)]));
}

// ---- Related articles (`<!--oet:related-guides-->`) -------------------------------------------------------------
// Pages that are not posts but carry the marker: course pages match on profession, the tips hub shows the newest.
export const RELATED_CONTEXT = {
  'oet-course-for-doctors': { professions: ['medicine'] },
  'oet-course-for-nurses': { professions: ['nursing'] },
  'oet-course-for-pharmacists': { professions: ['pharmacy'] },
  'oet-course-for-physiotherapists': { professions: ['physiotherapy'] },
  'oet-for-allied-health': { professions: ['allied-health'] },
  'oet-course-for-dentists': { professions: ['allied-health'] },
  'oet-tips': {},
};

/**
 * Score every other post against the page: same category +2, a shared profession +1 (a general post, with no
 * profession, +0.5 when the page has one), newest first on ties. Posts the page already links are skipped.
 */
export function relatedPosts(context, posts, n = 4, exclude = new Set()) {
  const profs = context.professions || [];
  const score = (p) => {
    let s = context.category && p.category === context.category ? 2 : 0;
    if (profs.length) {
      const pp = p.professions || [];
      s += pp.length ? (pp.some((x) => profs.includes(x)) ? 1 : 0) : 0.5;
    }
    return s;
  };
  return posts
    .filter((p) => p.slug !== context.slug && !exclude.has(p.url))
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || b.p.datePublished.localeCompare(a.p.datePublished) || a.p.order - b.p.order)
    .slice(0, n)
    .map(({ p }) => p);
}

function shorten(s, max = 110) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…';
}

export function renderRelated(list) {
  const cards = list.map((p) => `<a class="oet-related-card" href="${p.url}"><span class="oet-related-icon"><i class="fa-solid fa-${p.icon}" aria-hidden="true"></i></span><span class="oet-related-body"><strong>${escapeHtml(p.title)}</strong><span>${escapeHtml(shorten(p.summary))}</span></span><i class="fa-solid fa-arrow-right oet-related-arrow" aria-hidden="true"></i></a>`).join('');
  return `<section class="oet-related oet-related--articles" aria-label="Related articles"><div class="container"><h2 class="oet-related-title">Related articles</h2><div class="oet-related-grid">${cards}</div></div></section>`;
}

/** Fill `<!--oet:related-guides-->` (0 or 1 per page) for the page `key` (its URL slug, e.g. "oet-writing-tips"). */
export function applyRelatedGuides(parts, key, posts) {
  const marker = '<!--oet:related-guides-->';
  const hits = Object.values(parts).reduce((n, html) => n + html.split(marker).length - 1, 0);
  if (!hits) return parts;
  if (hits !== 1) throw new Error(`blog: ${marker} found ${hits} time(s) on ${key}, expected 1`);
  const self = posts.find((p) => p.slug === key);
  const context = self ? { slug: key, category: self.category, professions: self.professions || [] } : RELATED_CONTEXT[key];
  if (!context) throw new Error(`blog: ${marker} on ${key}, which is neither a post in blog.json nor in RELATED_CONTEXT`);
  const linked = new Set([...Object.values(parts).join('\n').matchAll(/href="(\/[^"#?]+\.html)/g)].map((m) => m[1]));
  const list = relatedPosts({ ...context, slug: key }, posts, 4, linked);
  if (list.length < 3) throw new Error(`blog: only ${list.length} related posts for ${key}`);
  return Object.fromEntries(Object.entries(parts).map(([k, html]) => [k, html.replace(marker, renderRelated(list))]));
}

// ---- Visible "Published · Updated" byline (`<!--oet:dates-->`) ----------------------------------------------------
/** The page's dates, read from its own JSON-LD: earliest datePublished, latest dateModified. */
export function pageDates(html) {
  const pick = (k) => [...html.matchAll(new RegExp(`"${k}"\\s*:\\s*"(\\d{4}-\\d{2}-\\d{2})`, 'g'))].map((m) => m[1]).sort();
  const pub = pick('datePublished');
  const mod = pick('dateModified');
  return { published: pub[0] || null, modified: mod[mod.length - 1] || pub[pub.length - 1] || null };
}

export function renderDates({ published, modified }, byline, cls = 'oet-guide-meta') {
  if (!modified) throw new Error('blog: <!--oet:dates--> on a page with no datePublished/dateModified in its JSON-LD');
  if (published && modified < published) throw new Error(`blog: dateModified ${modified} is before datePublished ${published}`);
  const t = (d) => `<time datetime="${d}">${formatDate(d)}</time>`;
  const dates = published && published !== modified
    ? `Published ${t(published)} &middot; Updated ${t(modified)}`
    : published ? `Published ${t(published)}` : `Updated ${t(modified)}`;
  return `<p class="${cls}">By <a href="/about.html">Dr Ahmed Hesham</a>, ${escapeHtml(byline)} &middot; ${dates}</p>`;
}
