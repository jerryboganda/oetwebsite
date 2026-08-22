import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('../src/partials/index/tail.html', import.meta.url), 'utf8');
const scriptMatch = source.match(/<script id="oet-promo-popup-script">([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'Promo popup script should exist in the homepage partial');

const script = scriptMatch[1];

test('promo popup auto-open is not blocked on mobile or tablet viewports', () => {
  assert.doesNotMatch(script, /if\s*\(\s*isMobileViewport\s*\(\s*\)\s*\)\s*return\s*;/);
});
