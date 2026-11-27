// Release evidence for SEO handoff #2 (25 Nov 2026) and the 2027 SEO expansion brief (26 Nov 2026): docs/seo-brief-2026-11-26/README.md.
// Every new or changed page is opened at desktop and phone width (English and Arabic) and checked for: page-level horizontal overflow,
// console errors, failed same-origin requests, the directory filters, the Arabic menu targets, and the homepage practice block.
// Needs the local server (preview "website-static" = node server.js on :8000) and Google Chrome (Playwright channel "chrome").
// Usage (from site/):  node scripts/qa-brief-2026-11-26.mjs [--base http://localhost:8000]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', 'docs', 'qa', '2026-11-26');
const argBase = process.argv.indexOf('--base');
const BASE = argBase !== -1 ? process.argv[argBase + 1] : 'http://localhost:8000';
fs.mkdirSync(OUT, { recursive: true });

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
let failures = 0;
const fail = (m) => { failures += 1; console.log(`FAIL ${m}`); };
const ok = (m) => console.log(`ok   ${m}`);

const PAGES = [
  '/', '/ar/', '/blog/', '/oet-writing-correction.html', '/ar/oet-writing-correction.html', '/ar/oet-free-resources.html', '/oet-speaking-practice-online.html',
  '/oet-for-pharmacists-usa.html', '/ar/oet-for-pharmacists-usa.html', '/usa-pathway-guide.html', '/oet-at-home.html', '/ar/oet-at-home.html',
  '/oet-test-centres.html', '/ar/oet-test-centres.html', '/oet-paper-test-centres-2027.html', '/ar/oet-paper-test-centres-2027.html',
  '/oet-clubbing-rules.html', '/ar/oet-clubbing-rules.html', '/oet-recognition-by-country.html',
  '/ireland-pathway-guide.html', '/canada-pathway-guide.html', '/new-zealand-pathway-guide.html', '/singapore-pathway-guide.html',
  '/oet-score-requirements.html', '/ar/oet-score-requirements.html', '/oet-course-for-pharmacists.html', '/ar/oet-course-egypt.html',
];
const SHOTS = new Set(['/', '/ar/', '/oet-test-centres.html', '/ar/oet-test-centres.html', '/oet-at-home.html', '/oet-clubbing-rules.html', '/oet-recognition-by-country.html',
  '/oet-for-pharmacists-usa.html', '/ar/oet-for-pharmacists-usa.html', '/oet-writing-correction.html', '/ar/oet-writing-correction.html', '/ar/oet-free-resources.html',
  '/canada-pathway-guide.html', '/oet-paper-test-centres-2027.html', '/oet-speaking-practice-online.html', '/blog/']);

const browser = await chromium.launch({ channel: 'chrome' });
async function open(viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 768, hasTouch: viewport.width < 768 });
  await ctx.addCookies([{ name: 'oet_cookie_consent', value: encodeURIComponent(JSON.stringify({ analytics: false, marketing: false, ts: 1 })), url: BASE }]);
  await ctx.addInitScript(() => { try { localStorage.setItem('oet_announce_paper-2027', '1'); sessionStorage.setItem('oetPromoPopupDismissedSession', '1'); } catch (e) {} });
  return ctx.newPage();
}
const slug = (u) => (u === '/' ? 'home' : u.replace(/^\/|\.html$|\/$/g, '').replace(/\//g, '-'));

for (const [name, vp] of [['desktop', DESKTOP], ['phone', PHONE]]) {
  const page = await open(vp);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', (r) => { if (r.url().startsWith(BASE)) errors.push(`request failed ${r.url()}`); });
  page.on('response', (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  for (const url of PAGES) {
    errors.length = 0;
    await page.goto(BASE + url, { waitUntil: 'load' });
    await page.waitForTimeout(350);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h1: document.querySelectorAll('h1').length,
      marker: /<!--oet:/.test(document.documentElement.innerHTML), blank: [...document.querySelectorAll('main i[class*="fa-"]')].filter((i) => getComputedStyle(i, '::before').content === 'none').length }));
    if (m.sw > m.cw + 1) fail(`${name} ${url}: the page scrolls sideways (${m.sw}px content in a ${m.cw}px viewport)`);
    if (m.h1 !== 1) fail(`${name} ${url}: ${m.h1} h1`);
    if (m.marker) fail(`${name} ${url}: an unreplaced build marker`);
    const real = errors.filter((e) => !/favicon|googletagmanager|google-analytics|facebook|ERR_BLOCKED|net::ERR_ABORTED/.test(e));
    if (real.length) fail(`${name} ${url}: ${real.slice(0, 3).join(' | ')}`);
    if (SHOTS.has(url)) await page.screenshot({ path: path.join(OUT, `${slug(url)}-${name}.png`), fullPage: false });
  }
  ok(`${name}: ${PAGES.length} pages opened without sideways scroll, console errors or broken requests (unless listed above)`);

  // the directory filters
  for (const pre of ['', '/ar']) {
    await page.goto(`${BASE}${pre}/oet-test-centres.html`, { waitUntil: 'load' });
    const total = await page.locator('.oet-venues__country tbody tr').count();
    await page.selectOption('[data-f=country]', 'egypt');
    const egypt = await page.locator('.oet-venues__country:not([hidden]) tbody tr:not([hidden])').count();
    await page.selectOption('[data-f=mode]', 'paper');
    const paper = await page.locator('.oet-venues__country:not([hidden]) tbody tr:not([hidden])').count();
    await page.selectOption('[data-f=profession]', 'pharmacy');
    const pharm = await page.locator('.oet-venues__country:not([hidden]) tbody tr:not([hidden])').count();
    const note = await page.locator('.oet-venues__profnote').isVisible();
    await page.selectOption('[data-f=mode]', '');
    const pharmAll = await page.locator('.oet-venues__country:not([hidden]) tbody tr:not([hidden])').count();
    await page.selectOption('[data-f=country]', ''); await page.selectOption('[data-f=profession]', '');
    await page.fill('[data-f=city]', 'riyadh');
    const riyadh = await page.locator('.oet-venues__country:not([hidden]) tbody tr:not([hidden])').count();
    const sections = await page.locator('.oet-venues__country:not([hidden])').count();
    await page.fill('[data-f=city]', 'zzzz');
    const emptyShown = await page.locator('.oet-venues__empty').isVisible();
    if (total !== 215 || egypt !== 7 || paper !== 5 || pharm !== 0 || !note || pharmAll !== 2 || riyadh < 3 || sections !== 1 || !emptyShown) fail(`${name} ${pre}/oet-test-centres.html: filters (total ${total}, Egypt ${egypt}, Egypt paper ${paper}, + Pharmacy ${pharm}, note ${note}, Egypt Pharmacy all modes ${pharmAll}, Riyadh ${riyadh} in ${sections} section(s), empty ${emptyShown})`);
    else ok(`${name} ${pre}/oet-test-centres.html: country, mode, profession and city filters behave (Egypt 7 listings, 5 paper, Pharmacy sees the 2 computer venues, Riyadh ${riyadh})`);
    await page.fill('[data-f=city]', '');
    await page.selectOption('[data-f=country]', 'saudi-arabia');
    if (name === 'phone' || pre === '') await page.screenshot({ path: path.join(OUT, `directory-saudi${pre ? '-ar' : ''}-${name}.png`), fullPage: false });
  }
  await page.context().close();
}

// Arabic menu: every link with an Arabic twin opens the twin, on the Arabic home page and an inner page; the desktop dropdowns fit the screen
{
  const page = await open({ width: 1536, height: 760 });
  for (const url of ['/ar/', '/ar/oet-course-egypt.html', '/ar/oet-test-dates-and-fees.html']) {
    await page.goto(BASE + url, { waitUntil: 'load' });
    const hrefs = await page.evaluate(() => [...document.querySelectorAll('header nav.vl-mobile-menu-active a[href^="/"], header .vl-logo a')].map((a) => a.getAttribute('href')));
    const want = ['/ar/pricing.html', '/ar/success-stories.html', '/ar/oet-course-for-nurses.html', '/ar/oet-writing-tips.html', '/ar/oet-score-calculator.html', '/ar/gulf-pathway-guide.html', '/ar/oet-recalls.html', '/ar/oet-test-centres.html', '/ar/oet-at-home.html', '/ar/oet-writing-correction.html', '/ar/'];
    const missing = want.filter((h) => !hrefs.includes(h));
    const english = hrefs.filter((h) => ['/pricing.html', '/success-stories.html', '/oet-score-requirements.html', '/oet-writing-correction.html', '/'].includes(h));
    if (missing.length || english.length) fail(`${url}: Arabic menu (missing ${missing.join(', ') || 'none'}; still English ${english.join(', ') || 'none'})`);
    else ok(`${url}: the menu keeps Arabic visitors on Arabic pages (${hrefs.filter((h) => h.startsWith('/ar/')).length} Arabic targets)`);
  }
  // open the deepest new dropdowns on an English page and check that nothing leaves the viewport
  await page.goto(`${BASE}/oet-tips.html`, { waitUntil: 'load' });
  for (const [top, sub] of [['Free Resources', 'Test Centres & Rules'], ['About', 'Pathway Guidelines']]) {
    await page.locator('header nav.vl-mobile-menu-active > ul > li.has-dropdown > a', { hasText: top }).first().hover();
    await page.waitForTimeout(350);
    await page.locator('header nav.vl-mobile-menu-active ul.sub-menu > li.has-dropdown > a', { hasText: sub }).first().hover();
    await page.waitForTimeout(450);
    const box = await page.evaluate((s) => {
      const a = [...document.querySelectorAll('header nav.vl-mobile-menu-active ul.sub-menu > li.has-dropdown > a')].find((x) => x.textContent.includes(s));
      const ul = a.parentElement.querySelector('ul.sub-menu'); const r = ul.getBoundingClientRect(); const cs = getComputedStyle(ul);
      const last = ul.lastElementChild.getBoundingClientRect(); const first = ul.firstElementChild.getBoundingClientRect();
      return { visible: cs.visibility !== 'hidden' && cs.opacity !== '0', top: Math.min(r.top, first.top), bottom: Math.max(r.bottom, last.bottom), left: r.left, right: r.right, vw: innerWidth, vh: innerHeight, inside: first.top >= r.top - 1 && last.bottom <= r.bottom + 1 };
    }, sub);
    await page.screenshot({ path: path.join(OUT, `menu-${sub.toLowerCase().replace(/[^a-z]+/g, '-')}.png`) });
    if (!box.visible || !box.inside || box.top < 0 || box.bottom > box.vh + 1 || box.right > box.vw + 1 || box.left < -1) fail(`menu "${top} > ${sub}": the dropdown is ${box.visible ? 'cut off' : 'not shown'} at 1536x760 (${JSON.stringify(box)})`);
    else ok(`menu "${top} > ${sub}": the dropdown fits a 1536x760 screen`);
    await page.mouse.move(5, 700);
    await page.waitForTimeout(250);
  }
  await page.context().close();
}

// homepage practice block: five working links, in one row on desktop and stacked on a phone
for (const [name, vp] of [['desktop', DESKTOP], ['phone', PHONE]]) {
  const page = await open(vp);
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  const block = page.locator('.oet-home-practice');
  await block.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => { const li = [...document.querySelectorAll('.oet-home-practice__grid li')]; const tops = new Set(li.map((x) => Math.round(x.getBoundingClientRect().top))); return { n: li.length, rows: tops.size, small: li.filter((x) => x.getBoundingClientRect().height < 44).length }; });
  await block.screenshot({ path: path.join(OUT, `home-practice-${name}.png`) });
  if (info.n !== 5 || info.small || (name === 'desktop' ? info.rows !== 1 : info.rows !== 5)) fail(`${name} homepage practice block: ${JSON.stringify(info)}`);
  else ok(`${name} homepage: "Practise OET Online" shows 5 links in ${info.rows} row(s)`);
  await page.context().close();
}

await browser.close();
console.log(failures ? `\nqa-brief-2026-11-26: ${failures} failure(s)` : `\nqa-brief-2026-11-26: all checks passed; screenshots in docs/qa/2026-11-26/`);
process.exit(failures ? 1 : 0);
