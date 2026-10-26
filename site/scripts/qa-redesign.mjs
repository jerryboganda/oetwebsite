/**
 * Acceptance QA for the 2026-10 UI + SEO redesign brief, in a real browser.
 * Needs the static site running (preview "website-static", node server.js on :8000)
 * and Google Chrome installed (Playwright channel "chrome", no browser download).
 *
 * Checks at 320/360/390/430/768/1024/1440 px (the brief's test widths):
 *   - no horizontal overflow on home, /blog/, an article and the practice hub
 *   - header: logo, CTA and menu fit; inline 6-item nav from 1200px
 *   - drawer: opens, locks scroll, lists the OET Blog + Start Free Practice,
 *     Escape and backdrop close it, focus returns to the menu button
 *   - footer: accordions on phones (OET Blog & Guides open), columns on desktop
 *   - blog search filters cards; login link + signed-in hint cookie still work
 *   - no console errors
 * Screenshots go to docs/qa/2026-10-redesign/ (viewport, JPEG).
 *
 * Usage (from site/):  node scripts/qa-redesign.mjs [--base http://localhost:8000] [--no-shots]
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.resolve(HERE, '..', '..', 'docs', 'qa', '2026-10-redesign');
const argBase = process.argv.indexOf('--base');
const BASE = argBase !== -1 ? process.argv[argBase + 1] : 'http://localhost:8000';
const takeShots = !process.argv.includes('--no-shots');
const WIDTHS = [320, 360, 390, 430, 768, 1024, 1440];
const PAGES = [
  ['home', '/'],
  ['blog', '/blog/'],
  ['article', '/oet-writing-referral-letter-structure.html'],
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
      };
    });
    if (header.loginHref !== LOGIN) fail(`${name} @${width}: login link is ${header.loginHref}`);
    if (width >= 1200) {
      if (!header.nav) fail(`${name} @${width}: inline nav hidden`);
      else if (!(header.firstLeft >= header.logoRight) || !header.sameRow || header.lastRight > header.vw) fail(`${name} @${width}: inline nav does not fit (${JSON.stringify(header)})`);
    } else {
      if (header.nav) fail(`${name} @${width}: inline nav should be hidden below 1200px`);
      if (!header.login || !header.burger) fail(`${name} @${width}: login or menu button missing`);
      else {
        if (header.login.left < header.logoRight) fail(`${name} @${width}: login overlaps logo`);
        if (header.burger.right > header.vw) fail(`${name} @${width}: menu button off-screen`);
        if (header.burger.h < 44 || header.login.h < 44) fail(`${name} @${width}: header tap target under 44px`);
      }
    }
    if (takeShots && (name !== 'article' || width === 390 || width === 1440)) {
      await page.screenshot({ path: path.join(SHOTS, `${name}-${width}.jpg`), type: 'jpeg', quality: 62 });
    }
    if (errors.length) fail(`${name} @${width}: console errors: ${errors.slice(0, 3).join(' | ')}`);
    await context.close();
  }
  ok(`${width}px: overflow, header fit and login link checked on ${PAGES.length} pages`);
}

// drawer behaviour (phone + small laptop)
for (const width of [390, 1024]) {
  const { context, page } = await open(width, '/');
  const toggle = page.locator('.vl-header-action-item .vl-offcanvas-toggle');
  await toggle.click();
  await page.waitForTimeout(450);
  const state = await page.evaluate(() => ({
    open: document.querySelector('.vl-offcanvas').classList.contains('vl-offcanvas-open'),
    locked: getComputedStyle(document.body).overflow === 'hidden',
    expanded: document.querySelector('.vl-header-action-item .vl-offcanvas-toggle').getAttribute('aria-expanded'),
    blog: !!document.querySelector('.vl-offcanvas nav a[href="/blog/"]'),
    practice: !!document.querySelector('.vl-offcanvas a[href="/oet-practice.html#free-practice"]'),
    login: !!document.querySelector('.vl-offcanvas nav a.oet-header-cta-btn'),
    tops: [...document.querySelectorAll('.vl-offcanvas nav>ul>li>a')].map((a) => a.textContent.trim().replace(/\s+/g, ' ')),
    focusInside: document.querySelector('.vl-offcanvas').contains(document.activeElement),
  }));
  if (!state.open || !state.locked || state.expanded !== 'true') fail(`drawer @${width}: did not open/lock (${JSON.stringify(state)})`);
  if (!state.blog || !state.practice || !state.login) fail(`drawer @${width}: missing OET Blog / Start Free Practice / Log in`);
  if (!state.focusInside) fail(`drawer @${width}: focus not moved into the drawer`);
  if (takeShots) await page.screenshot({ path: path.join(SHOTS, `drawer-${width}.jpg`), type: 'jpeg', quality: 62 });
  // submenu toggle
  await page.locator('.vl-offcanvas nav>ul>li.has-dropdown >> nth=0').locator(':scope > button.vl-menu-close').click();
  await page.waitForTimeout(400);
  const sub = await page.evaluate(() => {
    const li = document.querySelector('.vl-offcanvas nav>ul>li.has-dropdown');
    return { expanded: li.querySelector(':scope > button').getAttribute('aria-expanded'), shown: getComputedStyle(li.querySelector(':scope > .sub-menu')).display !== 'none' };
  });
  if (sub.expanded !== 'true' || !sub.shown) fail(`drawer @${width}: submenu did not expand`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(450);
  const closed = await page.evaluate(() => ({
    open: document.querySelector('.vl-offcanvas').classList.contains('vl-offcanvas-open'),
    focusBack: document.activeElement === document.querySelector('.vl-header-action-item .vl-offcanvas-toggle'),
  }));
  if (closed.open || !closed.focusBack) fail(`drawer @${width}: Escape did not close or return focus (${JSON.stringify(closed)})`);
  // phones: the drawer is full-width (no backdrop to tap); wider screens close on a backdrop click
  if (width >= 768) {
    await toggle.click();
    await page.waitForTimeout(450);
    await page.mouse.click(5, 400); // backdrop, left of the right-hand drawer
    await page.waitForTimeout(450);
    if (await page.evaluate(() => document.querySelector('.vl-offcanvas').classList.contains('vl-offcanvas-open'))) fail(`drawer @${width}: backdrop click did not close`);
  }
  ok(`drawer @${width}: ${state.tops.join(' / ')}`);
  await context.close();
}

// footer: accordions on phones, columns on desktop
for (const width of [390, 1440]) {
  const { context, page } = await open(width, '/');
  const read = () => page.evaluate(() => [...document.querySelectorAll('.oet-footer-group-toggle')].map((b) => ({
    label: b.textContent.trim(),
    expanded: b.getAttribute('aria-expanded'),
    shown: getComputedStyle(document.getElementById(b.getAttribute('aria-controls'))).display !== 'none',
    links: document.getElementById(b.getAttribute('aria-controls')).querySelectorAll('a').length,
  })));
  const groups = await read();
  if (groups.length !== 4) fail(`footer @${width}: ${groups.length} groups`);
  if (width < 992) {
    const wrong = groups.filter((g) => (g.label === 'OET Blog & Guides') !== (g.expanded === 'true') || (g.expanded === 'true') !== g.shown);
    if (wrong.length) fail(`footer @${width}: initial accordion state wrong ${JSON.stringify(wrong)}`);
    await page.locator('.oet-footer-group-toggle').first().click();
    const after = await read();
    if (after[0].expanded !== 'true' || !after[0].shown) fail(`footer @${width}: first group did not open`);
    if (takeShots) {
      await page.locator('footer').scrollIntoViewIfNeeded();
      await page.locator('footer').screenshot({ path: path.join(SHOTS, `footer-${width}.jpg`), type: 'jpeg', quality: 62 });
    }
  } else {
    if (groups.some((g) => g.expanded !== 'true' || !g.shown)) fail(`footer @${width}: all columns should be open ${JSON.stringify(groups)}`);
    if (takeShots) {
      await page.locator('footer').scrollIntoViewIfNeeded();
      await page.locator('footer').screenshot({ path: path.join(SHOTS, `footer-${width}.jpg`), type: 'jpeg', quality: 62 });
    }
  }
  ok(`footer @${width}: ${groups.map((g) => `${g.label} (${g.links})`).join(', ')}`);
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

// signed-in hint cookie swaps both CTAs to the dashboard
{
  const { context, page } = await open(390, '/');
  await context.addCookies([{ name: 'oet_signed_in', value: '1', url: BASE }]);
  await page.reload({ waitUntil: 'load' });
  const cta = await page.evaluate(() => [...document.querySelectorAll('a[data-dashboard-href]')].map((a) => [a.getAttribute('href'), a.innerText.trim()]));
  if (!cta.length || cta.some(([href]) => href !== 'https://app.oetwithdrhesham.co.uk/')) fail(`signed-in: CTA hrefs ${JSON.stringify(cta)}`);
  ok(`signed-in hint: ${JSON.stringify(cta)}`);
  await context.close();
}

await browser.close();
if (failures) {
  console.error(`\nqa-redesign: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`\nqa-redesign: all checks passed${takeShots ? ` (screenshots in ${SHOTS})` : ''}`);
