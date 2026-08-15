# Candidates App Downloads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive, modern "Download the Candidates App" 4-platform section to the public website with client-side device detection, dual CTA actions (Download installer vs. Open web app), global navigation and footer entries, and complete purge of legacy "Student App" terminology.

**Architecture:** Implement the component and styles in `site/src/partials/pricing/`, integrate global navigation in `site/src/components/Header.astro` and `Footer.astro`, compile with Astro build pipeline to generate hashed static assets and synchronized root HTML pages, and verify with `site/scripts/verify.mjs`.

**Tech Stack:** Astro, HTML5, CSS3, Vanilla JavaScript (zero external dependencies for detection), Node.js verification scripts.

## Global Constraints

- Android destination: `https://app.oetwithdrhesham.co.uk/get-app/android-install`
- iOS / iPhone / iPad destination: `https://app.oetwithdrhesham.co.uk/api/download/ios`
- Windows destination: `https://app.oetwithdrhesham.co.uk/api/download/windows`
- macOS destination: `https://app.oetwithdrhesham.co.uk/api/download/mac`
- Web App Portal destination: `https://app.oetwithdrhesham.co.uk/sign-in?next=/`
- Terminology rule: Never use "Student App"; always use "Candidates App" and candidate terminology.
- Single Source of Truth: Edit only in `site/src/`, never directly hand-edit root `*.html` files.

---

### Task 1: Update Pricing Head Styles, Download Section HTML & Device Detection

**Files:**
- Modify: `site/src/partials/pricing/head-extra.html`
- Modify: `site/src/partials/pricing/main.html`
- Modify: `site/src/partials/pricing/tail.html`

**Interfaces:**
- Section anchor: `#download-app` (alias `#apps`)
- Platform cards: `data-platform="android|ios|windows|mac"`
- Buttons:
  - `#oet-download-cta-btn` (primary download button)
  - Secondary button: `Open the Candidates App`

- [ ] **Step 1: Update CSS in `site/src/partials/pricing/head-extra.html`**
Replace `.oet-public-apps` styles with comprehensive `.oet-candidates-apps` CSS supporting card grids, icons, recommended badges, active selection states, hover effects, and responsive breakpoints.

- [ ] **Step 2: Update HTML in `site/src/partials/pricing/main.html`**
- Replace old `#apps` section with new `#download-app` component containing:
  - Eyebrow tag: `PUBLIC WEBSITE` + `Official applications`
  - Title: `Download the Candidates App`
  - Subtitle: `Choose your device. Device detection can highlight the recommended option, but all supported platforms should remain reachable.`
  - 4 Platform cards (Android, iPhone / iPad, Windows, macOS) with descriptions and official live URLs.
  - Action buttons: Primary `Download the Candidates App` and Secondary `Open the Candidates App`.
- Update "How to enrol" section:
  - Replace "student app" with "Candidates App".
  - Update hero CTA buttons: "Open the Candidates App" and "Download the Candidates App".
- Update FAQ answers to say "Candidates App" instead of "student app".

- [ ] **Step 3: Add Device Detection Script in `site/src/partials/pricing/tail.html`**
Add inline `<script>` that detects user OS (Android, iOS, Windows, macOS), highlights the corresponding card with `.is-recommended` / `.is-active`, updates the primary CTA destination, and handles card click/selection.

- [ ] **Step 4: Verify build syntax**
Run `cd site && npm run build` to ensure no syntax errors.

---

### Task 2: Update Header Navigation, Mobile Menu, and Footer

**Files:**
- Modify: `site/src/components/Header.astro`
- Modify: `site/src/components/Footer.astro`
- Modify: `site/src/layouts/Base.astro` (if needed to ensure global navigation consistency)

- [ ] **Step 1: Update `site/src/components/Header.astro`**
Ensure "Download App" is present in the main navigation across all pages:
- On `/pricing.html`: links to `#download-app`
- On other pages: links to `/pricing.html#download-app`

- [ ] **Step 2: Update `site/src/components/Footer.astro`**
Add `<li><a href="/pricing.html#download-app">Download Candidates App</a></li>` under Support / Top Links in the footer.

- [ ] **Step 3: Verify offcanvas mobile menu integration**
Check that `assets/js/main.js` clones the updated navigation into the mobile menu without duplication or layout breakages.

---

### Task 3: Terminology Audit & Purge of Legacy "Student App" References

**Files:**
- Audit & Modify: `site/src/partials/**`

- [ ] **Step 1: Grep codebase for "student app"**
Run grep across `site/src/` to find any leftover "student app" or "Student App" strings.

- [ ] **Step 2: Replace occurrences**
Replace with "Candidates App" or candidate wording as appropriate.

---

### Task 4: Complete Build, Root Synchronization, and Verification

**Files:**
- Build outputs: `dist/` and root `*.html`

- [ ] **Step 1: Execute full Astro build**
Run: `cd site && npm run build`

- [ ] **Step 2: Run verification script**
Run: `node site/scripts/verify.mjs`
Expected: `verify: 23 pages + sitemap + pricing data OK`

- [ ] **Step 3: Run root parity check**
Run: `node site/scripts/postbuild.mjs --check-root`
Expected: `postbuild: root == dist (no drift)`

- [ ] **Step 4: Interactive validation & screenshot proof**
Verify the page in browser, inspect the 4 cards, check device detection auto-selection, test responsive behavior, and capture evidence.
