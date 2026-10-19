#!/usr/bin/env python3
"""Copy the shared header/footer from index.html into every other page.

index.html is the single source for the layout blocks marked
<!-- layout:header --> ... <!-- /layout:header --> and
<!-- layout:quote --> ... (quote form, optional per page) and
<!-- layout:footer --> ... <!-- /layout:footer -->.
Relative links inside those blocks are written for the site root, so this
script prefixes them with "../" once per directory level of the target page.

Usage:  python3 tools/sync-layout.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLOCKS = ("header", "quote", "footer")
# Relative URLs only: skip absolute, protocol, in-page and data URLs.
URL_ATTR = re.compile(r'(\s(?:href|src))="(?!https?:|//|#|tel:|mailto:|data:|/)([^"]*)"')


def block(html, name, required=True):
    m = re.search(rf"[ \t]*<!-- layout:{name}\b.*?<!-- /layout:{name} -->", html, re.S)
    if not m and required:
        raise SystemExit(f"layout:{name} markers missing")
    return m


def rebase(snippet, depth):
    if depth == 0:
        return snippet
    prefix = "../" * depth

    def fix(m):
        url = m.group(2)
        # "./" and "./#x" mean the home page
        if url == "./" or url.startswith("./#"):
            url = url[2:]
        return f'{m.group(1)}="{prefix}{url}"'

    return URL_ATTR.sub(fix, snippet)


def main():
    source = (ROOT / "index.html").read_text(encoding="utf-8")
    parts = {name: block(source, name).group(0) for name in BLOCKS}

    pages = [p for p in ROOT.rglob("index.html")
             if p != ROOT / "index.html" and not any(s.startswith(".") for s in p.relative_to(ROOT).parts)
             and "tools" not in p.parts]
    for page in sorted(pages):
        depth = len(page.relative_to(ROOT).parts) - 1
        html = page.read_text(encoding="utf-8")
        for name in BLOCKS:
            # header and footer are mandatory; a page may opt out of the quote form
            m = block(html, name, required=name != "quote")
            if not m:
                continue
            html = html[:m.start()] + rebase(parts[name], depth) + html[m.end():]
        page.write_text(html, encoding="utf-8")
        print(f"synced {page.relative_to(ROOT)} (depth {depth})")


if __name__ == "__main__":
    main()
