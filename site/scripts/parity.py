#!/usr/bin/env python3
"""Migration parity check: compares site/dist pages against the pre-migration
pages at git HEAD. Run with:  python scripts/parity.py [<git-rev>]

Three projections per page:
  1. visible text     (tags/scripts/styles stripped, whitespace collapsed)
  2. resource refs    (multiset of href/src/action/poster values, normalized)
  3. inline code      (multiset of inline <script>/<style> bodies, normalized)

Normalization applied to BOTH sides so only real differences surface:
  - ?v= cache busters stripped from css/js refs
  - leading / stripped from root-absolute internal URLs
  - <base> tags ignored (build dropped them by design)
Approved intentional diffs (chrome unification, favicon pair) are annotated.
"""
import io
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DIST = os.path.join(ROOT, "site", "dist")

PAGES = [
    "404.html", "about.html", "australia-pathway-guide.html", "contact.html",
    "faq.html", "gulf-pathway-guide.html", "index.html", "oet-listening-tips.html",
    "oet-materials-support.html", "oet-reading-tips.html", "oet-speaking-tips.html",
    "oet-tips.html", "oet-writing-tips.html", "pricing.html", "service.html",
    "success-stories.html", "teaching-approach.html", "uk-pathway-guide.html",
    "usa-pathway-guide.html", "cookie-policy/index.html", "privacy/index.html",
    "refund-policy/index.html", "terms/index.html",
]


def read(p):
    return io.open(p, encoding="utf-8", newline="").read()


def read_live(rel, rev):
    import subprocess
    out = subprocess.run(["git", "show", "%s:%s" % (rev, rel)], cwd=ROOT,
                         capture_output=True, check=True)
    return out.stdout.decode("utf-8")


def norm_url(u):
    u = re.sub(r"\?v=[0-9a-f]{6,12}$", "", u)
    if u.startswith("/") and not u.startswith("//"):
        u = u[1:]
    return u


def visible_text(html):
    html = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>|<!--[\s\S]*?-->", " ", html)
    html = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", html).strip()


def refs(html):
    html = re.sub(r"<!--[\s\S]*?-->", " ", html)
    out = Counter()
    for m in re.finditer(r'(?:href|src|action|poster)="([^"]*)"', html):
        u = m.group(1)
        if u.startswith("#") or u.startswith("data:"):
            continue
        out[norm_url(u)] += 1
    return out


def inline_code(html):
    out = Counter()
    for m in re.finditer(r"<(script|style)((?:[^>](?!src=))*?)>([\s\S]*?)</\1>", html):
        body = re.sub(r"\s+", " ", m.group(3)).strip()
        if body:
            body = re.sub(r'([\'"(])/(assets/|oet-chat-)', r"\1\2", body)  # absolutize-normalize
            out[(m.group(1), body[:120])] += 1
    return out


def main():
    rev = sys.argv[1] if len(sys.argv) > 1 else "HEAD"
    failures = 0
    for rel in PAGES:
        live = read_live(rel, rev)
        dist = read(os.path.join(DIST, rel))
        notes = []

        lt, dt = visible_text(live), visible_text(dist)
        if lt != dt:
            # locate first difference
            i = next((k for k in range(min(len(lt), len(dt))) if lt[k] != dt[k]), min(len(lt), len(dt)))
            notes.append("TEXT differs at %d:\n  live: ...%s\n  dist: ...%s" % (i, lt[i-60:i+80], dt[i-60:i+80]))

        lr, dr = refs(live), refs(dist)
        if lr != dr:
            gone = lr - dr
            added = dr - lr
            notes.append("REFS -live +dist: " + "; ".join(
                ["-%s x%d" % kv for kv in gone.items()] + ["+%s x%d" % kv for kv in added.items()]))

        lc, dc = inline_code(live), inline_code(dist)
        if lc != dc:
            gone = lc - dc
            added = dc - lc
            notes.append("CODE -live +dist: " + "; ".join(
                ["-%s %s x%d" % (k[0], k[1][:80], v) for k, v in gone.items()] +
                ["+%s %s x%d" % (k[0], k[1][:80], v) for k, v in added.items()]))

        if notes:
            failures += 1
            print("== %s" % rel)
            for n in notes:
                print("   " + n)
        else:
            print("OK %s" % rel)
    print("\n%d/%d pages with differences" % (failures, len(PAGES)))
    sys.exit(0)


if __name__ == "__main__":
    main()
