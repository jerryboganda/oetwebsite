# Authoring rules for the 2027 SEO expansion pages (brief of 26 Nov 2026 + handoff #2 of 25 Nov 2026)

Read this before writing or editing any page for this brief. Repo rules are in `AGENTS.md`; this file adds what is specific to this work.

## 1. Facts: primary sources only

- Every regulatory or OET fact comes from `docs/seo-brief-2026-11-26/research/*.md` (read on 27 Nov 2026 from the regulators' own sites and oet.com). Nothing from memory, nothing from another prep site.
- A fact marked NOT CONFIRMED / NOT VERIFIED in the research is written on the page as "not confirmed" (Arabic: "غير مؤكد") with the advice to check the regulator, or is left out. Never turn it into a claim. Never invent a score, a date, a venue, a fee in local currency, a tax, or a seat availability.
- Keep four statuses apart everywhere: accepted, conditional, not accepted, not confirmed.
- Three different questions, never merged: (1) can I BOOK OET@Home from my country and profession (OET's rule), (2) will my REGULATOR accept it, (3) "Speaking by video" on a computer or paper test at a venue is NOT OET@Home.
- OET@Home professions: oet.com says all 12, Cambridge English lists four (Medicine, Nursing, Pharmacy, Physiotherapy). Write exactly that conflict; never say "all professions can take OET@Home" or "only four can" as settled fact. No blanket "OET@Home is available everywhere / in any country without a venue".
- NABP / FPGEC: OET Pharmacy accepted for tests taken on or after 11 January 2027 (FPGEE 2027 cycle and later); earlier OET tests do not count; OET minimum scores NOT published as of 27 Nov 2026 (never state one); OET or TOEFL iBT, not both; home editions not accepted for either; the test must be taken at an approved computer-based test centre in an NABP member or associate member jurisdiction (50 US states, DC, Guam, Puerto Rico, the Virgin Islands, 10 Canadian provinces); TOEFL MyBest accepted from 1 November 2026 for the 2027 FPGEE administration; current TOEFL minimums Reading 21, Listening 22, Speaking 25, Writing 22 (old scale) = 4 / 5 / 5 / 4.5 on the scale used for tests from 21 January 2026; TOEFL valid 2 years. OET score reporting, OET validity, combining OET sittings and the list of approved OET venues: not confirmed.
- Paper from January 2027: Nursing and Medicine only (oet.com, 16 Nov 2026). The 16-country list is attributed to the OET customer-care email (November 2026), never to oet.com. Paper availability is never guaranteed.
- Quote sparingly: at most a short phrase in quotation marks with the source linked; otherwise paraphrase. Link the official source for every rule (`target="_blank" rel="noopener noreferrer"`).
- We are an independent coaching service: never imply affiliation with OET, a regulator or a test centre. Test centres are not our locations.
- Prices of OUR packages are never typed: use `<!--oet:price:Package NN-->` / `<!--oet:bundle-price:<tier key>-->` (see `site/src/data/pricing.json`, `bundles.json`). OET's own fee is AU$587 (US$455 for computer / OET@Home in the United States); say nothing about tax or local currency except that OET publishes neither.
- Never promise free Writing correction or trial counts. Never use the word "AI". The paid course is never described as free.

## 2. Writing style

- Plain British English; no em dashes (use a colon, comma or full stop); no hype; answer first, then detail. Sentences a tired nurse can follow.
- Arabic pages: the same register as the existing `/ar/` pages (clear Modern Standard Arabic with the light Egyptian-friendly tone already used there), exam terms kept in English (OET, Listening, Speaking, OET@Home, TOEFL iBT), `dir="rtl"` handled exactly as the template does. Arabic tier names only (never the English-only tier names). Arabic pages link Arabic pages whenever an `/ar/` twin exists; the only English link to a twin is the "Read in English" switch.
- No thin content: every page must answer a real question completely. No city pages. No duplicated boilerplate between pages beyond the shared disclaimer.

## 3. Page anatomy (copy a template, do not invent markup)

Each page = `site/src/pages/<slug>.astro` + `site/src/partials/<slug>/{meta,head-extra,main,tail}.html` (Arabic: under `pages/ar/` and `partials/ar/`).

Templates to copy and adapt (same classes, same order of blocks, same JSON-LD shapes):

- English article: `partials/oet-paper-test-2027-changes/*` + `pages/oet-paper-test-2027-changes.astro`.
- Arabic article with an English twin: `partials/ar/oet-paper-test-2027-changes/*` + `pages/ar/oet-paper-test-2027-changes.astro` (note the byline, the `class="oet-ar-en"` "Read in English" link, the Arabic breadcrumb `الرئيسية › مقالات OET بالعربي › …`, `lang="ar"`).
- Arabic article without a twin: `partials/ar/oet-test-fee-booking-2027/*`.
- Pathway guide: `partials/australia-pathway-guide/*` + `pages/australia-pathway-guide.astro` (classes `pathway-*`, the official-sources block, the FAQ).
- Arabic service / tool page (not an article): `partials/ar/oet-mock-test/*`.

Every new page needs:

- `<title>` unique, at most 60 characters (English) / 70 (Arabic); meta description 120 to 160 characters; self canonical `https://oetwithdrhesham.co.uk/<slug>.html`; `og:*` and `twitter:*` like the template; `og:site_name` "OET with Dr Ahmed Hesham"; `og:image` = `https://oetwithdrhesham.co.uk/assets/img/blog/<slug>.webp` (Arabic article: `ar-<slug>.webp`); the thumbnails are generated later by the integrator.
- hreflang block (three links: en, ar, x-default = the English URL) ONLY when both language versions exist, on both pages.
- One `<h1>`. A visible breadcrumb that equals the BreadcrumbList JSON-LD. English articles: Home › OET Blog › <Category> › <short name>, the category link being `/blog/#exam-format` or `/blog/#pathways`.
- JSON-LD in `meta.html`: `BlogPosting` (datePublished and dateModified `2026-11-27`, author `#drhesham`, publisher `#organization`, exactly as the template), `BreadcrumbList`, `FAQPage` whose every question and answer appears VERBATIM in the visible FAQ (same characters; no markup differences that change the text; write prices in the FAQ without markers or leave prices out).
- In `main.html`: the `<!--oet:dates-->` byline marker under the lead, a "Last verified: 27 November 2026" line near the top, a sources section with the official links, a clear booking / independence disclaimer, the `<!--oet:author-box-->` marker and the `<!--oet:related-guides-->` marker where the template has them, and the official strip if the template has it.
- Only icons that exist in `assets/css/oet-icons.css` (check with grep `fa-<name>`); unknown icons render blank and fail the build.
- No `#` placeholder links; every internal link must resolve (existing pages are listed in `site/scripts/verify.mjs` `PAGES`; the new pages of this brief are listed in section 4).
- CTAs lead to free practice and the relevant course: `/oet-practice.html#free-practice`, `/english-placement-test`, the profession course page, `/pricing.html` (Arabic: `/ar/pricing.html`, `/ar/oet-sample-tests.html`, `/ar/oet-mock-test.html`, the Arabic course page).

## 4. URL inventory of this brief (link to these freely; they will all exist)

English: `/oet-for-pharmacists-usa.html`, `/oet-at-home.html`, `/oet-test-centres.html`, `/oet-paper-test-centres-2027.html`, `/oet-clubbing-rules.html`, `/oet-recognition-by-country.html`, `/canada-pathway-guide.html`, `/ireland-pathway-guide.html`, `/new-zealand-pathway-guide.html`, `/singapore-pathway-guide.html`.

Arabic: `/ar/oet-for-pharmacists-usa.html`, `/ar/oet-at-home.html`, `/ar/oet-test-centres.html`, `/ar/oet-paper-test-centres-2027.html`, `/ar/oet-clubbing-rules.html`, `/ar/oet-writing-correction.html`, `/ar/oet-free-resources.html`.

Country anchors on the two directory pages: `#<country id>` where the id is one of `egypt, saudi-arabia, uae, turkey, ghana, kenya, uk, ireland, india, pakistan, nepal, sri-lanka, philippines, australia, new-zealand, canada, qatar, kuwait, oman, bahrain, jordan, nigeria, south-africa, usa, singapore, malaysia` (the first 16 are the paper countries).

## 5. Data markers (rendered at build from the data files; write the marker, never the table)

Rendered in the page's language (Arabic under `/ar/`). Each marker goes on its own line inside a section's container, where a table or grid would go.

- `<!--oet:venue-directory-->` : the searchable test-centre directory (filters for country, city, mode, profession; every country with its verified venues). Hub page only.
- `<!--oet:paper-2027-directory-->` : the 16 paper countries with their paper venues and the "listed for January 2027" flag.
- `<!--oet:venues:<country id>-->` : one country's venue table.
- `<!--oet:home-acceptance-->` : regulator by regulator, whether OET@Home is accepted (accepted / conditional / not accepted / not confirmed), with sources.
- `<!--oet:clubbing-table-->` : regulator by regulator, combining rules (sittings, window, floors, single sub-test retake).
- `<!--oet:recognition-matrix-->` : the 12 professions by destination and regulator.
- `<!--oet:data-checked:venues-->`, `<!--oet:data-checked:regulators-->` : the "last checked" date as text ("27 November 2026" / "27 نوفمبر 2026").

Data files: `site/src/data/test-centres.json` (venues as keyed in OET's own finder, read 27 Nov 2026) and `site/src/data/regulators.json`.

## 6. Working rules for parallel authors

- Touch only the files your brief assigns to you. Never edit `blog.json`, `verify.mjs`, `postbuild.mjs`, anything under `site/src/lib`, `site/src/components`, `site/src/layouts`, `partials/chrome`, `assets/`, root `*.html`, or `AGENTS.md`: the integrator does that.
- Do not run `npm run build` (the build directory is shared). Check your work with `python docs/seo-brief-2026-11-26/check_partial.py <slug> [<slug> ...]` (slug as in `site/src/partials/`, e.g. `oet-at-home` or `ar/oet-at-home`) and fix everything it reports.
- Preserve each existing file's line endings and encoding (UTF-8, no BOM). When editing an existing partial, change only what your brief requires and bump that page's `dateModified` to `2026-11-27` (JSON-LD), keeping any visible FAQ and its FAQPage twin identical.
- Finish with a short report: files created or changed, the facts you left as "not confirmed", and anything the integrator must register (blog.json entry text: one-sentence summary per new page).
