# Original UI restored, new OET Blog kept: QA sign-off (27 Oct 2026)

Brief: *OET Website FINAL: Restore Old Menu, Keep New Blog SEO* (V3, 27 Oct 2026),
which supersedes the 26 Oct "UI & SEO Redesign" brief.

## Source of truth for the restore

- The VPS deploy log (`git reflog` in `/opt/docker/oetwebsite`) shows `f1c3af7` live from
  25 Oct until the redesign (`875017d`) went live on 26 Oct 23:04. `f1c3af7` and `6265159`
  (docs only) have identical site files, so `6265159` is the restore baseline.
- This is a selective restore of the visual components only. No rollback or redeploy of an
  older stack. The learner app, checkout, prices and registration are not touched.

## What was restored (the original design)

| Area | Restored from the baseline |
|---|---|
| Header | `chrome/header-1.html`, `header-2.html`, `Header.astro`: original menu (About, Pricing, Download App, OET Courses, Free Resources, Free Placement Test, Contact), "Login / Register" label, original logo and button sizes |
| Header breakpoints | `assets/css/oet-common.css`: inline menu from 1500px again (the redesign used 1200px); hamburger below that |
| Drawer | `chrome/offcanvas.html` = the original drawer block byte for byte ("Contact & Community", "Follow the Journey"); the "Start Free Practice" drawer is gone |
| Footer | `chrome/footer-1.html`, `footer-2.html`, `Footer.astro`: original brand block, social icons, Support, Top Links, Subscribe and legal row. The accordion and column footer is gone |
| Homepage | `partials/index/main.html` and `meta.html`: original hero, About, services, why-choose, process, testimonials, FAQ and CTA |
| Scripts | `assets/js/main.js`: original (the footer accordions and section-highlight code are removed) |
| Styles | `assets/css/oet-redesign.css`: the nav, drawer, footer and homepage-journey rules are removed; only the blog, practice-hub and homepage-blog-section rules remain |

## What was kept (owner-approved exceptions and non-visual SEO)

- **Homepage "Latest from the OET Blog" section, unchanged.** It keeps the lavender
  background, 3 illustrated cards, "View All Articles" and its place before the FAQ. It
  sits in the slot the original homepage used for its blog block.
- **"OET Blog" menu item.** It is a plain top-level link to `/blog/` inside the original
  menu, and the original drawer clones it as one more row. It has no new dropdown, drawer
  or icon system.
- `/blog/` library and all 31 articles, with their URLs, titles, meta, canonicals, Article
  data, BreadcrumbList and visible breadcrumbs (Home › OET Blog › Category), plus the
  `/blog` and old blog-template 301 redirects.
- `/oet-practice.html` stays published: it is in the sitemap and the restored chrome
  styles it.
- Non-layout fixes from the redesign: dead `href="#"` links now point to real URLs (video
  cards, testimonial stars, lightbox), and the OET facts in the Listening tips are
  corrected.
- Two dead `#` links in the original chrome now have real targets, with no visual change:
  "Pathway Guidelines" → `/blog/#pathways`, and "Cookie settings" falls back to
  `/cookie-policy/` when JS is off.

## Evidence

Old (`f1c3af7` served locally) vs restored, pixel comparison, Chrome:

| Check | Result |
|---|---|
| Header 360 / 390 / 430 / 768 / 1366px (home, about) | 0.00% pixel difference; logo, login and menu-button boxes identical |
| Header 1600px | differs only by the added "OET Blog" item |
| Drawer 360–1366px | identical apart from the added "OET Blog" row |
| Footer, non-home pages, 360–1366px | 0.00% |
| Footer on home and pricing | sub-pixel offset only (page height differs by about 1px because of the blog section) |
| Homepage hero, services, why-choose and process sections | 0.00% |
| OET Blog section, before vs after this change | identical (same size ±1px offset; side-by-side images in `compare/`) |

Composites: `docs/qa/2026-10-restore/compare/` (before | restored). Viewport screenshots
at 320 to 1500px: `docs/qa/2026-10-restore/`.

Automated gates, all passing:

- `node scripts/verify.mjs`: 66 pages, sitemap, pricing data, JSON-LD, internal-link
  audit, unique titles and canonicals. It now also asserts the original nav (including
  the plain OET Blog link), the original drawer and the original footer, and fails if
  redesign chrome returns.
- `node scripts/postbuild.mjs --check-root`: root pages equal the build output.
- `node scripts/qa-redesign.mjs` (browser) at 320, 360, 390, 430, 768, 1024, 1366, 1440
  and 1500px:
  - no horizontal overflow on home, blog, two articles, pricing and the practice hub
  - header fits, with "Login / Register" and OET Blog in the menu
  - the original drawer opens and closes, and its submenus expand
  - original footer
  - the homepage blog section has 3 cards on lavender and sits before the FAQ
  - blog search works
  - the signed-in hint switches the CTA to My Dashboard
  - no console errors
- Phone emulation (Galaxy S9+, Pixel 7, iPhone 13, iPhone 14 Pro Max) on home, blog,
  pricing and the practice hub: the viewport meta is `width=device-width,
  initial-scale=1.0`, pages render at device width with no desktop-width shrinking, and
  the login button (44px) and logo are at the original size.

## SEO checklist (unchanged by the restore)

Canonicals, robots meta, `sitemap.xml` (66 URLs), `robots.txt`, unique titles and
descriptions, Article, BreadcrumbList and FAQ JSON-LD, hreflang pairs, and crawlable
internal links all pass `verify.mjs`. The homepage meta description returns to the
original wording, which matches the restored homepage content.

## Not covered here (needs the owner or a real device)

- A real Android Chrome or iPhone Safari device test. Chrome device emulation was used.
- The Search Console baseline (clicks, impressions, indexed pages, top queries) and the
  ownership and sitemap-submission check need Search Console access.
- Owner sign-off on these screenshots before production, as the brief requires.
