// Head tags derived from what the page already declares, added only when its meta partial lacks them, so 70 partials
// do not each have to repeat (and drift on) the same boilerplate. Called by src/lib/page.mjs from layouts/Base.astro.
const attr = (html, re) => (html.match(re) || [])[1];

/**
 * @param {string} meta     the page's meta partial (title, canonical, og:*, twitter:*)
 * @param {string} all      meta + head-extra (the JSON-LD may sit in either)
 * @param {{isArticle:boolean, dates:{published:string|null, modified:string|null}, person:object}} ctx
 * @returns {string} the meta partial with the missing tags appended
 */
export function deriveHeadTags(meta, all, { isArticle, dates, person }) {
  const add = [];
  let out = meta;
  const has = (re) => re.test(out);
  const ogTitle = attr(out, /<meta property="og:title" content="([^"]*)"/);
  if (has(/<meta property="og:image" /) && !has(/<meta property="og:image:alt" /) && ogTitle)
    add.push(`<meta property="og:image:alt" content="${ogTitle}">`);
  const byDrHesham = isArticle || /"author"\s*:\s*\{[^}]*#drhesham/.test(all);
  if (byDrHesham && !has(/<meta name="author" /)) add.push(`<meta name="author" content="${person.name}">`);
  if (isArticle) {
    // Open Graph article:* tags only mean something on og:type=article
    out = out.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">');
    if (dates.published && !has(/article:published_time/)) add.push(`<meta property="article:published_time" content="${dates.published}">`);
    if (dates.modified && !has(/article:modified_time/)) add.push(`<meta property="article:modified_time" content="${dates.modified}">`);
    if (!has(/article:author/)) add.push(`<meta property="article:author" content="${person.url}">`);
  }
  if (person.twitter && !has(/name="twitter:site"/)) add.push(`<meta name="twitter:site" content="@${String(person.twitter).replace(/^@/, '')}">`);
  if (!has(/application\/atom\+xml/)) add.push('<link rel="alternate" type="application/atom+xml" title="OET Blog by Dr Hesham" href="/feed.xml">');
  return add.length ? `${out}\n    ${add.join('\n    ')}` : out;
}
