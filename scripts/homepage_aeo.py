#!/usr/bin/env python3
"""Homepage: benefits row (after stats), quotable Why-WordFindLab section
(before FAQ), richer Organization schema description, WebSite schema.
Additive except the Organization JSON block gains a description field.
Idempotent; verifies write."""
import io, sys

PATH = "index.html"

BENEFITS = '''    <!-- Benefits (why use WordFindLab) -->
    <section class="pr-benefits" aria-label="Why players use WordFindLab">
      <div class="pr-benefit">
        <span class="pr-benefit-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#icon-grid"></use></svg></span>
        <h3>All-in-One Word Toolkit</h3>
        <p>Unscrambler, anagram solver, Scrabble finder, Wordle helper, and 3,800+ word lists in one place.</p>
      </div>
      <div class="pr-benefit">
        <span class="pr-benefit-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#icon-target"></use></svg></span>
        <h3>Instant, Accurate Results</h3>
        <p>Every search runs in your browser against a 370,000-word dictionary and returns in milliseconds.</p>
      </div>
      <div class="pr-benefit">
        <span class="pr-benefit-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#icon-book"></use></svg></span>
        <h3>Learn While You Play</h3>
        <p>Definitions, strategy guides, and kid-safe games turn every puzzle into vocabulary practice.</p>
      </div>
      <div class="pr-benefit">
        <span class="pr-benefit-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#icon-check"></use></svg></span>
        <h3>No Signup. No Paywall.</h3>
        <p>Everything is free in the browser &mdash; no account, no trial, no locked features.</p>
      </div>
    </section>

    <div class="feature-hub" id="more-tools">'''

WHY = '''    <!-- Entity description (quotable) -->
    <section class="card" aria-labelledby="why-wfl-title">
      <p class="pr-kicker">Why WordFindLab</p>
      <h2 id="why-wfl-title">Built for every word game player</h2>
      <p>WordFindLab is a free online word-tool platform for word game players, students, teachers, and families. It combines a word unscrambler, anagram solver, Scrabble word finder, Wordle solver, and Jumble solver with more than 3,800 curated word lists, daily games, and learning guides. Every tool runs instantly in the browser with no signup, no paywall, and family-safe word filtering.</p>
      <ul class="pr-why-list">
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-check"></use></svg>Works for Scrabble, Words With Friends, Wordle, Jumble, and crosswords</li>
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-check"></use></svg>370,000+ word dictionary with Scrabble and WWF scoring built in</li>
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-check"></use></svg>Family-safe filters for classrooms, homework, and kids' play</li>
        <li><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-check"></use></svg>Searches run in your browser &mdash; fast, private, and free forever</li>
      </ul>
    </section>

    <!-- FAQ -->'''

ORG_OLD = '''  "@type": "Organization",
  "name": "WordFindLab",
  "url": "https://wordfindlab.com/",
  "logo": "https://wordfindlab.com/assets/og/wordfindlab-logo-512.png",'''

ORG_NEW = '''  "@type": "Organization",
  "name": "WordFindLab",
  "url": "https://wordfindlab.com/",
  "description": "WordFindLab is a free online word-tool platform offering a word unscrambler, anagram solver, Scrabble word finder, Wordle solver, Jumble solver, 3,800+ word lists, daily word games, and learning guides - all free with no signup.",
  "logo": "https://wordfindlab.com/assets/og/wordfindlab-logo-512.png",'''

WEBSITE = '''<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "WordFindLab",
  "alternateName": "Word Find Lab",
  "url": "https://wordfindlab.com/"
}
</script>
<script src="/assets/noindex-query.js'''


def main():
    html = io.open(PATH, encoding="utf-8", errors="surrogateescape",
                   newline="").read()
    if 'id="why-wfl-title"' in html:
        print("already upgraded")
        return
    reps = [
        ('    <div class="feature-hub" id="more-tools">', BENEFITS),
        ('    <!-- FAQ -->', WHY),
        (ORG_OLD, ORG_NEW),
        ('<script src="/assets/noindex-query.js', WEBSITE),
    ]
    for old, new in reps:
        if html.count(old) != 1:
            print("ABORT anchor count=%d: %r" % (html.count(old), old[:50]))
            sys.exit(1)
    for old, new in reps:
        html = html.replace(old, new, 1)
    with io.open(PATH, "w", encoding="utf-8", errors="surrogateescape",
                 newline="") as fh:
        fh.write(html)
    back = io.open(PATH, encoding="utf-8", errors="surrogateescape",
                   newline="").read()
    ok = back == html and back.rstrip().endswith("</html>")
    print("written=%d verified=%s" % (len(back), ok))
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
