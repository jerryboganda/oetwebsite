import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

// the popup script is an external deferred file (it used to be inline in the homepage tail partial; SEO brief 21 Nov 2026)
const tail = readFileSync(new URL('../src/partials/index/tail.html', import.meta.url), 'utf8');
assert.ok(tail.includes('<script defer src="/assets/js/oet-promo-popup.js"></script>'), 'The homepage tail should load the promo popup script');
const script = readFileSync(new URL('../../assets/js/oet-promo-popup.js', import.meta.url), 'utf8');
assert.ok(script.includes("getElementById('oet-promo-popup')"), 'Promo popup script should drive #oet-promo-popup');
const mobileCss = readFileSync(new URL('../../assets/css/oet-mobile.css', import.meta.url), 'utf8');

test('promo popup auto-open is not blocked on mobile or tablet viewports', () => {
  assert.doesNotMatch(script, /if\s*\(\s*isMobileViewport\s*\(\s*\)\s*\)\s*return\s*;/);
});

test('promo popup stays centered on mobile instead of bottom-sheet layout', () => {
  assert.doesNotMatch(mobileCss, /\.oet-promo-popup\s*\{\s*padding:\s*0;\s*align-items:\s*flex-end;/s);
  assert.doesNotMatch(mobileCss, /\.oet-promo-popup__dialog\s*\{\s*width:\s*100%;\s*max-width:\s*100%;\s*max-height:\s*min\(88dvh,100dvh\);\s*border-radius:\s*22px\s*22px\s*0\s*0;/s);
});
