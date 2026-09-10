# SEO / Search Console technical audit — September 2026

Full technical SEO + accessibility audit and fix cycle, driven by real
Search Console API and PageSpeed Insights API data (not guesswork, not a
browser session — see **Tooling** below for how). Commits `d90e61a` →
`64e89db`, all deployed to production the same session.

**Result:** homepage (mobile + desktop) and `pricing.html` (mobile) all
independently verified at **100/100/100 on SEO, Accessibility, and Best
Practices** via a live PageSpeed Insights re-run after deploy, zero scored
failures remaining anywhere.

## Tooling — reuse this, don't recreate it

Everything below was done through `automation/searchconsole/` and a
PageSpeed Insights API key, both already set up and working. **Full setup
docs, CLI usage, and the API's real capability boundaries are in
[`automation/README.md`](../../automation/README.md)** — read that before
re-running any check or (especially) before assuming something needs a
fresh service account / API key. It doesn't; it's already there.

Quick reference:
```
cd ../automation
.venv\Scripts\python.exe -m searchconsole.verify
.venv\Scripts\python.exe -m searchconsole.inspect_urls
```

## What was actually broken (root causes, not symptoms)

- **The sitemap had never been submitted to Search Console.** `robots.txt`
  referenced it, but nobody had ever registered it in GSC, so systematic
  crawl-driven discovery was never running. Fixed via the API
  (`sitemaps().submit()`).
- **`www.oetwithdrhesham.co.uk` served duplicate content** instead of
  redirecting to the apex domain — same nginx-proxy-manager host covered
  both domains with no redirect between them. Fixed at the VPS reverse-proxy
  layer (see [[oet-website-search-console-fix-2026-09]] in project memory
  for the exact NPM `advanced_config` change and DB backup).
- **4 legal pages** (`terms/`, `privacy/`, `refund-policy/`, `cookie-policy/`)
  had zero canonical tag, robots meta, meta description, or structured
  data — literally just a `<title>`. Full parity added, matching every
  other page's pattern.
- **Every single page 404'd on its own favicon** — `Base.astro` referenced
  `/favicon.ico` and a `platform-icon-white-bg.png` that don't exist.
  Repointed to the real `fav-icon.svg`/`.png` files.
- **CSP was silently blocking a vendor font** — swiper's bundled CSS embeds
  an icon font as a `data:` URI, which `font-src 'self'` doesn't cover.
  Fixed in `.htaccess` (`font-src 'self' data:`).
- **42 pricing offers** were missing `returnMethod`/`merchantReturnDays`/
  `returnFees` in their merchant-listing structured data (a Search Console
  warning). Added values that actually match the real refund policy
  (`KeepProduct` + `FreeReturn` + 14 days — refundable until content is
  accessed, digital good so no physical return needed).
- **A full accessibility sweep**, each item found by a real PSI audit and
  confirmed fixed by a second live run afterward, not assumed: heading
  order (stat counters + testimonial names were skipping from h2 straight
  to h4; 7 decorative "eyebrow" labels were headings when they should be
  `<p>`), 13 generic "Read More" links with no descriptive text, a contact
  widget button whose accessible name didn't track its own notification
  badge, insufficient color contrast on the pricing page's app-download
  button (`#6366f1` → `#6063ea`, 4.46:1 → 4.69:1), 69 unsized icon images
  (CLS risk) across 23 pages, and mismatched labels on the desktop header's
  email/phone links.

## What's still genuinely outside API reach

Not a gap in this setup — Google doesn't expose these through any public
API, full stop:

- The aggregate "Page indexing" report and its exact reason breakdown
  (the dashboard's 310-URLs/6-reasons view) — `inspect_urls` in the
  toolkit is the closest substitute (per-URL, not aggregate).
- **Request Indexing** and **Validate fix** — UI-only buttons.
- Manual Actions / Security issues — no API at all.

If any of these need checking, that's the one remaining reason to actually
open the Search Console dashboard in a browser.

## Re-running this later

```
cd automation
.venv\Scripts\python.exe -m searchconsole.inspect_urls   # re-check indexing status
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://oetwithdrhesham.co.uk/&category=performance&category=seo&category=accessibility&category=best-practices&strategy=mobile&key=$(cat credentials/pagespeed-api-key.txt)"
```

If either surfaces something new, that's real signal — this audit's
numbers were independently re-verified against the live site, not assumed.
