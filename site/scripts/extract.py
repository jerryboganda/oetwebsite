#!/usr/bin/env python3
"""ONE-SHOT migration extractor (already executed — do not re-run casually).

Splits the 23 live HTML pages at the repo root into Astro layout + components +
raw partials under site/src/. After this ran, site/src became the source of
truth and the root pages became build outputs (npm run build).

Per page it writes  src/partials/<key>/
  meta.html        head tokens before the first core CSS link (title/meta/OG/canonical)
  head-extra.html  head tokens after core CSS (inline styles, JSON-LD, extra links)
  main.html        body content between </header> and <footer>
  tail.html        post-footer scripts/popups minus community popup + uniform trailing scripts

Chrome (header/footer/community popup) comes from about.html (canonical) with
approved unifications:
  - "Packages & Offers" submenu -> pricing.html (index.html variant, best-of)
  - data-oet-inline-video attrs kept (fixes success-stories drift)
  - footer keeps Contact link (fixes contact.html drift)
  - pricing-only "#apps" nav items are prop-driven (showApps)
  - popup video resources get real youtu.be hrefs + target/rel (success-stories
    variant, best-of: JS still intercepts for inline play, no-JS falls back)
URL policy: every root-relative reference (assets/, page.html, folder/,
contact.php) is rewritten to root-absolute (/assets/, /page.html, ...) and all
<base href="/"> tags are dropped; ?v= hashes on css/js are stripped (postbuild
re-adds them from content hashes). This fixes 404.html-at-depth and legal-page
resolution without <base> footguns.
"""
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = os.path.join(ROOT, "site")
SRC = os.path.join(SITE, "src")

# (source file, partial key, astro page path)
PAGES = [
    ("404.html", "404", "404.astro"),
    ("about.html", "about", "about.astro"),
    ("australia-pathway-guide.html", "australia-pathway-guide", "australia-pathway-guide.astro"),
    ("contact.html", "contact", "contact.astro"),
    ("faq.html", "faq", "faq.astro"),
    ("gulf-pathway-guide.html", "gulf-pathway-guide", "gulf-pathway-guide.astro"),
    ("index.html", "index", "index.astro"),
    ("oet-listening-tips.html", "oet-listening-tips", "oet-listening-tips.astro"),
    ("oet-materials-support.html", "oet-materials-support", "oet-materials-support.astro"),
    ("oet-reading-tips.html", "oet-reading-tips", "oet-reading-tips.astro"),
    ("oet-speaking-tips.html", "oet-speaking-tips", "oet-speaking-tips.astro"),
    ("oet-tips.html", "oet-tips", "oet-tips.astro"),
    ("oet-writing-tips.html", "oet-writing-tips", "oet-writing-tips.astro"),
    ("pricing.html", "pricing", "pricing.astro"),
    ("service.html", "service", "service.astro"),
    ("success-stories.html", "success-stories", "success-stories.astro"),
    ("teaching-approach.html", "teaching-approach", "teaching-approach.astro"),
    ("uk-pathway-guide.html", "uk-pathway-guide", "uk-pathway-guide.astro"),
    ("usa-pathway-guide.html", "usa-pathway-guide", "usa-pathway-guide.astro"),
    ("cookie-policy/index.html", "cookie-policy", "cookie-policy/index.astro"),
    ("privacy/index.html", "privacy", "privacy/index.astro"),
    ("refund-policy/index.html", "refund-policy", "refund-policy/index.astro"),
    ("terms/index.html", "terms", "terms/index.astro"),
]

PAGE_FILES = [p[0] for p in PAGES if "/" not in p[0]] + ["login.html"]
FOLDER_ROUTES = ["cookie-policy", "privacy", "refund-policy", "terms"]

CORE_LINKS = {  # css marker -> layout always emits it?
    "bootstrap.purged.min.css": True,
    "swiper-bundle.min.css": False,   # flag: swiperCss
    "oet-icons.css": True,
    "plugins/sal.css": False,         # flag: salCss
    "style.min.css": False,           # flag: styleCss (service.html omits it + font preloads)
    "oet-common.css": True,
    "oet-cookie-consent.css": True,
}
FONT_PRELOADS = ("mulish-latin-var.woff2", "cal-sans-latin.woff2")
TRAILING_SCRIPTS = ("oet-analytics.js", "oet-cookie-consent.js", "oet-search.js")

HEAD_TOKEN = re.compile(
    r"<!--[\s\S]*?-->|<title>[\s\S]*?</title>|<style[\s\S]*?</style>"
    r"|<script[\s\S]*?</script>|<link[^>]*>|<meta[^>]*>|<base[^>]*>"
)


def read(p):
    return io.open(os.path.join(ROOT, p), encoding="utf-8", newline="").read()


def write(relpath, text):
    p = os.path.join(SRC, relpath)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    io.open(p, "w", encoding="utf-8", newline="\n").write(text)


def absolutize(text):
    """Rewrite root-relative URLs to root-absolute; strip css/js ?v= hashes."""
    # assets/... after a quote or open paren (attrs, srcset first item, url(), JS literals)
    text = re.sub(r'((?<=["\'(]))assets/', "/assets/", text)
    # subsequent srcset entries: ", assets/..."
    text = re.sub(r"(,\s*)assets/(?=img/)", r"\1/assets/", text)
    # known page files and PHP endpoints
    page_alt = "|".join(re.escape(p) for p in PAGE_FILES + ["contact.php"])
    text = re.sub(r'((?:href|action)=")(%s)(["?#])' % page_alt, r"\1/\2\3", text)
    # folder routes referenced relatively:  href="privacy/..."
    folder_alt = "|".join(re.escape(f) for f in FOLDER_ROUTES)
    text = re.sub(r'(href=")(%s)/' % folder_alt, r"\1/\2/", text)
    # strip content-hash cache busters on css/js (postbuild re-adds)
    text = re.sub(r"(/assets/(?:css|js)/[^\"'?]+\.(?:css|js))\?v=[0-9a-f]+", r"\1", text)
    return text


def div_block(src, start_pat):
    """Return (start, end) span of a <div ...>...</div> block found by start_pat."""
    m = re.search(start_pat, src)
    if not m:
        return None
    depth = 0
    for t in re.finditer(r"<div\b[^>]*>|</div>", src[m.start():]):
        depth += 1 if t.group(0).startswith("<div") else -1
        if depth == 0:
            return (m.start(), m.start() + t.end())
    raise SystemExit("unbalanced divs for " + start_pat)


def classify_link(tag):
    for marker in CORE_LINKS:
        if marker in tag:
            return marker
    return None


def split_head(head_inner, fname):
    """Return (meta_html, extra_html, flags). Drops core bits + comments."""
    tokens = []
    for m in HEAD_TOKEN.finditer(head_inner):
        t = m.group(0)
        if t.startswith("<!--"):
            kind = "comment"
        elif t.startswith("<meta charset") or 'name="viewport"' in t:
            kind = "core"
        elif t.startswith("<base"):
            kind = "base"
        elif t.startswith("<link") and ('rel="icon"' in t or 'rel="shortcut icon"' in t):
            kind = "core"  # layout emits unified favicon pair
        elif t.startswith("<link") and 'rel="preload"' in t and any(f in t for f in FONT_PRELOADS):
            kind = "core"
        elif t.startswith("<link") and classify_link(t):
            kind = "css:" + classify_link(t)
        else:
            kind = "keep"
        tokens.append((m.start(), kind, t))

    flags = {"swiperCss": False, "salCss": False, "styleCss": False, "hasBase": False}
    required_seen = set()
    first_css = None
    for s, kind, t in tokens:
        if kind.startswith("css:"):
            marker = kind[4:]
            if first_css is None:
                first_css = s
            if marker == "swiper-bundle.min.css":
                flags["swiperCss"] = True
            elif marker == "plugins/sal.css":
                flags["salCss"] = True
            elif marker == "style.min.css":
                flags["styleCss"] = True
            else:
                required_seen.add(marker)
        elif kind == "base":
            flags["hasBase"] = True
    missing = [m for m, req in CORE_LINKS.items() if req and m not in required_seen]
    if missing:
        raise SystemExit("%s missing required core css: %s" % (fname, missing))

    meta_parts, extra_parts = [], []
    for s, kind, t in tokens:
        if kind in ("comment", "core", "base") or kind.startswith("css:"):
            continue
        (meta_parts if s < first_css else extra_parts).append(t)
    return "\n    ".join(meta_parts), "\n    ".join(extra_parts), flags


def body_attrs(src, fname):
    m = re.search(r"<body([^>]*)>", src)
    cm = re.search(r'class="([^"]*)"', m.group(1))
    return cm.group(1) if cm else ""


def chrome_spans(src, fname):
    """First <header>..</header> (site chrome; legal pages have an inner
    <header class="oet-legal-intro"> that must stay in main content)."""
    h1 = src.find("<header")
    h2 = src.find("</header>", h1) + len("</header>")
    f1 = src.find("<footer")
    f2 = src.find("</footer>", f1) + len("</footer>")
    if not (0 < h1 < h2 <= f1 < f2):
        raise SystemExit(fname + " chrome boundaries broken")
    return h1, h2, f1, f2


def process_tail(tail, fname):
    """Remove community popup div+script and the 3 uniform trailing scripts."""
    span = div_block(tail, r"<div class=\"oet-community-popup\"")
    if not span:
        raise SystemExit(fname + " missing community popup div")
    tail = tail[: span[0]] + tail[span[1]:]
    m = re.search(r"<script id=\"oet-community-popup-script\">[\s\S]*?</script>", tail)
    if not m:
        raise SystemExit(fname + " missing community popup script")
    tail = tail[: m.start()] + tail[m.end():]
    for marker in TRAILING_SCRIPTS:
        m = re.search(r"[ \t]*<script[^>]*%s[^>]*></script>\n?" % re.escape(marker), tail)
        if not m:
            raise SystemExit("%s missing trailing script %s" % (fname, marker))
        tail = tail[: m.start()] + tail[m.end():]
    tail = re.sub(r"\s*<!--=+ (?:Footer|footer) section End =+-->", "", tail)
    return tail.strip("\n")


def extract_chrome():
    """Canonical header/footer/community popup from about.html + approved fixes."""
    src = read("about.html")
    h1, h2, f1, f2 = chrome_spans(src, "about.html")
    header = src[h1:h2]
    footer = src[f1:f2]

    # 1) "Packages & Offers" submenu entry points at pricing.html (index variant)
    old = ('<li><a href="https://wa.me/447961725989" target="_blank" rel="noopener noreferrer">'
           '<span class="submenu-icon"><i class="fa-solid fa-tags"></i></span>'
           '<span class="submenu-text">Packages &amp; Offers</span></a></li>')
    new = ('<li><a href="pricing.html"><span class="submenu-icon"><i class="fa-solid fa-tags"></i></span>'
           '<span class="submenu-text">Packages &amp; Offers</span></a></li>')
    if header.count(old) != 1:
        raise SystemExit("fa-tags li not found exactly once in canonical header")
    header = absolutize(header.replace(old, new))

    # 2) split points for the prop-driven pricing "#apps" items
    hdr_anchor = '<li><a class="oet-pricing-nav-link" href="/pricing.html">Pricing</a></li>'
    if header.count(hdr_anchor) != 1:
        raise SystemExit("header pricing anchor not found exactly once")
    p1, p2 = header.split(hdr_anchor)
    write("partials/chrome/header-1.html", p1 + hdr_anchor)
    write("partials/chrome/header-2.html", p2)

    footer = absolutize(footer)
    ftr_anchor = '<li><a href="/pricing.html">Pricing</a></li>'
    if footer.count(ftr_anchor) != 1:
        raise SystemExit("footer pricing anchor not found exactly once")
    p1, p2 = footer.split(ftr_anchor)
    write("partials/chrome/footer-1.html", p1 + ftr_anchor)
    write("partials/chrome/footer-2.html", p2)

    tail = src[f2: src.rfind("</body>")]
    span = div_block(tail, r"<div class=\"oet-community-popup\"")
    popup_div = tail[span[0]: span[1]]
    # Best-of: real video hrefs (success-stories variant) so no-JS users reach
    # YouTube; main.js still intercepts any youtu.be href for inline play.
    popup_div, n = re.subn(
        r'href="#" (data-youtube-url="(https://youtu\.be/[^"]+)")',
        r'href="\2" target="_blank" rel="noopener noreferrer" \1',
        popup_div)
    if n != 5:
        raise SystemExit("expected 5 popup video resources, rewrote %d" % n)
    m = re.search(r"<script id=\"oet-community-popup-script\">[\s\S]*?</script>", tail)
    write("partials/chrome/community-popup.html", absolutize(popup_div + "\n\n    " + m.group(0)))


def extract_pricing_data(main_html, head_extra, tail_html):
    """Build src/data/pricing.json from the visible cards + JSON-LD offers."""
    cards = re.findall(
        r'<div class="oet-card-kicker">([^<]*)</div>\s*<h3>([^<]*)</h3>\s*'
        r'<div class="oet-pricing-price"><strong>&pound;(\d+)</strong>', main_html)
    if len(cards) != 48:
        raise SystemExit("expected 48 pricing cards, found %d" % len(cards))
    offers = {}
    for blob in (main_html, head_extra, tail_html):
        for m in re.finditer(r'<script type="application/ld\+json">([\s\S]*?)</script>', blob):
            def walk(o):
                if isinstance(o, dict):
                    if "offers" in o and "name" in o and isinstance(o["offers"], dict):
                        offers[o["name"].strip()] = o["offers"].get("price")
                    for v in o.values():
                        walk(v)
                elif isinstance(o, list):
                    for v in o:
                        walk(v)
            walk(json.loads(m.group(1)))
    data = []
    for kicker, title, price in cards:
        t = title.strip()
        entry = {"kicker": kicker.strip(), "title": t, "price": int(price)}
        if t in offers:
            if str(offers[t]) != price:
                raise SystemExit("price mismatch %s: visible %s vs offer %s" % (t, price, offers[t]))
            entry["structuredData"] = True
        data.append(entry)
    write("data/pricing.json", json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    return len(data), len(offers)


COMPONENTS = {
    "components/Header.astro": """---
import part1 from '../partials/chrome/header-1.html?raw';
import part2 from '../partials/chrome/header-2.html?raw';
const { showApps = false } = Astro.props;
---
<Fragment set:html={part1} />{showApps && (
    <li><a class="oet-pricing-nav-link" href="#apps">Apps</a></li>
)}<Fragment set:html={part2} />
""",
    "components/Footer.astro": """---
import part1 from '../partials/chrome/footer-1.html?raw';
import part2 from '../partials/chrome/footer-2.html?raw';
const { showApps = false } = Astro.props;
---
<Fragment set:html={part1} />{showApps && (
    <li><a href="/pricing.html#apps">Apps</a></li>
)}<Fragment set:html={part2} />
""",
    "components/CommunityPopup.astro": """---
import html from '../partials/chrome/community-popup.html?raw';
---
<Fragment set:html={html} />
""",
    "layouts/Base.astro": """---
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import CommunityPopup from '../components/CommunityPopup.astro';

interface Props {
  meta: string;
  headExtra: string;
  main: string;
  tail: string;
  bodyClass?: string;
  swiperCss?: boolean;
  salCss?: boolean;
  styleCss?: boolean;
  showApps?: boolean;
}

const {
  meta,
  headExtra,
  main,
  tail,
  bodyClass = 'oet-live-site',
  swiperCss = false,
  salCss = false,
  styleCss = true,
  showApps = false,
} = Astro.props;
---
<html lang="en" class="oet-live-site">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <Fragment set:html={meta} />
    <link rel="icon" href="/assets/img/logo/fav-icon.svg" type="image/svg+xml" />
    <link rel="icon" href="/assets/img/logo/fav-icon.png" type="image/png" sizes="64x64" />
    {styleCss && <link rel="preload" href="/assets/fonts/mulish-latin-var.woff2" as="font" type="font/woff2" crossorigin />}
    {styleCss && <link rel="preload" href="/assets/fonts/cal-sans-latin.woff2" as="font" type="font/woff2" crossorigin />}
    <link rel="stylesheet" href="/assets/css/plugins/bootstrap.purged.min.css" />
    {swiperCss && <link rel="stylesheet" href="/assets/css/plugins/swiper-bundle.min.css" />}
    <link rel="stylesheet" href="/assets/css/oet-icons.css" />
    {salCss && <link rel="stylesheet" href="/assets/css/plugins/sal.css" />}
    {styleCss && <link rel="stylesheet" href="/assets/css/style.min.css" />}
    <link rel="stylesheet" href="/assets/css/oet-common.css" />
    <link rel="stylesheet" href="/assets/css/oet-cookie-consent.css" />
    <Fragment set:html={headExtra} />
</head>
<body class={bodyClass || undefined}>
    <a class="oet-skip-link" data-lenis-ignore-anchor href="#main-content">Skip to main content</a>
<!--================= Header section start =================-->
    <Header showApps={showApps} />
<!--================= Header section End =================-->
<Fragment set:html={main} />
<!--================= Footer section start =================-->
    <Footer showApps={showApps} />
<!--================= Footer section End =================-->
<Fragment set:html={tail} />
    <CommunityPopup />
    <script src="/assets/js/oet-analytics.js" defer is:inline></script>
    <script src="/assets/js/oet-cookie-consent.js" defer is:inline></script>
    <script src="/assets/js/oet-search.js" defer is:inline></script>
</body>
</html>
""",
}

PAGE_TEMPLATE = """---
import Base from '{rel}layouts/Base.astro';
import meta from '{rel}partials/{key}/meta.html?raw';
import headExtra from '{rel}partials/{key}/head-extra.html?raw';
import main from '{rel}partials/{key}/main.html?raw';
import tail from '{rel}partials/{key}/tail.html?raw';
---
<Base
  meta={{meta}}
  headExtra={{headExtra}}
  main={{main}}
  tail={{tail}}{props}
/>
"""

PRICING_TEMPLATE = """---
import Base from '../layouts/Base.astro';
import metaRaw from '../partials/pricing/meta.html?raw';
import headExtraRaw from '../partials/pricing/head-extra.html?raw';
import mainRaw from '../partials/pricing/main.html?raw';
import tailRaw from '../partials/pricing/tail.html?raw';
import pricing from '../data/pricing.json';
import { applyPricing } from '../lib/inject.mjs';

// src/data/pricing.json is the single source of truth for package prices:
// visible &pound; amounts AND JSON-LD Offer prices are rewritten at build.
const parts = applyPricing(
  { meta: metaRaw, headExtra: headExtraRaw, main: mainRaw, tail: tailRaw },
  pricing,
);
---
<Base
  meta={parts.meta}
  headExtra={parts.headExtra}
  main={parts.main}
  tail={parts.tail}{props}
/>
"""

STORIES_TEMPLATE = """---
import Base from '../layouts/Base.astro';
import metaRaw from '../partials/success-stories/meta.html?raw';
import headExtraRaw from '../partials/success-stories/head-extra.html?raw';
import mainRaw from '../partials/success-stories/main.html?raw';
import tailRaw from '../partials/success-stories/tail.html?raw';
import stories from '../../../assets/img/success-stories/success-stories.json';
import { applyStoryCounts } from '../lib/inject.mjs';

// Year-tab counts are computed from success-stories.json at build time
// (they were hand-edited HTML before the Astro migration).
const parts = applyStoryCounts(
  { meta: metaRaw, headExtra: headExtraRaw, main: mainRaw, tail: tailRaw },
  stories,
);
---
<Base
  meta={parts.meta}
  headExtra={parts.headExtra}
  main={parts.main}
  tail={parts.tail}{props}
/>
"""


def main():
    extract_chrome()
    for relpath, text in COMPONENTS.items():
        write(relpath, text)

    report = []
    for fname, key, astro_path in PAGES:
        src = read(fname)
        head_inner = re.search(r"<head>([\s\S]*?)</head>", src).group(1)
        meta, extra, flags = split_head(head_inner, fname)
        body_class = body_attrs(src, fname)

        h1, h2, f1, f2 = chrome_spans(src, fname)
        main_html = src[h2:f1].strip("\n")
        main_html = re.sub(r"^\s*<!--=+ (?:Header|header) section End =+-->", "", main_html)
        main_html = re.sub(r"\s*<!--=+ (?:Footer|footer) section start =+-->\s*$", "", main_html)
        tail_html = process_tail(src[f2: src.rfind("</body>")], fname)

        meta, extra = absolutize(meta), absolutize(extra)
        main_html, tail_html = absolutize(main_html), absolutize(tail_html)

        write("partials/%s/meta.html" % key, meta + "\n")
        write("partials/%s/head-extra.html" % key, extra + "\n")
        write("partials/%s/main.html" % key, main_html + "\n")
        write("partials/%s/tail.html" % key, tail_html + "\n")

        depth = astro_path.count("/") + 1
        rel = "../" * depth
        props = []
        if body_class != "oet-live-site":
            props.append('bodyClass="%s"' % body_class)
        if flags["swiperCss"]:
            props.append("swiperCss={true}")
        if flags["salCss"]:
            props.append("salCss={true}")
        if not flags["styleCss"]:
            props.append("styleCss={false}")
        if key == "pricing":
            props.append("showApps={true}")
        props_str = "".join("\n  " + p for p in props)

        if key == "pricing":
            n_cards, n_offers = extract_pricing_data(main_html, extra, tail_html)
            page_src = PRICING_TEMPLATE.replace("{props}", props_str)
            report.append("pricing.json: %d cards, %d structured offers" % (n_cards, n_offers))
        elif key == "success-stories":
            page_src = STORIES_TEMPLATE.replace("{props}", props_str)
        else:
            page_src = PAGE_TEMPLATE.format(rel=rel, key=key, props=props_str)
        write("pages/" + astro_path, page_src)
        report.append("%-28s meta=%-5d extra=%-6d main=%-7d tail=%-6d cls=%r %s%s" % (
            fname, len(meta), len(extra), len(main_html), len(tail_html), body_class,
            "swiper " if flags["swiperCss"] else "", "sal" if flags["salCss"] else ""))

    print("\n".join(report))
    print("OK: %d pages extracted" % len(PAGES))


if __name__ == "__main__":
    main()
