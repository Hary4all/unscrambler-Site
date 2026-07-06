#!/usr/bin/env python3
"""Enrich the 5 main solver pages:
   1. add two original FAQ items per page (after last existing faq-item)
   2. add FAQPage JSON-LD built from ALL on-page FAQs (existing + new)
   Idempotent; verifies writes."""
import io, json, re, sys

FAQ_RE = re.compile(
    r'<div class="faq-item"><div class="faq-q">(.*?)</div>'
    r'<div class="faq-a">(.*?)</div></div>', re.S)

TAG_RE = re.compile(r"<[^>]+>")

EXTRA = {
    "anagram-solver": [
        ("Can the solver handle multi-word anagrams?",
         'The tool solves one word at a time, but a two-pass approach works well for phrases: enter the full letter set, pick out a strong long word, then run the leftover letters again. Many phrase anagrams fall apart quickly once the longest word is found.'),
        ("How many combinations can one set of letters have?",
         'Seven letters can be arranged over 5,000 ways, yet only a handful form valid English words. The solver checks every arrangement against a 370,000-word dictionary in milliseconds, which is why it beats manual shuffling &mdash; see our <a href="/anagram-solving-techniques/">anagram techniques guide</a> for the human-friendly methods.'),
    ],
    "wordle-solver": [
        ("What is the best Wordle starting word?",
         'Words that combine common vowels with frequent consonants &mdash; like STARE, CRANE, or SLATE &mdash; statistically remove the most candidates on guess one. We keep a ranked list on our <a href="/word-lists/best-wordle-starting-words/">best starting words</a> page.'),
        ("Does this work for Quordle and other Wordle variants?",
         'Yes. Any variant built on five-letter English answers &mdash; Quordle, Octordle, Dordle &mdash; can be solved the same way. Enter the clues for one board at a time and treat each board as its own puzzle.'),
    ],
    "scrabble-word-finder": [
        ("Are two-letter words really worth memorizing?",
         'They are the single highest-value study investment in Scrabble. Words like QI, ZA, JO, and XU turn dead racks into 20&ndash;60 point parallel plays. Start with our complete <a href="/2-letter-words/">two-letter word list</a>.'),
        ("What is the highest-scoring Scrabble word?",
         'In theoretical play, OXYPHENBUTAZONE across three triple-word squares scores over 1,700 points. In realistic games, words like QUIXOTRY (365 points in tournament play) show what premium-square stacking can do &mdash; browse our <a href="/word-lists/highest-scoring-scrabble-words/">highest-scoring words list</a> for practical targets.'),
    ],
    "jumble-solver": [
        ("What is the fastest way to crack the daily Jumble phrase?",
         'Solve the individual scrambles first and write down only the circled letters. Then treat those letters as one final anagram, using the cartoon caption as the theme hint &mdash; the answer is almost always a pun on it.'),
        ("Are Jumble answers always common words?",
         'Almost always. Jumble puzzles use everyday vocabulary, so if the solver returns several options, pick the most familiar one. Switching the dictionary filter to common words mirrors how the puzzle authors choose answers.'),
    ],
    "words-with-friends-cheat": [
        ("How is Words With Friends scoring different from Scrabble?",
         'The letter values differ noticeably: J and Q are worth 10 in WWF (J is 8 in Scrabble), while H drops from 4 to 3. Board layout and premium squares differ too, which changes strategy &mdash; our <a href="/scrabble-vs-words-with-friends/">Scrabble vs WWF comparison</a> covers every difference.'),
        ("Does Words With Friends use a different dictionary?",
         'Yes. WWF uses an ENABLE-based word list with its own additions, while Scrabble tournaments use TWL or Collins. Some words are valid in one game but not the other, so always check against the game you are actually playing.'),
    ],
}


def clean(txt):
    txt = TAG_RE.sub("", txt)
    txt = txt.replace("&mdash;", "-").replace("&ndash;", "-")
    txt = txt.replace("&amp;", "&").replace("&nbsp;", " ")
    return re.sub(r"\s+", " ", txt).strip()


def process(slug):
    path = slug + "/index.html"
    html = io.open(path, encoding="utf-8", errors="surrogateescape",
                   newline="").read()
    if "FAQPage" in html:
        print(slug, "already has FAQPage; skipping")
        return True

    items = FAQ_RE.findall(html)
    if not items:
        print(slug, "ABORT: no faq items found")
        return False

    # 1. append two new FAQ items after the LAST existing faq-item
    new_html_items = "".join(
        '\n      <div class="faq-item"><div class="faq-q">%s</div>'
        '<div class="faq-a">%s</div></div>' % (q, a)
        for q, a in EXTRA[slug])
    last = None
    for last in FAQ_RE.finditer(html):
        pass
    end = last.end()
    html = html[:end] + new_html_items + html[end:]

    # 2. FAQPage schema from all items
    all_items = items + EXTRA[slug]
    schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": clean(q),
             "acceptedAnswer": {"@type": "Answer", "text": clean(a)}}
            for q, a in all_items
        ],
    }
    block = ('<script type="application/ld+json">\n%s\n</script>\n</head>'
             % json.dumps(schema, ensure_ascii=False, indent=1))
    assert html.count("</head>") == 1
    html = html.replace("</head>", block, 1)

    with io.open(path, "w", encoding="utf-8", errors="surrogateescape",
                 newline="") as fh:
        fh.write(html)
    back = io.open(path, encoding="utf-8", errors="surrogateescape",
                   newline="").read()
    ok = back == html and back.rstrip().endswith("</html>")
    print(slug, "faqs=%d written=%d verified=%s" % (len(all_items),
                                                    len(back), ok))
    return ok


def main():
    ok = all(process(s) for s in EXTRA)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
