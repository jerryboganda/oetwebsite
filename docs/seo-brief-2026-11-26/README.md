# SEO handoff #2 (25 Nov 2026) and "2027 SEO expansion: pathways, exam formats & test centres" (26 Nov 2026)

Built 27 Nov 2026 from two owner documents:

- `OET-SEO-combined-handoff-25-Nov-2026` ("Combined SEO handoff #2"): Arabic menu, blog directory, writing-correction prices, Arabic
  writing-correction and free-resources pages, practice-cluster visibility, date hygiene.
- `OET_2027_SEO_Pathways_and_Test_Centres_FINAL` (26 Nov 2026): USA pharmacy correction, OET@Home, global test-centre directory, clubbing
  rules, new pathway guides, the 12-profession matrix, a reusable regulatory dataset.

Every regulatory and venue fact was read on 27 Nov 2026 from the regulator's own site or oet.com. The notes, with quotes and URLs, are in
`research/`. Authoring rules for further pages: `AUTHORING.md`. Gates: the block "SEO handoff #2 ... + 2027 SEO expansion" in
`site/scripts/verify.mjs`.

## 1. What was asked and what was done

### Handoff #2 (25 Nov 2026)

| Item | Status | What was done |
|---|---|---|
| 1.1 Arabic menu stays in Arabic | Done | On every `/ar/` page, the Arabic home page included, each menu link with an Arabic twin opens the twin (all 16 rows of the handoff table, plus any Arabic page added later), the logo opens `/ar/`, Pricing opens `/ar/pricing.html`, and the `/ar/` home menu has the Recalls item. `site/src/lib/arabic-nav.mjs`. English pages unchanged. |
| 1.2 Blog directory: Arabic tools | Done | `/blog/` lists the free Arabic tools (score calculator, mock test, sample tests, recalls, free resources) with an "Arabic" label, from `blog.json` `arabicPages`. |
| 1.3 English homepage FAQ parity | Done | The homepage already shows a four-question FAQ; it now has the matching FAQPage node. No copy was added. |
| 1.4 Analytics check | Owner / team | Needs a real consent-granting visit watched in GA4 Realtime and Meta Events Manager; it cannot be verified from the code. |
| 1.4 `/oet-recalls` redirect | Already live | `curl -I https://oetwithdrhesham.co.uk/oet-recalls` returned `301` on 27 Nov 2026 (the existing "without .html" rule). No change needed. |
| R1(a) price on the writing-correction page | Done | Price table and FAQ answer, every figure from `pricing.json` by marker. |
| R1(b) "letters corrected" count | Waiting for the owner (D1) | Not built. `verify.mjs` fails if a count is typed. |
| R1(c) marked-letter example | Waiting for the owner (D2) | Not built. |
| R1(d) 48-72 hour turnaround | Kept | In the lead, the hero stat, the new price table and the FAQ. |
| R2 Arabic writing-correction page | Done | `/ar/oet-writing-correction.html` with the hreflang pair. |
| R3(a) speaking page: virtual-patient offer first | Done | In the introduction and as the first content section. |
| R3(b), R4, R6 homepage links | Done | "Practise OET Online" block on the homepage: Speaking practice, mock test, role-play cards, score calculator, practice hub. |
| R3(c) matching FAQ entries | Done | One entry each on the Speaking practice, role-play cards and score calculator pages, with the FAQPage twins. |
| R4 free mini-mock | Owner decision (D3) | Not built. The mock page keeps its honest free / paid split. |
| R5 Arabic free-resources page | Done | `/ar/oet-free-resources.html`: only what is free today, and a "what is not free" section. |
| R7 OET preparation-provider programme | Owner (D4) | Not a development task. |
| R8 date fields | Done where the page changed | `oet-writing-correction.html` now has its real `datePublished` (2026-10-24, from git) and today's `dateModified`. `oet-practice.html` was not edited, so no date was invented for it. |
| "What NOT to touch" | Respected | No Arabic title, design or structure changed beyond the menu fix; the new Arabic pages are additions. |

### Brief of 26 Nov 2026

| Item | Status | What was done |
|---|---|---|
| P0 USA pharmacy | Done, scores pending at NABP | `usa-pathway-guide` pharmacy section rewritten; new `/oet-for-pharmacists-usa.html` + Arabic twin; NABP added to the score-requirements pages and the pharmacy course pages (EN + AR). |
| P0 OET@Home | Done | `/oet-at-home.html` + Arabic twin; existing OET@Home sentences audited against the research (see section 3). |
| P1 test-centre hub and 16-country paper directory | Done | `/oet-test-centres.html`, `/oet-paper-test-centres-2027.html` + Arabic twins, rendered from `site/src/data/test-centres.json` (26 countries, 215 venue records, plus 228 US computer venues counted by state). |
| P1 country pages | Reused, not multiplied | The six existing country pages link their section of the hub. No new per-country page: a page per country with only a venue table would be thin (the brief forbids thin pages); the hub has one section per country and the folder-style URLs redirect there. |
| P1 clubbing rules | Done | `/oet-clubbing-rules.html` + Arabic twin, table from `regulators.json`. |
| P1 Canada, Ireland, New Zealand guides | Done (English) | Three pathway guides in the existing guide format. |
| P1 Gulf country-specific pathways | Already covered | The six country pages (EN + AR) and the Gulf guide; the research found no published OET requirement on any Gulf regulator's site, and the pages say so. |
| P2 Singapore | Done (English) | `/singapore-pathway-guide.html`. |
| 12 professions pathway matrix | Done | `/oet-recognition-by-country.html`, from `regulators.json` (62 regulator rows, 8 destinations). |
| Reusable regulatory data model | Done | `regulators.json` + `test-centres.json` + `site/src/lib/regdata.mjs` (markers). One edit updates every page. |
| Technical SEO checklist | Done in code | Unique titles and H1s, self canonicals, en/ar hreflang on every pair, sitemap, Article + BreadcrumbList data, bylines and last-verified dates, source links, booking disclaimers, hubs in Pathway Guidelines, Free Resources and the blog. |
| Search Console: submit the sitemap, monitor | Owner / team | Needs Search Console access. |

## 2. Facts that are deliberately "not confirmed"

- **NABP minimum OET scores**: not published on 27 Nov 2026. NABP's help page promised them "by the end of November 2026". Re-check
  `https://read.nxtbook.com/nabp/bulletin/fpgec_bulletin/step_3.html` and the NABP help article in early December, then follow the steps in
  `AGENTS.md`. Also not stated by NABP: how OET results are reported, OET validity, combining sittings, paper-based OET, a list of approved venues.
- **OET@Home professions**: oet.com says all 12, Cambridge English says four. Pages state the conflict.
- **OET@Home country list**: OET publishes none. Pages state the rule (no venue in the country, or a case-by-case exception).
- **The 16 paper countries**: only in the OET customer-care email; oet.com names no country. Turkey and Sri Lanka have no paper record
  carrying OET's January 2027 note. Whether each older paper venue continues in 2027 is not shown by OET.
- **Gulf regulators**: no published OET requirement found on any regulator's own site.
- Every row of `regulators.json` with `status` other than `confirmed` (44 of 62) says in its notes exactly what could not be read.

## 3. Open items

Owner:

1. D1: the real number of letters corrected (for a proof line on the writing-correction page).
2. D2: permission approach for one marked-letter example.
3. D3: whether to offer a free mock element.
4. D4: the OET preparation-provider programme.
5. Confirm with OET customer care which professions can book OET@Home, and whether the 16-country paper list still stands.
6. Whether the four new pathway guides and the 12-profession matrix should also exist in Arabic.

Team:

1. Early December: NABP scores (above).
2. Before each test season: re-read the OET venue finder and update `test-centres.json` (`checked`).
3. GA4 Realtime / Meta Events Manager check after a consent-granting visit (handoff 1.4).
4. Search Console: submit the sitemap, request indexing of the new pages, monitor impressions and free-practice registrations by country.

## 4. Release evidence (27 Nov 2026)

- `npm run build`: 136 pages. `node scripts/verify.mjs`: passes, including the new block for these two briefs.
  `node scripts/postbuild.mjs --check-root`: root matches the build.
- `node scripts/qa-brief-2026-11-26.mjs` (Chrome, local server): 27 new or changed pages at 1440 px and 390 px, English and Arabic: no
  sideways scroll, no console error, no broken request; directory filters (country, city, mode, profession) checked on both language
  versions; the Arabic menu checked on `/ar/` and two inner pages; the two long dropdowns fit a 1536 x 760 screen (the Pathway Guidelines
  list now opens upwards, `.oet-submenu-up`); the homepage practice block shows five links. Screenshots: `docs/qa/2026-11-26/`.
- Not tested: live GA4 / Meta events, Search Console, and the production redirects for the folder-style test-centre URLs (they take effect
  on deploy; check `curl -I https://oetwithdrhesham.co.uk/oet-test-centres/paper-2027/` afterwards).
