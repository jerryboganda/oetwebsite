# Candidate Feedback Videos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive, accessible "Candidate Feedback Videos" 3-video subsection with 16:9 embedded players, unique summaries, and VideoObject Schema.org structured data to the public Success Stories page (`/success-stories.html`).

**Architecture:** Add CSS styling and VideoObject JSON-LD to `site/src/partials/success-stories/head-extra.html`, add the HTML section to `site/src/partials/success-stories/main.html`, build with Astro pipeline (`npm run build`), and verify with `verify.mjs` and `--check-root`.

**Tech Stack:** HTML5, CSS3, Schema.org JSON-LD, Astro, Node.js verification scripts.

## Global Constraints

- Video 1 ID: `QDjuW_P_ybc`
- Video 2 ID: `gfm75M2BcHA`
- Video 3 ID: `5wLGH-u12Pc`
- Embed base URL: `https://www.youtube.com/embed/{id}`
- Do not include `?si=...` tracking share parameters in player URLs.
- Provide responsive 16:9 aspect ratio and unique descriptive summary for each video.
- Add `VideoObject` structured data for each video.
- Single Source of Truth: Edit only in `site/src/`, never directly hand-edit root `*.html` files.

---

### Task 1: Add Styling & VideoObject Structured Data to `head-extra.html`

**Files:**
- Modify: `site/src/partials/success-stories/head-extra.html`

- [ ] **Step 1: Add CSS for `.success-videos-section`**
Add styles for `.success-videos-section`, `.success-videos-head`, `.success-videos-grid`, `.success-video-card`, `.success-video-embed`, `.success-video-title`, and `.success-video-summary`.

- [ ] **Step 2: Add `VideoObject` JSON-LD Structured Data**
Add 3 `VideoObject` definitions inside `@graph` with name, description, thumbnailUrl, embedUrl, url, and uploadDate.

---

### Task 2: Add Candidate Feedback Videos Section to `main.html`

**Files:**
- Modify: `site/src/partials/success-stories/main.html`

- [ ] **Step 1: Insert section `#candidate-feedback-videos`**
Add the section with the 3 video cards between the hero section and the gallery section.

---

### Task 3: Build & Parity Verification

**Files:**
- Build outputs: `dist/` and root `*.html`

- [ ] **Step 1: Execute Astro build**
Run: `cd site && npm run build`

- [ ] **Step 2: Run verification script**
Run: `node site/scripts/verify.mjs`
Expected: `verify: 23 pages + sitemap + pricing data OK`

- [ ] **Step 3: Run root parity check**
Run: `node site/scripts/postbuild.mjs --check-root`
Expected: `postbuild: root == dist (no drift)`
