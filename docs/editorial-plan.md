# OET Blog editorial plan

Source: UI + SEO redesign brief (26 Oct 2026), section 10. The `/blog/` hub
launched on 27 Oct 2026 with 31 articles: 24 existing guides (skill tips,
writing samples, speaking role-plays, exam-format and pathway guides) and the
7 new articles below.

## Launch articles (published 27 Oct 2026)

| Article | Cluster | Next step it links to |
|---|---|---|
| `/oet-writing-referral-letter-structure.html` | Writing | Writing assessment |
| `/oet-writing-physiotherapy-referral-vs-discharge.html` | Writing / Physio | Physiotherapy course |
| `/oet-reading-part-a-scanning.html` | Reading | Reading practice |
| `/oet-reading-part-c-inference.html` | Reading | Reading practice |
| `/oet-listening-part-a-note-taking.html` | Listening | Listening practice |
| `/oet-speaking-empathy-signposting.html` | Speaking | Speaking practice |
| `/oet-computer-vs-paper.html` | Exam format | Computer-based practice |

The brief's 8th idea ("OET Score Requirements for Nurses and Doctors") is
already covered by `/oet-score-requirements.html`; it is listed in the blog and
must not be duplicated.

Format facts in these articles were checked against oet.com on 27 Oct 2026
(each article lists its sources). Dr Hesham should read each one and add his
own classroom examples where he has better ones.

## Cadence

Aim for **2 useful, editorially reviewed posts per month** if capacity allows.
Refresh an outdated guide before adding a new one on the same topic. Keep the
OET Tips and Pathway pages as evergreen hubs; never copy them word for word
into a blog post, and never mass-produce thin articles for keywords.

## Every post must include

1. A real candidate question and search intent (from WhatsApp, Telegram or class).
2. First-hand teaching examples, clearly labelled when they are practice cases.
3. Clear headings, an "In this guide" list and a key takeaway.
4. Relevant internal links: its skill hub, a related article, the blog.
5. Official citations (oet.com or the regulator) for any test format or score requirement.
6. One meaningful call to action (practice, course or assessment).

Never: guaranteed scores, invented statistics, reviews or dates, visible
"Keywords: ..." lines, or a publication date that is not the real one.

## How to publish (technical)

1. Create `site/src/pages/<slug>.astro` and `site/src/partials/<slug>/{meta,head-extra,main,tail}.html`
   (copy `oet-writing-referral-letter-structure` as the template).
2. Breadcrumb: Home › OET Blog › Category › Title, visible and in BreadcrumbList JSON-LD.
   JSON-LD also needs BlogPosting (real `datePublished`) and, if there is a FAQ,
   a FAQPage whose text is identical to the visible FAQ.
3. Add the slug to `site/src/data/blog.json` (category + 1-2 sentence summary),
   to `PAGES` in `site/scripts/postbuild.mjs` and `site/scripts/verify.mjs`.
4. `cd site && npm run thumbs && npm run build && node scripts/verify.mjs`.
5. After deploy, request indexing for the new URL in Search Console.

## Topic backlog (not yet written)

- OET Writing: discharge letters for nurses, the final request paragraph
- OET Speaking: handling an angry or anxious patient
- OET Reading Part B: workplace extracts and purpose questions
- OET Listening Part B and Part C: following a presentation
- Retaking OET: what to change after a near miss
