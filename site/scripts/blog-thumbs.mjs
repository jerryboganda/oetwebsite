// Generate the OET Blog card / og:image thumbnails (1200x630 webp) for every
// post in src/data/blog.json into assets/img/blog/<slug>.webp.
// Run from site/:  npm run thumbs   (only needed when a post is added or retitled;
// verify.mjs fails if a post has no thumbnail).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { loadBlog } from '../src/lib/blog.mjs';

const ROOT = path.resolve(process.cwd(), '..');
const OUT = path.join(ROOT, 'assets', 'img', 'blog');
const LOGO = path.join(ROOT, 'assets', 'img', 'logo', 'footer-logo.webp');
const force = process.argv.includes('--force');

const THEMES = {
  writing: ['#4c1d95', '#7c3aed'],
  speaking: ['#3b0764', '#a21caf'],
  reading: ['#1e1b4b', '#4f46e5'],
  listening: ['#134e4a', '#0f766e'],
  'exam-format': ['#1e3a8a', '#2563eb'],
  pathways: ['#831843', '#be185d'],
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if ((line + ' ' + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function svg(post) {
  const [a, b] = THEMES[post.category];
  let size = 66;
  let lines = wrap(post.title, 28);
  if (lines.length > 4) {
    size = 54;
    lines = wrap(post.title, 34);
  }
  if (lines.length > 5) lines = [...lines.slice(0, 4), `${lines[4]}…`];
  const lh = Math.round(size * 1.18);
  const top = 300 - ((lines.length - 1) * lh) / 2;
  const label = post.categoryLabel.toUpperCase();
  const pill = 40 + label.length * 15;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1090" cy="90" r="210" fill="#ffffff" fill-opacity=".06"/>
  <circle cx="1150" cy="560" r="140" fill="#ffffff" fill-opacity=".05"/>
  <rect x="72" y="64" width="${pill}" height="48" rx="24" fill="#ffffff" fill-opacity=".16"/>
  <text x="${72 + pill / 2}" y="96" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="2" fill="#ffffff">${esc(label)}</text>
  ${lines
    .map(
      (l, i) =>
        `<text x="72" y="${Math.round(top + i * lh)}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="700" fill="#ffffff">${esc(l)}</text>`,
    )
    .join('\n  ')}
  <text x="72" y="566" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="#ffffff" fill-opacity=".9">OET Blog · Dr Ahmed Hesham</text>
</svg>`;
}

fs.mkdirSync(OUT, { recursive: true });
const logo = await sharp(LOGO).resize({ width: 240 }).toBuffer();
const { posts } = loadBlog();
let made = 0;
for (const post of posts) {
  const file = path.join(OUT, `${post.slug}.webp`);
  if (fs.existsSync(file) && !force) continue;
  await sharp(Buffer.from(svg(post)))
    .composite([{ input: logo, left: 1200 - 72 - 240, top: 630 - 72 - 68 }])
    .webp({ quality: 82 })
    .toFile(file);
  made += 1;
}
console.log(`blog-thumbs: ${made} generated, ${posts.length - made} already present (use --force to redraw)`);
