# Design Specification: Candidates App Download Options on Public Website

- **Date**: 2026-08-15
- **Status**: Approved
- **Requirement Reference**: CHANGE 9 - NEW WEBSITE REQUIREMENT (Add Candidates App download options to the public Website - not only the Web App)

---

## 1. Overview & Objectives

Provide a first-class, clearly visible **Download the Candidates App** section on the public marketing website, exposing all 4 official platform releases (Android, iPhone/iPad iOS, Windows, macOS) directly to prospective and enrolled candidates without requiring them to log in or enter the Web App first.

### Key Success Criteria
1. Clearly visible "Download the Candidates App" component matching the visual specification and layout.
2. 4 supported platform cards (Android, iOS, Windows, macOS) with official download destinations.
3. Dual actions:
   - **Download the Candidates App** (platform installer / app store download).
   - **Open the Candidates App** (web app sign-in at `https://app.oetwithdrhesham.co.uk/sign-in?next=/`).
4. Automatic client-side device detection that highlights the visitor's OS and recommends the matching platform while keeping all 4 platforms reachable and selectable.
5. Global navigation placement in Header (desktop and mobile offcanvas) and Footer across all pages.
6. Consistent candidate-centric terminology — complete removal of legacy "Student App" language.
7. Strict Astro single-source-of-truth compliance (`site/src/` -> `npm run build` -> root HTML parity -> verify tests pass).

---

## 2. Platform Downloads & Destinations

| Platform | Card Title | Description | Live Destination URL |
| :--- | :--- | :--- | :--- |
| **Android** | Android | Official Android app/store download. | `https://app.oetwithdrhesham.co.uk/get-app/android-install` |
| **iPhone / iPad** | iPhone / iPad | Official iOS App Store destination. | `https://app.oetwithdrhesham.co.uk/api/download/ios` |
| **Windows** | Windows | Laptop/desktop installer or official Windows destination. | `https://app.oetwithdrhesham.co.uk/api/download/windows` |
| **macOS** | macOS | MacBook/iMac installer or official macOS destination. | `https://app.oetwithdrhesham.co.uk/api/download/mac` |

*Web App Portal URL*: `https://app.oetwithdrhesham.co.uk/sign-in?next=/`

---

## 3. UI Component Architecture & Layout

### 3.1 Structure & Styling
- **Section ID**: `download-app` (with backwards compatibility for `#apps`).
- **Section Container**: `.oet-candidates-apps` styled with gradient background matching the site's modern lavender/mint aesthetic.
- **Eyebrow Tag**: `PUBLIC WEBSITE` badge + `Official applications`.
- **Heading (H2)**: `Download the Candidates App`
- **Subtitle (P)**: `Choose your device. Device detection can highlight the recommended option, but all supported platforms should remain reachable.`
- **Platform Grid**: 2x2 grid on desktop/tablet, single-column responsive on mobile screens.
- **Card Elements**:
  - Platform Icon (SVG).
  - Platform Name (H3).
  - Platform Description (P).
  - Recommendation Badge (Pill tag: "Recommended").
  - Direct clickable action / selection handler.
- **Action Buttons Area**:
  - Primary button: `.oet-btn-download-primary` ("Download the Candidates App" with download icon) pointing directly to the selected/detected platform download.
  - Secondary button: `.oet-btn-open-app` ("Open the Candidates App" with external/arrow icon) pointing to the web app portal.

### 3.2 Device Detection Logic
A lightweight, zero-dependency inline script executes on DOMContentLoaded:
```javascript
function initCandidatesAppDetection() {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  
  let detected = 'windows'; // default fallback
  if (/Android/i.test(ua)) {
    detected = 'android';
  } else if (/iPad|iPhone|iPod/i.test(ua) || (/Macintosh/i.test(platform) && maxTouchPoints > 1)) {
    detected = 'ios';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    detected = 'mac';
  } else if (/Win/i.test(platform) || /Windows/i.test(ua)) {
    detected = 'windows';
  }
  
  selectPlatform(detected);
}
```
- Highlights the detected platform card with `.is-recommended` / `.is-active`.
- Updates the primary button's `href` and `aria-label` to match the selected platform.
- Allows user to click any card to manually select another platform.

---

## 4. Navigation & Placement

### 4.1 Header Navigation
- Update `site/src/components/Header.astro`:
  - Provide a global navigation item "Download App" in the main navigation.
  - Links to `#download-app` on the pricing page.
  - Links to `/pricing.html#download-app` on other pages.
  - Ensure mobile offcanvas menu clones and binds correctly.

### 4.2 Pricing Hero CTA ("How to enrol")
- Primary button: `Open the Candidates App` (`https://app.oetwithdrhesham.co.uk/sign-in?next=/`)
- Secondary button: `Download the Candidates App` (`#download-app`)

### 4.3 Footer Navigation
- In `site/src/components/Footer.astro`:
  - Add link `Download Candidates App` pointing to `/pricing.html#download-app`.

---

## 5. Terminology Cleanup

- Review and replace all occurrences of `Student App` / `student app` in `site/src/partials/pricing/main.html` and any shared partials with `Candidates App` / candidate-oriented wording.
- Assert zero instances of "Student App" remain in website navigation, download labels, installer descriptions, or help text.

---

## 6. Verification & Build Parity

1. Build with `npm run build` in `site/`.
2. Run `node scripts/verify.mjs` to ensure:
   - All 23 pages build cleanly.
   - Asset hashes match and exist on disk.
   - JSON-LD schemas are valid.
   - Sitemap is intact (22 URLs).
   - Pricing count matches `pricing.json`.
3. Run `node scripts/postbuild.mjs --check-root` to confirm root output parity.
4. Verify responsive layout, device detection, and link targets across breakpoints.
