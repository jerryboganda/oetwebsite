# Design Specification: Candidate Feedback Videos on Public Website

- **Date**: 2026-08-15
- **Status**: Approved
- **Requirement Reference**: CHANGE 10 - PUBLIC WEBSITE SOCIAL PROOF (Add the three Candidate Feedback Videos to the Website and implement them as searchable, responsive video content)

---

## 1. Overview & Objectives

Add three official **Candidate Feedback Videos** to the public **Success Stories** page (`/success-stories.html`) as an interactive, responsive, searchable video subsection with unique summaries, accessible 16:9 embedded players, and valid `VideoObject` Schema.org structured data.

### Key Success Criteria
1. Dedicated section `#candidate-feedback-videos` titled **Candidate Feedback Videos** on `/success-stories.html`.
2. All 3 supplied YouTube video IDs embedded cleanly without tracking query artifacts (`?si=...`):
   - Video 1: `QDjuW_P_ybc` ("Official OET Exam Results & Passing Scorecards")
   - Video 2: `gfm75M2BcHA` ("OET Success Stories: Passing on First Attempt")
   - Video 3: `5wLGH-u12Pc` ("OET Candidate Reviews & Student Feedback")
3. Each video accompanied by a visible heading, short unique descriptive summary/transcript context, and direct link.
4. Valid `VideoObject` Schema.org JSON-LD structured data for all three videos.
5. Fast, mobile-friendly 16:9 player presentation, lazy-loaded iframes, and zero horizontal overflow across mobile/tablet/desktop.
6. Astro single-source-of-truth build parity (`site/src/` -> `npm run build` -> root HTML parity -> verify tests pass).

---

## 2. Video Metadata & Destinations

| Video ID | Title | Summary Excerpt | Embed URL | Thumbnail URL |
| :--- | :--- | :--- | :--- | :--- |
| `QDjuW_P_ybc` | Official OET Exam Results & Passing Scorecards | Real scorecards and verified result breakdowns from candidates who cleared OET with high grades across Medicine and Nursing. | `https://www.youtube.com/embed/QDjuW_P_ybc` | `https://i.ytimg.com/vi/QDjuW_P_ybc/hqdefault.jpg` |
| `gfm75M2BcHA` | OET Success Stories: Passing on First Attempt | First-attempt pass testimonials sharing preparation routines, shorthand note-taking techniques, and exam-day strategies. | `https://www.youtube.com/embed/gfm75M2BcHA` | `https://i.ytimg.com/vi/gfm75M2BcHA/hqdefault.jpg` |
| `5wLGH-u12Pc` | OET Candidate Reviews & Student Feedback | Authentic candidate feedback on writing corrections, speaking role-play coaching, and Dr Hesham's targeted preparation method. | `https://www.youtube.com/embed/5wLGH-u12Pc` | `https://i.ytimg.com/vi/5wLGH-u12Pc/hqdefault.jpg` |

---

## 3. UI Component Architecture & Layout

### 3.1 Structure
```html
<section class="success-videos-section" id="candidate-feedback-videos" aria-labelledby="success-videos-title">
    <div class="container">
        <div class="success-videos-head">
            <span class="success-eyebrow"><i class="fa-brands fa-youtube" aria-hidden="true"></i> Video Testimonials &amp; Results</span>
            <h2 id="success-videos-title">Candidate Feedback Videos</h2>
            <p>Watch doctors, nurses, and healthcare professionals share their real exam scorecards, preparation strategies, and experience passing OET with Dr Ahmed Hesham.</p>
        </div>
        <div class="success-videos-grid" role="list">
            <!-- 3 Video Cards with 16:9 iframe embeds, title, summary, and action links -->
        </div>
    </div>
</section>
```

### 3.2 Responsive Styling
- Container: Grid of 3 columns on desktop (`minmax(0, 1fr)`), 2 columns on tablet, 1 column on mobile.
- Embed container: `aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden;` with `width: 100%`.
- Card container: White card with subtle border, rounded corners (16px), soft shadow, hover elevate effect.

---

## 4. Structured Data (Schema.org)

Add 3 `VideoObject` entries into the existing `@graph` in `site/src/partials/success-stories/head-extra.html`.

---

## 5. Verification Plan

1. Compile with `npm run build` in `site/`.
2. Run `node scripts/verify.mjs` to ensure JSON-LD parses and all 23 pages pass checks.
3. Run `node scripts/postbuild.mjs --check-root` to confirm root output matches dist.
4. Verify responsive layout, video embeds, and accessibility.
