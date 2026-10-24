# SEO and lead-growth plan, October 2026

Audit date: 24 Oct 2026. What it covers: production (`origin/main` @ `62883da`, which is
byte-identical to the live site), local Lighthouse runs against the live site, and fresh web
research on keywords, competitors and Google's 2025–2026 changes.

The site is technically clean (SEO 100, HTTPS, canonicals, sitemap, schema). It still won't
get much traffic, because it has **~19 indexable pages, the money pages barely use the words
people search, and there's no analytics to measure leads.** Most of the upside is in content
and keyword targeting, not technical fixes.

Where it stands in Google today (checked live on 24 Oct 2026):
- **Branded search is strong.** "OET with Dr Hesham" shows #1 with 5 sitelinks, a YouTube
  video carousel and an AI Overview.
- **It isn't in the top ~9 for any money term:** "OET course", "OET preparation online",
  "best OET course for doctors", "OET writing correction", "OET writing/speaking tips".
- **21 of the 23 sitemap URLs are indexed. `service.html` and
  `australia-pathway-guide.html` are not.**
- **About 8 `app.` pages are indexed** (sign-in, register ×3, forgot-password, "Install the
  Android update"). That's the web-app repo, so it needs `noindex` there, not here.

---

## 0. Sync status (laptop ↔ GitHub ↔ production)

| Where | Commit | State |
|---|---|---|
| Production VPS `/opt/docker/oetwebsite` | `62883da` (14 Oct 2026) | Clean. Only untracked files are `storage/` chat data (expected). Live HTML byte-identical to GitHub (6 files hash-checked). |
| GitHub `origin/main` | `62883da` | Same as production. |
| This laptop `main` | `0eba7af` | **44 commits behind**, and 5 tracked files deleted but not committed: `.github/copilot-instructions.md`, `site/scripts/{extract.py,parity.py,postbuild.mjs,preview.mjs}`. `npm run build` is broken until they're restored. |

Local-only branches: `backup-local-main` has 1 commit, but that patch is already upstream.
All `manwara575-star-*` branches are fully contained in remote history. Nothing will be lost
by syncing.

To sync the laptop (restores the 5 files, then fast-forwards):

```sh
git restore .github site/scripts
git pull --ff-only origin main
```

Also: the `automation/` Search Console API toolkit and PageSpeed API key used in the
September audit are **not on this laptop**, so this audit couldn't pull real GSC query data.

---

## 1. Fix this week: measurement and leaks (highest ROI, little code)

1. **Time-critical. Get into OET's Preparation Partner programme now.** Completing OET's
   free preliminary training (3 modules plus quizzes at 100%) earns the "OET Knowledge"
   badge, and per OET's brochure, completers get listed on oet.com. That's the most
   authoritative backlink and trust signal in this niche. **The current training platform
   closes on 30 Oct 2026**, and then there's a gap while it moves.
   ([oet.com/access/preparation-partners](https://oet.com/access/preparation-partners))
   Longer term, aim for **Premium** Preparation Provider status, which SLC holds and uses
   on its #1-ranking pages.
2. **In Search Console, "Request indexing"** for `service.html` and
   `australia-pathway-guide.html`. Neither is indexed. Do it again after the §3 rewrite of
   `service.html`.
3. **Check the possible impersonation.** A Facebook "OET Fighters" post advertises
   "Dr Hesham's Writing Crash Course" with a "100 percent pass rate" and a +92 number. If
   it isn't yours, report it. It hurts trust and steals branded leads.
4. **Turn on analytics. Right now nothing is measured.** `assets/js/oet-analytics.js`
   ships with `ga4: ""` and `umami: ""`. With zero tracking you can't tell which page or
   keyword produces leads. Create a GA4 property, paste the ID, and mark these as key events
   (the event helper already exists in the file): WhatsApp click (`wa.me`), Telegram click,
   placement-test click, app register/sign-in click, contact form submit, pricing package
   click.
5. **Link Search Console to GA4**, and check the GSC Performance report weekly. Queries at
   positions 5–20 with impressions are the fastest traffic wins (rewrite title/H1/intro
   around them).
6. **Attribute WhatsApp leads by page.** Replace bare `https://wa.me/447961725989` with a
   per-page prefilled text, e.g. `?text=Hi Dr Hesham, I'm a nurse interested in OET (from: writing tips page)`.
   Every WhatsApp chat then tells you its source page.
7. **Redirect chain through HTTP:** `/privacy`, `/terms`, `/refund-policy`, `/cookie-policy`
   (no trailing slash) 301 → `http://…/privacy/` → https. Add explicit https redirects in
   `.htaccess`, e.g.
   `RewriteRule ^(privacy|terms|refund-policy|cookie-policy)$ https://oetwithdrhesham.co.uk/$1/ [R=301,L]`.
8. **`/index.html` returns 200** (duplicate of `/`). Add a 301 to `/`.
9. **`/favicon.ico` 404s.** Google and browsers still request it. Copy `fav-icon.png` →
   `/favicon.ico` (or rewrite).
10. **Placement-test links point at the non-canonical URL.** The header/footer link to
   `/english-placement-test.html`, but the canonical and sitemap say
   `/english-placement-test`. Link to the canonical.
11. **Tips-page H1s read as garbage to Google.** The H1 has a desktop span and a mobile span
   with `<br>`, so the extracted text is
   `OET Writing Tips 2026: 11 Expert Strategies…ProfessionalsOET Writing Tips2026: 11 ExpertStrategies…`
   (all 4 skill pages). Use one text node and handle line breaks with CSS
   (`text-wrap: balance`).
12. **The FAQ meta says "90+ questions"; the page has ~34.** Make the claim match.
13. **Sitemap `lastmod` is the build date for every page** (all `2026-10-14`). Google
    learns to ignore lastmod when it's always "today". Root cause: the CI
    `regenerate-root` job used a shallow clone, so `git log` returned one date for every
    page.

> **Status (24 Oct 2026):** items 6–11 and 13 are implemented locally (12, the FAQ count
> claim, is still open), built and verified, but not
> committed or deployed yet. That covers: `.htaccess` redirects and favicon (tested on a
> throwaway php:8.3-apache container), WhatsApp `[page: …]` tags (static links + chat
> widget), the tips H1s, canonical placement-test links, and per-page `lastmod`
> (`fetch-depth: 0` + pricing.json + uncommitted edits). Items 1–5 need the owner (OET
> training, Search Console, Facebook check, GA4 ID).

---

## 2. Core Web Vitals (mobile, local Lighthouse, Moto G throttled)

| Page | Perf | LCP | TBT | Weight | LCP element |
|---|---|---|---|---|---|
| Home | 80 | **3.6 s** | 340 ms | 1.24 MB | the 320×90 **logo PNG** |
| Pricing | 85 | **3.8 s** | 170 ms | 481 KB | promo banner 1597×985 |
| Writing tips | 97 | 2.3 s | 50 ms | 231 KB | H1 text |

(PageSpeed Insights' public quota was exhausted, so no CrUX field data. Re-check in PSI.)

- **Home LCP is the logo, which means the hero H1 is hidden while it animates in**
  (`oet-hero__anim` with delays). Animate the H1 with `transform` only, not `opacity: 0`,
  so it paints at FCP (~1.8 s). Give the logo `fetchpriority="high"` or serve it as SVG.
- **421 KB of oversized images on home, 119 KB on pricing.** Add `srcset`/`sizes` (or
  Astro `<Image>`), and lazy-load anything below the fold. Give the pricing banner a
  mobile-sized variant.
- 340 ms TBT on home: defer the swiper/animation JS until after load or interaction.
- TTFB is ~0.3 s from the Lighthouse run, ~0.7 s from here (Pakistan). Optional: put
  Cloudflare (free) in front, with HTML caching, for Gulf/Asia/Africa users. Weigh this
  against the current NPM/HSTS setup before doing it.

---

## 3. On-page keyword targeting (the biggest quick win)

Exact-phrase counts in `<main>`:

| Page | "OET course" | "OET for nurses" | "OET for doctors" | "online OET" | words |
|---|---|---|---|---|---|
| Home | **0** | **0** | **0** | **0** | 1,129 |
| Services (`service.html`) | 1 | 0 | 0 | 0 | **137** |
| Pricing | 10 | 0 | 0 | 0 | 6,673 |

- **Homepage H1** is "OET success starts here — trusted by thousands…", with no money
  keyword. Suggested:
  **"Online OET Course for Doctors, Nurses & Pharmacists — Coached by Dr Hesham"**, keeping
  "trusted by thousands" as the lead line. Title:
  `Online OET Course & Coaching for Nurses and Doctors | Dr Hesham`.
- **`service.html` is 137 words and isn't in the header or footer nav.** It should be the
  main "OET course online" page. Expand it to 1,200–1,800 words (who it's for, what's
  included per skill, how live classes and correction work, timelines, outcomes, FAQs,
  testimonials, price-from), and add it to the nav as "OET Courses".
- **Homepage FAQ questions are H2s.** Use one H2 ("OET coaching FAQs") with H3 questions.
- **Weak internal linking.** Pathway guides link only to each other and to success
  stories (5 links each). They never link to the skill tips or to pricing. The FAQ page has
  0 in-content links, and so does success-stories. Add contextual links, e.g. the UK guide →
  "NMC OET score requirements" → writing tips → nursing package.
- **Success stories are invisible to Google.** The 1,600+ score cards load from JSON with
  `alt=""`, and only 9 `<img>` tags are in the HTML. Render a crawlable subset per
  profession/year, with descriptive alt text ("OET Nursing score card — Writing B 380,
  2026") and short text quotes. These pages then work as profession-level proof pages
  (see §4).

---

## 4. Content to build (where the traffic is)

Detailed keyword clusters and competitor evidence are in §6. Build in this order, one page
per search intent. Each page gets Dr Hesham as visible author with credentials and an
updated date, an embedded YouTube video, a 3–5 question FAQ, and a CTA to the free
placement test plus WhatsApp.

**A. Money pages (transactional, build first)**
1. `/oet-course-for-nurses` — NMC/AHPRA/DHP nursing focus, nursing package, nurse score cards
2. `/oet-course-for-doctors` — GMC/AMC/ECFMG/Qatar, medicine package, doctor score cards
3. `/oet-for-pharmacists`, `/oet-for-physiotherapists` (later: dentists, others)
4. Expanded `/service.html` as the "Online OET course" hub
5. `/oet-writing-correction` — the service on its own page (strong commercial intent)
6. `/oet-speaking-practice-online` — 1:1 role-play service page
7. `/oet-mock-test` — mock exam packages as a landing page

**B. Evergreen, high-volume informational pages (traffic, links and AI Overview citations)**
- OET score requirements by regulator (NMC, GMC, AHPRA, ECFMG, DHP/DHA/SCFHS), as one table
  page plus a section per regulator
- OET score calculator / grade converter (OET ↔ IELTS ↔ CEFR). A tool gets linked and
  bookmarked.
- OET test dates 2026 & 2027, OET fees by country, OET results date
- OET vs IELTS for nurses / doctors (UK and Australia)
- OET on computer vs paper vs OET@Home: which to choose
- OET writing sample letters by profession and letter type (referral, discharge, transfer,
  advice), each with a band-scored model answer and examiner-style comments. This is the
  largest informational cluster in OET.
- OET speaking role-play cards with model answers, by profession
- OET listening and reading practice tests (free, scored), as lead magnets that ask for
  email or app sign-up for full results
- "How to get B in OET writing", "OET writing criteria explained", "OET re-sit / one
  sitting rules", "How long to prepare for OET"

**C. Arabic-language pages (low competition, core audience)**
Mirror the top 5–10 pages in Arabic under `/ar/` with `hreflang="ar"`/`"en"` pairs. Use
real Arabic copy, not machine translation left as-is, and Arabic-language video embeds.

**D. Country pages, only where you can make them genuinely unique**
Egypt, Pakistan, India/Kerala, Nigeria, Saudi/UAE: local test centres, fees in local
currency, payment methods, local success stories, local WhatsApp groups. Without unique
content these become doorway pages and get penalised. Skip any country you can't make
unique.

**Cadence:** 2 pages per week. Refresh every guide's numbers each quarter, update
`dateModified`, and show a visible "Last reviewed by Dr Ahmed Hesham, <date>".

---

## 5. E-E-A-T and structured data

- **Author box on every tips/guide page**: photo, "Dr Ahmed Hesham, medical doctor
  (degree, university, registration if any), OET coach since 2020, 1,600+ verified
  results", plus links to LinkedIn and YouTube. Today the pages have none.
- **`Person` schema** is missing `image`, `sameAs` (LinkedIn
  `ahmed-hesham-ibrahim-3b44281b3`, YouTube `@drhesham222`, Instagram), `alumniOf` and
  `hasCredential`.
- **`Organization.sameAs`** is missing Instagram and LinkedIn, which are linked in the
  header but not in the schema.
- Add **`VideoObject`** wherever a YouTube video is embedded (tips pages, home), so the
  pages can appear in video results.
- `Article` dates are May 2026 on every guide. Update `dateModified` only when content
  actually changes.
- Reviews: self-serving reviews on your own site don't earn stars for an Organization. Put
  effort into **Trustpilot reviews** (see §7), and quote those on the site.
- **Stop investing in Course and FAQ markup for rich results.** Google retired Course Info
  rich results in June 2025, and FAQ rich results stopped showing on 7 May 2026. Keep the
  markup, since it still helps machines understand the page, but it earns no visual
  result.
  ([Google, June 2025](https://developers.google.com/search/blog/2025/06/simplifying-search-results),
  [FAQPage](https://developers.google.com/search/docs/appearance/structured-data/faqpage))
- **What still earns visual results:** a **Course list carousel** (≥3 courses + `ItemList`
  on one summary page; course names with no prices or promo words), which
  `service.html` is almost set up for. Also **Video**, **Product/Review snippet** (stars on
  a product are allowed when the reviews are genuine and visible), **Breadcrumb** (already
  working), **Organization** and **Profile page** (use it for the About/author page).

---

## 6. Keywords, competitors, SERP features (fresh research)

Google UK and Egypt results, Trends and autocomplete were checked live on 24 Oct 2026. No
paid keyword tool was available, so the volumes below are **relative** (Google Trends, last
12 months): "oet sample test" **60** · "oet course" **43** · "oet exam dates" **37** ·
"oet vs ielts" **13** · "oet writing sample" **11**. Rising searches: "oet ultimacy"
(Breakout), **"oet exam dates 2026" (+1,000%)**, "fsmb", "myintealth login" (ECFMG).

| Cluster | Intent | Example queries | Who wins today | Your page |
|---|---|---|---|---|
| Free samples (largest) | Info | oet sample test, writing sample for nurses/doctors pdf, listening/reading practice test, speaking role-play cards | oet.com, edubenchmark, OET Ultimacy, Scribd + video carousels | **none** → build §4B |
| Courses | Transactional | oet course online / for nurses / for doctors / fees / duration, best oet course reddit | oet.com, E2, edubenchmark (★4.9), SLC, Reddit | home + service (weak) → §3, §4A |
| Writing correction | Transactional | oet writing correction (online/free), writing check, mock test | SLC (#1), edubenchmark, AI checkers, Reddit | **none** → §4A-5 |
| Scores & requirements | Info | oet score chart/calculator, score for UK/NMC/GMC/ECFMG/AHPRA | NMC, GMC, oet.com, edubenchmark, tool sites; AI Overview | partly in pathway guides → own page + calculator |
| Logistics | Nav/Info | oet exam dates 2026/2027, fees, results, fees in egypt/pakistan/nigeria | oet.com, colleges, edubenchmark | **none** → dates/fees pages |
| Comparison | Info | oet vs ielts (easier, nurses, doctors), vs pte | Reddit #1, Mind the Bleep, IMG Connect, IDP | **none** |
| Recalls | Info | oet recalls (nurses), listening recalls | OET Ultimacy #1, YouTube Shorts, Studocu copies | you sell recalls but have no page (see risk note) |
| USA/ECFMG | Mixed | oet for ecfmg, oet usmle, myintealth | rising, thin competition | USA guide → dedicated ECFMG page |
| Arabic | Transactional | كورس oet، كورس oet في مصر، امتحان oet للاطباء / للتمريض / السعودية / قطر | **video carousel first**, then OET Ultimacy's Arabic page, Facebook groups, Udemy | **none** → §4C + Arabic YouTube titles |

**Competitors to beat:**
- **edubenchmark:** a big blog (calculator, dates, role-play cards, referral-letter
  samples), review stars and a price range in the results, free mock test.
- **E2Language:** free course and trial, a calculator, 360 Trustpilot reviews.
- **SLC:** Premium Preparation Provider, #1 for writing correction, a test-date calendar.
- **oet.com:** official samples and a free intro course.
- **OET Ultimacy (Dr Ahmed Elgendy):** your **direct Arab-focused rival**, now Breakout on
  Trends. It has a recalls library, 100+ speaking cards with a calculator, a study
  planner and an Arabic course page, and it ranks on page 1 for *your* brand query.

**What the results pages look like:**
- **Reddit is #1 or #2** for vs-IELTS, "how to pass first attempt", "best course for
  doctors", writing correction and recalls.
- **Video carousels** appear on most informational queries and lead the Arabic ones.
- **AI Overviews** appear on calculator, sample, practice-test and fees queries. On those,
  answer in the first 100 words, use question headings, give definite figures with dates,
  and name the author's credentials.
- There are **no map packs** (online-only businesses can't get a Google Business Profile)
  and no classic featured snippets.

**Official facts to build evergreen pages on** (verify before publishing, and date-stamp):
- **GMC:** B in all four sub-tests in one sitting. Accepts paper, computer and @Home.
  Results valid 2 years.
  ([GMC](https://www.gmc-uk.org/registration-and-licensing/join-our-registers/before-you-apply-guide-for-doctors/evidence-of-your-knowledge-of-english/using-your-oet-certificate))
- **NMC:** B (350) in Listening, Reading and Speaking, and C+ (300) in Writing. Two
  sittings can be combined under rules.
  ([NMC](https://www.nmc.org.uk/registration/joining-the-register/english-language-requirements/accepted-english-language-tests/oet/))
- **ECFMG, 2027 pathways:** 350 in Listening, Reading and Speaking and 300 in Writing, in
  one sitting on or after 1 Jan 2025. A MyIntealth ID is needed from 14 May 2026, and the
  last December 2026 test date is the cut-off for the 2027 Match.
  ([ECFMG](https://www.ecfmg.org/certification-pathways/oet.html))
  → **"OET for ECFMG 2027" is a timely page to publish now.**
- **AHPRA:** new numeric minimums were reported from 23 Apr 2026 (L350/R360/W350/S360).
  This comes from secondary sources and is **unverified**. Check the official page first.
- **OET logistics:** paper bookings close 24 days before the test, computer and @Home 7
  days before. Computer results come in about 48 h to 6 days. The full test is AU$587.
  New Zealand immigration stops accepting @Home from 13 Jul 2026.
  ([OET](https://oet.com/test/book-a-test))

**Recalls risk:** competitors rank by publishing post-exam "recalls". Check OET's test
regulations on sharing test content before building a recalls page. It could put your
Preparation Partner application at risk.

---

## 7. Off-page and lead channels

1. **OET Preparation Partner listing** (§1, item 1). Deadline 30 Oct 2026.
2. **Trustpilot:** you have 0 reviews, edubenchmark has 31 and E2 has 360. Send every
   student who passes a review link alongside the score-card request (you already collect
   1,600+ score cards, so the habit exists). Target 50+ reviews in 90 days. Embed the
   TrustBox and quote the reviews on pricing.
3. **YouTube** (7.5k subscribers, vs SLC ~115k and Swoosh ~73k): carousels lead most
   informational and all Arabic results.
   - Retitle and describe videos around the §6 queries ("OET Writing Sample for Nurses —
     Discharge Letter (Band B)", "كورس OET للتمريض").
   - Add chapters, which become key moments in results.
   - Link from each description to the matching site page.
   - Embed each video on that page with `VideoObject` markup.
4. **Reddit and Facebook groups:** Reddit wins "best course" and "vs IELTS" queries.
   - Answer helpful threads as Dr Hesham (r/OETforECFMG has 8.4k members, also
     r/IMGreddit, r/NursingUK) and link to guides, not to pricing.
   - In your own Facebook groups, pin posts that link to the tips pages and placement test.
5. **Directories that already rank** for your keywords: Laimoon (Egypt/Arabic), Edarabia
   (UAE), Careers360 and Collegedunia (India), Udemy (a short paid course as a funnel),
   Preply. List the business, with a link, on each.
6. **Linkable assets and digital PR:**
   - The score calculator (§4B).
   - A data study: "What 1,600 OET score cards tell us: the sub-test that fails most
     nurses", pitched to nursing and IMG blogs, recruitment agencies and IMG Connect.
   - A partner page for UK nursing and doctor recruitment agencies.
7. **Leads:**
   - Make the **free placement test** (it already registers users in the app) the primary
     CTA on every content page.
   - Add a per-page **free PDF** (writing checklist, NMC/GMC score sheet) that asks for an
     email or WhatsApp number.
   - Use page-tagged WhatsApp links (§1).
   - Today the hero's primary CTA sends people to a community chat you can't remarket to.
8. **Not useful:** Google Business Profile. Online-only businesses aren't eligible, so
   don't create a fake address.

---

## 8. 90-day roadmap

**Week 1 (≈1 day of work)**
- OET Knowledge training (before 30 Oct).
- GA4 + key events.
- Request indexing for the 2 unindexed pages.
- Redirect, favicon and `index.html` fixes.
- Tips H1 fix.
- Canonical placement-test links.
- Per-page WhatsApp text.
- Check the impersonation post.

**Weeks 2–4**
- Rewrite home H1, title and intro around "online OET course for nurses/doctors".
- Expand `service.html` into the course hub and add it to the nav.
- Ship the nurses and doctors course pages and the writing-correction page.
- Fix home LCP (hero animation, image `srcset`).
- Add author boxes and fill out the `Person` schema.
- Launch Trustpilot.

> **Status (24 Oct 2026, branch `feat/website-seo-week2`):** all of the above is
> implemented except Trustpilot (owner action). Also done:
> - Visible "Keywords: …" stuffing lines removed from the 4 tips pages.
> - The FAQ page realigned to its real content (exam FAQs).
> - Related-content and in-body links added to the 3 new pages from 11 pages.
> - Broken `#nursing`/`#medicine`/`#pharmacy` pricing anchors fixed.
> - Site search fixed (the input selector never matched) and its index now
>   generated by the build.
> - FAQ JSON-LD synced to the visible text on 3 pages, with a `verify` guard.
> - Invalid `role="listitem"` removed on pricing.
>
> Lighthouse, mobile, same local server, before → after (home): performance
> 40–42 → 51–54, weight 1,930 → 1,480 KB, TBT ~750 → ~350 ms. The LCP element
> is now the H1 instead of the logo. Production LCP still needs confirming in
> PageSpeed after deploy.
>
> New copy must be reviewed by Dr Hesham before deploy, especially exam-format
> facts and package details.

**Month 2**
- Publish "OET for ECFMG 2027", "OET exam dates 2026/2027", "OET score requirements
  (NMC/GMC/AHPRA/ECFMG)", "OET vs IELTS" and the score calculator.
- Start 2 pages a week of writing sample letters by profession.
- Retitle the top 20 YouTube videos.

> **Status (24 Oct 2026, branch `feat/website-seo-week2`, week 3 batch):** done, not
> deployed.
>
> **New pages**
> - `/oet-score-calculator.html`: interactive; checks 11 regulators; its logic is
>   tested in `verify`.
> - `/oet-score-requirements.html`: 12 regulators, each linked to its official page.
> - `/oet-for-ecfmg.html`
> - `/oet-test-dates-and-fees.html`: every 2026 paper date, plus fees and results
>   timing.
> - `/oet-vs-ielts.html`: built on OET's official IELTS and CEFR benchmarking.
> - `/oet-writing-sample-nursing.html` and `/oet-writing-sample-medicine.html`:
>   original practice cases with model letters.
>
> **Every fact was checked against official sources** (oet.com, NMC, GMC, Ahpra,
> NMBI, MCI, NCNZ, MCNZ, ECFMG, TruMerit, HCPC, GPhC, SMC) on 24 Oct 2026. The
> source notes are in the session scratchpad.
>
> **Wrong claims corrected on existing pages**
> - FAQ:
>   - "NMC clubbing within 6 months" → 12 months, with set floors.
>   - "NMBI accepts clubbing" → it doesn't.
>   - "valid for 2 years" was attributed to OET → it's each regulator's rule.
>   - "results in 16–17 business days" → 48 hours to 6 days on computer, from
>     13 days on paper.
>   - An extra, unofficial Writing criterion is removed, and the re-marking terms
>     are now accurate.
> - USA guide: it now says CGFNS VisaScreen accepts OET, with the new scores from
>   12 May 2026.
> - UK guide: the GPhC rule is now exact.
> - Course pages: they now give Ahpra's new 2026 minimums.
>
> **Other fixes**
> - Placement-test page expanded (177 → ~650 words, with FAQ markup).
> - 7 icons were rendering blank; the build now fails on unknown icons.
> - 10 over-length titles and descriptions shortened.
>
> **Next batch**
> - More sample letters: pharmacy, physiotherapy, a nursing transfer letter.
> - Speaking role-play cards.
> - Arabic `/ar/` pages.
> - Trustpilot (owner).
> - Ask Dr Hesham to review the new clinical and exam copy.

> **Status (24 Oct 2026, week 4 batch, same branch, not deployed)**
>
> **New pages**
> - **Arabic:** `/ar/` (كورس OET), `/ar/oet-course-for-nurses.html` and
>   `/ar/oet-course-for-doctors.html`. Each has `lang="ar"`, RTL layout and a
>   reciprocal hreflang link to its English page, which the build checks.
> - **Writing samples:** pharmacy (letter to a GP), physiotherapy (discharge
>   letter) and nursing transfer (hospital to care home).
> - **Speaking role-play pages:** nursing and medicine. Each has 2 original
>   cards, an annotated model transcript and phrases by stage.
>
> **Other changes**
> - The homepage links to all the exam guides.
> - The About page is now marked as a `ProfilePage`. The Organization schema
>   gained a contact point, phone number and `knowsLanguage` (en, ar).
> - New menu entries: "OET بالعربية" and the role-play pages.
> - Mobile tables now wrap their first column on every page.
> - `/ar` redirects to `/ar/` in one https hop.
>
> **Next batch**
> - Expand the Arabic pages (Arabic score requirements, Arabic test dates).
> - More role-plays: pharmacy and physiotherapy.
> - A profession hub for allied health.
> - Measure what's working in GSC once deployed: double down on pages getting
>   impressions, and rewrite titles where CTR is low.

> **Status (24 Oct 2026, A–Z fix pass, deployed `1af1e60`)**
>
> - **Contact-form leads were being lost.** The container has no `sendmail`, so
>   every enquiry hit `error=mail`. Enquiries are now saved to
>   `storage/contact/*.jsonl` first. This was verified live with a test
>   enquiry, which was then deleted, and the folder returns 403 on the web. Email
>   still needs `OET_SMTP_*`: the domain uses Microsoft 365 with SPF `-all`, so
>   VPS mail can't deliver.
> - **GSAP:** phones, touch devices and reduced-motion users no longer load GSAP
>   or ScrollTrigger (about 115 KB). The hero portrait is no longer downloaded
>   twice (the preload `sizes` mismatched the `<picture>`).
> - **Lab LCP:** Lighthouse's raw trace shows the homepage H1 paints at first
>   paint (about 1.9 s). The ~3.3 s lab figure is the throttling simulation
>   adding 10 separate CSS requests. CSS bundling is the next speed lever if
>   field data ever shows slow LCP.
> - **Pathway guides:** "The PDF highlights…" leftovers are rewritten.
>   Unverified Qatar rules are attributed to DHP, with a prompt to confirm.
> - **Lighthouse:** About and success-stories issues fixed (About now
>   100/100/100). The contact page uses an H2. Sampled pages score 100 on SEO,
>   accessibility and best practices.
> - **Navigation:** "Free Resources" opens the OET Tips hub, and the teaching
>   approach page has more inbound links.
> - **Kept unchanged at the owner's request:** the homepage "Rated 5.0 on
>   Google" badge and the other trust badges.

> **Status (24 Oct 2026, week 5 batch)**
>
> **New pages**
> - `/oet-course-for-pharmacists.html`: GPhC and Ahpra.
> - `/oet-course-for-physiotherapists.html`: HCPC 1400 rule, Ahpra and
>   VisaScreen.
> - Speaking role-plays: `/oet-speaking-role-play-pharmacy.html` and
>   `/oet-speaking-role-play-physiotherapy.html`.
> - Arabic `/ar/oet-score-requirements.html` (درجات OET المطلوبة) and
>   `/ar/oet-test-dates-and-fees.html` (مواعيد ورسوم امتحان OET). Both link to
>   their English pages with reciprocal hreflang.
>
> **Navigation:** "Pharmacist OET" and "Physiotherapy OET" now open the new
> course pages instead of WhatsApp.
>
> **Shared CSS fixes**
> - `.oet-resource-grid` and `.oet-legal-grid` items can now shrink, which fixes
>   card and table overflow on phones.
> - The About email box no longer clips on phones.
> - The breadcrumb shape keeps its aspect ratio on all pages, so best practices
>   is 100.
>
> **Next batch:** more Arabic pages (OET vs IELTS, Arabic tips), dentist and
> other allied professions, an Egypt/Pakistan page only with verified local
> facts, and a GSC review once data arrives.

> **Status (24 Oct 2026, week 6 batch)**
>
> **New pages**
> - `/oet-sample-tests.html`: the hub for the largest search cluster ("oet sample
>   test"). It links all 23 official OET sample-test pages (checked live) and all
>   of our model letters, role-plays and tools.
> - `/oet-for-allied-health.html`: OT, radiography, dietetics, podiatry and
>   speech therapy, covering the HCPC 1400/1800 rules, Ahpra and VisaScreen, and
>   noting that the GDC does not list OET.
> - Arabic `/ar/oet-vs-ielts.html` (OET أم IELTS) and `/ar/oet-writing-tips.html`
>   (شرح كتابة رسالة OET), each with reciprocal hreflang to its English page.
>
> **Navigation:** "Free Sample Tests" added to the Exam Guide menu and footer;
> "OET for Allied Health" added to the Courses menu.
>
> **Fixes**
> - "Supplied PDF" leftovers removed from the tips pages.
> - Phone overflow fixed: the legal pages' intro box and the contact email box.
> - A 51-page sweep at phone width shows no overflow.
>
> **Next batch:** Arabic Speaking tips and Arabic sample hub; more profession
> samples (dentistry/OT/radiography letters); measure in GSC once data arrives.

> **Status (24 Oct 2026, week 7 batch)**
>
> **New pages**
> - Model letters: `/oet-writing-sample-nursing-referral.html`,
>   `/oet-writing-sample-medicine-discharge.html` and
>   `/oet-writing-sample-occupational-therapy.html`.
> - Arabic `/ar/oet-speaking-tips.html` (شرح Speaking OET) and
>   `/ar/oet-sample-tests.html` (نماذج امتحان OET), with reciprocal hreflang to
>   the English pages.
>
> **Course list:** the Services hub's Course list `ItemList` now points
> pharmacists, physiotherapists and allied health at their own course pages
> (previously `pricing.html`), as Google's Course list summary-page pattern
> expects.
>
> **Totals:** 56 indexable pages (9 Arabic). Every page checked scores 100 on SEO,
> accessibility and best practices.

> **YouTube retitles (owner action in YouTube Studio).** Recent uploads from Sept
> 2026 are already well titled. These older ones waste search demand:
>
> | Current title | Suggested title |
> |---|---|
> | Routine Referral 1 ( How to approach the Case Notes ) | OET Writing: How to Read Case Notes for a Referral Letter (Part 1) \| Dr Ahmed Hesham |
> | Routine Referral 2 ( How to approach the case notes 2 & Start of Layout ) | OET Writing Referral Letter Layout, Step by Step (Part 2) \| Dr Ahmed Hesham |
> | Nursing Speaking Workshop OET By Dr. Ahmed Hesham | OET Speaking for Nurses: Role-Play Workshop With Model Answers \| Dr Ahmed Hesham |
> | OET Orientation Session for Doctors By Dr. Ahmed Hesham | OET for Doctors 2026: Full Orientation (Format, Scores, GMC) \| Dr Ahmed Hesham |
> | OET Orientation For Nurses By Dr. Ahmed Hesham - دكتور أحمد هشام | OET for Nurses: Full Orientation in Arabic \| شرح امتحان OET للتمريض \| د. أحمد هشام |
> | Feedbacks on our OET Courses | OET Course Reviews: What Our Nurses and Doctors Say \| Dr Ahmed Hesham |
> | OET Free Webinar - Pharmacy New Recalls - A letter of complaint… | OET Pharmacy Writing: Complaint Letter to a Manufacturer (Free Webinar) |
> | New OET Trends 2026 + Intro to the New OET Course | OET 2026 Changes and Exam Trends: What's New \| Dr Ahmed Hesham |
>
> For every video:
> - Put the matching site page link in the first two description lines (for
>   example writing videos → `/oet-writing-tips.html`, nursing →
>   `/oet-course-for-nurses.html`).
> - Add chapters, which Google shows as key moments.
> - Pin a comment that links the free placement test.
> - Make Arabic-language videos Arabic-first in the title, because Arabic OET
>   searches are led by video carousels.

**Month 3**
- Arabic `/ar/` versions of the top pages, with `hreflang`.
- Speaking role-play cards and free practice tests as lead magnets.
- Make success stories crawlable by profession.
- Pitch the data study.
- Apply for Premium Preparation Provider status.

**Track weekly** (GSC + GA4):
- Impressions and clicks for non-brand queries.
- Number of pages ranking top 10.
- WhatsApp/placement-test/register events by landing page.
- Trustpilot review count.
