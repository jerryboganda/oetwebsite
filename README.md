# OET with Dr Hesham — Website

Static marketing site for [oetwithdrhesham.co.uk](https://oetwithdrhesham.co.uk)
(OET coaching by Dr Hesham). 23 static pages built with
[Astro](https://astro.build), plus small PHP endpoints for the contact form and
support-chat widget. Enrollment happens in the separate web app at
`app.oetwithdrhesham.co.uk`.

## Architecture

**`site/src` is the source of truth. The repo root is the deployable webroot.**

```
site/src/pages/*.astro      one per page (23) — thin wrappers
site/src/layouts/Base.astro shared document shell (head, chrome, body flags)
site/src/components/        Header / Footer / CommunityPopup (shared chrome)
site/src/partials/<page>/   raw HTML for each page: meta, head-extra, main, tail
site/src/partials/chrome/   unified header/footer/popup markup
site/src/data/pricing.json  single source of truth for package prices
site/src/lib/inject.mjs     build-time data injection (prices, story counts)
site/scripts/postbuild.mjs  cache-bust hashes → sitemap.xml → copy to repo root
site/scripts/verify.mjs     post-build sanity assertions (CI)
site/scripts/parity.py      historical: dist vs pre-migration diff tool
site/scripts/extract.py     historical: one-shot migration extractor (already run;
                            do not re-run — it regenerates partials from root pages)
```

`npm run build` builds `site/dist/` and **overwrites the root HTML pages +
`sitemap.xml`**. Never hand-edit root `*.html` — edit `site/src` and rebuild
(CI fails if root pages drift from build output).

Everything else at the root deploys as-is: `assets/`, PHP endpoints,
`.htaccess`, `robots.txt`, `storage/` (chat threads, never in git),
`login.html` (hand-maintained redirect page, not in Astro).

### Data-driven content

- **Reprice packages**: edit `site/src/data/pricing.json`, rebuild. Visible
  `£` amounts *and* JSON-LD `Offer` prices update together; the build fails
  loudly if the markup drifted.
- **Success-story counts**: year-tab counts, the "Score cards" counter and
  JSON-LD `numberOfItems` are computed from
  `assets/img/success-stories/success-stories.json` at build time. Add new
  stories to that manifest (+ images in `optimized/`, originals stay out of
  git) and rebuild.

## Local development

```bash
cd site
npm ci
npm run dev        # Astro dev server; proxies /assets, /storage and *.php
                   # to http://localhost:8000
```

For the proxy target (and for previewing the built site exactly as deployed),
serve the repo root separately:

```bash
node server.js     # static server on :8000 (no PHP execution)
# or, to exercise the PHP endpoints too:
php -S 127.0.0.1:8000 -t .
```

## Build & verify

```bash
cd site
npm run build      # astro build → postbuild (hash, sitemap, copy to root)
npm run verify     # assert 23 pages, hashed assets, valid JSON-LD, sitemap
```

CI (`.github/workflows/build.yml`) runs build + verify + a root-drift check on
every push/PR.

> Note: the workflow file exists locally but could not be pushed by the
> automation credential (OAuth token lacks the `workflow` scope). Push it once
> from any client with workflow permission:
> `git add .github/workflows/build.yml && git commit -m "ci: add build workflow" && git push`.

## Deployment (current production: VPS 185.252.233.186)

The live site is served from a Docker container on the VPS behind Nginx Proxy
Manager (TLS, HSTS). Layout:

- **Docroot**: `/opt/docker/oetwebsite` — a git checkout of this repo (`main`).
- **Container**: `oetwebsite` (`php:8.3-apache`), compose project
  `oetwebsite-landing` at `/opt/docker/oetwebsite-stack/docker-compose.yml`.
  The compose enables `mod_rewrite`/`headers`/`expires` and mounts
  `htaccess-support.conf` (`AllowOverride All`) so the repo's `.htaccess`
  (caching, compression, security headers, 301s, 404 page) is honoured, plus
  `security.conf` denying `.git`/dotfiles.
- **Kept out of git, live on disk only**: `assets/img/success-stories/originals/`
  (lightbox originals) and `storage/` (chat threads — PII). **Never delete these
  during a deploy.**

Deploy procedure (SSH as root):

```sh
cd /opt/docker/oetwebsite
git fetch origin && git reset --hard origin/main
chown -R www-data:www-data storage
```

If history was rewritten (force-push), first move `assets/img/success-stories/originals`
and `storage` outside the repo, reset, then move them back — files tracked by the
old history get deleted from the worktree on reset.

Container config changes: edit the compose/conf under
`/opt/docker/oetwebsite-stack/`, then `docker compose up -d` from that dir.
SMTP/IMAP env vars (see below) belong in an `environment:` block there —
without them the chat/contact email relay is off and chat send fails
(`mail_transport_failed`).

## Deployment (future: Hostinger Business / LiteSpeed)

1. Build locally (or in CI) and commit the regenerated root pages.
2. Upload the repo root to the webroot **excluding**: `site/`, `server.js`,
   `.git*`, `.github/`, `storage/` (create it server-side, writable),
   `assets/img/success-stories/originals/` (deployed separately, kept out of git).
3. Set the PHP environment variables (hPanel → Advanced → environment or
   `.htaccess SetEnv`): `OET_SMTP_HOST`, `OET_SMTP_PORT`, `OET_SMTP_USERNAME`,
   `OET_SMTP_PASSWORD`, `OET_SMTP_ENCRYPTION`, `OET_SMTP_FROM`,
   `OET_SMTP_FROM_NAME`, `OET_IMAP_HOST`, `OET_IMAP_PORT`, `OET_IMAP_USERNAME`,
   `OET_IMAP_PASSWORD`, `OET_IMAP_ENCRYPTION`, `OET_IMAP_INBOX_MAILBOX`,
   `OET_IMAP_SENT_MAILBOX`, `OET_SUPPORT_EMAIL`, `OET_SUPPORT_NAME`,
   `OET_SITE_URL`.
4. Post-deploy checklist:
   - `curl -I` a page: expect `content-encoding: br|gzip`, security headers
     (CSP, `x-content-type-options`, `referrer-policy`), and long-lived
     `cache-control` on `/assets/...?v=` URLs.
   - A missing URL serves the branded 404 page (`ErrorDocument` works).
   - `https://` + host canonical redirects work (www ↔ apex, http → https).
   - Contact form and chat widget send (SMTP env is correct).
   - `storage/oet-chat/` is writable but **not** listable/downloadable.
   - Old template URLs 301-redirect (spot-check a few from `.htaccess`).

## Analytics (pending IDs)

`assets/js/oet-analytics.js` ships dormant until real IDs are set in its
`CONFIG` block: GA4 measurement ID (loads behind cookie-consent, Consent Mode
v2) and Umami website ID (cookieless, always on). Set both, rebuild, deploy.
