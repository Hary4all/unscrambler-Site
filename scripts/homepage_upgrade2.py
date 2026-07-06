#!/usr/bin/env python3
"""Homepage upgrade for the deployed (unscrambler-Site) markup:
   stats strip, FAQ section, Organization + FAQPage schema.
   Additive only. Idempotent. Verifies the write."""
import io, sys

PATH = "index.html"

STATS = '''    <!-- Site statistics -->
    <section class="pr-stats" aria-label="WordFindLab by the numbers">
      <div class="pr-stat"><span class="num" data-counter="370,000+">370,000+</span><span class="lbl">Dictionary Words</span></div>
      <div class="pr-stat"><span class="num" data-counter="3,800+">3,800+</span><span class="lbl">Word Lists &amp; Guides</span></div>
      <div class="pr-stat"><span class="num" data-counter="15+">15+</span><span class="lbl">Free Word Tools</span></div>
      <div class="pr-stat"><span class="num" data-counter="2.3M+">2.3M+</span><span class="lbl">Words Generated</span></div>
    </section>

    <div class="feature-hub" id="more-tools">'''

FAQ_HTML = '''    <!-- FAQ -->
    <section class="card" aria-labelledby="home-faq-title">
      <h2 id="home-faq-title">Frequently Asked Questions</h2>
      <div class="faq-item">
        <div class="faq-q">How does the word unscrambler work?</div>
        <p class="faq-a">Enter up to 15 letters and the tool checks every possible combination against a dictionary of 370,000+ English words. Results are grouped by length and sorted by Scrabble score, so the strongest plays appear first. Everything runs in your browser, which is why results appear in milliseconds.</p>
      </div>
      <div class="faq-item">
        <div class="faq-q">Can I use blank tiles or wildcards?</div>
        <p class="faq-a">Yes. Type <b>?</b> for each blank tile (up to 3). The solver automatically tries all 26 letters in that position and includes every valid word in the results.</p>
      </div>
      <div class="faq-item">
        <div class="faq-q">Which word games does this work for?</div>
        <p class="faq-a">The same engine covers Scrabble, Words With Friends, Wordscapes, Boggle, Jumble, crosswords, and daily puzzles. For game-specific help, try the dedicated <a href="/scrabble-word-finder/">Scrabble Word Finder</a>, <a href="/wordle-solver/">Wordle Solver</a>, or <a href="/words-with-friends-cheat/">WWF Cheat</a>.</p>
      </div>
      <div class="faq-item">
        <div class="faq-q">Is WordFindLab really free?</div>
        <p class="faq-a">Yes &mdash; every tool, word list, and game on the site is free with no signup, no trial, and no feature paywall. The site is supported by unobtrusive advertising.</p>
      </div>
      <div class="faq-item">
        <div class="faq-q">Is using a word finder cheating?</div>
        <p class="faq-a">That depends on how you use it. In casual play most people treat solvers as a learning aid &mdash; a way to discover new words and improve pattern recognition. For rated or competitive games, check your group's rules first. Our <a href="/scrabble-strategy/">strategy guides</a> can help you improve without any assistance.</p>
      </div>
      <div class="faq-item">
        <div class="faq-q">Why do some results show words I've never seen?</div>
        <p class="faq-a">The full dictionary includes rare and archaic words that are valid in word games. Turn on <b>Meaningful words only</b> to keep everyday vocabulary at the top, or switch the dictionary filter to <b>Common words</b> for a cleaner list.</p>
      </div>
    </section>

    <section class="affiliate-section card"'''

SCHEMAS = '''<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "WordFindLab",
  "url": "https://wordfindlab.com/",
  "logo": "https://wordfindlab.com/assets/og/wordfindlab-logo-512.png",
  "sameAs": ["https://www.facebook.com/profile.php?id=61589971622325"]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "How does the word unscrambler work?", "acceptedAnswer": {"@type": "Answer", "text": "Enter up to 15 letters and the tool checks every possible combination against a dictionary of 370,000+ English words. Results are grouped by length and sorted by Scrabble score, so the strongest plays appear first. Everything runs in your browser, which is why results appear in milliseconds."}},
    {"@type": "Question", "name": "Can I use blank tiles or wildcards?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Type ? for each blank tile (up to 3). The solver automatically tries all 26 letters in that position and includes every valid word in the results."}},
    {"@type": "Question", "name": "Which word games does this work for?", "acceptedAnswer": {"@type": "Answer", "text": "The same engine covers Scrabble, Words With Friends, Wordscapes, Boggle, Jumble, crosswords, and daily puzzles. Dedicated solvers are available for Scrabble, Wordle, and Words With Friends."}},
    {"@type": "Question", "name": "Is WordFindLab really free?", "acceptedAnswer": {"@type": "Answer", "text": "Yes - every tool, word list, and game on the site is free with no signup, no trial, and no feature paywall. The site is supported by unobtrusive advertising."}},
    {"@type": "Question", "name": "Is using a word finder cheating?", "acceptedAnswer": {"@type": "Answer", "text": "That depends on how you use it. In casual play most people treat solvers as a learning aid - a way to discover new words and improve pattern recognition. For rated or competitive games, check your group's rules first."}},
    {"@type": "Question", "name": "Why do some results show words I've never seen?", "acceptedAnswer": {"@type": "Answer", "text": "The full dictionary includes rare and archaic words that are valid in word games. Turn on Meaningful words only to keep everyday vocabulary at the top, or switch the dictionary filter to Common words for a cleaner list."}}
  ]
}
</script>
<script src="/assets/noindex-query.js'''

REPLACEMENTS = [
    ('    <div class="feature-hub" id="more-tools">', STATS),
    ('    <section class="affiliate-section card"', FAQ_HTML),
    ('<script src="/assets/noindex-query.js', SCHEMAS),
]


def main():
    html = io.open(PATH, encoding="utf-8", errors="surrogateescape",
                   newline="").read()
    if 'id="home-faq-title"' in html:
        print("already upgraded; nothing to do")
        return
    for old, new in REPLACEMENTS:
        if html.count(old) != 1:
            print("ABORT - anchor not unique (%d): %r"
                  % (html.count(old), old[:60]))
            sys.exit(1)
    for old, new in REPLACEMENTS:
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
