// Webinars menu link (owner brief "Webinars Management System", 21 Nov 2026). The webinar directory, event pages and
// registration live in the web app (app.oetwithdrhesham.co.uk/webinars), which is the system of record; this site only links to it.
// Like the Recalls link, it is added to the shared header on every page EXCEPT the two frozen landing pages (layouts/Base.astro),
// and main.js clones the header nav into the mobile menu, so desktop and mobile both get it.
export const WEBINARS_URL = 'https://app.oetwithdrhesham.co.uk/webinars';

const LABELS = {
  en: { text: 'Webinars', lang: '' },
  ar: { text: 'الندوات', lang: ' lang="ar"' },
};
const BLOG_ITEM = '<li><a href="/blog/">OET Blog</a></li>';

/** Add the Webinars <li> directly after the "OET Blog" <li> of the header nav partial. */
export function addWebinarsLink(html, lang) {
  if (html.split(BLOG_ITEM).length !== 2) throw new Error('webinars: expected exactly one "OET Blog" item in the header partial');
  const l = LABELS[lang] ?? LABELS.en;
  return html.replace(BLOG_ITEM, () => `${BLOG_ITEM}<li><a href="${WEBINARS_URL}"${l.lang}>${l.text}</a></li>`);
}
