# Free Community popup update (brief of 22 Nov 2026): status and open items

Source: `Free-Community-Developer-Handoff` (4 pages, "Prepared for Faisal's team", 22 November 2026). Built 23 Nov 2026.

## What the popup does now

`site/src/data/community.json` is the single source of truth for every card (label, href, icon, section, order, hint, featured, video).
`site/src/lib/community.mjs` validates it (https only, unique destinations, known icon, no login / account / admin / edit / `next=` URL)
and renders it; `components/CommunityPopup.astro` drops the result into the dialog shell `partials/chrome/community-popup.html`
(marker `<!--oet:community-links-->`). To add, remove, rename or reorder a card, edit the JSON and nothing else, then rebuild and
update the register in the "Free Community popup" block of `site/scripts/verify.mjs` (it is typed independently on purpose).

23 cards in five sections, in the brief's order:

| Section | Cards |
|---|---|
| Follow & explore | **TikTok** (first), Instagram, **YouTube channel**, **All links (Linktree)** |
| Join a study community | OET Nursing Free Community, Medicine, English Only - Non-Arabic Speakers, Pharmacy, Physiotherapy, Exam Recalls Group 1, Group 2, Main Facebook Group |
| Free orientation & resources | Doctors Arabic, Doctors Non-Arabic, Nursing, **Pharmacy Arabic**, Course Feedback, OET & UK Nursing Live |
| Updates & channels | Official Telegram Channel, Telegram Nursing Channel, Official Facebook Page |
| Professional profiles | LinkedIn, **Behance portfolio** |

Bold = the five additions. Instagram and LinkedIn stay one card each (re-ordered, not duplicated). Indeed is held (brief: no verified
public destination; add it only if Ahmed supplies a public profile link that works signed out). Display labels follow page 2 of the
brief (so "OET Nursing Free Community-New" is now "OET Nursing Free Community", and the Telegram / Facebook labels are shortened).
Every destination of the 18 existing cards is byte-identical to the live modal and to the brief's register (page 3 and 4).

Icons: WhatsApp, Telegram, Facebook and YouTube use the site's Font Awesome subset; Instagram and LinkedIn keep their existing inline
SVGs; TikTok, Behance and Linktree are inline Simple Icons SVGs (CC0, `simple-icons@13`). Every card keeps a visible text label; icons
are `aria-hidden`.

CSS (end of `assets/css/oet-common.css`): section spacing, the brand tiles for TikTok / Behance / Linktree, a visible 3 px focus ring on
cards and the close button, a text wrapper so long labels wrap beside the icon instead of under it, and, below 576 px, the "Featured"
ribbon straddles the card's top edge (found at 320 px: it covered the second line of long titles).

## Checks done 23 Nov 2026 (local, built output)

- `npm run build`, `node scripts/verify.mjs` (new block: every one of the 119 pages must carry exactly the 23 cards, labels, hrefs,
  sections and order of the brief, `target="_blank"` + `rel="noopener noreferrer"`, a brand icon and visible label per card, the
  inline-video attributes on the six `youtu.be` cards only, no Indeed / account / admin / sign-in URL; negative-tested by editing one
  href in `dist`), `node scripts/postbuild.mjs --check-root`: all passed.
- Built page at 390 px and 320 px (emulated): 23 cards, no horizontal overflow, every card at least 44 px tall, no icon / text overlap,
  the close button stays in view while the body scrolls, Escape closes, focus moves to the close button on open and returns to the
  opening button. Desktop (1024 px) looks right.

## Open items for the owner (not done, and not possible from here)

1. **Medicine WhatsApp invite**: the public invite page did not show a group name. Ahmed must open
   `https://chat.whatsapp.com/CeJmvXO5dJA50OKBGtZcuD?mode=gi_t` on his phone and confirm it reaches the Medicine group. Unchanged.
2. **Physiotherapy WhatsApp invite**: the invite on the site (`.../E6AkDZhctn95XP7Do1RYgc?s=cl&p=a&mlu=4&ilr=4`) showed no group name.
   Ahmed previously supplied `https://chat.whatsapp.com/DFjSLSJuP3o4uoXUyKQ56c?s=sh&p=a&iam=2`, which shows an OET Physiotherapy community.
   **Not swapped**: the brief says to confirm the intended current group first. To switch, change that one `href` in `community.json` and the
   matching row of the verify register.
3. Test all seven WhatsApp invites and the TikTok, Instagram, YouTube channel, Linktree and Behance cards signed out on a real phone
   (the brief's last two checklist items). Facebook and LinkedIn were preserved from the site, not re-validated.
4. Indeed: send a public profile link that works signed out, or it stays out.
