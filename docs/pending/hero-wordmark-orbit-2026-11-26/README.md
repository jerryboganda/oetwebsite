# PENDING: homepage hero "Wordmark Orbit" (option D, 26 Nov 2026)

Status: **on hold by the owner** (26 Nov 2026). It was live for a few hours (commit `5afc166`), then the owner asked to keep it
pending and restore the previous hero design with only the new portrait. Do not ship it without the owner's go-ahead.

Files (exactly as they were live):

- `hero-partial.html`: the `<section class="oet-hero">` block for `site/src/partials/index/main.html` (replace the section between
  `<!--===== Hero section start` and `<!--===== Hero section End`).
- `oet-hero.css`: the full replacement for `assets/css/oet-hero.css`.
- `preload.html`: the portrait preload line for `site/src/partials/index/meta.html` (its `imagesizes` must equal the hero `sizes`).

To re-apply it: copy the three pieces into place. Then restore the stricter "Homepage hero" block of `site/scripts/verify.mjs`
from commit `5afc166` (`git show 5afc166:site/scripts/verify.mjs`), rebuild, verify and re-run the browser QA. Decision record,
checks and performance numbers: `docs/hero-2026-11-26.md`.
