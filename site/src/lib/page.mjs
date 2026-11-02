// One build-time pass over EVERY page (called by layouts/Base.astro), after the page wrapper's own injections:
//   1. price markers           <!--oet:price:Package NN-->, <!--oet:bundle-price:<tier>-->   (inject.mjs)
//   2. counts                  <!--oet:story-count--> (success-stories.json),
//                              <!--oet:years-->, <!--oet:years-word--> (person.json coachingSince)
//   3. entity nodes            every typed #drhesham / #organization JSON-LD node            (schema.mjs)
//   4. visible dates byline    <!--oet:dates-->                                              (blog.mjs)
//   5. author box              <!--oet:author-box-->                                         (schema.mjs)
//   6. related articles        <!--oet:related-guides-->                                     (blog.mjs)
//   7. derived head tags       og:image:alt, author, article:*, Atom link                    (head.mjs)
// verify.mjs fails if any <!--oet:…--> marker survives into dist.
import fs from 'node:fs';
import path from 'node:path';
import { applyPriceMarkers } from './inject.mjs';
import { loadPerson, applyEntityNodes, authorBox, yearsCoaching, numberWord } from './schema.mjs';
import { loadBlog, applyRelatedGuides, pageDates, renderDates } from './blog.mjs';
import { deriveHeadTags } from './head.mjs';

const SITE = process.cwd();
let data; // the build is one process: read the data files once
function shared() {
  if (!data) {
    const read = (f) => JSON.parse(fs.readFileSync(path.join(SITE, 'src', 'data', f), 'utf8'));
    const stories = JSON.parse(fs.readFileSync(path.join(path.dirname(SITE), 'assets', 'img', 'success-stories', 'success-stories.json'), 'utf8'));
    data = { pricing: read('pricing.json'), bundles: read('bundles.json'), person: loadPerson(), posts: loadBlog().posts, stories: stories.length };
  }
  return data;
}

/** The page's slug from its canonical URL: "/" -> "index", "/ar/" -> "ar/index", "/blog/" -> "blog/index". */
export function pageKey(meta) {
  const canon = (meta.match(/<link rel="canonical" href="https:\/\/oetwithdrhesham\.co\.uk\/([^"]*)"/) || [])[1];
  if (canon === undefined) return null;
  if (canon === '' || canon.endsWith('/')) return `${canon}index`;
  return canon.replace(/\.html$/, '');
}

function replaceMarker(parts, marker, render) {
  const hits = Object.values(parts).reduce((n, html) => n + html.split(marker).length - 1, 0);
  if (!hits) return parts;
  const value = render();
  return Object.fromEntries(Object.entries(parts).map(([k, html]) => [k, html.split(marker).join(value)]));
}

export function enrichPage(input) {
  const { pricing, bundles, person, posts, stories } = shared();
  const key = pageKey(input.meta);
  let parts = applyPriceMarkers(input, pricing, bundles);
  // "1,750+ verified score cards": the count of the success-stories manifest, never a typed number
  parts = replaceMarker(parts, '<!--oet:story-count-->', () => stories.toLocaleString('en-GB'));
  parts = replaceMarker(parts, '<!--oet:years-->', () => String(yearsCoaching(person)));
  parts = replaceMarker(parts, '<!--oet:years-word-->', () => numberWord(yearsCoaching(person)));
  parts = applyEntityNodes(parts, person);
  const ld = `${parts.meta}\n${parts.headExtra}`;
  const dates = pageDates(ld);
  // <!--oet:dates--> renders the byline with class oet-guide-meta; the pathway guides use <!--oet:dates class="pathway-byline"-->
  const DATES = /<!--oet:dates(?: class="([a-z-]+)")?-->/g;
  const dateHits = parts.main.match(DATES) || [];
  if (dateHits.length > 1) throw new Error(`page: <!--oet:dates--> found ${dateHits.length} times on ${key}`);
  parts = { ...parts, main: parts.main.replace(DATES, (_, cls) => renderDates(dates, person.byline, cls)) };
  parts = replaceMarker(parts, '<!--oet:author-box-->', () => authorBox(person));
  if (key) parts = applyRelatedGuides(parts, key, posts);
  const isArticle = !!key && posts.some((p) => p.slug === key);
  return { ...parts, meta: deriveHeadTags(parts.meta, ld, { isArticle, dates, person }) };
}
