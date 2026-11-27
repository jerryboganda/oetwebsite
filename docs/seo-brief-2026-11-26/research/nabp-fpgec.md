# NABP / FPGEC: OET for Pharmacy and TOEFL iBT (primary-source research)

Researched 27 Nov 2026. Sources: nabp.pharmacy and NABP's own FPGEC Candidate Application Bulletin (hosted by NABP on read.nxtbook.com) only.
Nothing here comes from oet.com, ETS, forums or memory. Where NABP does not state a fact, it is marked **NOT CONFIRMED**.

## How each page was read

| # | Page | Method | Result |
|---|------|--------|--------|
| 1 | News release "NABP Expands Communication Skills Options for FPGEC Certification" | WebFetch + direct HTTP fetch (curl) of the HTML to check wording | Read in full |
| 2 | Help: "Does the OET replace the TOEFL iBT requirement?" | WebFetch + curl | Read in full |
| 3 | Programs page `/programs/foreign-pharmacy/` | WebFetch + curl | Read in full |
| 3b | FPGEC Candidate Application Bulletin, "Step 3: Meet the Communication Skills Requirement" (online flipbook, not a PDF) | WebFetch returned only the title (JavaScript page); the page's raw HTML was fetched with curl and holds the full text. The two score graphics are JPEG images, downloaded and read visually | Read in full |
| 4 | Help: "Where can I take the English language proficiency exam?" (slug `where-can-i-take-the-toefl-exam`) | WebFetch + curl | Read in full |
| 5 | Help: "Does NABP accept Special Home Edition Scores?" | WebFetch + curl | Read in full |
| 6-9 | Other help articles in the category "English Language Proficiency Exams" (list below) | WebFetch (+ curl for dates) | Read in full |

WebSearch was used once (restricted to nabp.pharmacy) only to look for a newer announcement of OET scores; it found none. No cached copies were needed.

Dates: NABP help pages show no visible date. The "published / modified" values below are the `datePublished` / `dateModified` values in each page's own structured data (machine-readable, not visible text). The bulletin section prints "October 2026" at its foot. The news release prints "10-06-26".

Quote accuracy: quotes from the bulletin, pages 2, 3 and the news release were checked against the raw HTML. Quotes marked (WebFetch) were returned by the fetch tool as exact quotes and not re-checked against raw HTML.

## 1. From which date OET Pharmacy is accepted; do earlier tests count?

**CONFIRMED: OET for Pharmacy is accepted from 11 January 2027, for the FPGEE 2027 application cycle and later. OET tests taken before 11 January 2027 do not count, including ones taken in late 2026.**

- "OET for pharmacy results will be accepted beginning January 11, 2027." (Bulletin Step 3) https://read.nxtbook.com/nabp/bulletin/fpgec_bulletin/step_3.html
- "OET results from tests taken before January 11, 2027, will not be accepted." (Bulletin Step 3, same URL)
- "Candidates may take either language proficiency exam starting on January 11, 2027; OET results from tests taken prior to this date will not be accepted." (news release) https://nabp.pharmacy/news/news-releases/nabp-expands-communication-skills-options-for-fpgec-certification/
- "OET Pharmacy results cannot be used for applications for FPGEC Certification in the FPGEE 2026 application cycle." https://nabp.pharmacy/help/does-the-oet-replace-the-toefl-ibt-requirement/
- "OET scores can only be submitted on or after January 11, 2027 and OET exams taken before that date do not qualify." (same help article)
- NABP's own worked examples (same help article): a passing OET score received in December 2026 with an application on 25 January 2027, and a September 2026 score with an application on 20 October 2026. In both: "The OET score will not be accepted with the application."
- "The OET will be accepted for exams taken starting January 11, 2027." https://nabp.pharmacy/programs/foreign-pharmacy/
- Scope: candidates accepted "to sit for Foreign Pharmacy Graduate Equivalency Examination administrations in 2027 and beyond" (news release; the ® mark after "Examination" omitted).

**OET does not replace TOEFL.** Either one satisfies the requirement:
- "No, the current policy remains in place." (help article above, answering "Does the OET replace the TOEFL iBT requirement?")
- "Either computer-based test option may be completed to fulfill this requirement; you do not need to complete both." (Bulletin Step 3)
- No waiver for anyone: "There are no exceptions or waivers to these requirements." (Bulletin Step 3; the preceding sentence says it applies even to US citizens, US residents and native English speakers.)

## 2. OET minimum scores

**NOT PUBLISHED as of 27 Nov 2026 on any NABP page read.** No sub-test value (Listening, Reading, Writing, Speaking) and no grade is stated anywhere. Do not publish a number.

NABP's exact wording:
- "Additional information, including score requirements, will be provided when available." (Bulletin Step 3, section "OET for Pharmacy Score Requirements"; bulletin section dated "October 2026") https://read.nxtbook.com/nabp/bulletin/fpgec_bulletin/step_3.html
- "Minimum score requirements will be posted following the completion of standard setting later in 2026." (news release, 10-06-26)
- "Passing scores will be determined and published by the end of November 2026." https://nabp.pharmacy/help/does-the-oet-replace-the-toefl-ibt-requirement/ (WebFetch)

Checked for a newer announcement: the NABP news-release index shows only two releases after 6 Oct 2026 (27 Oct drug disposal kit, 19 Nov healthcare merchant accreditation), neither about FPGEC. The programs page (modified 12 Nov 2026) still says only "Refer to the Candidate Application Bulletin for score requirements."

Action: re-check the Bulletin Step 3 page and the help article in early December 2026; NABP's own deadline is the end of November 2026.

## 3. TOEFL iBT: current rules

**Minimum scores (CONFIRMED, from the two graphics in Bulletin Step 3, read as images):**

| Scale | Applies to | Reading | Listening | Speaking | Writing |
|-------|-----------|---------|-----------|----------|---------|
| Old ETS scale (0-30 per section) | Graphic titled "TOEFL requirements for FPGEC applications accepted on or after October 25, 2025" | 21 | 22 | 25 | 22 |
| New ETS scale | Graphic titled "FPGEC requirements for TOEFL exams administered on or after January 21, 2026" | 4 | 5 | 5 | 4.5 |

Both graphics print "Scores are valid for 2 years". Image files: `https://read.nxtbook.com/nabp/bulletin/fpgec_bulletin/assets/d2260f96de7b134342921895cac33bd2.jpg` and `.../assets/837d53611f91eb93ccaf041cbfd5792c.jpg`.

Supporting text (Bulletin Step 3):
- "The updated passing scores went into effect October 25, 2025."
- "As of January 21, 2026, ETS is applying a revised score scale to TOEFL iBT results."
- Legacy only (applications submitted before 1 January 2020): "Reading: 22, Listening: 21, Speaking: 26, Writing: 24", new-scale equivalent "Reading: 4.5, Listening: 4.5, Speaking: 5, Writing: 5." These are NOT the current minimums; any page still quoting 22/21/26/24 as current is out of date.

**Validity (CONFIRMED):** "Passing TOEFL iBT scores are accepted as valid for the FPGEC program for 2 years from the date of the administration of the TOEFL iBT." (Bulletin Step 3)

**Single sitting (CONFIRMED):** "Unless you are submitting MyBest Scores (see below), you must complete all four sections of the TOEFL iBT in one testing session." and "If your score is less than the minimum required score in any section, your score report will not be accepted." (Bulletin Step 3)

**MyBest (CONFIRMED, from 1 November 2026, for the 2027 FPGEE administration):**
- "Beginning November 1, 2026, MyBest Scores can be submitted to fulfill the acceptance requirement for the 2027 FPGEE administration." (Bulletin Step 3)
- "MyBest Scores combine your highest score in each section from all valid TOEFL iBTs taken within a rolling 2-year period." (Bulletin Step 3)
- "Yes, you can submit MyBest Scores to meet the acceptance requirement for the 2027 FPGEE administration." https://nabp.pharmacy/help/does-nabp-accept-etss-mybest-scores-for-toefl-ibt/ (WebFetch)
- News release says "Beginning in November 2026" (no day); the bulletin gives the day.

**Timing:** "You must pass the TOEFL iBT before applying for FPGEC certification." (Bulletin Step 3). The programs page words it as: must pass TOEFL iBT or OET "before you can be accepted for the FPGEE."

**Score-scale questions:** "All questions regarding the updated scoring scale should be directed to ETS." https://nabp.pharmacy/help/how-can-i-request-information-regarding-the-new-ets-score-scale/ (WebFetch)

## 4. Home editions and test-centre location

**Home editions (CONFIRMED: not accepted, for OET and TOEFL alike):**
- "We do not accept the OET or TOEFL iBT Special Home Edition scores." https://nabp.pharmacy/help/does-nabp-accept-the-toefl-ibt-special-home-edition-scores/ (WebFetch)
- "The at-home and remotely proctored TOEFL iBT is not accepted by the FPGEC program." (Bulletin Step 3)
- NABP never uses the product name "OET@Home". The exclusion follows from the sentence above and from the bulletin's OET rule below (approved computer-based test centre).

**Location rule: stated for BOTH tests in the bulletin (CONFIRMED). The test must be taken at a test centre in the USA (incl. territories) or Canada.**
- OET: "The OET must be completed in a secure testing environment at an approved computer-based OET testing center, which must be located in an NABP member or associate member jurisdiction" (Bulletin Step 3; first 24 words quoted, the sentence continues by pointing to the jurisdiction list).
- TOEFL: "The TOEFL iBT must be completed in a secure testing environment in an ETS test center, which must be located in an NABP member or associate member jurisdiction." (Bulletin Step 3)
- Jurisdiction list (Bulletin Step 3): the 50 US states, the District of Columbia, Guam, Puerto Rico, the Virgin Islands, and 10 Canadian provinces (Alberta, British Columbia, Manitoba, New Brunswick, Newfoundland and Labrador, Nova Scotia, Ontario, Prince Edward Island, Quebec, Saskatchewan).
- "International test site locations are not accepted by the FPGEC." https://nabp.pharmacy/programs/foreign-pharmacy/ (printed directly after the sentence naming both ETS and OET)

Inconsistency to know about: the help article "Where can I take the English language proficiency exam?" states the location rule for TOEFL only ("TOEFL iBT score reports are only accepted from test centers located in NABP member and associate member jurisdictions.") and for OET says just "Check with OET for exam dates and locations." https://nabp.pharmacy/help/where-can-i-take-the-toefl-exam/ . The bulletin is the governing document and states the rule for OET explicitly, so the website should follow the bulletin.

**OET format (CONFIRMED):** computer-based at an approved test centre (quote above). Paper-based OET is therefore not within the bulletin's wording. NABP does not use the words "paper-based"; say "computer-based at a test centre", do not add "paper is rejected" as an NABP quote.

Consequence for candidates outside North America (Egypt, Gulf, etc.): an OET or TOEFL taken in their home country does not meet the FPGEC rule as written. This is an inference from the quotes above, not a sentence NABP prints.

## 5. Score reporting, deadlines, other points

**OET score reporting to NABP: NOT CONFIRMED.** NABP has not published the mechanism (no institution code, no OET verification step, no named process).
- "For further information on reporting OET Pharmacy results for FPGEC Certification in 2027, contact OET." https://nabp.pharmacy/help/does-the-oet-replace-the-toefl-ibt-requirement/
- The bulletin's "Score Reports" section covers TOEFL only.

**TOEFL score reporting (CONFIRMED):**
- "Use the FPGEC identification number 9103." (Bulletin Step 3)
- "The FPGEC will only accept official score reports received directly from ETS." (Bulletin Step 3)
- "Scores for the four sections must be reported directly to the FPGEC on one official score report." (Bulletin Step 3, non-MyBest route)
- "Important: Ensure your email address matches the email address on file with NABP." (Bulletin Step 3)

**Processing and status (both tests):**
- "It takes approximately 4 weeks for us to process your score after you request the score report." https://nabp.pharmacy/help/did-you-receive-my-toefl-score/ (WebFetch)
- Status is checked in the NABP e-Profile, Document Status section of the current FPGEC application: "Log in to your NABP e-Profile to check if your OET or TOEFL iBT score has been received" (same article, WebFetch).
- "An official score report, along with other required documentation, must be submitted before application evaluation can begin." (Bulletin Step 3)

**Other facts on the programs page** (https://nabp.pharmacy/programs/foreign-pharmacy/; WebFetch summary, wording NOT re-checked against raw HTML, so treat as paraphrase):
- FPGEE minimum passing score is 75.
- After submitting the application, 2 years to meet the acceptance requirements; 2 years from acceptance to take and pass the FPGEE.
- Evaluation takes about 12 weeks; each resubmission can add about 12 weeks.
- FPGEE is given once per year.
- ETS discount code for FPGEC candidates on TOEFL iBT (15%). There is no OET discount mentioned.

**OET score validity: NOT CONFIRMED.** The 2-year validity sentence names only TOEFL iBT; nothing is stated for OET.

**Combining OET sittings: NOT CONFIRMED.** MyBest is a TOEFL feature; NABP says nothing about combining OET sub-tests from different sittings or about any single-sitting rule for OET.

**OET profession: CONFIRMED** as "OET for Pharmacy" in every NABP source. No other OET profession is mentioned.

## 6. Dates shown on each page

| Page | Visible date | Structured-data published | Structured-data modified |
|------|--------------|---------------------------|--------------------------|
| News release (page 1) | 10-06-26 | 2026-10-06 | 2026-11-19 |
| Does the OET replace the TOEFL iBT requirement? (2) | none | 2026-03-05 | 2026-10-05 |
| Programs: Foreign Pharmacy (3) | none | 2020-09-23 | 2026-11-12 |
| Bulletin Step 3 (3b) | "October 2026" | n/a | n/a |
| Where can I take the English language proficiency exam? (4) | none | 2024-02-08 | 2026-10-05 |
| Does NABP accept Special Home Edition Scores? (5) | none | 2020-10-26 | 2026-10-05 |
| Which English language proficiency exam does NABP accept...? | none | 2026-10-05 | 2026-10-05 |
| Does NABP accept ETS's MyBest scores for TOEFL iBT? | none | 2019-06-25 | 2026-11-16 |
| Did NABP receive the score report...? | none | 2024-02-08 | 2026-10-05 |
| How can I request information regarding the new ETS score scale? | none | 2026-03-05 | not captured |

## 7. All NABP help articles on English proficiency (complete category list)

Category: https://nabp.pharmacy/help/categories/foreign-pharmacy/english-language-proficiency-exams/ (7 articles; no further OET article exists there)

1. https://nabp.pharmacy/help/which-english-language-proficiency-exam-does-nabp-accept-for-fpgec-certification/
2. https://nabp.pharmacy/help/does-the-oet-replace-the-toefl-ibt-requirement/
3. https://nabp.pharmacy/help/how-can-i-request-information-regarding-the-new-ets-score-scale/
4. https://nabp.pharmacy/help/where-can-i-take-the-toefl-exam/
5. https://nabp.pharmacy/help/did-you-receive-my-toefl-score/
6. https://nabp.pharmacy/help/does-nabp-accept-the-toefl-ibt-special-home-edition-scores/
7. https://nabp.pharmacy/help/does-nabp-accept-etss-mybest-scores-for-toefl-ibt/

Also found (not read): NABP "Report of the Task Force to Examine the Use of the TOEFL iBT as a Requirement for FPGEC Certification", https://nabp.pharmacy/wp-content/uploads/2026/02/Report-of-the-Task-Force-to-Examine-the-Use-of-the-TOEFL-iBT-as-a-Requirement-for-FPGEC-Certification.pdf . It is background, not the rule; the bulletin is the rule.

## 8. Summary of NOT CONFIRMED items

1. OET minimum scores per sub-test: not published (NABP promised them by end of November 2026; not on the site on 27 Nov 2026).
2. How OET results are reported to NABP (code, verification route, fee): NABP says "contact OET".
3. OET score validity period for FPGEC.
4. Whether OET sub-tests from different sittings can be combined.
5. Whether paper-based OET at a test centre is rejected in so many words (bulletin says "computer-based OET testing center"; no sentence names paper).
6. Which specific OET venues in the USA/Canada are "approved": NABP gives no list.
7. Exact wording of the programs-page deadlines and FPGEE facts in section 5 (summary only, not checked verbatim).

## 9. What the website must not say

- Any OET score or grade "required by NABP" (none exists yet).
- That an OET taken in 2026, or taken outside the USA/Canada, or taken as OET@Home, counts for FPGEC.
- That OET replaces TOEFL, or that OET is accepted "now" (acceptance starts 11 January 2027).
- TOEFL minimums of 22/21/26/24 as current (legacy, pre-2020 applications only). Current: 21/22/25/22 old scale, 4/5/5/4.5 new scale.
