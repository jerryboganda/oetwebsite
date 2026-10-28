/**
 * Browser acceptance QA for the V3 correction (27 Oct 2026): the ORIGINAL owner-approved header,
 * drawer and footer are restored, the new OET Blog is kept; plus the 28 Oct 2026 refinements (Login /
 * Register label, Contact row out of the side menu, "Support & Community", grouped footer). Needs the static site running
 * (preview "website-static", node server.js on :8000) and Google Chrome (Playwright channel "chrome").
 *
 * Checks at 320/360/390/430/768/1024/1366/1440/1500 px (the brief's matrix plus breakpoints):
 *   - no horizontal overflow on home, /blog/, two articles, pricing and the practice hub
 *   - header: logo, Login / Register and menu button fit; original inline nav from 1500px,
 *     with the approved plain "OET Blog" item
 *   - drawer: the original drawer (cloned menu incl. OET Blog but no Contact row, Support & Community,
 *     Follow the Journey) opens and closes; submenus expand
 *   - footer: the original footer re-grouped (brand + social, Courses & Practice, Resources & Guides,
 *     About & Support, Subscribe): four <details>, closed on phones, open from 768px
 *   - homepage "Latest from the OET Blog": lavender section, 3 cards, View All Articles, before the FAQ
 *   - blog search filters cards; login link + signed-in hint cookie still work; no console errors
 * Screenshots go to docs/qa/2026-10-restore/ (viewport, JPEG).
 *
 * Usage (from site/):  node scripts/qa-redesign.mjs [--base http://localhost:8000] [--no-shots]
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.resolve(HERE, '..', '..', 'docs', 'qa', '2026-10-restore');
const argBase = process.argv.indexOf('--base');
const BASE = argBase !== -1 ? process.argv[argBase + 1] : 'http://localhost:8000';
const takeShots = !process.argv.includes('--no-shots');
const WIDTHS = [320, 360, 390, 430, 768, 1024, 1366, 1440, 1500];
const PAGES = [
  ['home', '/'],
  ['blog', '/blog/'],
  ['article', '/oet-writing-referral-letter-structure.html'],
  ['article2', '/oet-listening-tips.html'],
  ['pricing', '/pricing.html'],
  ['practice', '/oet-practice.html'],
];
const LOGIN = 'https://app.oetwithdrhesham.co.uk/sign-in?next=%2F';

let failures = 0;
const fail = (msg) => { failures += 1; console.error(`FAIL ${msg}`); };
const ok = (msg) => console.log(`ok   ${msg}`);

if (takeShots) fs.mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });

async function open(width, url, { signedIn = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: width < 768 ? 800 : 900 }, reducedMotion: 'reduce' });
  // consent answered + promo dismissed, so overlays never cover the checks
  const cookies = [{ name: 'oet_cookie_consent', value: encodeURIComponent(JSON.stringify({ necessary: true, analytics: false })), url: BASE }];
  if (signedIn) cookies.push({ name: 'oet_signed_in', value: '1', url: BASE });
  await context.addCookies(cookies);
  await context.addInitScript(() => { try { sessionStorage.setItem('oetPromoPopupDismissedSession', '1'); } catch (e) {} });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/googletagmanager|google-analytics|favicon/.test(m.text())) errors.push(m.text()); });
  await page.goto(BASE + url, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  return { context, page, errors };
}

for (const width of WIDTHS) {
  for (const [name, url] of PAGES) {
    const { context, page, errors } = await open(width, url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) fail(`${name} @${width}: horizontal overflow ${overflow}px`);
    const header = await page.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? b : null; };
      const logo = r('.vl-logo img');
      const login = r('.vl-header-action-item .oet-header-login');
      const burger = r('.vl-header-action-item .vl-offcanvas-toggle');
      const nav = r('.vl-main-menu');
      const items = [...document.querySelectorAll('.vl-main-menu nav>ul>li>a')].map((a) => a.getBoundingClientRect());
      return {
        vw: document.documentElement.clientWidth,
        logoRight: logo && logo.right,
        login: login && { left: login.left, right: login.right, h: login.height },
        burger: burger && { right: burger.right, h: burger.height, w: burger.width },
        nav: !!nav,
        firstLeft: items[0] && items[0].left,
        lastRight: items.length ? Math.max(...items.map((b) => b.right)) : null,
        top: items[0] && items[0].top,
        sameRow: items.length ? items.every((b) => Math.abs((b.top + b.height / 2) - (items[0].top + items[0].height / 2)) < 4) : null,
        loginHref: document.querySelector('.oet-header-login').getAttribute('href'),
        loginText: document.querySelector('.oet-header-login').textContent.trim(),
        blogItem: [...document.querySelectorAll('.vl-main-menu nav>ul>li>a')].some((a) => a.getAttribute('href') === '/blog/' && a.textContent.trim() === 'OET Blog'),
      };
    });
    if (header.loginHref !== LOGIN) fail(`${name} @${width}: login link is ${header.loginHref}`);
    if (header.loginText !== 'Login / Register') fail(`${name} @${width}: login label is "${header.loginText}" (original: Login / Register)`);
    if (!header.blogItem) fail(`${name} @${width}: OET Blog item missing from the menu`);
    if (width >= 1500) {
      if (!header.nav) fail(`${name} @${width}: inline nav hidden`);
      else if (!(header.firstLeft >= header.logoRight) || !header.sameRow || header.lastRight > header.vw) fail(`${name} @${width}: inline nav does not fit (${JSON.stringify(header)})`);
    } else {
      if (header.nav) fail(`${name} @${width}: inline nav should be hidden below 1500px (original breakpoint)`);
      if (!header.login || !header.burger) fail(`${name} @${width}: login or menu button missing`);
      else {
        if (header.login.left < header.logoRight) fail(`${name} @${width}: login overlaps logo`);
        if (header.burger.right > header.vw) fail(`${name} @${width}: menu button off-screen`);
      }
    }
    if (takeShots && (!name.startsWith('article') || width === 390 || width === 1366)) {
      await page.screenshot({ path: path.join(SHOTS, `${name}-${width}.jpg`), type: 'jpeg', quality: 62 });
    }
    if (errors.length) fail(`${name} @${width}: console errors: ${errors.slice(0, 3).join(' | ')}`);
    await context.close();
  }
  ok(`${width}px: overflow, header fit and login link checked on ${PAGES.length} pages`);
}

// drawer behaviour (phone + small laptop): the original drawer, with OET Blog in its cloned menu
for (const width of [390, 1024]) {
  const { context, page } = await open(width, '/');
  const toggle = page.locator('.vl-header-action-item .vl-offcanvas-toggle');
  await toggle.click();
  await page.waitForTimeout(450);
  const state = await page.evaluate(() => ({
    open: document.querySelector('.vl-offcanvas').classList.contains('vl-offcanvas-open'),
    blog: !!document.querySelector('.vl-offcanvas nav a[href="/blog/"]'),
    community: [...document.querySelectorAll('.vl-offcanvas .vl-offcanvas-sm-title')].map((h) => h.textContent.trim()),
    contactRow: !!document.querySelector('.vl-offcanvas nav a[href="/contact.html"]'),
    tops: [...document.querySelectorAll('.vl-offcanvas nav>ul>li>a')].map((a) => a.textContent.trim().replace(/\s+/g, ' ')),
  }));
  if (!state.open) fail(`drawer @${width}: did not open`);
  if (!state.blog) fail(`drawer @${width}: OET Blog missing`);
  if (state.community.join('|') !== 'Support & Community|Follow the Journey') fail(`drawer @${width}: not the original drawer (${state.community.join(' / ')})`);
  if (state.contactRow) fail(`drawer @${width}: the standalone Contact row is still in the side menu`);
  if (takeShots) await page.screenshot({ path: path.join(SHOTS, `drawer-${width}.jpg`), type: 'jpeg', quality: 62 });
  await page.locator('.vl-offcanvas nav>ul>li.has-dropdown >> nth=0').locator(':scope > button.vl-menu-close').click();
  await page.waitForTimeout(400);
  const shown = await page.evaluate(() => getComputedStyle(document.querySelector('.vl-offcanvas nav>ul>li.has-dropdown > .sub-menu')).display !== 'none');
  if (!shown) fail(`drawer @${width}: submenu did not expand`);
  await page.locator('.vl-offcanvas-close .vl-offcanvas-toggle').click();
  await page.waitForTimeout(450);
  if (await page.evaluate(() => document.querySelector('.vl-offcanvas').classList.contains('vl-offcanvas-open'))) fail(`drawer @${width}: close button did not close`);
  ok(`drawer @${width}: ${state.tops.join(' / ')}`);
  await context.close();
}

// footer: the original footer re-grouped (28 Oct 2026): closed accordions on phones, open from 768px
for (const width of [390, 768, 1366]) {
  const { context, page } = await open(width, '/');
  const f = await page.evaluate(() => {
    const ft = document.querySelector('footer');
    const groups = [...ft.querySelectorAll('details.oet-footer-group')];
    return {
      titles: groups.map((g) => g.querySelector('h3').textContent.trim()),
      open: groups.map((g) => g.open),
      links: groups.map((g) => g.querySelectorAll('a[href]').length),
      app: ft.textContent.includes('Download Candidates App'),
      blog: !!ft.querySelector('a[href="/blog/"]'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  const wantOpen = width >= 768;
  if (f.titles.join('|') !== 'Courses & Practice|Resources & Guides|About & Support|Stay Connected' || f.open.some((o) => o !== wantOpen) || f.links.join(',') !== '7,9,8,3' || !f.app || !f.blog || f.overflow > 0)
    fail(`footer @${width}: not the grouped footer (${JSON.stringify(f)})`);
  if (takeShots) {
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.locator('footer').screenshot({ path: path.join(SHOTS, `footer-${width}.jpg`), type: 'jpeg', quality: 62 });
  }
  ok(`footer @${width}: ${f.titles.join(' / ')} (open: ${f.open.join(',')})`);
  await context.close();
}

// homepage OET Blog section (owner-approved as-is): lavender, 3 cards, View All Articles, before the FAQ
for (const width of [390, 1366]) {
  const { context, page } = await open(width, '/');
  const blog = await page.evaluate(() => {
    const s = document.querySelector('section.oet-home-blog');
    if (!s) return null;
    const faq = s.nextElementSibling && s.nextElementSibling.classList.contains('faq-theme-purple');
    return { bg: getComputedStyle(s).backgroundColor, cards: s.querySelectorAll('.oet-blog-card').length, all: !!s.querySelector('a[href="/blog/"]'), title: s.querySelector('h2').textContent.trim(), beforeFaq: faq };
  });
  if (!blog || blog.bg !== 'rgb(230, 224, 255)' || blog.cards !== 3 || !blog.all || blog.title !== 'Latest from the OET Blog' || !blog.beforeFaq) fail(`home blog @${width}: ${JSON.stringify(blog)}`);
  if (takeShots) {
    await page.locator('section.oet-home-blog').scrollIntoViewIfNeeded();
    await page.locator('section.oet-home-blog').screenshot({ path: path.join(SHOTS, `home-blog-${width}.jpg`), type: 'jpeg', quality: 70 });
  }
  ok(`home blog @${width}: ${blog && blog.cards} cards, lavender, before the FAQ`);
  await context.close();
}

// blog search
{
  const { context, page } = await open(390, '/blog/');
  const total = await page.locator('.oet-blog-section:not(.oet-blog-latest) .oet-blog-card').count();
  await page.fill('#oet-blog-search-input', 'part a');
  const res = await page.evaluate(() => ({
    visible: [...document.querySelectorAll('.oet-blog-section:not(.oet-blog-latest) .oet-blog-card')].filter((c) => !c.hidden).map((c) => c.querySelector('h3').textContent),
    status: document.getElementById('oet-blog-search-status').textContent,
  }));
  if (!res.visible.length || res.visible.length >= total) fail(`blog search: "part a" showed ${res.visible.length}/${total}`);
  await page.fill('#oet-blog-search-input', 'zzzz');
  if (await page.locator('.oet-blog-empty').isHidden()) fail('blog search: empty state not shown');
  ok(`blog search "part a": ${res.status} (${res.visible.join('; ')})`);
  await context.close();
}

// signed-in hint cookie retargets both CTAs to the dashboard; the label stays Login / Register
{
  const { context, page } = await open(390, '/');
  await context.addCookies([{ name: 'oet_signed_in', value: '1', url: BASE }]);
  await page.reload({ waitUntil: 'load' });
  const cta = await page.evaluate(() => [...document.querySelectorAll('a[data-dashboard-href]')].map((a) => [a.getAttribute('href'), a.textContent.trim()]));
  if (!cta.length || cta.some(([href, text]) => href !== 'https://app.oetwithdrhesham.co.uk/' || text !== 'Login / Register')) fail(`signed-in: CTA hrefs/labels ${JSON.stringify(cta)}`);
  ok(`signed-in hint: ${JSON.stringify(cta)}`);
  await context.close();
}

await browser.close();
if (failures) {
  console.error(`\nqa-redesign: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`\nqa-redesign: all checks passed${takeShots ? ` (screenshots in ${SHOTS})` : ''}`);
