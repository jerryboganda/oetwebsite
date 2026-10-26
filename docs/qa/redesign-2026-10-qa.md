# UI + SEO redesign: QA sign-off (27 Oct 2026)

Brief: "OET Website UI + SEO Redesign — Developer Brief v1.0" (26 Oct 2026).
Checked on a local build (`node server.js`, the same files the VPS serves),
**before deployment**. Re-run after deploy against production where noted.

## How to reproduce

```sh
cd site
npm run build
node scripts/verify.mjs                 # 66 pages, sitemap 65 URLs, link audit, SEO + blog gates
node scripts/postbuild.mjs --check-root # root pages == build output
node scripts/qa-redesign.mjs            # real Chrome at 320/360/390/430/768/1024/1440 px
```

All three passed on 27 Oct 2026. Screenshots: `docs/qa/2026-10-redesign/`
(`home-*`, `blog-*`, `practice-*`, `article-*`, `drawer-*`, `footer-*`).

## Acceptance checklist (brief, page 13)

| Item | Result | Evidence |
|---|---|---|
| OET Blog visible in desktop navigation, mobile menu, homepage and footer | Pass | verify.mjs nav/footer/home gates; `drawer-390.jpg`, `home-1440.jpg`, `footer-*.jpg` |
| `/blog/` contains working article cards; each points to a unique article | Pass | 31 cards, verify.mjs checks every `blog.json` URL is built, unique and linked |
| Footer groups: columns on desktop, accessible accordions on phones | Pass | qa-redesign footer checks (`aria-expanded`, panel visibility); `footer-390.jpg`, `footer-1440.jpg` |
| All destinations tested: no broken, irrelevant or placeholder targets | Pass | verify.mjs internal-link audit over all 66 pages (no `#`, no missing pages or `#fragments`) |
| All current app / login / payment functions remain intact | Pass (site side) | Login href unchanged (`sign-in?next=%2F`), signed-in hint cookie swaps both CTAs to the dashboard; pricing/checkout pages untouched |
| Mobile screenshots and Lighthouse / Search Console evidence | Partly | Screenshots attached. Lighthouse and Search Console were **not** run here (no Lighthouse install; no Search Console access). See below. |

## P0 / P1 / P2 summary

- **P0 routes:** `/blog/` is a real index; retired `/blog-*.html` template URLs
  now 301 to `/blog/` (were `/oet-tips.html`); `/blog` → `/blog/`. "Free
  Resources" opens an on-site page (`/oet-sample-tests.html`); Telegram,
  YouTube and Facebook moved out of the menus into "Stay Connected". The footer
  YouTube link labelled "OET Programs" and every `href="#"` (cookie settings,
  pathway menu parent, video thumbnails, testimonial stars, lightbox, 404
  breadcrumb) were replaced with real targets or non-link elements. The
  placement-test page was missing its drawer markup (menu button did nothing);
  the drawer is now shared chrome on every page.
- **P1 visual:** 6-item nav (inline from 1200px), compact "Log in" pill on
  phones, drawer with Start Free Practice + WhatsApp/Contact, 4-group footer,
  2-CTA hero with one H1, homepage consolidated (11 service cards + 9-badge
  marquee → 6 pillars), "7+ OET Skills Covered" corrected to 4 core skills.
- **P2 SEO:** 7 new articles (BlogPosting + BreadcrumbList + FAQPage, official
  sources cited), 24 existing articles re-parented to OET Blog breadcrumbs,
  `/oet-practice.html` hub, sitemap 56 → 65 URLs, unique titles/descriptions
  and self-canonicals enforced by verify.mjs. www → apex and http → https
  already redirect in one hop at the proxy (checked live with `curl -I`).

## Still to do after deploy (needs the owner's accounts)

1. **Lighthouse** on production: home, `/blog/`, one article — mobile profile.
2. **Search Console baseline** (28 days vs previous 28 days): clicks,
   impressions, CTR, top pages, top queries, indexing exclusions, sitemap
   status. Resubmit `sitemap.xml`, request indexing for `/blog/`,
   `/oet-practice.html` and the 7 new articles, and annotate the release date.
   Report real numbers only; no projected improvements.
3. Real-device pass on Android Chrome (menu, footer, free practice, sign-in, blog).
4. Dr Hesham to read the 7 new articles and add classroom examples where he has better ones.
