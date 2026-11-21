// Build-time data injection into raw HTML partials.
// Every replacement asserts its match count so a drifted partial fails the
// build loudly instead of silently shipping stale numbers.

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAcross(parts, regex, replacement, expected, label) {
  let hits = 0;
  const out = {};
  for (const [k, html] of Object.entries(parts)) {
    out[k] = html.replace(regex, (...args) => {
      hits += 1;
      if (typeof replacement === 'function') return replacement(...args);
      // expand $1..$9 group references manually (function replacements
      // return literal text, so String.replace would not expand them)
      return replacement.replace(/\$(\d)/g, (_, n) => args[Number(n)] ?? '');
    });
  }
  if (hits !== expected) {
    throw new Error(`inject: ${label} matched ${hits} time(s), expected ${expected}`);
  }
  return out;
}

/**
 * Rewrite visible card prices and JSON-LD Offer prices from pricing.json.
 * @param {{meta:string,headExtra:string,main:string,tail:string}} parts
 * @param {Array<{kicker:string,title:string,price:number,structuredData?:boolean}>} data
 */
export function applyPricing(parts, data) {
  let out = { ...parts };
  for (const card of data) {
    const vis = new RegExp(
      `(<div class="oet-card-kicker">${escapeRe(card.kicker)}</div>\\s*` +
      `<h3>${escapeRe(card.title)}</h3>\\s*` +
      `<div class="oet-pricing-price"><strong>&pound;)\\d+(</strong>)`,
    );
    out = replaceAcross(out, vis, `$1${card.price}$2`, 1, `visible price "${card.title}"`);
    if (card.structuredData) {
      const ld = new RegExp(
        `("name"\\s*:\\s*"${escapeRe(card.title)}"[\\s\\S]*?"price"\\s*:\\s*")\\d+(")`,
      );
      out = replaceAcross(out, ld, `$1${card.price}$2`, 1, `JSON-LD offer "${card.title}"`);
    }
  }
  // Prose that quotes another card's price (for example the "Upgrade to the Nursing Premium Bundle" line on the Full
  // Nursing OET Course card) carries <!--oet:price:Package 07-->: filled from the same data, so a reprice cannot leave it stale.
  return applyPriceMarkers(out, data);
}

/**
 * Site-wide price markers (every page, applied centrally by src/lib/page.mjs): <!--oet:price:Package NN--> from
 * pricing.json and <!--oet:bundle-price:<tier key>--> from bundles.json, both rendered as "&pound;N". No page types a
 * price by hand, so a reprice in the data files reaches every landing page and guide.
 * @param {{[k:string]:string}} parts
 * @param {Array<{kicker:string,price:number}>} data pricing.json
 * @param {{families?:Array<{tiers:Array<{key:string,price:number}>}>}} [bundles] bundles.json
 */
export function applyPriceMarkers(parts, data, bundles) {
  const byKicker = new Map(data.map((c) => [c.kicker, c.price]));
  const byTier = new Map((bundles?.families || []).flatMap((f) => f.tiers.map((t) => [t.key, t.price])));
  return Object.fromEntries(Object.entries(parts).map(([k, html]) => [k, html
    .replace(/<!--oet:price:(Package \d+)-->/g, (_, kicker) => {
      if (!byKicker.has(kicker)) throw new Error(`inject: price marker for unknown package "${kicker}"`);
      return `&pound;${byKicker.get(kicker)}`;
    })
    .replace(/<!--oet:bundle-price:([a-z-]+)-->/g, (_, key) => {
      if (!byTier.has(key)) throw new Error(`inject: bundle price marker for unknown tier "${key}"`);
      return `&pound;${byTier.get(key)}`;
    })]));
}

/**
 * Labels the story injectors look for / write, per language. The English page uses STORY_EN; the Arabic page
 * (partials/ar/success-stories) must carry exactly the STORY_AR strings in its markup.
 */
export const STORY_EN = {
  allTab: 'All Stories',
  scoreCards: 'Score cards',
  latest: 'Latest additions',
  inWord: ' in ',
  loading: 'Loading success stories...',
  summary: (shown, total) => `Showing ${shown} of ${total} score cards`,
  alt: (year, i, n) => `Verified OET score card shared in ${year} (${i} of ${n} that year)`,
};
export const STORY_AR = {
  allTab: 'كل القصص',
  scoreCards: 'بطاقات الدرجات',
  latest: 'أحدث الإضافات',
  inWord: ' في ',
  loading: 'جارٍ تحميل قصص النجاح...',
  summary: (shown, total) => `عرض ${shown} من ${total} بطاقة درجات`,
  alt: (year, i, n) => `بطاقة درجات OET موثقة شاركها أحد الطلاب في ${year} (${i} من ${n} في ذلك العام)`,
};
const grouped = (n) => n.toLocaleString('en-GB');

/**
 * Rewrite the success-stories year-tab counts (and "1,634" copy mentions)
 * from the success-stories.json manifest. The animated counters carry their FINAL value as text (crawlers and
 * no-JS visitors read it; assets/js/main.js animates from 0 on view), never "0".
 * @param {{meta:string,headExtra:string,main:string,tail:string}} parts
 * @param {Array<{year:string}>} stories
 */
export function applyStoryCounts(parts, stories, L = STORY_EN) {
  const total = stories.length;
  const byYear = {};
  for (const s of stories) byYear[s.year] = (byYear[s.year] || 0) + 1;

  let out = replaceAcross(
    parts,
    new RegExp(`(data-year="All"[^>]*>${escapeRe(L.allTab)} <span>)\\d+(</span>)`),
    `$1${total}$2`,
    1,
    'All Stories tab count',
  );
  for (const [year, count] of Object.entries(byYear)) {
    out = replaceAcross(
      out,
      new RegExp(`(data-year="${year}"[^>]*>${year} <span>)\\d+(</span>)`),
      `$1${count}$2`,
      1,
      `${year} tab count`,
    );
  }
  // "Score cards" animated counter in the verified-results band.
  out = replaceAcross(
    out,
    new RegExp(`(<dt>${escapeRe(L.scoreCards)}</dt><dd><span class="oet-countup" data-count=")\\d+(">)\\d+(</span>)`),
    `$1${total}$2${grouped(total)}$3`,
    1,
    'Score cards countup',
  );
  // "Latest additions" counter = newest year's story count.
  const latest = Math.max(...Object.keys(byYear).map(Number));
  out = replaceAcross(
    out,
    new RegExp(`(<dt>${escapeRe(L.latest)}</dt><dd><span class="oet-countup" data-count=")\\d+("[^>]*>)\\d+(</span>${escapeRe(L.inWord)})\\d{4}`),
    `$1${byYear[latest]}$2${grouped(byYear[latest])}$3${latest}`,
    1,
    'Latest additions countup',
  );
  // JSON-LD ItemList numberOfItems.
  out = replaceAcross(
    out,
    /("numberOfItems"\s*:\s*)\d+/,
    `$1${total}`,
    1,
    'JSON-LD numberOfItems',
  );
  return out;
}

const ORIGIN = 'https://oetwithdrhesham.co.uk';
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The crawlable sample: the first `perYear` score cards of every year, newest year first, with honest alt text. */
export function storySample(stories, perYear = 4, L = STORY_EN) {
  const byYear = {};
  for (const s of stories) (byYear[s.year] ||= []).push(s);
  return Object.keys(byYear).sort().reverse().flatMap((year) => byYear[year].slice(0, perYear).map((s, i) => ({
    ...s,
    sampleAlt: L.alt(year, i + 1, byYear[year].length.toLocaleString('en-GB')),
  })));
}

/**
 * Success stories: the gallery is filled by JavaScript from a 958 KB manifest, so search engines and AI crawlers saw no
 * score card at all. Render a sample as real <img> markup inside #success-gallery (the script replaces it as soon as it
 * runs) and list the same images as associatedMedia of the ImageGallery JSON-LD.
 */
export function applyStorySample(parts, stories, rewriteJsonLd, mapNodes, L = STORY_EN) {
  const sample = storySample(stories, 4, L);
  const cards = sample.map((s) => `<article class="success-card is-visible"><a class="success-card__button" href="/${escAttr(s.optimizedSrc)}"><span class="success-card__media"><img src="/${escAttr(s.thumbSrc || s.optimizedSrc)}" alt="${escAttr(s.sampleAlt)}" width="${s.thumbWidth || s.width}" height="${s.thumbHeight || s.height}" loading="lazy" decoding="async"></span><span class="success-card__meta"><span><i class="fa-solid fa-calendar-check" aria-hidden="true"></i> ${escAttr(s.year)}</span><span><i class="fa-solid fa-share-nodes" aria-hidden="true"></i> ${escAttr(s.platform)}</span></span></a></article>`).join('\n                ');
  let out = replaceAcross(parts, /<div class="success-masonry" id="success-gallery"><\/div>/,
    `<div class="success-masonry" id="success-gallery">\n                ${cards}\n            </div>`, 1, 'success gallery sample');
  // the skeleton would sit above real cards until the script loads; the (now empty) box still shows a load error
  out = replaceAcross(out, /(<div class="success-loading" id="success-loading"[^>]*>)(?:<span class="success-skel"><\/span>)+/, '$1', 1, 'success skeleton');
  out = replaceAcross(out, new RegExp(`(<span id="success-results-summary">)${escapeRe(L.loading)}(</span>)`),
    `$1${L.summary(sample.length, stories.length.toLocaleString('en-GB'))}$2`, 1, 'success summary');
  let galleries = 0;
  out = rewriteJsonLd(out, (ld) => mapNodes(ld, (node) => {
    if (node['@type'] !== 'ImageGallery') return undefined;
    galleries += 1;
    return {
      ...node,
      associatedMedia: sample.map((s) => ({
        '@type': 'ImageObject',
        contentUrl: `${ORIGIN}/${s.optimizedSrc}`,
        thumbnailUrl: `${ORIGIN}/${s.thumbSrc || s.optimizedSrc}`,
        width: s.width,
        height: s.height,
        encodingFormat: s.mimeType,
        caption: s.sampleAlt,
      })),
    };
  }), (body) => body.includes('"ImageGallery"'));
  if (galleries !== 1) throw new Error(`inject: expected 1 ImageGallery JSON-LD node, found ${galleries}`);
  return out;
}
