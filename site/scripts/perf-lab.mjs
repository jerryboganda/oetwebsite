// Repeatable mobile lab runs for the pages the 22 Nov 2026 brief names (docs/seo-brief-2026-11-22.md, section 6): Playwright + Chrome with
// DevTools throttling (150 ms RTT, 1.6 Mbps down, 4x CPU), cold cache, three runs per URL. Harsher than Lighthouse's simulated Slow 4G
// on purpose; compare like with like (before/after on the same machine). Field data (CrUX / Search Console) stays the real judge.
// Usage (from site/):  node scripts/perf-lab.mjs [--base https://oetwithdrhesham.co.uk] [--out perf.json]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const arg = (k, d) => (process.argv.indexOf(k) !== -1 ? process.argv[process.argv.indexOf(k) + 1] : d);
const BASE = arg('--base', 'https://oetwithdrhesham.co.uk');
const OUT = arg('--out', null);
const URLS = ['/', '/ar/oet-course-egypt.html', '/pricing.html', '/oet-course-for-nurses.html'].map((u) => BASE + u);
const browser = await chromium.launch({ channel: 'chrome' });
const rows = [];
for (const url of URLS) {
  for (let run = 1; run <= 3; run++) {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.__m = { lcp: 0, lcpEl: '', cls: 0, tbt: 0, fcp: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__m.lcp = e.startTime; window.__m.lcpEl = (e.element ? e.element.tagName + '.' + (e.element.className || '').toString().slice(0, 60) + (e.url ? ' ' + e.url.split('/').pop().slice(0, 50) : '') : ''); } }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.tbt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
    });
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(5000);
    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const res = performance.getEntriesByType('resource');
      const bytes = (nav.transferSize || 0) + res.reduce((s, r) => s + (r.transferSize || 0), 0);
      return { ...window.__m, ttfb: nav.responseStart, load: nav.loadEventEnd, htmlBytes: nav.decodedBodySize, transfer: bytes, requests: res.length + 1, scripts: res.filter((r) => r.initiatorType === 'script').length };
    });
    rows.push({ url, run, ...m, wall: Date.now() - t0 });
    console.log(JSON.stringify({ url: url.replace(BASE, ''), run, lcp: Math.round(m.lcp), fcp: Math.round(m.fcp), cls: m.cls.toFixed(3), tbt: Math.round(m.tbt), ttfb: Math.round(m.ttfb), kb: Math.round(m.transfer / 1024), html: Math.round(m.htmlBytes / 1024), lcpEl: m.lcpEl }));
    await ctx.close();
  }
}
await browser.close();
if (OUT) fs.writeFileSync(OUT, JSON.stringify(rows, null, 2));
console.log('done');
