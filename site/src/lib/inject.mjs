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
  return out;
}

/**
 * Rewrite the success-stories year-tab counts (and "1,634" copy mentions)
 * from the success-stories.json manifest.
 * @param {{meta:string,headExtra:string,main:string,tail:string}} parts
 * @param {Array<{year:string}>} stories
 */
export function applyStoryCounts(parts, stories) {
  const total = stories.length;
  const byYear = {};
  for (const s of stories) byYear[s.year] = (byYear[s.year] || 0) + 1;

  let out = replaceAcross(
    parts,
    /(data-year="All"[^>]*>All Stories <span>)\d+(<\/span>)/,
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
    /(<dt>Score cards<\/dt><dd><span class="oet-countup" data-count=")\d+(">)/,
    `$1${total}$2`,
    1,
    'Score cards countup',
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
