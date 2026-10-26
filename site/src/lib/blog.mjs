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
