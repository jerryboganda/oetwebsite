# Reputation and case-study verification plan (brief deliverable E)

Drafted 19 Nov 2026. Nothing here is live until the owner approves it.

## 1. What exists today

- 1,750 score cards on `/success-stories.html`, sent by students, with year and source platform. The original files are kept on the server and open from each card.
- Video testimonials on YouTube, linked from the same page.
- No linked third-party review profile. The homepage badge "Rated 5.0 on Google" has no link or count (kept by the owner on 19 Nov 2026).

## 2. Consent and source record (start now, for every new result)

Keep one private sheet, never in the repository. One row per result:

| Field | Note |
|---|---|
| Date received, channel | WhatsApp, Telegram, email |
| Profession, test date, grades | As shown on the card |
| Consent | The student's own message agreeing to publication, with the date. Ask: "May we publish your score card on our website and social channels? We will hide your name, candidate number and photo unless you tell us otherwise." |
| What to hide | Name, candidate number, date of birth, photo: hidden by default |
| Original file | Stored unedited |
| Withdrawal | A student can ask for removal at any time; remove within 7 days and record it |

For the existing archive: cards already hide or show what the student sent. If a student asks for removal, remove the card and its original and rebuild.

## 3. Review request sequence (no incentives, no gating)

1. When a student shares a result: congratulate, ask consent for the score card (above).
2. Two days later: one message with the review link. Wording: "If you have a minute, an honest review helps other candidates decide. Say whatever you think, good or bad." The same message goes to every student, whatever their result or opinion.
3. No reward, discount or extra service for a review or for a star rating. No second reminder after one follow-up.
4. Reply to every review, including critical ones, without disclosing personal details.

Never: buy reviews, write reviews for students, ask only happy students, or offer anything for five stars.

## 4. Review profiles

| Profile | Eligibility to check first | Then |
|---|---|---|
| Google Business Profile | Google requires a real business that serves customers; a service-area business is allowed, a fictitious address is not | If eligible: verify, then link the profile from the 5.0 badge and show the live count. If not eligible: remove the badge |
| Trustpilot | Free to claim for any business with a website | Claim, add the review link to step 2, link the profile from `/official-information.html` |
| App Store and Google Play ratings | Already listed | Use the in-app review prompt at a natural moment (after a completed lesson or a result), never tied to a reward |

## 5. What may be published, and how

- A testimonial on the site carries: profession, month and year, the outcome, and a link to its source when there is one.
- No `aggregateRating` or `review` schema is added to the site (the build fails if it is).
- Every public number (score cards, community size, views) names or links its source. The score-card count is generated from the manifest, never typed.

## 6. Checks before amplifying the 1,750 figure

Done 19 Nov 2026: the static HTML, the year tabs and the script agree (1,750; per-year counts sum to 1,750). To do after deploy, in a real browser: open three cards per year and confirm "Original" opens the untouched file.
