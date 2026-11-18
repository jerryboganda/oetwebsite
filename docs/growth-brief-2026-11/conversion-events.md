# Conversion events (GA4 `G-PM9X3G8S3S`, `assets/js/oet-analytics.js`)

Events are sent only after the visitor accepts analytics cookies, so GA4 undercounts: use Search Console for organic volume.

| Brief requirement | Event | Fires when | Parameters |
|---|---|---|---|
| Sign-up | `app_cta_click` | Any link to `app.oetwithdrhesham.co.uk` (register, sign-in, subscriptions) | `cta`, `package`, `page`, `link_text` |
| WhatsApp click | `click_whatsapp` | Any `wa.me` / WhatsApp link | `page`, `cta`, `link_text` |
| Store click (iOS) | `ios_download_click` | Any App Store link | `placement`, `destination=app-store`, `page` |
| Store click (Android) | `android_download_click` (new 19 Nov 2026) | Any Google Play link | `placement`, `destination=google-play`, `page` |
| Enquiry | `generate_lead` (+ Meta `Lead`) | Contact form sent | `form`, `page` |
| Package interest | `pricing_cta_click`, `view_item` | Pricing card CTA; course page view | `package`; `item_id` |
| Community | `telegram_click`, `video_click`, `chat_open` | Telegram, YouTube, contact widget | `page` |
| Purchase | `purchase` | Sent by the web app's server after checkout (not this repo); carries `session_id` since 7 Nov 2026 | see the web app |
| Referral | GA4 session source / medium, plus `utm_*` carried into app links | Automatic | Filter by hostname: the site and the app share one stream |

To do in GA4 (owner or agency): mark `generate_lead`, `app_cta_click`, `click_whatsapp`, `ios_download_click`, `android_download_click` and `purchase` as key events; register `placement`, `cta`, `package` and `destination` as custom dimensions.

End-to-end test for sign-off: accept cookies, click each link type once with GA4 DebugView open, and complete one test purchase in the app. This has not been run from the repository: it needs GA4 access.
