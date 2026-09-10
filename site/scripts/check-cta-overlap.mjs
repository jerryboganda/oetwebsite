/**
 * §1 acceptance check — the promotional CTA image/card must never cover the
 * footer or any content below it, in any engine, at any width or orientation.
 *
 * Engine mapping (there are only two real engines to cover here):
 *   chromium → Google Chrome, Microsoft Edge (and other Blink browsers)
 *   webkit   → Apple Safari (iOS + macOS)
 *
 * Widths run from small phone up to large desktop; every width at or below the
 * site's phone breakpoint is checked in BOTH portrait and landscape, because
 * orientation changes the layout independently of width.
 *
 * Serves the repository root (the deployable webroot — the same files that ship)
 * over a throwaway local HTTP server, so this needs no running stack.
 *
 * Usage:  node scripts/check-cta-overlap.mjs [--root <dir>]
 */
import { chromium, webkit } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, '..', '..'); // site/scripts -> repo root

const rootArgIndex = process.argv.indexOf('--root');
const ROOT = rootArgIndex !== -1 ? resolve(process.argv[rootArgIndex + 1]) : DEFAULT_ROOT;
const PORT = Number(process.env.OVERLAP_PORT ?? 4321);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

const WIDTHS = [320, 360, 375, 390, 414, 430, 540, 768, 820, 1024, 1280, 1440, 1920];
const MOBILE_MAX = 767; // matches the site's phone breakpoint

const ENGINES = [
  { name: 'chromium (Chrome / Edge)', launcher: chromium },
  { name: 'webkit (Safari)', launcher: webkit },
];

/**
 * The element's *visible* rect: its layout rect intersected with every ancestor
 * that clips (overflow !== visible). style.min.css gives the CTA image a fixed
 * height inside an `overflow:hidden` wrapper, so the raw layout rect is taller
 * than what a user can actually see — comparing raw rects yields false positives.
 */
const MEASURE = `(selector) => {
  const el = document.querySelector(selector);
  if (!el) return null;
  let rect = el.getBoundingClientRect();
  let node = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (style.overflow !== 'visible' || style.overflowX !== 'visible' || style.overflowY !== 'visible') {
      const r = node.getBoundingClientRect();
      const top = Math.max(rect.top, r.top);
      const bottom = Math.min(rect.bottom, r.bottom);
      const left = Math.max(rect.left, r.left);
      const right = Math.min(rect.right, r.right);
      if (bottom <= top || right <= left) return { empty: true, top, bottom, left, right };
      rect = { top, bottom, left, right, height: bottom - top, width: right - left };
    }
    node = node.parentElement;
  }
  return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height, width: rect.width };
}`;

const server = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = join(ROOT, url);
    if (url.endsWith('/')) filePath = join(filePath, 'index.html');
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

const pages = (await readdir(ROOT)).filter((f) => f.endsWith('.html')).sort();

let checks = 0;
const failures = [];
const skips = [];

await new Promise((r) => server.listen(PORT, r));
console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}`);
console.log(`pages: ${pages.length}, engines: ${ENGINES.length}, widths: ${WIDTHS.length}\n`);

try {
  for (const engine of ENGINES) {
    const browser = await engine.launcher.launch();
    console.log(`── ${engine.name} ──`);

    for (const page of pages) {
      const context = await browser.newContext();
      const tab = await context.newPage();

      // Some pages redirect client-side; that destroys the execution context
      // mid-measurement. Record it and move on rather than aborting the sweep.
      let navigatedAway = false;
      tab.on('framenavigated', (frame) => {
        if (frame === tab.mainFrame() && !frame.url().endsWith(`/${page}`)) navigatedAway = true;
      });

      await tab.goto(`http://127.0.0.1:${PORT}/${page}`, { waitUntil: 'load' });
      await tab.waitForTimeout(120);

      if (navigatedAway) {
        skips.push(`${engine.name} ${page}: redirects on load`);
        await context.close();
        continue;
      }

      for (const width of WIDTHS) {
        const viewports =
          width <= MOBILE_MAX
            ? [
                ['portrait', { width, height: Math.max(640, Math.round(width * 1.9)) }],
                ['landscape', { width: Math.max(width, 640), height: width }],
              ]
            : [['desktop', { width, height: 900 }]];

        for (const [orientation, viewport] of viewports) {
          await tab.setViewportSize(viewport);
          await tab.waitForTimeout(60);

          let footer;
          let image;
          let ctaWrap;
          try {
            footer = await tab.evaluate(MEASURE, 'footer.vl-footer-10');
            image = await tab.evaluate(MEASURE, '.cta-wrap7 .cta-large-thumb-10 img');
            ctaWrap = await tab.evaluate(MEASURE, '.cta-wrap7');
          } catch (err) {
            failures.push(
              `${engine.name} ${page} ${width}px/${orientation}: measurement failed — ${err.message.split('\n')[0]}`,
            );
            continue;
          }
          checks += 1;

          if (!footer) {
            failures.push(`${engine.name} ${page} ${width}px/${orientation}: footer.vl-footer-10 not found`);
            continue;
          }
          if (!image) continue; // page has no promotional CTA banner

          // The banner must end at or above the footer's top edge — no intrusion.
          const gap = footer.top - image.bottom;
          if (gap < 0) {
            failures.push(
              `${engine.name} ${page} ${width}px/${orientation}: CTA image overlaps footer by ${(-gap).toFixed(1)}px ` +
                `(image bottom ${image.bottom.toFixed(1)}, footer top ${footer.top.toFixed(1)})`,
            );
          }
          if (ctaWrap && ctaWrap.bottom - footer.top > 0.5) {
            failures.push(
              `${engine.name} ${page} ${width}px/${orientation}: CTA section intrudes into footer by ` +
                `${(ctaWrap.bottom - footer.top).toFixed(1)}px`,
            );
          }
        }
      }
      await context.close();
    }
    await browser.close();
  }
} finally {
  server.close();
}

if (skips.length) {
  console.log(`skipped (redirect on load): ${skips.length}`);
  for (const s of skips) console.log('  - ' + s);
}

console.log(`\nchecks: ${checks}`);
if (failures.length === 0) {
  console.log('RESULT: PASS — no CTA/footer overlap in any engine, width or orientation.');
  process.exit(0);
}
console.log(`RESULT: FAIL — ${failures.length} problem(s):`);
for (const f of failures.slice(0, 40)) console.log('  - ' + f);
if (failures.length > 40) console.log(`  … and ${failures.length - 40} more`);
process.exit(1);
