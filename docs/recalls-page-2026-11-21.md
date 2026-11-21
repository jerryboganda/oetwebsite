# OET Recalls page: operating guide, brief status and open items (owner brief v2, 21 Nov 2026)

Source: "OET Recalls Page - Implementation Brief (v2)" (Dr Hesham's voice notes of 21 Nov 2026). It supersedes P2 of the SEO brief and v1 of the recalls brief.
Code-level rules for agents: `AGENTS.md` ("OET Recalls page"). History of the earlier "not built" decision: `docs/seo-brief-2026-11-21.md`.

## What shipped

| Piece | Where |
|---|---|
| English page, Arabic page | `site/src/pages/oet-recalls.astro`, `site/src/pages/ar/oet-recalls.astro` + `site/src/partials/oet-recalls/`, `site/src/partials/ar/oet-recalls/` |
| Topics (Block B), dates, header/footer link helper | `site/src/data/recalls.json`, `site/src/lib/recalls.mjs` |
| Styles, click tracking, share card | `assets/css/oet-recalls.css`, `assets/js/oet-recalls.js`, `assets/img/og/og-recalls.png` |
| Nav + footer link, `<html dir>` | `site/src/components/Header.astro`, `Footer.astro`, `site/src/layouts/Base.astro` |
| Sitemap, llms.txt, gates | `site/scripts/postbuild.mjs`, `site/scripts/verify.mjs` |

## Adding the next batch of topics (a small edit)

1. In `site/src/data/recalls.json` add the new month at the top of `months` (or entries to the current one), newest first:
   `{ "skill": "writing" | "speaking", "profession": "<key in professions>", "topic": "<English, one or two sentences>", "hintAr": "<optional one-line Arabic hint>" }`.
2. Drop months older than about two months (at most three groups; the build fails otherwise) and set `"updated"` to today's date. That one value is the JSON-LD
   `dateModified` on both pages, and the file's git date becomes the sitemap `lastmod`.
3. `cd site && npm run build && node scripts/verify.mjs && node scripts/postbuild.mjs --check-root`, commit the regenerated root files, deploy (`AGENTS.md`, "Standard deploy").
4. Freshness is the ranking engine: do this after every OET test date.

## Definition of done (brief section 6)

| # | Item | Status |
|---|---|---|
| 1 | Both pages; `/oet-recalls` and `/ar/oet-recalls` 301 to them | Built. The 301s come from the existing `.htaccess` rule (production already answers 301 for `/oet-passing-score` and `/ar/oet-passing-score`); `verify.mjs` asserts the rule. Not live until deployed. |
| 2 | Landing pages untouched | Done. SHA-256 of `index.html` and `ar/index.html` identical before and after; `verify.mjs` fails if either mentions the page. |
| 3 | Nav (desktop + mobile menu), footer, language switcher | Done on every page except the two frozen landing pages (see below). The mobile menu is the header nav cloned by `main.js`: checked at 375px, the link sits right after "OET Blog". Each version links its sibling. |
| 4 | Titles, descriptions, canonicals, hreflang, OG | Done, asserted verbatim by `verify.mjs`. Canonical host differs from the brief (see below). |
| 5 | Block B shows the first batch grouped by month | Done. The owner pasted the batch in chat on 21 Nov 2026: 14 entries (6 Writing + 8 Speaking, all Medicine) under "November 2026", each with its Arabic hint. See "The first batch" below. |
| 6 | CTA renders, button reaches the app, `recalls_cta_register` fires | Done. Event verified by stubbing `oetAnalytics.track` and clicking on both pages. Not run against live GA4 (needs consent and DebugView). |
| 7 | FAQ visible; FAQPage + BreadcrumbList JSON-LD validate | FAQ and JSON-LD are done and checked structurally by `verify.mjs`. **Not run through validator.schema.org** (external tool, and the page is not public yet). |
| 8 | Disclaimer verbatim above the footer | Done, asserted by `verify.mjs`. |
| 9 | Sitemap (hreflang annotations) and llms.txt | Done. |
| 10 | 375px check, Arabic fully RTL | Done in the built-in browser: no horizontal scroll on either page, `<html dir="rtl">`, main RTL. Desktop checked at 1280px. Not checked on a physical phone or in Safari. |

## Where the brief and the real site differ (and what was done)

1. **Canonical host.** The brief types `https://www.oetwithdrhesham.co.uk/...`. The site, its sitemap and every canonical use the apex `https://oetwithdrhesham.co.uk`, and `www.` answers 301 to the apex (checked live). A `www` canonical would point at a redirect, so the apex is used everywhere (canonical, hreflang, JSON-LD, og:url, sitemap). `verify.mjs` also requires it.
2. **Frozen landing pages vs shared chrome.** The brief says the landing pages must be byte-for-byte unchanged AND that the nav/footer link goes in "the shared header and footer includes". On this site those includes are compiled into every page, including the homepage. The two rules cannot both hold on the homepage, so the frozen rule won: the link appears on every page except `index.html` and `ar/index.html`. A visitor on the homepage does not see "Recalls" in the menu until they open another page. To add it there, the owner lifts the freeze (one line in `Base.astro`).
3. **One shared header and footer, not one per locale.** Arabic pages use the same English header and footer. The link is therefore localised by page language: Arabic pages show "الريكولز" (nav) and "ريكولز OET" (footer) pointing at `/ar/oet-recalls.html`; English pages show "Recalls" and "OET Recalls".
4. **`dir="rtl"` on `<html>`.** Other `/ar/` pages set it on `<main>` only. This page sets it on both, and keeps the untranslated shared chrome left to right with `html[dir=rtl] body{direction:ltr}`.
5. **Sitemap annotations.** The brief says to match the pattern "the sitemap already uses for paired pages", but the sitemap had no `xhtml:link` annotations (hreflang lives in each page `<head>`). They were added for this pair only; the `<head>` hreflang follows the site-wide pattern.
6. **Button target.** The brief says "links to https://app.oetwithdrhesham.co.uk (registration)". The button opens `https://app.oetwithdrhesham.co.uk/register`, the actual registration route (the bare root sends signed-out visitors to sign-in).
7. **FAQ answer 4.** Appendix C's JSON-LD answer is shorter than Appendix B's visible answer (it stops at "on our platform."). Both are used verbatim, and `verify.mjs` was relaxed by one final full stop so a visible answer may continue past it.
8. **Arabic text.** The PDF's text layer scrambles lam-alif ligatures and shadda placement (for example "االمتحان"). The Arabic was transcribed from the rendered pages and written with correct orthography. Please have Dr Hesham glance at it, and at the strings the brief did not supply: the Arabic profession and month names, the Block B heading "مواضيع امتحان OET الأخيرة", the FAQ heading "أسئلة شائعة", and the holding line.
9. **`og:locale` / `robots`.** The brief's values were used (`ar_EG`; `index, follow`) although other pages use `ar_AR` and add `max-image-preview:large`.
10. **Exempt from one Arabic-section rule.** Every other Arabic page must link `/ar/oet-sample-tests.html` with a rotating anchor; this page keeps the exact four-block format the owner approved, so it is exempt.

## The first batch (21 Nov 2026)

The owner's paste had 28 lines. Published: the 6 Writing and 8 Speaking entries (Medicine), English text and Arabic hint exactly as supplied. Three decisions the agent made, each easy to reverse:

- **Listening and Reading entries were not published** (4 Listening Part A, 5 Reading Part A, 5 Reading Part C). The approved brief limits the page to Writing and Speaking (its tags, meta description, intro and FAQ all say so), and keeps audio and the rest in the platform. Adding them needs a decision on the copy as well as a new `skill` in `recalls.json`. They were deliberately not copied into this repo.
- **Month.** The batch has no dates, so all 14 are filed under November 2026 (one entry says "Nov 1 sitting"). Move any that belong to October into an `"2026-10"` group.
- **One Arabic hint was left as typed:** "اشتباه مييلوما متعددة" (probably "ميلوما"). Fix it in `recalls.json` if it is a typo.

Until `recalls.json` has entries the page shows a holding line and `verify.mjs` prints a WARN: never deploy in that state (an indexable empty page is the thin filler `docs/editorial-plan.md` forbids).

## Open items for the owner

1. **The 8 Nov concern still applies.** OET treats sharing test content as malpractice. The owner has decided to publish; the agent did not check the OET Preparation Partner terms. The brief's disclaimer wording is canonical.
2. After deploy: request indexing for both URLs in Search Console, check `https://oetwithdrhesham.co.uk/oet-recalls` and `/ar/oet-recalls` answer 301, run both URLs through validator.schema.org, and GA4 DebugView for `recalls_cta_register` (mark it a key event). IndexNow (`postbuild.mjs --indexnow`) is manual and was not run.
