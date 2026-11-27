"""Quick structural check for a page's partials before the integrator builds it.
usage (from the repo root): python docs/seo-brief-2026-11-26/check_partial.py <slug> [<slug> ...]   e.g. oet-at-home ar/oet-at-home
It does not replace `npm run build` + `node scripts/verify.mjs`; it catches the common mistakes early."""
import sys, re, json, os, html
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'site', 'src')
ICONS = open(os.path.join(ROOT, 'assets', 'css', 'oet-icons.css'), encoding='utf8').read()
NEW = ['oet-for-pharmacists-usa', 'oet-at-home', 'oet-test-centres', 'oet-paper-test-centres-2027', 'oet-clubbing-rules', 'oet-recognition-by-country',
       'canada-pathway-guide', 'ireland-pathway-guide', 'new-zealand-pathway-guide', 'singapore-pathway-guide',
       'ar/oet-for-pharmacists-usa', 'ar/oet-at-home', 'ar/oet-test-centres', 'ar/oet-paper-test-centres-2027', 'ar/oet-clubbing-rules', 'ar/oet-writing-correction', 'ar/oet-free-resources']
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
MARKERS = re.compile(r'<!--oet:(dates(?: class="[a-z-]+")?|author-box|related-guides|story-count|years|years-word|price:Package \d+|bundle-price:[a-z-]+|venue-directory|paper-2027-directory|venues:[a-z-]+|home-acceptance|clubbing-table|recognition-matrix|data-checked:(?:venues|regulators))-->')


def vis(s):
    s = re.sub(r'<(script|style)[\s\S]*?</\1>', ' ', s)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


class Balance(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.stack = []; self.errors = []; self.h1 = 0; self.ids = {}
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if 'id' in d:
            self.ids[d['id']] = self.ids.get(d['id'], 0) + 1
        if tag == 'h1': self.h1 += 1
        if tag not in VOID: self.stack.append((tag, self.getpos()[0]))
    def handle_endtag(self, tag):
        if tag in VOID: return
        if not self.stack: self.errors.append(f'line {self.getpos()[0]}: </{tag}> with nothing open'); return
        if self.stack[-1][0] == tag: self.stack.pop(); return
        # tolerate implied closes of p / li / td / tr / th / thead / tbody
        names = [t for t, _ in self.stack]
        if tag in names:
            while self.stack and self.stack[-1][0] != tag:
                t, ln = self.stack.pop()
                if t not in ('p', 'li', 'td', 'tr', 'th', 'thead', 'tbody', 'dt', 'dd', 'option'): self.errors.append(f'line {ln}: <{t}> not closed before </{tag}> (line {self.getpos()[0]})')
            self.stack.pop()
        else: self.errors.append(f'line {self.getpos()[0]}: </{tag}> has no matching open tag')


def pages_known():
    v = open(os.path.join(ROOT, 'site', 'scripts', 'verify.mjs'), encoding='utf8').read()
    block = v[v.index('const PAGES = ['):v.index('];', v.index('const PAGES = ['))]
    known = set(re.findall(r"'([^']+\.html)'", block))
    known |= {f'{n}.html' for n in NEW}
    return known


def check(slug):
    errs = []
    d = os.path.join(SRC, 'partials', *slug.split('/'))
    ar = slug.startswith('ar/')
    parts = {}
    for n in ('meta', 'head-extra', 'main', 'tail'):
        p = os.path.join(d, n + '.html')
        if not os.path.exists(p): errs.append(f'missing {n}.html'); continue
        raw = open(p, 'rb').read()
        if raw.startswith(b'\xef\xbb\xbf'): errs.append(f'{n}.html starts with a BOM')
        parts[n] = raw.decode('utf8')
    wrapper = os.path.join(SRC, 'pages', *slug.split('/')) + '.astro'
    if not os.path.exists(wrapper): errs.append(f'missing page wrapper {os.path.relpath(wrapper, ROOT)}')
    elif ar and 'lang="ar"' not in open(wrapper, encoding='utf8').read(): errs.append('Arabic wrapper must pass lang="ar"')
    if len(parts) < 4: return errs
    meta, main = parts['meta'], parts['main']
    allhtml = ''.join(parts.values())
    url = f'https://oetwithdrhesham.co.uk/{slug}.html'
    t = re.search(r'<title>([^<]*)</title>', meta)
    if not t: errs.append('no <title>')
    else:
        title = html.unescape(t.group(1)); lim = 70 if ar else 60
        if len(title) > lim: errs.append(f'title is {len(title)} characters (max {lim}): {title}')
    desc = re.search(r'<meta name="description" content="([^"]*)"', meta)
    if not desc: errs.append('no meta description')
    elif not 110 <= len(html.unescape(desc.group(1))) <= 165: errs.append(f'meta description is {len(html.unescape(desc.group(1)))} characters (aim 120 to 160)')
    if f'<link rel="canonical" href="{url}">' not in meta: errs.append(f'canonical must be {url}')
    if '<meta property="og:site_name" content="OET with Dr Ahmed Hesham">' not in meta: errs.append('og:site_name must be "OET with Dr Ahmed Hesham"')
    b = Balance(); b.feed(main); b.close()
    errs += [f'main.html {e}' for e in b.errors[:12]]
    errs += [f'main.html line {ln}: <{t}> never closed' for t, ln in b.stack[:8]]
    if b.h1 != 1: errs.append(f'main.html has {b.h1} <h1> (need exactly 1)')
    errs += [f'duplicate id "{i}"' for i, n in b.ids.items() if n > 1]
    if not re.search(r'<main id="main-content"', main): errs.append('main.html must contain <main id="main-content" ...>')
    # markers
    for m in re.finditer(r'<!--oet:[^>]*-->', allhtml):
        if not MARKERS.fullmatch(m.group(0)): errs.append(f'unknown build marker {m.group(0)}')
    # icons
    for ic in sorted(set(re.findall(r'\bfa-(?:solid|regular|brands) (fa-[a-z0-9-]+)', allhtml))):
        if f'.{ic}:' not in ICONS and f'.{ic}{{' not in ICONS and f'.{ic},' not in ICONS and f'.{ic}::' not in ICONS: errs.append(f'icon {ic} is not in assets/css/oet-icons.css')
    # style rules
    text = vis(main)
    if '—' in text: errs.append('em dash found in visible text (use a colon, comma or full stop)')
    if re.search(r'\bAI\b', text): errs.append('the word "AI" is not used on candidate-facing pages')
    if '<base ' in allhtml: errs.append('<base> tag')
    # links
    known = pages_known()
    for href in set(re.findall(r'href="(/[^"]*)"', allhtml)):
        path = href.split('#')[0].split('?')[0]
        if path in ('/', '/ar/', '/blog/', '/ar/blog/', '/english-placement-test', '/terms/', '/privacy/', '/refund-policy/', '/cookie-policy/') or path.startswith('/assets/'): continue
        if path.lstrip('/') not in known: errs.append(f'internal link to a page that does not exist: {href}')
    if re.search(r'href="#"', allhtml): errs.append('placeholder link href="#"')
    if ar:
        for href in set(re.findall(r'<a\b(?![^>]*(?:class="oet-ar-en"|hreflang="en"))[^>]*href="(/(?!ar/)[^"#?]*\.html)', main)):
            if f'ar{href}'.lstrip('/') in known or os.path.exists(os.path.join(SRC, 'pages', 'ar', href.strip('/').replace('.html', '.astro'))):
                errs.append(f'Arabic page links the English {href} although an Arabic version exists')
    for a in re.findall(r'<a\b[^>]*href="https?://(?!oetwithdrhesham\.co\.uk|app\.oetwithdrhesham\.co\.uk)[^"]*"[^>]*>', main):
        if 'rel="noopener noreferrer"' not in a or 'target="_blank"' not in a: errs.append(f'external link needs target="_blank" rel="noopener noreferrer": {a[:110]}'); break
    # JSON-LD
    faqs = []
    for blk in re.findall(r'<script type="application/ld\+json">([\s\S]*?)</script>', meta + parts['head-extra']):
        try: data = json.loads(blk)
        except Exception as e: errs.append(f'JSON-LD does not parse: {e}'); continue
        nodes = data.get('@graph', [data]) if isinstance(data, dict) else data
        for n in nodes:
            if n.get('@type') == 'FAQPage': faqs += n.get('mainEntity', [])
            if n.get('@type') == 'BreadcrumbList':
                names = [i.get('name') for i in n['itemListElement']]
                crumbs = re.search(r'<nav class="oet-breadcrumbs"[^>]*><ol>([\s\S]*?)</ol>', main)
                if crumbs and [vis(x) for x in re.findall(r'<li[^>]*>([\s\S]*?)</li>', crumbs.group(1))] != names: errs.append(f'visible breadcrumb != BreadcrumbList {names}')
                if n['itemListElement'][-1].get('item') != url: errs.append('last BreadcrumbList item must be the page URL')
            if n.get('@type') in ('BlogPosting', 'Article', 'WebPage') and 'dateModified' in n and n['dateModified'] < '2026-11-27': errs.append(f'dateModified {n["dateModified"]} should be 2026-11-27')
    norm = lambda s: re.sub(r'\s+', ' ', html.unescape(s)).strip().lower()
    body = norm(text)
    for q in faqs:
        if norm(q['name']) not in body: errs.append(f'FAQ question not visible verbatim: {q["name"][:70]}')
        a = norm(q['acceptedAnswer']['text'])
        if a not in body and a.rstrip('.') not in body: errs.append(f'FAQ answer not visible verbatim: {q["name"][:70]}')
    return errs


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf8')
    bad = 0
    for slug in sys.argv[1:]:
        e = check(slug.replace('\\', '/').strip('/'))
        bad += len(e)
        print(f'{slug}: ' + ('OK' if not e else f'{len(e)} problem(s)'))
        for x in e: print('  - ' + x)
    sys.exit(1 if bad else 0)
