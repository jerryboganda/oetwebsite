# Paid-media recommendation (brief deliverable F)

Drafted 19 Nov 2026. **No campaign is launched and no budget is committed by this document.** It contains no cost or return
figures because there is no baseline yet: GA4 has measured purchases by channel only since 7 Nov 2026, and no keyword-planner or
ad-account data is connected. Estimated ranges must come from the tools named below, not from this file.

## 1. Before any spend (gates)

1. Conversion tracking proven end to end (`conversion-events.md`): a test purchase appears in GA4 with its source.
2. Four weeks of organic baseline: registrations, purchases and revenue per week.
3. The owner sets the most he will pay for one paying student. Without that number there is no stop rule.

## 2. Recommended order

| Step | Channel | Why | Landing page | Needs |
|---|---|---|---|---|
| 1 | Google Search, exact and phrase match | Highest intent; the site already ranks 45 to 72 for the head terms, so ads cover what SEO cannot yet | Profession pages; `/service.html` | Google Ads account; Keyword Planner ranges by country (Egypt, Saudi Arabia, UAE, Qatar, Kuwait, Oman, UK) |
| 2 | YouTube in-feed and Meta (Facebook / Instagram) retargeting | Cheap reach to people who already visited or watched | `/pricing.html`, `/success-stories.html` | Meta Pixel is installed (marketing consent only); original clips and real app screen recordings |
| 3 | TikTok | Only if organic short videos get traction first | `/official-information.html` | Account confirmed by the owner |
| 4 | ChatGPT Ads pilot | New channel; chatgpt.com already sends organic sessions | A profession page | See section 3 |

Competitor brand terms: only where the platform's policy allows, never using a competitor's name in ad text.

## 3. ChatGPT Ads: what to check first

- Whether Ads Manager self-service is open to ProHealth Digital LLC as the US billing entity, and whether education advertisers are eligible: confirm on OpenAI's availability page, not from this file.
- Landing pages are reachable by `OAI-AdsBot`: done (allowed in `robots.txt`; HTTP 200 on 19 Nov 2026).
- UTM tags on every destination; they are carried into the app links automatically.
- An ad is a labelled placement. It does not change what the assistant recommends in its own answer.

## 4. Pilot design (fill in before approval)

| Item | Value |
|---|---|
| Channel and countries | |
| Daily cap and total cap | Owner sets |
| Duration | 14 to 28 days |
| Primary metric | Cost per paying student (GA4 `purchase` by campaign) |
| Secondary | Cost per registration; WhatsApp enquiries |
| Stop rule | Pause when spend reaches twice the allowed cost per paying student with no purchase |
| Go rule | Cost per paying student at or under the owner's limit for two consecutive weeks |

## 5. Approval points

Owner approval is required for: opening each ad account, each budget, each ad that shows a student result or a price, and any ad that names another provider.
