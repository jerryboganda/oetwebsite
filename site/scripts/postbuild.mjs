// Post-build pipeline:
//   1. add content-hash ?v= cache busters to /assets/css|js refs in dist HTML
//   2. regenerate sitemap.xml (lastmod = last git commit touching the page's partials)
//   3. copy dist HTML (+ sitemap) onto the repo root, which is the deployable webroot
//      (assets/, PHP endpoints, .htaccess, robots.txt, login.html live there already)
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ROOT = path.dirname(SITE);
const DIST = path.join(SITE, 'dist');

const PAGES = [
  // [dist-relative html, site URL path or null (not in sitemap), changefreq, priority]
  ['index.html', '/', 'weekly', '1.0'],
  ['pricing.html', '/pricing.html', 'weekly', '0.9'],
  ['success-stories.html', '/success-stories.html', 'weekly', '0.9'],
  ['service.html', '/service.html', 'weekly', '0.9'],
  ['oet-course-for-nurses.html', '/oet-course-for-nurses.html', 'monthly', '0.9'],
  ['oet-course-for-doctors.html', '/oet-course-for-doctors.html', 'monthly', '0.9'],
  ['oet-writing-correction.html', '/oet-writing-correction.html', 'monthly', '0.9'],
  ['oet-score-calculator.html', '/oet-score-calculator.html', 'monthly', '0.8'],
  ['oet-score-requirements.html', '/oet-score-requirements.html', 'monthly', '0.8'],
  ['oet-test-dates-and-fees.html', '/oet-test-dates-and-fees.html', 'monthly', '0.8'],
  ['oet-vs-ielts.html', '/oet-vs-ielts.html', 'monthly', '0.8'],
  ['oet-for-ecfmg.html', '/oet-for-ecfmg.html', 'monthly', '0.8'],
  ['oet-writing-sample-nursing.html', '/oet-writing-sample-nursing.html', 'monthly', '0.8'],
  ['oet-writing-sample-medicine.html', '/oet-writing-sample-medicine.html', 'monthly', '0.8'],
  ['oet-writing-sample-pharmacy.html', '/oet-writing-sample-pharmacy.html', 'monthly', '0.8'],
  ['oet-writing-sample-physiotherapy.html', '/oet-writing-sample-physiotherapy.html', 'monthly', '0.8'],
  ['oet-writing-sample-nursing-transfer.html', '/oet-writing-sample-nursing-transfer.html', 'monthly', '0.8'],
  ['oet-speaking-role-play-nursing.html', '/oet-speaking-role-play-nursing.html', 'monthly', '0.8'],
  ['oet-speaking-role-play-medicine.html', '/oet-speaking-role-play-medicine.html', 'monthly', '0.8'],
  ['ar/index.html', '/ar/', 'monthly', '0.8'],
  ['ar/oet-course-for-nurses.html', '/ar/oet-course-for-nurses.html', 'monthly', '0.8'],
  ['ar/oet-course-for-doctors.html', '/ar/oet-course-for-doctors.html', 'monthly', '0.8'],
  ['oet-course-for-pharmacists.html', '/oet-course-for-pharmacists.html', 'monthly', '0.9'],
  ['oet-course-for-physiotherapists.html', '/oet-course-for-physiotherapists.html', 'monthly', '0.9'],
  ['oet-speaking-role-play-pharmacy.html', '/oet-speaking-role-play-pharmacy.html', 'monthly', '0.8'],
  ['oet-speaking-role-play-physiotherapy.html', '/oet-speaking-role-play-physiotherapy.html', 'monthly', '0.8'],
  ['ar/oet-score-requirements.html', '/ar/oet-score-requirements.html', 'monthly', '0.8'],
  ['ar/oet-test-dates-and-fees.html', '/ar/oet-test-dates-and-fees.html', 'monthly', '0.8'],
  ['oet-sample-tests.html', '/oet-sample-tests.html', 'monthly', '0.9'],
  ['oet-for-allied-health.html', '/oet-for-allied-health.html', 'monthly', '0.9'],
  ['ar/oet-vs-ielts.html', '/ar/oet-vs-ielts.html', 'monthly', '0.8'],
  ['ar/oet-writing-tips.html', '/ar/oet-writing-tips.html', 'monthly', '0.8'],
  ['oet-writing-sample-nursing-referral.html', '/oet-writing-sample-nursing-referral.html', 'monthly', '0.8'],
  ['oet-writing-sample-medicine-discharge.html', '/oet-writing-sample-medicine-discharge.html', 'monthly', '0.8'],
  ['oet-writing-sample-occupational-therapy.html', '/oet-writing-sample-occupational-therapy.html', 'monthly', '0.8'],
  ['ar/oet-speaking-tips.html', '/ar/oet-speaking-tips.html', 'monthly', '0.8'],
  ['ar/oet-sample-tests.html', '/ar/oet-sample-tests.html', 'monthly', '0.8'],
  ['about.html', '/about.html', 'monthly', '0.8'],
  ['contact.html', '/contact.html', 'monthly', '0.8'],
  ['faq.html', '/faq.html', 'monthly', '0.8'],
  ['oet-tips.html', '/oet-tips.html', 'weekly', '0.8'],
  ['oet-writing-tips.html', '/oet-writing-tips.html', 'monthly', '0.7'],
  ['oet-speaking-tips.html', '/oet-speaking-tips.html', 'monthly', '0.7'],
  ['oet-listening-tips.html', '/oet-listening-tips.html', 'monthly', '0.7'],
  ['oet-reading-tips.html', '/oet-reading-tips.html', 'monthly', '0.7'],
  ['oet-materials-support.html', '/oet-materials-support.html', 'monthly', '0.7'],
  ['uk-pathway-guide.html', '/uk-pathway-guide.html', 'monthly', '0.7'],
  ['usa-pathway-guide.html', '/usa-pathway-guide.html', 'monthly', '0.7'],
  ['australia-pathway-guide.html', '/australia-pathway-guide.html', 'monthly', '0.7'],
  ['gulf-pathway-guide.html', '/gulf-pathway-guide.html', 'monthly', '0.7'],
  ['teaching-approach.html', '/teaching-approach.html', 'monthly', '0.7'],
  ['english-placement-test.html', '/english-placement-test', 'weekly', '0.8'],
  ['privacy/index.html', '/privacy/', 'yearly', '0.3'],
  ['terms/index.html', '/terms/', 'yearly', '0.3'],
  ['refund-policy/index.html', '/refund-policy/', 'yearly', '0.3'],
  ['cookie-policy/index.html', '/cookie-policy/', 'yearly', '0.3'],
  ['blog/index.html', '/blog/', 'weekly', '0.9'],
  ['oet-practice.html', '/oet-practice.html', 'monthly', '0.9'],
  ['oet-writing-referral-letter-structure.html', '/oet-writing-referral-letter-structure.html', 'monthly', '0.7'],
  ['oet-writing-physiotherapy-referral-vs-discharge.html', '/oet-writing-physiotherapy-referral-vs-discharge.html', 'monthly', '0.7'],
  ['oet-reading-part-a-scanning.html', '/oet-reading-part-a-scanning.html', 'monthly', '0.7'],
  ['oet-reading-part-c-inference.html', '/oet-reading-part-c-inference.html', 'monthly', '0.7'],
  ['oet-listening-part-a-note-taking.html', '/oet-listening-part-a-note-taking.html', 'monthly', '0.7'],
  ['oet-speaking-empathy-signposting.html', '/oet-speaking-empathy-signposting.html', 'monthly', '0.7'],
  ['oet-computer-vs-paper.html', '/oet-computer-vs-paper.html', 'monthly', '0.7'],
  ['oet-mock-test.html', '/oet-mock-test.html', 'monthly', '0.9'],
  ['oet-speaking-practice-online.html', '/oet-speaking-practice-online.html', 'monthly', '0.9'],
  ['oet-course-for-dentists.html', '/oet-course-for-dentists.html', 'monthly', '0.9'],
  ['oet-vs-pte.html', '/oet-vs-pte.html', 'monthly', '0.8'],
  ['oet-study-plan.html', '/oet-study-plan.html', 'monthly', '0.8'],
  ['oet-reading-part-b-workplace-texts.html', '/oet-reading-part-b-workplace-texts.html', 'monthly', '0.7'],
  ['oet-listening-parts-b-c.html', '/oet-listening-parts-b-c.html', 'monthly', '0.7'],
  ['oet-writing-nursing-discharge-letter.html', '/oet-writing-nursing-discharge-letter.html', 'monthly', '0.7'],
  ['oet-speaking-angry-anxious-patient.html', '/oet-speaking-angry-anxious-patient.html', 'monthly', '0.7'],
  ['oet-retake-after-near-miss.html', '/oet-retake-after-near-miss.html', 'monthly', '0.7'],
  ['ar/oet-course-for-pharmacists.html', '/ar/oet-course-for-pharmacists.html', 'monthly', '0.8'],
  ['ar/oet-course-for-physiotherapists.html', '/ar/oet-course-for-physiotherapists.html', 'monthly', '0.8'],
  ['ar/gulf-pathway-guide.html', '/ar/gulf-pathway-guide.html', 'monthly', '0.7'],
  ['what-is-oet.html', '/what-is-oet.html', 'monthly', '0.9'],
  ['oet-exam-fees.html', '/oet-exam-fees.html', 'monthly', '0.9'],
  ['oet-cancellation-refund-policy.html', '/oet-cancellation-refund-policy.html', 'monthly', '0.8'],
  ['oet-passing-score.html', '/oet-passing-score.html', 'monthly', '0.9'],
  ['oet-writing-samples.html', '/oet-writing-samples.html', 'monthly', '0.9'],
  ['oet-speaking-role-play-cards.html', '/oet-speaking-role-play-cards.html', 'monthly', '0.9'],
  ['ar/what-is-oet.html', '/ar/what-is-oet.html', 'monthly', '0.8'],
  ['ar/oet-exam-fees.html', '/ar/oet-exam-fees.html', 'monthly', '0.8'],
  ['ar/oet-passing-score.html', '/ar/oet-passing-score.html', 'monthly', '0.8'],
  ['404.html', null, null, null],
];

const ORIGIN = 'https://oetwithdrhesham.co.uk';

// --- 1. cache busting -------------------------------------------------------
const hashCache = new Map();
function assetHash(assetPath) {
  if (!hashCache.has(assetPath)) {
    const file = path.join(ROOT, assetPath.replace(/^\//, ''));
    if (!fs.existsSync(file)) throw new Error(`hash: missing asset ${assetPath}`);
    // Hash EOL-normalized content: assets are stored LF in git but Windows
    // working copies are CRLF (core.autocrlf), so raw bytes would yield a
    // platform-dependent hash and fail --check-root on the runner.
    const content = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
    hashCache.set(assetPath, createHash('md5').update(content).digest('hex').slice(0, 10));
  }
  return hashCache.get(assetPath);
}

function addHashes(html, name) {
  let count = 0;
  const out = html.replace(
    /(href|src)="(\/assets\/(?:css|js)\/[^"?]+\.(?:css|js))(\?[^"]*)?"/g,
    (_, attr, asset) => {
      count += 1;
      return `${attr}="${asset}?v=${assetHash(asset)}"`;
    },
  );
  if (count === 0) throw new Error(`hash: no css/js refs found in ${name}`);
  return out;
}

// --- 1b. WhatsApp prefill ----------------------------------------------------
// Give every bare wa.me link a friendly default message. No technical labels are added
// to what the candidate sends: the source page is recorded by oet-analytics.js
// (whatsapp_click, page) instead. Idempotent: --check-root re-runs this on dist, and any
// legacy " [page: …]" suffix is stripped.
const WA_DEFAULT_TEXT = "Hi Dr Hesham, I'm interested in OET preparation.";
function prefillWhatsApp(html) {
  return html.replace(/href="https:\/\/wa\.me\/447961725989(?:\?text=([^"]*))?"/g, (_, text) => {
    const base = text ? decodeURIComponent(text).replace(/ \[page: [^\]]*\]$/, '') : WA_DEFAULT_TEXT;
    return `href="https://wa.me/447961725989?text=${encodeURIComponent(base)}"`;
  });
}

// --- 2. sitemap --------------------------------------------------------------
function lastmodFor(distRel) {
  const key = distRel === '404.html' ? '404' : distRel.replace(/\/index\.html$|\.html$/, '');
  // The blog index has no partials: pages/blog/index.astro generates it from blog.json.
  const partials = key === 'blog'
    ? path.join(SITE, 'src', 'pages', 'blog')
    : path.join(SITE, 'src', 'partials', key);
  // Visible prices on pricing.html come from the data file, not the partials;
  // the blog index and the homepage "Latest from the OET Blog" cards come from blog.json.
  // The Full / Crash Course tiers (pricing.html and the five profession course pages) come from bundles.json
  // and are rendered by assets/js/oet-bundles.js.
  const bundles = [path.join(SITE, 'src', 'data', 'bundles.json'), path.join(ROOT, 'assets', 'js', 'oet-bundles.js')];
  const extra = {
    pricing: [path.join(SITE, 'src', 'data', 'pricing.json'), ...bundles],
    'oet-course-for-doctors': bundles,
    'oet-course-for-nurses': bundles,
    'oet-course-for-pharmacists': bundles,
    'oet-course-for-physiotherapists': bundles,
    'oet-for-allied-health': bundles,
    blog: [path.join(SITE, 'src', 'data', 'blog.json')],
    index: [path.join(SITE, 'src', 'data', 'blog.json')],
  }[key] || [];
  const sources = [partials, ...extra]
    .map((p) => `"${path.relative(ROOT, p)}"`).join(' ');
  try {
    // Uncommitted source edits ship with this build, so the page changes today.
    if (execSync(`git status --porcelain -- ${sources}`, { cwd: ROOT, encoding: 'utf8' }).trim()) {
      return new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD, like git's %cs
    }
    const out = execSync(`git log -1 --format=%cs -- ${sources}`, {
      cwd: ROOT, encoding: 'utf8',
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
  } catch { /* fall through */ }
  const files = fs.readdirSync(partials).map((f) => fs.statSync(path.join(partials, f)).mtime);
  return new Date(Math.max(...files)).toISOString().slice(0, 10);
}

function buildSitemap() {
  const rows = PAGES.filter(([, url]) => url).map(([rel, url, freq, prio]) =>
    `  <url><loc>${ORIGIN}${url}</loc><lastmod>${lastmodFor(rel)}</lastmod>` +
    `<changefreq>${freq}</changefreq><priority>${prio}</priority></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

// --- 2b. page text shared by the search index, llms.txt and llms-full.txt ------
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', middot: '·', pound: '£', hellip: '…' };
const plain = (s) => s.replace(/<[^>]+>/g, ' ')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, e) => ENTITIES[e] ?? m)
  .replace(/\s+/g, ' ').trim();

/** Every sitemap page as text: {rel, url, title, desc, headings, mainText} (read from the built, hashed dist HTML). */
function pageEntries() {
  return PAGES.filter(([, url]) => url).map(([rel, url]) => {
    const html = fs.readFileSync(path.join(DIST, rel), 'utf8');
    const main = (html.match(/<main[\s\S]*<\/main>/) || [''])[0];
    const body = main
      .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<nav\b[\s\S]*?<\/nav>/g, ' ') // breadcrumbs and in-page contents
      .replace(/<section class="oet-related[\s\S]*?<\/section>/g, ' ') // link lists
      // block ends become line breaks so the text keeps its paragraphs
      .replace(/<\/(p|h[1-6]|li|tr|div|section|article|blockquote|dt|dd)>/g, '$&\n');
    return {
      rel,
      url,
      title: plain((html.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]),
      desc: plain((html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1]),
      headings: [...main.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/g)].map((m) => plain(m[1])).filter(Boolean).slice(0, 14),
      mainText: body.split('\n').map(plain).filter(Boolean).join('\n'),
    };
  });
}

function buildSearchIndex(entries) {
  return entries.map((e) => ({ u: e.url, t: e.title, d: e.desc, h: e.headings }));
}

// --- 2c. AI-search discovery: llms.txt, llms-full.txt (llmstxt.org) and the Atom feed ---------------------------
// Curated groups for llms.txt. Blog posts are grouped by their blog.json category; everything else is listed here.
// Every sitemap URL must appear exactly once (the build fails otherwise), so a new page cannot be forgotten.
const LLMS_GROUPS = [
  ['Start here', ['/', '/about.html', '/teaching-approach.html', '/success-stories.html', '/service.html', '/pricing.html', '/faq.html', '/contact.html']],
  ['OET courses and services', ['/oet-course-for-doctors.html', '/oet-course-for-nurses.html', '/oet-course-for-pharmacists.html', '/oet-course-for-physiotherapists.html',
    '/oet-course-for-dentists.html', '/oet-for-allied-health.html', '/oet-writing-correction.html', '/oet-speaking-practice-online.html', '/oet-mock-test.html']],
  ['Free practice and tools', ['/oet-practice.html', '/english-placement-test', '/oet-sample-tests.html', '/oet-materials-support.html', '/oet-score-calculator.html', '/oet-tips.html', '/blog/']],
  // blog.json categories are inserted here, in their blog.json order
  ['Arabic pages (العربية)', null], // every /ar/ URL
  ['Legal', ['/terms/', '/privacy/', '/refund-policy/', '/cookie-policy/']],
];
const CATEGORY_TITLES = { 'exam-format': 'Exam format, fees and comparisons', pathways: 'Registration pathways and score requirements' };

async function llmsContext() {
  const { loadBlog } = await import('../src/lib/blog.mjs');
  const { loadPerson, yearsCoaching } = await import('../src/lib/schema.mjs');
  const read = (f) => JSON.parse(fs.readFileSync(path.join(SITE, 'src', 'data', f), 'utf8'));
  const stories = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'img', 'success-stories', 'success-stories.json'), 'utf8'));
  return { blog: loadBlog(), person: loadPerson(), years: yearsCoaching(), pricing: read('pricing.json'), bundles: read('bundles.json'), stories: stories.length };
}

function buildLlms(entries, ctx) {
  const byUrl = new Map(entries.map((e) => [e.url, e]));
  const groups = [];
  for (const [title, urls] of LLMS_GROUPS) {
    if (title === 'Arabic pages (العربية)') {
      for (const c of ctx.blog.categories) {
        groups.push([CATEGORY_TITLES[c.id] || `OET ${c.label} guides`, ctx.blog.posts.filter((p) => p.category === c.id).map((p) => p.url)]);
      }
      groups.push([title, entries.map((e) => e.url).filter((u) => u.startsWith('/ar/'))]);
    } else groups.push([title, urls]);
  }
  const seen = new Map();
  for (const [title, urls] of groups) for (const u of urls) {
    if (!byUrl.has(u)) throw new Error(`llms.txt: ${u} (group "${title}") is not a sitemap page`);
    if (seen.has(u)) throw new Error(`llms.txt: ${u} listed twice ("${seen.get(u)}" and "${title}")`);
    seen.set(u, title);
  }
  const missing = entries.filter((e) => !seen.has(e.url)).map((e) => e.url);
  if (missing.length) throw new Error(`llms.txt: add these pages to LLMS_GROUPS in postbuild.mjs: ${missing.join(', ')}`);

  const { person, bundles, pricing } = ctx;
  const gbp = (n) => `£${n}`;
  const tier = (key) => bundles.families.flatMap((f) => f.tiers).find((t) => t.key === key);
  const pkg = (k) => pricing.find((c) => c.kicker === k);
  const full = ['full-practice', 'full-tutorbook', 'ultimate'].map(tier);
  const crash = ['crash-essential', 'crash-letters', 'crash-complete'].map(tier);
  const profs = bundles.professions.map((p) => p.label).join(', ');
  const lines = [
    '# OET with Dr Hesham',
    '',
    `> Online OET (Occupational English Test) preparation for doctors, nurses, pharmacists, physiotherapists, dentists and other allied health professionals, led by ${person.name}, a medical doctor and OET educator coaching OET candidates since ${person.coachingSince}. Recorded courses, personally assessed Writing letters, private Speaking sessions and timed website practice for Paper-Based and Computer-Based OET, in English with Arabic support.`,
    '',
    'Key facts:',
    `- Provider: OET with Dr Hesham (${ORIGIN}/), an online OET coaching service; learner app: https://app.oetwithdrhesham.co.uk/.`,
    `- Founder and lead teacher: ${person.name} (${person.url}), a medical doctor and OET educator, coaching since ${person.coachingSince} (${ctx.years}+ years).`,
    `- Professions with dedicated courses: ${profs} (Modified Allied Health covers the other OET professions, including Dentistry).`,
    `- Full OET Course tiers, same price for Paper-Based and Computer-Based: ${full.map((t) => `${t.name} ${gbp(t.price)}${t.recommended ? ' (Recommended)' : ''}`).join('; ')}.`,
    `- Full Crash Course tiers: ${crash.map((t) => `${t.name} ${gbp(t.price)}`).join('; ')}.`,
    `- Classic recorded courses: ${pkg('Package 01').title} ${gbp(pkg('Package 01').price)} (also Pharmacy, Physiotherapy and Modified Allied Health); ${pkg('Package 05').title} ${gbp(pkg('Package 05').price)}; ${pkg('Package 07').title} ${gbp(pkg('Package 07').price)}.`,
    `- Writing letters are assessed personally by ${person.name}; private Speaking sessions are with an expert tutor; SAMI 24/7 is the included study assistant. Prices are in GBP and confirmed at checkout: ${ORIGIN}/pricing.html.`,
    `- Results: ${ctx.stories.toLocaleString('en-GB')} OET score cards shared by students are published at ${ORIGIN}/success-stories.html.`,
    `- Languages: English and Arabic (Arabic pages under ${ORIGIN}/ar/).`,
    `- Contact: support@oetwithdrhesham.co.uk, WhatsApp +44 7961 725989, ${ORIGIN}/contact.html.`,
    `- Full text of every guide: ${ORIGIN}/llms-full.txt. Blog feed: ${ORIGIN}/feed.xml.`,
  ];
  for (const [title, urls] of groups) {
    lines.push('', `## ${title}`, '');
    for (const u of urls) {
      const e = byUrl.get(u);
      lines.push(`- [${e.title.replace(/\s*\|\s*(Dr Hesham|د\. أحمد هشام|OET with Dr Hesham)\s*$/, '')}](${ORIGIN}${u}): ${e.desc}`);
    }
  }
  return lines.join('\n') + '\n';
}

const LEGAL = new Set(['/terms/', '/privacy/', '/refund-policy/', '/cookie-policy/']);
function buildLlmsFull(entries) {
  const head = [
    '# OET with Dr Hesham: full text of the guides and course pages',
    '',
    `> Plain-text copy of every page on ${ORIGIN} except the legal pages, generated at build from the same source as the HTML. The curated index is ${ORIGIN}/llms.txt.`,
  ];
  const parts = entries.filter((e) => !LEGAL.has(e.url)).map((e) => [
    '', '---', '', `## ${e.title}`, '', `URL: ${ORIGIN}${e.url}`, '', e.desc, '', e.mainText,
  ].join('\n'));
  return head.join('\n') + '\n' + parts.join('\n') + '\n';
}

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function buildFeed(ctx) {
  const posts = [...ctx.blog.posts].sort((a, b) => b.dateModified.localeCompare(a.dateModified) || b.datePublished.localeCompare(a.datePublished) || a.order - b.order);
  const updated = posts.reduce((m, p) => (p.dateModified > m ? p.dateModified : m), '');
  const t = (d) => `${d}T00:00:00Z`;
  const entries = posts.map((p) => `  <entry>
    <title>${xml(p.title)}</title>
    <link rel="alternate" type="text/html" href="${ORIGIN}${p.url}"/>
    <id>${ORIGIN}${p.url}</id>
    <published>${t(p.datePublished)}</published>
    <updated>${t(p.dateModified)}</updated>
    <author><name>${xml(ctx.person.name)}</name><uri>${ctx.person.url}</uri></author>
    <category term="${xml(p.category)}" label="${xml(p.categoryLabel)}"/>
    <summary>${xml(p.summary)}</summary>
  </entry>`);
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-GB">
  <title>OET Blog by Dr Hesham</title>
  <subtitle>Practical OET advice for Listening, Reading, Writing and Speaking, plus exam format and registration pathway guides.</subtitle>
  <id>${ORIGIN}/blog/</id>
  <link rel="alternate" type="text/html" href="${ORIGIN}/blog/"/>
  <link rel="self" type="application/atom+xml" href="${ORIGIN}/feed.xml"/>
  <updated>${t(updated)}</updated>
  <author><name>${xml(ctx.person.name)}</name><uri>${ctx.person.url}</uri></author>
  <icon>${ORIGIN}/assets/img/logo/fav-icon.png</icon>
${entries.join('\n')}
</feed>
`;
}

// --- 2d. one render-blocking stylesheet instead of eight ------------------------------------------------------
// The eight stylesheets Base.astro links on EVERY page, in its order. postbuild concatenates them into
// assets/css/oet-core.css and replaces the eight <link>s with one, at the place of the last of them, so every
// conditional sheet (swiper, sal) still loads before the theme and the page's own head-extra sheets still load after
// it. `astro dev` keeps the separate files. All eight live in /assets/css (bootstrap in plugins/ has only data: URLs),
// so relative url()s keep resolving. The build fails if a page links them in another order or misses one.
const CORE_CSS = [
  '/assets/css/plugins/bootstrap.purged.min.css', '/assets/css/oet-icons.css', '/assets/css/style.min.css', '/assets/css/oet-common.css',
  '/assets/css/oet-mobile.css', '/assets/css/oet-cookie-consent.css', '/assets/css/oet-polish.css', '/assets/css/oet-redesign.css',
];
const CORE_FILE = '/assets/css/oet-core.css';
function coreCss() {
  return CORE_CSS.map((f) => {
    const css = fs.readFileSync(path.join(ROOT, f.slice(1)), 'utf8').replace(/\r\n?/g, '\n');
    if (/@import|@charset/.test(css)) throw new Error(`core css: ${f} uses @import/@charset and cannot be concatenated`);
    if (/url\(\s*(?!['"]?(?:data:|https?:|\/))/.test(css) && f.includes('/plugins/')) throw new Error(`core css: ${f} has a relative url() that would break`);
    return `/* ${f} */\n${css.trim()}\n`;
  }).join('\n');
}
function bundleCoreCss(html, name) {
  const re = /<link rel="stylesheet" href="(\/assets\/css\/[^"?]+\.css)(?:\?[^"]*)?">\n?/g;
  const found = [...html.matchAll(re)].map((m) => m[1]).filter((f) => CORE_CSS.includes(f) || f === CORE_FILE);
  if (found.includes(CORE_FILE)) return html; // already bundled (--check-root re-runs on dist)
  if (found.join() !== CORE_CSS.join()) throw new Error(`core css: ${name} links ${found.join(', ')}; expected exactly ${CORE_CSS.join(', ')} in that order`);
  let seen = 0;
  return html.replace(re, (tag, f) => {
    if (!CORE_CSS.includes(f)) return tag;
    seen += 1;
    return seen === CORE_CSS.length ? `<link rel="stylesheet" href="${CORE_FILE}">\n` : '';
  });
}

// --- 2e. IndexNow (Bing, Yandex, Seznam…; Bing feeds Copilot and ChatGPT search) -------------------------------
// Opt-in only: `node scripts/postbuild.mjs --indexnow` with OET_INDEXNOW_KEY set to the key whose <key>.txt file
// sits in the repo root (= the deployed webroot). Posts the sitemap URLs whose lastmod is today. CI never passes it.
async function pingIndexNow(sitemap) {
  const key = process.env.OET_INDEXNOW_KEY || '';
  if (!/^[0-9a-f]{32}$/.test(key) || fs.readFileSync(path.join(ROOT, `${key}.txt`), 'utf8').trim() !== key)
    throw new Error('indexnow: OET_INDEXNOW_KEY must be the 32-hex key of a <key>.txt file in the repo root');
  const today = new Date().toLocaleDateString('en-CA');
  const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].filter((m) => m[2] === today).map((m) => m[1]);
  if (!urlList.length) { console.log('indexnow: no page changed today, nothing sent'); return; }
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(ORIGIN).host, key, keyLocation: `${ORIGIN}/${key}.txt`, urlList }),
  });
  console.log(`indexnow: ${urlList.length} URL(s) sent, HTTP ${res.status}`);
}

// --- 3. run -------------------------------------------------------------------
const checkRoot = process.argv.includes('--check-root');
const copyToRoot = !checkRoot && !process.argv.includes('--no-copy');
const norm = (s) => s.replace(/\r\n?/g, '\n');
let written = 0;
const drifted = [];

// The bundled stylesheet is an asset in the webroot: written there by a normal build; a --no-copy (CI) build and
// --check-root use the committed file, and --check-root fails if it differs from what the sources produce.
const core = coreCss();
const coreRoot = path.join(ROOT, CORE_FILE.slice(1));
if (copyToRoot && (!fs.existsSync(coreRoot) || norm(fs.readFileSync(coreRoot, 'utf8')) !== core)) fs.writeFileSync(coreRoot, core);
if (checkRoot && (!fs.existsSync(coreRoot) || norm(fs.readFileSync(coreRoot, 'utf8')) !== core)) drifted.push(CORE_FILE.slice(1));

for (const [rel] of PAGES) {
  const distFile = path.join(DIST, rel);
  if (!fs.existsSync(distFile)) throw new Error(`postbuild: missing ${rel} in dist/`);
  const html = prefillWhatsApp(addHashes(bundleCoreCss(fs.readFileSync(distFile, 'utf8'), rel), rel));
  fs.writeFileSync(distFile, html);
  if (copyToRoot) {
    fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true }); // e.g. ar/ on first build
    fs.writeFileSync(path.join(ROOT, rel), html);
    written += 1;
  } else if (checkRoot) {
    // Compare content modulo line endings: sources carry CRLF (committed from
    // Windows) so dist picks it up, while root blobs were normalized to LF by
    // core.autocrlf on commit. Raw byte comparison fails on CI for every page;
    // the gate exists to catch content drift, not EOL noise.
    const rootFile = path.join(ROOT, rel);
    if (!fs.existsSync(rootFile) || norm(fs.readFileSync(rootFile, 'utf8')) !== norm(html)) drifted.push(rel);
  }
}

// Generated text files: deterministic (no build timestamps), written to dist and the webroot, checked by --check-root.
const entries = pageEntries();
const ctx = await llmsContext();
const GENERATED = {
  'llms.txt': buildLlms(entries, ctx),
  'llms-full.txt': buildLlmsFull(entries),
  'feed.xml': buildFeed(ctx),
};
for (const [rel, text] of Object.entries(GENERATED)) {
  fs.writeFileSync(path.join(DIST, rel), text);
  if (copyToRoot) fs.writeFileSync(path.join(ROOT, rel), text);
  else if (checkRoot && (!fs.existsSync(path.join(ROOT, rel)) || norm(fs.readFileSync(path.join(ROOT, rel), 'utf8')) !== text)) drifted.push(rel);
}

if (checkRoot) {
  if (drifted.length) {
    console.error(`postbuild --check-root: root files differ from build output:\n  ${drifted.join('\n  ')}` +
      `\nRun "npm run build" in site/ and commit the regenerated root files.`);
    process.exit(1);
  }
  console.log(`postbuild --check-root: ${PAGES.length} root pages, ${CORE_FILE.slice(1)} and ${Object.keys(GENERATED).join(', ')} match build output`);
} else {
  const sitemap = buildSitemap();
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
  if (copyToRoot) {
    fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
    fs.writeFileSync(path.join(ROOT, 'assets', 'search-index.json'), JSON.stringify(buildSearchIndex(entries)));
  }
  if (process.argv.includes('--indexnow')) await pingIndexNow(sitemap);

  console.log(`postbuild: hashed ${PAGES.length} pages, sitemap, ${Object.keys(GENERATED).join(', ')} generated` +
    (copyToRoot ? `, ${written} pages + sitemap + ${CORE_FILE.slice(1)} copied to repo root` : ' (dist only)'));
}
