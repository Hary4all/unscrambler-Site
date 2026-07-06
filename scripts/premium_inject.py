#!/usr/bin/env python3
"""
WordFindLab premium enhancement injector.

Purely ADDITIVE and idempotent. For every *.html page it:
  1. inserts /assets/premium.css   before </head>
  2. inserts /assets/premium.js    before </body>
  3. inserts the .footer-mega nav  before <footer class="site-footer">

Never removes or rewrites existing markup. Safe to re-run.

Usage:
  python3 premium_inject.py [--limit N] [--root PATH]
Prints: files scanned / changed / remaining.
"""
import argparse
import io
import os
import sys

VER = "20260706"

CSS_TAG = '<link rel="stylesheet" href="/assets/premium.css?v=%s">' % VER
JS_TAG = '<script defer src="/assets/premium.js?v=%s"></script>' % VER

FOOTER_MEGA = """<!-- Premium footer navigation (additive) -->
<div class="footer-mega">
  <div class="footer-mega-inner">
    <div class="footer-mega-brand">
      <a class="footer-mega-logo" href="/">WordFind<span>Lab</span></a>
      <p>Free, fast word tools for Scrabble, Wordle, Words With Friends, anagrams, and every word puzzle. No signup, no paywall &mdash; just answers.</p>
      <div class="footer-mega-social">
        <a href="https://www.facebook.com/profile.php?id=61589971622325" target="_blank" rel="noopener noreferrer" aria-label="WordFindLab on Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.4 21v-7.1h2.4l.4-2.8h-2.8V9.3c0-.8.3-1.4 1.4-1.4h1.5V5.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2h-2.4v2.8h2.4V21h3z"/></svg></a>
      </div>
    </div>
    <nav aria-label="Word tools">
      <p class="footer-mega-title">Word Tools</p>
      <ul>
        <li><a href="/">Word Unscrambler</a></li>
        <li><a href="/anagram-solver/">Anagram Solver</a></li>
        <li><a href="/scrabble-word-finder/">Scrabble Word Finder</a></li>
        <li><a href="/wordle-solver/">Wordle Solver</a></li>
        <li><a href="/jumble-solver/">Jumble Solver</a></li>
        <li><a href="/words-with-friends-cheat/">WWF Cheat</a></li>
        <li><a href="/dictionary/">Dictionary</a></li>
      </ul>
    </nav>
    <nav aria-label="Word lists">
      <p class="footer-mega-title">Word Lists</p>
      <ul>
        <li><a href="/2-letter-words/">2 Letter Words</a></li>
        <li><a href="/5-letter-words/">5 Letter Words</a></li>
        <li><a href="/words-starting-with/">Words Starting With</a></li>
        <li><a href="/words-ending-with/">Words Ending With</a></li>
        <li><a href="/words-with/">Words With...</a></li>
        <li><a href="/words-by-length/">Words by Length</a></li>
        <li><a href="/word-lists/">All Word Lists</a></li>
      </ul>
    </nav>
    <nav aria-label="Games and learning">
      <p class="footer-mega-title">Play &amp; Learn</p>
      <ul>
        <li><a href="/crossword-game/">Daily Crossword</a></li>
        <li><a href="/word-search-for-kids/">Kids Word Search</a></li>
        <li><a href="/printable-word-search/">Printable Puzzles</a></li>
        <li><a href="/spelling-games-for-kids/">Spelling Games</a></li>
        <li><a href="/family-word-games/">Family Word Games</a></li>
        <li><a href="/word-of-the-day/">Word of the Day</a></li>
      </ul>
    </nav>
    <nav aria-label="Resources">
      <p class="footer-mega-title">Resources</p>
      <ul>
        <li><a href="/guides/">Guides</a></li>
        <li><a href="/blog/">Blog</a></li>
        <li><a href="/browse/">Browse Words</a></li>
        <li><a href="/trending-words/">Trending Words</a></li>
        <li><a href="/pronunciation/">Pronunciation</a></li>
        <li><a href="/about/">About</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul>
    </nav>
  </div>
</div>
"""

FOOTER_ANCHOR = '<footer class="site-footer">'


def process(path):
    """Returns True if the file was modified."""
    with io.open(path, "r", encoding="utf-8", errors="surrogateescape",
                 newline="") as fh:
        html = fh.read()

    orig = html

    if "premium.css" not in html and "</head>" in html:
        html = html.replace("</head>", CSS_TAG + "\n</head>", 1)

    if "premium.js" not in html and "</body>" in html:
        html = html.replace("</body>", JS_TAG + "\n</body>", 1)

    if "footer-mega" not in html and FOOTER_ANCHOR in html:
        html = html.replace(FOOTER_ANCHOR, FOOTER_MEGA + FOOTER_ANCHOR, 1)

    if html != orig:
        with io.open(path, "w", encoding="utf-8", errors="surrogateescape",
                     newline="") as fh:
            fh.write(html)
        return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--limit", type=int, default=0,
                    help="max files to CHANGE this run (0 = unlimited)")
    args = ap.parse_args()

    scanned = changed = pending = 0
    skip_names = {"index-improved.html", "404-improved.html",
                  "SUBPAGE-TEMPLATE.html"}

    for dirpath, dirnames, filenames in os.walk(args.root):
        dirnames[:] = [d for d in dirnames if d not in (".git",
                                                        "node_modules",
                                                        "ad_screenshots")]
        for name in filenames:
            if not name.endswith(".html") or name in skip_names:
                continue
            path = os.path.join(dirpath, name)
            scanned += 1
            if args.limit and changed >= args.limit:
                # count how many still need work (cheap check)
                try:
                    with io.open(path, "r", encoding="utf-8",
                                 errors="surrogateescape") as fh:
                        head = fh.read()
                    if "premium.css" not in head:
                        pending += 1
                except OSError:
                    pass
                continue
            try:
                if process(path):
                    changed += 1
            except OSError as exc:
                print("ERROR %s: %s" % (path, exc), file=sys.stderr)

    print("scanned=%d changed=%d pending>=%d" % (scanned, changed, pending))


if __name__ == "__main__":
    main()
