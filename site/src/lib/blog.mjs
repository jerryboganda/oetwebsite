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
  return { categories: data.categories, posts };
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

export function renderCard(post, { headingLevel = 3, eager = false } = {}) {
  const h = `h${headingLevel}`;
  return `<article class="oet-blog-card" data-category="${post.category}" data-search="${escapeHtml(
    `${post.title} ${post.summary} ${post.categoryLabel}`.toLowerCase(),
  )}">
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
