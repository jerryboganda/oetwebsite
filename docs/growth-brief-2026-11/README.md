# Search Visibility & Brand Discovery brief (owner, 15 Nov 2026): implementation status

Status on 19 Nov 2026. The brief covers the website, AI search, reputation, social, app stores and paid media. This repository is the
website, so everything a code change can deliver is built and verified here; everything that needs an account, a person or the
owner's approval is listed with its owner and the document that prepares it. Nothing below is marked done without evidence.

Files in this folder:

| File | Brief deliverable |
|---|---|
| `brand-facts-and-links-register.md` | C. Brand facts and verified links register |
| `baseline-keywords.csv`, `ai-prompt-test-register.csv`, `conversion-events.md` | A. Baseline spreadsheet (keywords, AI prompts, conversion events; indexed URLs = `sitemap.xml`) |
| `task-board.csv` | B. Task board: priority, owner, deadline, dependency, status, proof |
| `content-plan-30-day.md` | D. 30-day bilingual content plan |
| `reputation-verification-plan.md` | E. Reputation and case-study verification plan |
| `paid-media-recommendation.md` | F. Paid-media recommendation and approval points |
| `weekly-update-template.md` | G. Weekly update and monthly dashboard template |
| `competitor-matrix.md` | Section 5 comparison matrix (internal, unpublished) |

## 1. Built in this release

| Brief item | What changed | Proof |
|---|---|---|
| 1. One primary identity | Organization and WebSite schema, `og:site_name` on every page and `llms.txt` now say **OET with Dr Ahmed Hesham**; "OET with Dr Hesham", "Dr Hesham OET" and the Arabic forms are `alternateName`. Page titles keep the short recognised forms. Header, footer and logo are unchanged (owner-approved chrome) | `site/src/data/person.json`; `verify.mjs` fails if a page disagrees |
| 2 and 4. One dated source of truth | New page `/official-information.html` and `/ar/official-information.html`: identity, official links (website, app, App Store, Google Play, WhatsApp, email, social), teaching, courses with prices from the data files, results, and 14 answers (13 in Arabic) with FAQ schema. Linked from About, Contact, Success Stories, Teaching Approach, the courses hub, six course pages, the practice, mock, Writing and Speaking pages, five Arabic pages, `llms.txt` and the sitemap | The page; `verify.mjs` checks every official link is on it |
| 4. Answer-ready pages | The same page answers: official website / WhatsApp / app, who Dr Ahmed Hesham is, OET affiliation, are results genuine, which course for a nurse, what is included, how live virtual patient Speaking works, what recall-based practice means, how to enrol, what is free, how we compare, who is behind the business | FAQ JSON-LD matches the visible text (verify gate) |
| 7. App-to-web | App Store and Google Play links on 20 more pages (trust, course and Arabic pages), in addition to the header, footer and pricing | `oet-official-strip` in the page source |
| 3 and 9. Conversion events | Google Play clicks are now measured (`android_download_click`); App Store links without the data attribute are measured too. Full list in `conversion-events.md` | `assets/js/oet-analytics.js` |
| 4. Crawler access | `robots.txt` now also names `OAI-AdsBot` (ChatGPT ad landing-page validation) and `Googlebot`. Live test on 19 Nov 2026: OAI-SearchBot, OAI-AdsBot, GPTBot, ChatGPT-User, Googlebot, bingbot, PerplexityBot, ClaudeBot and Claude-SearchBot user agents all receive HTTP 200 on `/`, `/pricing.html`, `/robots.txt` and `/ar/` (no firewall or CDN block by user agent) | `robots.txt` |
| 5. Unsourced counters | The homepage counters (doctors reached, orientation views, Telegram members, free community) now link to the public channel they come from (owner decision 19 Nov 2026) | `site/src/partials/index/main.html` |
| 3. Country-led pages | Six country pages in English and Arabic (owner decision 19 Nov 2026, ahead of demand data): `/oet-course-egypt.html`, `-saudi-arabia`, `-uae`, `-qatar`, `-kuwait`, `-oman` and the same under `/ar/`. Each has the OET venues listed for that country, formats, Speaking mode, the fee, what the local licensing authority's own pages say about English tests, the scores regulators abroad ask for, how the course works from there, FAQ schema and its official sources. Facts were read on primary sources on 19 Nov 2026 and are recorded in `country-research/` | The pages; `country-research/*.md` |
| 1. Course accuracy | The Complete OET Bundle description now uses the live checkout wording (owner decision 19 Nov 2026) | `bundles.json`, verify gate |
| 5. Recalls | One careful answer on the official page (owner decision 19 Nov 2026). Still no recalls landing page (owner decision 8 Nov 2026) | The page |

## 2. Checked and already in place (no change needed)

| Brief item | Evidence |
|---|---|
| Canonicals, sitemap, hreflang, one H1, unique titles and descriptions, redirects | `verify.mjs` (102 pages pass); live: `http://` and `www.` return 301 to `https://oetwithdrhesham.co.uk/` |
| Structured data: Organization, Person / ProfilePage, Course, BreadcrumbList, Article, VideoObject, FAQPage; no rating markup | `verify.mjs` forbids `aggregateRating` and `review` and checks each type |
| Success Stories counter, filters and totals | Static HTML, year tabs and the script all read the same manifest: 1,750 cards (2021: 8, 2022: 123, 2023: 292, 2024: 882, 2025: 264, 2026: 181). 24 cards are in the HTML for crawlers. Year filters have shareable URLs (`/success-stories.html#year-2025`) |
| High-intent pages | `/service.html`, `/oet-writing-correction.html`, `/oet-speaking-practice-online.html`, `/oet-mock-test.html`, `/oet-practice.html`, six profession pages, five Arabic course pages |
| Course accuracy vs live checkout | 19 Nov 2026: all 15 live bundles in `GET api.oetwithdrhesham.co.uk/v1/catalog/bundles` match the site for price, access months, plan code and description (Ultimate carries its profession in the live name, by design) |
| Store links | The App Store listing resolves (301 to the regional store); Google Play returns 200; no TestFlight link on any page (verify gate) |
| AI discovery files | `llms.txt`, `llms-full.txt`, `feed.xml`, IndexNow key |
| Claims | No "only provider", "highest-rated" or "guaranteed pass" wording on any page; the only "guarantee" text is the Terms saying no score is guaranteed |

## 3. Findings that need the owner

1. **"Rated 5.0 on Google" badge**: kept as it is (owner, 19 Nov 2026). No Google Business Profile exists yet; when one does, send the link and review count and the badge is linked.
2. **Kuwait licensing rules**: no official Kuwait source could be opened from outside Kuwait, so the Kuwait page says so and makes no local licensing claim. Someone on a Kuwait network should read the pages listed in `country-research/kuwait.md`.
3. **Country page facts to re-check by eye**: venue lists come from the OET venue finder on 19 Nov 2026 and change; the UAE venue addresses were not opened; MOHAP's own service pages and the DOH exam provider could not be read (not stated on the page).
4. **Profession filters on Success Stories**: the manifest has year and platform only. Per-card profession (and grade) needs the owner's data.
5. **Credentials**: not added (owner, 19 Nov 2026: not now).
6. **X, TikTok, Facebook Page**: no URLs given; only the channels already on the site are listed as official.
7. **Comparison pages naming competitors**: not built (needs owner approval). `competitor-matrix.md` stays internal; El Ghazouli unknown, Dr Ahmed El Gendy merged with OET Ultimacy (owner, 19 Nov 2026: leave as is).
8. **Arabic prompts**: P2 and P9 in `ai-prompt-test-register.csv` and the Arabic keywords are proposals (the Arabic brand forms were confirmed by the owner on 19 Nov 2026).

## 4. Not possible from this repository (owner or agency)

Search Console and Bing exports, Core Web Vitals field data, rankings by country, running the AI prompt set in ChatGPT / Gemini / Claude / Perplexity / Grok / Copilot / Kimi / DeepSeek, social profile optimisation, App Store and Google Play listing edits, review collection, outreach and any paid campaign. Each has a row in `task-board.csv` and a prepared template in this folder.

## 5. Deploy

Standard deploy (AGENTS.md). After it: request indexing for `/official-information.html`, `/ar/official-information.html` and the twelve country pages in Search Console, then
`cd site && OET_INDEXNOW_KEY=<key> node scripts/postbuild.mjs --indexnow`.
