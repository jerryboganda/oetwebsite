// Release evidence for the brief of 22 Nov 2026 (docs/seo-brief-2026-11-22.md): EN/AR desktop and phone screenshots of every changed
// journey, plus live checks of locale links, the Arabic library search and the analytics consent replay.
// Needs the local server (preview "website-static" = node server.js on :8000) and Google Chrome (Playwright channel "chrome").
// Usage (from site/):  node scripts/qa-brief-2026-11-22.mjs [--base http://localhost:8000]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', 'docs', 'qa', '2026-11-22');
const argBase = process.argv.indexOf('--base');
const BASE = argBase !== -1 ? process.argv[argBase + 1] : 'http://localhost:8000';
fs.mkdirSync(OUT, { recursive: true });

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
let failures = 0;
const fail = (m) => { failures += 1; console.log(`FAIL ${m}`); };
const ok = (m) => console.log(`ok   ${m}`);

const browser = await chromium.launch({ channel: 'chrome' });

async function page(viewport, { consent = true } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 768, hasTouch: viewport.width < 768 });
  // a decided cookie choice keeps the banner out of the evidence shots (the consent test below starts from a fresh context)
  if (consent) await ctx.addCookies([{ name: 'oet_cookie_consent', value: encodeURIComponent(JSON.stringify({ analytics: false, marketing: false, ts: 1 })), url: BASE }]);
  // the announcement bar is dismissed so the shots show the page itself
  await ctx.addInitScript(() => { try { localStorage.setItem('oet_announce_paper-2027', '1'); } catch (e) {} });
  return ctx.newPage();
}

async function shot(p, name, selector) {
  // viewport captures (an element screenshot of a tall block stitches in the fixed header and the search overlay). Scroll-reveal blocks
  // (sal.js) are revealed first so the layout has settled before scrolling; the page itself is unchanged.
  const file = path.join(OUT, `${name}.jpg`);
  await p.evaluate(() => document.querySelectorAll("[data-sal]").forEach((e) => e.classList.add("sal-animate")));
  await p.waitForTimeout(1300);
  if (selector) {
    for (let i = 0; i < 2; i++) {
      await p.locator(selector).first().evaluate((e) => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + window.scrollY - 170));
      });
      await p.waitForTimeout(700);
    }
  }
  await p.screenshot({ path: file, type: "jpeg", quality: 70 });
  ok(`shot ${name}.jpg`);
}

const SHOTS = [
  ["en-dates-jan-2027-paper", "/oet-test-dates-and-fees.html", "#sec-paper-2027"],
  ["ar-dates-jan-2027-paper", "/ar/oet-test-dates-and-fees.html", "#sec-paper-2027"],
  ["en-ecfmg-deadlines", "/oet-for-ecfmg.html", "#sec-deadlines"],
  ["ar-booking-guide-hero", "/ar/oet-test-fee-booking-2027.html", null],
  ["ar-booking-guide-portals", "/ar/oet-test-fee-booking-2027.html", "#paper"],
  ["ar-library-top", "/ar/blog/", null],
  ["ar-library-other-pages", "/ar/blog/", "#pages-title"],
  ["en-blog-arabic-section", "/blog/", "#arabic-title"],
  ["en-guide-arabic-switch", "/oet-writing-tips.html", null],
  ["ar-guide-read-in-english", "/ar/oet-writing-tips.html", null],
  ["ar-egypt-booking-link", "/ar/oet-course-egypt.html", "#venues"],
];

for (const [vpName, vp] of [['desktop', DESKTOP], ['phone', PHONE]]) {
  const p = await page(vp);
  for (const [name, url, sel] of SHOTS) {
    await p.goto(BASE + url, { waitUntil: 'networkidle' });
    await shot(p, `${name}-${vpName}`, sel);
  }
  await p.context().close();
}

// navigation: the Arabic library entry in the Free Resources dropdown (desktop, 1500px) and the mobile drawer (390px)
{
  const p = await page({ width: 1500, height: 900 });
  await p.goto(`${BASE}/oet-test-dates-and-fees.html`, { waitUntil: 'networkidle' });
  const top = p.locator('.vl-mobile-menu-active > ul > li.has-dropdown', { hasText: 'Free Resources' }).first();
  await top.hover();
  await p.waitForTimeout(600);
  const link = top.locator('a[href="/ar/blog/"]');
  if (!(await link.isVisible())) fail('desktop: the Free Resources dropdown does not show "مقالات OET بالعربي"');
  else ok('desktop: Free Resources dropdown shows the Arabic library first');
  await p.screenshot({ path: path.join(OUT, 'nav-desktop-free-resources.jpg'), type: 'jpeg', quality: 70, clip: { x: 0, y: 0, width: 1500, height: 620 } });
  await p.context().close();
}
{
  const p = await page(PHONE);
  await p.goto(`${BASE}/ar/oet-test-dates-and-fees.html`, { waitUntil: 'networkidle' });
  await p.locator('button.vl-offcanvas-toggle').first().click();
  await p.waitForTimeout(800);
  const drawer = p.locator('#vl-offcanvas-menu');
  const parent = drawer.locator('li', { hasText: 'Free Resources' }).first();
  const toggle = parent.locator('.vl-mean-expand, .mean-expand, button, .dropdown-btn').first();
  if (await toggle.count()) await toggle.click().catch(() => {});
  await p.waitForTimeout(500);
  const n = await drawer.locator('a[href="/ar/blog/"]').count();
  if (!n) fail('phone: the drawer has no Arabic library link'); else ok(`phone: drawer carries the Arabic library link (${n})`);
  const pricing = await drawer.locator('a[href="/ar/pricing.html"]').count();
  if (!pricing) fail('phone: on an Arabic page the drawer "Pricing" item must open /ar/pricing.html'); else ok('phone: Arabic page drawer Pricing -> /ar/pricing.html');
  await p.screenshot({ path: path.join(OUT, 'nav-phone-drawer-ar.jpg'), type: 'jpeg', quality: 70 });
  await p.context().close();
}

// locale links: every link inside <main> of the Arabic Egypt and Saudi pages resolves (200) and stays Arabic where an Arabic page exists
{
  const p = await page(DESKTOP);
  for (const url of ['/ar/oet-course-egypt.html', '/ar/oet-course-saudi-arabia.html']) {
    await p.goto(BASE + url, { waitUntil: 'networkidle' });
    const hrefs = await p.$$eval('main a[href^="/"]', (as) => [...new Set(as.map((a) => a.getAttribute('href')))]);
    let bad = 0;
    for (const h of hrefs) {
      const [pathname, frag] = h.split('#');
      const r = await p.request.get(BASE + pathname);
      if (r.status() !== 200) { bad += 1; fail(`${url}: ${h} -> HTTP ${r.status()}`); continue; }
      if (frag && !(await r.text()).includes(`id="${frag}"`)) { bad += 1; fail(`${url}: ${h} -> #${frag} does not exist`); }
    }
    const english = hrefs.filter((h) => /^\/(pricing|success-stories)\.html/.test(h));
    if (english.length) fail(`${url}: still links ${english.join(', ')}`);
    if (!bad) ok(`${url}: ${hrefs.length} internal links resolve; pricing/results stay Arabic`);
  }
  await p.context().close();
}

// analytics: a fresh visitor accepts analytics on a course page AFTER load -> exactly one view_item, none before consent
{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/oet-course-for-nurses.html`, { waitUntil: 'networkidle' });
  const before = await p.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)).filter((a) => a[0] === 'event').map((a) => a[1]));
  if (before.length) fail(`analytics: events before consent: ${before.join(', ')}`); else ok('analytics: nothing tracked before consent');
  await p.click('#oet-cc-manage');
  await p.evaluate(() => { document.getElementById('oet-cc-a').checked = true; document.getElementById('oet-cc-m').checked = false; });
  await p.click('#oet-cc-save');
  await p.waitForTimeout(4500);
  await p.evaluate(() => { window.oetAnalytics.grantAnalytics(); window.oetAnalytics.grantAnalytics(); });
  await p.waitForTimeout(500);
  const views = await p.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)).filter((a) => a[0] === 'event' && a[1] === 'view_item').length);
  const type = await p.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)).filter((a) => a[0] === 'config').map((a) => a[2] && a[2].page_type));
  if (views !== 1) fail(`analytics: late consent sent view_item ${views} times (expected 1)`); else ok('analytics: late consent sends view_item once (repeat grants do not duplicate)');
  if (type.join() !== 'course_detail') fail(`analytics: course page_type ${type.join()}`); else ok('analytics: page_type course_detail');
  for (const url of ['/pricing.html', '/ar/pricing.html']) {
    await p.goto(BASE + url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(3500);
    const t = await p.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)).filter((a) => a[0] === 'config').map((a) => a[2] && a[2].page_type));
    if (t.join() !== 'pricing') fail(`analytics: ${url} page_type ${t.join()}`); else ok(`analytics: ${url} page_type pricing`);
  }
  await ctx.close();
}

await browser.close();
console.log(failures ? `\nqa-brief-2026-11-22: ${failures} failure(s)` : '\nqa-brief-2026-11-22: all checks passed');
process.exit(failures ? 1 : 0);
