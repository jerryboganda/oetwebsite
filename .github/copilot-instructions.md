# Copilot instructions

Read `AGENTS.md` at the repo root first — it documents the Astro build
architecture (`site/src` is the source of truth; root `*.html` is committed
build output), the build/verify commands, and the production VPS deployment
(185.252.233.186, Docker container `oetwebsite`, docroot
`/opt/docker/oetwebsite`).

Key invariants:

- Never hand-edit root HTML pages or `sitemap.xml`; edit `site/src` partials
  or `site/src/data/pricing.json`, then `cd site && npm run build`,
  `node scripts/verify.mjs`, `node scripts/postbuild.mjs --check-root`.
- Never delete `storage/` or `assets/img/success-stories/originals/` on the
  VPS (live-only data, gitignored).
- The enrollment web app (app./api. subdomains, `/opt/oetwebapp`) is a
  separate system — out of scope for this repo.
