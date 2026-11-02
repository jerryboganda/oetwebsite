// Entity data for Dr Ahmed Hesham (Person #drhesham) and OET with Dr Hesham (Organization #organization).
// src/data/person.json is the single source: every typed node with one of those @ids, on every page, is rebuilt
// from it at build (applyEntityNodes, called by src/lib/page.mjs from layouts/Base.astro), so AI assistants and
// search engines see ONE consistent entity instead of the per-page stubs that used to disagree ("since 2020" vs the
// 2018 timeline). Used by Base.astro, scripts/postbuild.mjs (llms.txt) and scripts/verify.mjs. Paths resolve from
// the site/ folder (npm run build and the verify scripts both run there), like blog.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const SITE = process.cwd();
const DATA = path.join(SITE, 'src', 'data', 'person.json');

let cached;
export function loadPerson() {
  if (!cached) {
    const p = JSON.parse(fs.readFileSync(DATA, 'utf8'));
    if (!Number.isInteger(p.coachingSince)) throw new Error('person.json: coachingSince must be a year');
    cached = p;
  }
  return cached;
}

// The "N+ years" counters are derived, never typed. The reference year is the date of the HEAD commit (not the
// wall clock), so a build is reproducible: CI rebuilding an old commit gets the same numbers as the committed root.
let year;
export function buildYear() {
  if (year === undefined) {
    try {
      year = Number(execSync('git log -1 --format=%cs', { cwd: SITE, encoding: 'utf8' }).trim().slice(0, 4));
    } catch { /* fall through */ }
    if (!Number.isInteger(year) || year < 2026) year = 2026;
  }
  return year;
}

/** Completed years of coaching (true whatever month coaching began). */
export function yearsCoaching(p = loadPerson()) {
  return buildYear() - p.coachingSince - 1;
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
export const numberWord = (n) => WORDS[n] ?? String(n);

export function personDescription(p = loadPerson()) {
  return `Medical doctor and OET educator who has coached thousands of doctors and nurses to OET success since ${p.coachingSince}.`;
}

/** The full Person node. Empty credential slots are left out, never invented. */
export function personNode(p = loadPerson()) {
  const node = {
    '@type': 'Person',
    '@id': p.id,
    name: p.name,
    honorificPrefix: p.honorificPrefix,
    jobTitle: p.jobTitle,
    description: personDescription(p),
    url: p.url,
    image: p.image,
    worksFor: { '@id': p.organization.id },
    knowsAbout: p.knowsAbout,
    knowsLanguage: p.knowsLanguage,
    sameAs: p.sameAs,
  };
  if (p.alumniOf) node.alumniOf = p.alumniOf;
  if (p.hasCredential && p.hasCredential.length) node.hasCredential = p.hasCredential;
  if (p.identifier) node.identifier = p.identifier;
  return node;
}

export function organizationNode(p = loadPerson()) {
  const o = p.organization;
  return {
    '@type': 'EducationalOrganization',
    '@id': o.id,
    name: o.name,
    url: o.url,
    logo: { '@type': 'ImageObject', url: o.logo, width: o.logoWidth, height: o.logoHeight },
    email: o.email,
    telephone: o.telephone,
    founder: { '@id': p.id },
    knowsLanguage: o.knowsLanguage,
    sameAs: o.sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: o.telephone,
      email: o.email,
      availableLanguage: ['English', 'Arabic'],
    },
  };
}

/** Visible author box (`<!--oet:author-box-->`). Credentials appear automatically once person.json has them. */
export function authorBox(p = loadPerson()) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const extra = [];
  if (p.alumniOf) extra.push(`Graduate of ${esc(typeof p.alumniOf === 'string' ? p.alumniOf : p.alumniOf.name)}.`);
  for (const c of p.hasCredential || []) extra.push(`${esc(typeof c === 'string' ? c : c.name)}.`);
  return `<section class="oet-resource-section oet-author-bio" aria-label="About the author"><div class="container"><div class="oet-snippet"><strong>About the author</strong><p>${esc(p.name)} is a medical doctor and OET educator who has coached doctors, nurses and allied health professionals preparing for OET since ${p.coachingSince}.${extra.length ? ' ' + extra.join(' ') : ''} <a href="/about.html">More about Dr Hesham</a>.</p></div></div></section>`;
}

const LD = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g;
const typed = (n) => n && typeof n === 'object' && !Array.isArray(n) && n['@type'];

/**
 * Rewrite the JSON-LD blocks of a page. `fn(data)` returns the new data; a block is re-serialised only when it
 * changed (everything else stays byte for byte). Blocks for which `want(body)` is false are skipped unparsed.
 */
export function rewriteJsonLd(parts, fn, want = () => true) {
  const out = {};
  for (const [k, html] of Object.entries(parts)) {
    out[k] = html.replace(LD, (all, open, body, close) => {
      if (!want(body)) return all;
      let data;
      try { data = JSON.parse(body); } catch { return all; } // verify.mjs reports invalid JSON-LD
      const before = JSON.stringify(data, null, 2);
      const next = JSON.stringify(fn(data), null, 2);
      if (next === before) return all;
      return `${open}\n${next.replace(/</g, '\\u003c')}\n    ${close}`;
    });
  }
  return out;
}

/** Depth-first map over a JSON-LD value: `fn(node)` may return a replacement object (children are not revisited). */
export function mapNodes(node, fn) {
  if (Array.isArray(node)) return node.map((n) => mapNodes(n, fn));
  if (!node || typeof node !== 'object') return node;
  const hit = fn(node);
  if (hit !== undefined) return hit;
  return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, mapNodes(v, fn)]));
}

/**
 * Rebuild every TYPED node whose @id is #drhesham or #organization from person.json (bare {"@id": …} references stay
 * references). Only JSON-LD blocks that hold such a node are re-serialised; everything else is left byte for byte.
 */
export function applyEntityNodes(parts, p = loadPerson()) {
  const person = personNode(p);
  const org = organizationNode(p);
  const withCtx = (node, full) => (node['@context'] ? { '@context': node['@context'], ...full } : { ...full });
  return rewriteJsonLd(parts, (data) => mapNodes(data, (node) => {
    if (typed(node) && node['@id'] === p.id) return withCtx(node, person);
    if (typed(node) && node['@id'] === p.organization.id) return withCtx(node, org);
    return undefined;
  }), (body) => body.includes(p.id) || body.includes(p.organization.id));
}
