// "Join Free Community" popup links (components/CommunityPopup.astro renders them into the dialog shell in
// partials/chrome/community-popup.html). One data file, src/data/community.json, owns label, href, icon, section and
// order, so the cards cannot drift from the register in the owner brief of 22 Nov 2026.
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join(process.cwd(), 'src', 'data', 'community.json');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Brand glyphs. Font Awesome classes exist in the subset font (assets/css/oet-icons.css); the others are inline SVGs
// (Instagram and LinkedIn are the Font Awesome Free paths the popup already used; TikTok, Behance and Linktree are Simple Icons, CC0).
const fa = (cls) => `<i class="fa-brands ${cls}" aria-hidden="true"></i>`;
const svg = (viewBox, d) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="22" height="22" fill="currentColor" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;

export const ICONS = {
  whatsapp: { mod: '', html: fa('fa-whatsapp') },
  telegram: { mod: 'telegram', html: fa('fa-telegram') },
  facebook: { mod: 'facebook', html: fa('fa-facebook-f') },
  youtube: { mod: 'youtube', html: fa('fa-youtube') },
  instagram: {
    mod: 'instagram',
    html: svg('0 0 448 512', 'M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z'),
  },
  linkedin: {
    mod: 'linkedin',
    html: svg('0 0 448 512', 'M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z'),
  },
  tiktok: {
    mod: 'tiktok',
    html: svg('0 0 24 24', 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'),
  },
  behance: {
    mod: 'behance',
    html: svg('0 0 24 24', 'M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.595.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.699c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.711.958 1.182.241.579.357 1.203.341 1.83a3.506 3.506 0 0 1-.506 1.961 3.726 3.726 0 0 1-1.503 1.287 3.588 3.588 0 0 1 2.027 1.437c.464.747.697 1.615.67 2.494a4.593 4.593 0 0 1-.423 2.032 3.945 3.945 0 0 1-1.163 1.413 5.114 5.114 0 0 1-1.683.807 7.135 7.135 0 0 1-1.928.259H0V4.084h6.947Zm-.235 12.9c.308.004.616-.029.916-.099a2.18 2.18 0 0 0 .766-.332c.228-.158.411-.371.534-.619.142-.317.208-.663.191-1.009a2.08 2.08 0 0 0-.642-1.715 2.618 2.618 0 0 0-1.696-.505h-3.54v4.279h3.471Zm13.635-5.967a2.13 2.13 0 0 0-1.654-.619 2.336 2.336 0 0 0-1.163.259 2.474 2.474 0 0 0-.738.62 2.359 2.359 0 0 0-.396.792c-.074.239-.12.485-.137.734h4.769a3.239 3.239 0 0 0-.679-1.785l-.002-.001Zm-13.813-.648a2.254 2.254 0 0 0 1.423-.433c.399-.355.607-.88.56-1.413a1.916 1.916 0 0 0-.178-.891 1.298 1.298 0 0 0-.495-.533 1.851 1.851 0 0 0-.711-.274 3.966 3.966 0 0 0-.835-.073H3.241v3.631h3.293v-.014ZM21.62 5.122h-5.976v1.527h5.976V5.122Z'),
  },
  linktree: {
    mod: 'linktree',
    html: svg('0 0 24 24', 'm13.73635 5.85251 4.00467-4.11665 2.3248 2.3808-4.20064 4.00466h5.9085v3.30473h-5.9365l4.22865 4.10766-2.3248 2.3338L12.0005 12.099l-5.74052 5.76852-2.3248-2.3248 4.22864-4.10766h-5.9375V8.12132h5.9085L3.93417 4.11666l2.3248-2.3808 4.00468 4.11665V0h3.4727zm-3.4727 10.30614h3.4727V24h-3.4727z'),
  },
};

const LAYOUTS = new Set(['cards', 'resources']);
// Never a login, account, admin or profile-edit address (owner brief 22 Nov 2026).
const FORBIDDEN_URL = /\/(log-?in|sign-?in|signup|register|accounts?|admin|settings|edit|dashboard)(\/|\?|$)|[?&]next=/i;

let cache;
export function loadCommunity() {
  if (cache) return cache;
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (!Array.isArray(data.sections) || !data.sections.length) throw new Error('community: sections are missing');
  const seenIds = new Set();
  const seenHrefs = new Set();
  for (const s of data.sections) {
    if (!/^[a-z0-9-]+$/.test(s.id || '') || seenIds.has(s.id)) throw new Error(`community: section id "${s.id}" must be a unique slug`);
    seenIds.add(s.id);
    if (!s.title) throw new Error(`community: section ${s.id} needs a title`);
    if (!LAYOUTS.has(s.layout)) throw new Error(`community: section ${s.id} layout must be cards or resources`);
    if (!Array.isArray(s.items) || !s.items.length) throw new Error(`community: section ${s.id} has no items`);
    for (const it of s.items) {
      if (!it.label) throw new Error(`community: an item in ${s.id} has no visible label`);
      if (!/^https:\/\/[^\s"<>]+$/.test(it.href || '')) throw new Error(`community: "${it.label}" needs an https href`);
      if (FORBIDDEN_URL.test(it.href)) throw new Error(`community: "${it.label}" looks like an account, admin, sign-in or edit URL`);
      if (seenHrefs.has(it.href)) throw new Error(`community: "${it.label}" repeats a destination (one card per destination)`);
      seenHrefs.add(it.href);
      if (!ICONS[it.icon]) throw new Error(`community: "${it.label}" uses the unknown icon "${it.icon}"`);
    }
  }
  cache = data;
  return data;
}

function itemHtml(it, layout) {
  const icon = ICONS[it.icon];
  const iconHtml = `<span class="oet-community-popup__icon${icon.mod ? ` oet-community-popup__icon--${icon.mod}` : ''}">${icon.html}</span>`;
  const link = `href="${esc(it.href)}" target="_blank" rel="noopener noreferrer"`;
  if (layout === 'cards') {
    const text = `<span class="oet-community-popup__text"><span class="oet-community-popup__name">${esc(it.label)}</span>` +
      (it.hint ? `<span class="oet-community-popup__hint">${esc(it.hint)}</span>` : '') + '</span>';
    return `<a class="oet-community-popup__card${it.featured ? ' oet-community-popup__card--featured' : ''}" ${link}>${iconHtml}${text}</a>`;
  }
  const video = it.video ? ` data-youtube-url="${esc(it.href)}" data-oet-inline-video="true"` : '';
  return `<a class="oet-community-popup__resource" ${link}${video}>${iconHtml}<span class="oet-community-popup__text"><span class="oet-community-popup__name">${esc(it.label)}</span></span></a>`;
}

/** The sections, in display order, for the dialog body (everything between the intro paragraph and the end of the body). */
export function communityLinksHtml() {
  return loadCommunity().sections.map((s) => {
    const wrap = s.layout === 'cards' ? 'oet-community-popup__grid' : 'oet-community-popup__resources';
    return `<section class="oet-community-popup__section" aria-labelledby="oet-community-${s.id}">` +
      `<h3 class="oet-community-popup__section-title" id="oet-community-${s.id}">${esc(s.title)}</h3>` +
      `<div class="${wrap}">${s.items.map((it) => itemHtml(it, s.layout)).join('')}</div></section>`;
  }).join('\n');
}
