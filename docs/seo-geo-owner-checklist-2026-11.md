# SEO + AI-search (GEO) plan: owner checklist (2 Nov 2026)

The code half of the plan (Tracks A, B and C) is built on branch `seo-geo-2026-11`. Everything
below needs Dr Hesham (or someone with his accounts). Most of the AI-visibility signal comes from
this list, not from the code: ChatGPT, Perplexity, Claude and Google AI Overviews cite providers that
other sites, reviews and videos talk about.

## 1. Before deploying: review the new pages

Every new page was researched against oet.com and the regulators' own sites on 2 Nov 2026 and lists
its sources, but **you sign them off before they go live** (plan rule). Read each one and replace an
invented practice example with a classroom one where you have a better one.

| Page | What to check |
|---|---|
| `/oet-mock-test.html` | What the mock packages include; that mock Speaking is "assessed with detailed feedback" (the cards do not say by whom) |
| `/oet-speaking-practice-online.html` | That private Speaking sessions are run online (the title says "online"; the package cards only say "live 1:1") |
| `/oet-course-for-dentists.html` | It sells the Modified Allied Health course to dentists; GDC (UK) names neither OET nor PTE, so the page tells dentists to ask the GDC |
| `/oet-vs-pte.html` | Regulator acceptance table (GMC, NMC, HCPC, GPhC, GDC, Ahpra, Ireland, New Zealand, ECFMG) |
| `/oet-study-plan.html` | The 4 / 8 / 12-week schedules and weekly hours match how you coach |
| `/oet-reading-part-b-workplace-texts.html`, `/oet-listening-parts-b-c.html` | Method and invented practice items |
| `/oet-writing-nursing-discharge-letter.html` | Model letter (197 words) and the five closing requests |
| `/oet-speaking-angry-anxious-patient.html` | Model dialogue and phrase tables |
| `/oet-retake-after-near-miss.html` | Regulator rules on combining sittings (NMC, GMC, Ahpra) |
| `/ar/oet-course-for-pharmacists.html`, `/ar/oet-course-for-physiotherapists.html`, `/ar/gulf-pathway-guide.html` | Arabic wording and the Arabic tier names |

Corrections made to existing pages on 2 Nov 2026 (please read too):

- **Gulf Pathway Guide (English)**: Qatar's DHP facts were wrong or unsourced and were corrected from DHP's
  own pages: qualifying exams are 150 questions in 3 hours with unlimited attempts (not "up to five"), pass
  marks 50% nursing / midwifery / physiotherapy / allied, 60% GP / dentist / pharmacist, 65% most specialist
  physicians; pharmacists DO need a Qatari police clearance; exam exemptions follow Circular DHP/2025/24;
  "Sheryan", the 1 January 2026 date, the 3-year validity and "B / 350 is a common Gulf target" were removed;
  Oman's OMSB exams are via Pearson VUE.
- **Arabic nurses page**: still sold the retired Package 06 "كورس التمريض + التقييم"; it now shows the two
  real Nursing packages (Classic Nursing OET Course, Nursing Premium Bundle).
- **Listening tips**: the "30-second" reading time was wrong for Parts B and C (OET: 30 s Part A, 15 s Part B,
  90 s Part C); an invented "wrong 7 out of 10 times" statistic and "OET mentions wrong answers first" were removed.
- **Test dates and fees / FAQ / Arabic dates page**: fees re-confirmed on oet.com (AU$587; US$455 in the USA;
  re-sits AU$315 / 415 / 515; re-marking AU$120); the "95% within 6 days" figure is now attributed to OET on
  Computer only; reschedule / cancel rules spelled out from the Test Regulations.
- **Course schema / service page**: the retired "Full condensed recorded Medicine course" wording is gone.
- **Dates**: the eight May guides now show "Updated 27 Oct 2026" (your confirmation); the Gulf guide and
  Listening tips show 2 Nov 2026.
- **Years of coaching**: everything now follows your start year **2018**: schema "since 2018", the About and
  homepage counters read **7+** (completed years: 2026 − 2018 − 1, true whatever month you started) and the
  homepage text "over seven years". It updates itself every January.
- **Score cards**: the stale "1,600+" is now the live manifest count (**1,750+**) on every page.

Facts the research could not verify (left out or worded carefully; confirm if you can):
oet.com's own pages disagree on paper results (12 days on "after the test", 13 days elsewhere; the site uses 13);
ECFMG pages returned 403 (the "10 business days" and MyIntealth claims on the ECFMG guide are unchanged);
TruMerit's VisaScreen OET table is an image (physio scores 360/340/350/320 on the USA guide unconfirmed);
Kuwait licensing (no official source reachable).

## 2. Deploy

1. Merge `seo-geo-2026-11` into `main` after review, then the standard deploy (AGENTS.md):
   `ssh root@185.252.233.186`, `cd /opt/docker/oetwebsite`, `git fetch origin && git reset --hard origin/main`,
   `chown -R www-data:www-data storage`. This also ships the Meta Pixel CSP that is missing on the live
   `.htaccess` today.
2. Live serves gzip only: brotli needs `a2enmod brotli` in `/opt/docker/oetwebsite-stack/docker-compose.yml`
   (then `docker compose up -d`); `.htaccess` already asks for it.
3. Run the README post-deploy checklist, including the new lines (folder-index 301s, `llms.txt`,
   `llms-full.txt`, `feed.xml`, `robots.txt`, the IndexNow key file).

## 3. Search engines

1. **Google Search Console**: check that all 78 sitemap URLs are indexed (the 24 Oct audit saw 21/23 at the time;
   a research pass on 2 Nov could not find the domain at all, so confirm). Request indexing for the 13 new URLs.
   Validate one course page, `/pricing.html` and `/success-stories.html` in the Rich Results Test.
2. **Bing Webmaster Tools**: verify the site, submit the sitemap, watch the "AI Performance" report (Bing feeds
   Copilot and ChatGPT search). Turn on IndexNow there with the key in the repo root
   (`6eb1e43214d712b4171aaa7d1667ce96.txt`), then after each release:
   `cd site && OET_INDEXNOW_KEY=6eb1e43214d712b4171aaa7d1667ce96 node scripts/postbuild.mjs --indexnow`.
3. Lighthouse mobile on `/` and `/pricing.html`: render-blocking stylesheets went from 10–12 per page (2 Nov audit) to 1–5 (one
   bundled `oet-core.css`), and the homepage popup no longer downloads posters (up to 1.85 MB each) until it opens.

## 4. Trust signals only you can create

1. **OET Preparation Partner**: complete OET's free training, display the badge, aim for Premium (SLC's main trust signal).
2. **Reviews**: ask every passing student for a Trustpilot (and Google) review together with the score-card request;
   target 50+ in 90 days. Quote real reviews on the pricing page afterwards. Never add a self-made
   AggregateRating to the schema (verify.mjs forbids it).
3. **"Rated 5.0 on Google" and the 15K / 20K / 25K counters**: you kept them on 2 Nov 2026. Source them
   (a link to the Google profile, the YouTube / Telegram numbers) or remove them; unsourced numbers are what AI
   assistants and reviewers distrust first.
4. **YouTube**: rename "The Pathway to UK" to include "OET with Dr Hesham"; say the brand and the domain in every
   video; retitle per the table in `docs/seo-growth-plan-2026-10.md`; Arabic-first titles for Arabic videos; link the
   matching site page in each description.
5. **Communities**: answer on Reddit (r/OET, r/IMGreddit, r/NursingUK), Quora and LinkedIn as Dr Ahmed Hesham,
   with disclosure, linking the guide that answers the question.
6. **Listicles and directories** that rank for "best OET course": talkdrill, learnenglish.life, collegedunia, Laimoon,
   Edarabia, a Udemy funnel course. Pitch NHS trust international-recruitment teams and IMG Connect.

## 5. Owner inputs that fill placeholders automatically

Add them to `site/src/data/person.json` (or send them and we add them); the schema, the author box on every
article and `twitter:site` update on the next build:

- Degree + university (`alumniOf`), registration body + number (`identifier` / `hasCredential`: e.g. GMC number).
  This is the single biggest fix for AI assistants confusing "Dr Hesham" with other doctors.
- X / Twitter handle (`twitter`), if there is one.
- Team names and roles (for the About page), only real people with their consent.
- Course workload hours for the nursing, pharmacy, physiotherapy and allied courses (the schema uses the
  existing PT30H / PT25H / PT40H values).
- Per-card grades and professions for the score cards: unlocks `/oet-results-data.html` ("What 1,750 verified
  score cards show"), the most citable page possible in this niche. The manifest has only file, year and platform.
- The Arabic nurses (129 characters) and doctors (127) meta descriptions are under the 140-character target if you
  want them longer.

## 6. Every month

Ask ChatGPT, Perplexity, Claude and Google ("best online OET course for nurses UK", "OET course for pharmacists",
"OET preparation in Arabic") and log whether OET with Dr Hesham is cited and which page.
