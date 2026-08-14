// @ts-check
import { defineConfig } from 'astro/config';

// Static-output build for oetwithdrhesham.co.uk.
// - `build.format: 'preserve'` keeps the exact URL structure of the live site
//   (about.astro -> about.html, privacy/index.astro -> privacy/index.html).
// - Assets (assets/**, PHP endpoints, .htaccess) live at the repo root and are
//   NOT copied into dist; deploy = dist/**/*.html + repo-root runtime files.
//   During `astro dev`, /assets and PHP requests proxy to the legacy dev
//   server (node ../server.js on :8000).
export default defineConfig({
  site: 'https://oetwithdrhesham.co.uk',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'preserve',
    // Page HTML only; no Astro-generated JS/CSS bundles are expected because
    // pages are raw-HTML partials, but keep any that appear under /assets/astro.
    assets: 'assets/astro',
  },
  compressHTML: false,
  vite: {
    server: {
      proxy: {
        '/assets': 'http://localhost:8000',
        '/storage': 'http://localhost:8000',
        '^/.*\\.php$': 'http://localhost:8000',
      },
    },
  },
});
