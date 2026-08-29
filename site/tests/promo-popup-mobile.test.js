import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../src/partials/index/tail.html', import.meta.url), 'utf8');
const scriptMatch = source.match(/<script id="oet-promo-popup-script">([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'Promo popup script should exist in the homepage partial');

const script = scriptMatch[1];
const mobileCss = readFileSync(new URL('../../assets/css/oet-mobile.css', import.meta.url), 'utf8');

test('promo popup auto-open is not blocked on mobile or tablet viewports', () => {
  assert.doesNotMatch(script, /if\s*\(\s*isMobileViewport\s*\(\s*\)\s*\)\s*return\s*;/);
});

test('promo popup stays centered on mobile instead of bottom-sheet layout', () => {
  assert.doesNotMatch(mobileCss, /\.oet-promo-popup\s*\{\s*padding:\s*0;\s*align-items:\s*flex-end;/s);
  assert.doesNotMatch(mobileCss, /\.oet-promo-popup__dialog\s*\{\s*width:\s*100%;\s*max-width:\s*100%;\s*max-height:\s*min\(88dvh,100dvh\);\s*border-radius:\s*22px\s*22px\s*0\s*0;/s);
});
