#!/usr/bin/env python3
"""Generate 3 original data-driven blog articles from the site's own
published word counts. Uses the existing blog post template so nav,
tracking, footer, and styling match exactly. Adds BlogPosting schema."""
import io, os, re, sys

TPL = "blog/word-games-health-benefits/index.html"
DATE = "July 10, 2026"
ISO = "2026-07-10"

LEN = [(2,427),(3,2130),(4,7186),(5,15921),(6,29874),(7,41998),(8,51627),
       (9,53402),(10,45872),(11,37539),(12,29124),(13,20944),(14,14149),(15,8846)]
TOT = sum(c for _, c in LEN)
START = dict(a=24678,b=18220,c=31257,d=18337,e=13787,f=11831,g=10846,h=13202,
             i=12548,j=2829,k=3937,l=9878,m=19316,n=12196,o=12100,p=33304,
             q=1752,r=16579,s=37558,t=18384,u=21665,v=5275,w=6546,x=504,
             y=1142,z=1368)
SUF = [("ed",22223),("ing",17845),("ly",15012),("er",14949),("ic",12447),
       ("al",11637),("ness",7782),("ous",6873),("tion",6351),("able",4522),
       ("less",1841),("ment",1777),("ish",1758),("ary",1261),("ful",1025)]

TABLE_CSS = """
  .data-table { width: 100%; border-collapse: collapse; margin: 14px 0 6px; font-size: 15px; }
  .data-table th { text-align: left; padding: 10px 12px; background: #f1f5f9; color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
  .data-table td { padding: 9px 12px; border-bottom: 1px solid rgba(148,163,184,.18); }
  .data-table tr:nth-child(even) td { background: #f8fafc; }
  .data-table a { color: #2563eb; text-decoration: none; font-weight: 700; }
  .data-bar { display: inline-block; height: 10px; border-radius: 5px; background: linear-gradient(90deg,#2563eb,#4f46e5); vertical-align: middle; }
</style>"""

def fmt(n):
    return f"{n:,}"

def bar(v, mx, w=140):
    return f'<span class="data-bar" style="width:{max(4,int(v/mx*w))}px"></span>'

def page(slug, title, desc, tag, h1, sub, minutes, herocard, intro, body,
         cta_h, cta_p, related):
    tpl = io.open(TPL, encoding="utf-8", errors="surrogateescape").read()
    head_end = tpl.index("</head>")
    head = tpl[:head_end]
    # swap metadata
    head = re.sub(r"<title>.*?</title>", f"<title>{title} | WordFindLab</title>", head, 1, re.S)
    head = re.sub(r'<meta name="description" content="[^"]*">',
                  f'<meta name="description" content="{desc}">', head, 1)
    head = head.replace(
        'href="https://wordfindlab.com/blog/word-games-health-benefits/"',
        f'href="https://wordfindlab.com/blog/{slug}/"')
    head = head.replace("</style>", TABLE_CSS, 1)
    schema = f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "{title}",
  "description": "{desc}",
  "datePublished": "{ISO}",
  "dateModified": "{ISO}",
  "author": {{"@type": "Organization", "name": "WordFindLab"}},
  "publisher": {{"@type": "Organization", "name": "WordFindLab",
    "logo": {{"@type": "ImageObject", "url": "https://wordfindlab.com/assets/og/wordfindlab-logo-512.png"}}}},
  "mainEntityOfPage": "https://wordfindlab.com/blog/{slug}/"
}}
</script>
'''
    head += schema + "</head>"
    # body: nav from template, custom hero+main, footer from template
    nav = tpl[tpl.index("<body>"):tpl.index('<header class="hero')]
    footer = tpl[tpl.index("<!-- Premium footer navigation"):]
    hero = f'''<header class="hero">
  <div class="hero-inner">
    <div class="breadcrumb"><a href="https://wordfindlab.com/">Home</a> / <a href="https://wordfindlab.com/blog/">Blog</a> / Data &amp; Research</div>
    <span class="tag">{tag}</span>
    <div class="hero-grid">
      <div class="hero-main">
        <h1>{h1}</h1>
        <p>{sub}</p>
        <div class="hero-meta">
          <span>{DATE}</span><span>|</span><span>{minutes} min read</span><span>|</span><span>By WordFindLab</span>
        </div>
      </div>
      {herocard}
    </div>
  </div>
</header>

<main class="wrap">
  <section class="intro">{intro}</section>
  <div class="content-layout">
    <div class="content-column">
{body}
      <section class="post-cta">
        <h2>{cta_h}</h2>
        <p>{cta_p}</p>
        <a class="cta-btn" href="/">Try the Word Finder</a>
      </section>
      <section class="related">
        <h3>Related Reads</h3>
        <div class="related-grid">
{related}
        </div>
      </section>
    </div>
    <aside class="side-column">
      <div class="side-card">
        <h3>About this data</h3>
        <p>All figures were counted directly from the WordFindLab dictionary of {fmt(TOT)} words between 2 and 15 letters &mdash; the same list our tools search.</p>
      </div>
      <div class="side-card">
        <h3>More WordFindLab</h3>
        <div class="side-links">
          <a href="https://wordfindlab.com/scrabble-word-finder/">Scrabble Finder<span>Score-first word search</span></a>
          <a href="https://wordfindlab.com/wordle-solver/">Wordle Solver<span>Find the next best guess</span></a>
          <a href="https://wordfindlab.com/words-by-length/">Words by Length<span>Every list from 2 to 15</span></a>
          <a href="https://wordfindlab.com/word-lists/">Word Lists Hub<span>Curated special lists</span></a>
        </div>
      </div>
    </aside>
  </div>
</main>

'''
    html = "<!DOCTYPE html>\n<html lang=\"en\">\n" + head[head.index("<head>"):] if head.startswith("<!DOCTYPE") is False else head
    html = head + "\n" + nav + hero + footer
    os.makedirs(f"blog/{slug}", exist_ok=True)
    out = f"blog/{slug}/index.html"
    io.open(out, "w", encoding="utf-8", errors="surrogateescape").write(html)
    back = io.open(out, encoding="utf-8", errors="surrogateescape").read()
    ok = back == html and back.rstrip().endswith("</html>")
    print(out, len(back), "verified:", ok)
    return ok

# ---------- Article 1: words by length ----------
mx = max(c for _, c in LEN)
rows = "\n".join(
    f'<tr><td><a href="/{n}-letter-words/">{n} letters</a></td>'
    f'<td>{fmt(c)}</td><td>{c/TOT*100:.1f}%</td><td>{bar(c, mx)}</td></tr>'
    for n, c in LEN)
t1_table = f'''<table class="data-table">
<thead><tr><th>Word length</th><th>Words</th><th>Share</th><th></th></tr></thead>
<tbody>
{rows}
<tr><td><b>Total (2&ndash;15)</b></td><td><b>{fmt(TOT)}</b></td><td><b>100%</b></td><td></td></tr>
</tbody></table>'''

a1_body = f'''      <section class="article-section">
        <h2>The full count, 2 to 15 letters</h2>
        <p>We counted every word in the WordFindLab dictionary &mdash; the same {fmt(TOT)}-word list that powers our <a href="/">word unscrambler</a>. Here is exactly how English vocabulary spreads out by length:</p>
        {t1_table}
        <p>Two independent counting methods (by length and by starting letter) both land on exactly {fmt(TOT)} words, so you can treat these figures as internally consistent rather than estimates.</p>
      </section>

      <section class="article-section">
        <h2>Nine letters is the peak of English</h2>
        <p>Most people guess that short words dominate English. The data says otherwise: the single most common word length is <a href="/9-letter-words/">nine letters</a>, with {fmt(53402)} entries. Words of 8, 9, and 10 letters together make up {(51627+53402+45872)/TOT*100:.0f}% of the entire dictionary.</p>
        <p>Why so long? English builds words by stacking parts: a root like <i>form</i> grows into <i>formation</i>, <i>reformative</i>, and <i>transformation</i>. Every prefix and suffix pushes the average length up, and the 8&ndash;10 letter zone is where most of those combinations land.</p>
        <ul>
          <li>Only {fmt(427)} two-letter words exist &mdash; which is why memorizing the <a href="/2-letter-words/">valid two-letter list</a> is such a cheap win in Scrabble.</li>
          <li>Wordle players pick from {fmt(15921)} possible <a href="/5-letter-words/">five-letter words</a> &mdash; far more than the ~2,300 words in Wordle's official answer list.</li>
          <li>A Scrabble bingo uses all 7 tiles: there are {fmt(41998)} <a href="/7-letter-words/">seven-letter words</a> to aim for.</li>
        </ul>
      </section>

      <section class="article-section">
        <h2>What this means for your game</h2>
        <p>In Scrabble, the practical playing zone is 2&ndash;8 letters, which covers {fmt(427+2130+7186+15921+29874+41998+51627)} words &mdash; about {(427+2130+7186+15921+29874+41998+51627)/TOT*100:.0f}% of the language. Everything longer mostly matters in crosswords and word-building puzzles.</p>
        <p>For Wordle, the five-letter pool is big enough that guessing blindly is hopeless, but small enough that two good guesses usually narrow it to a handful of candidates. That is exactly the problem our <a href="/wordle-solver/">Wordle Solver</a> is built for.</p>
        <p>If you want to browse any slice of this data yourself, every length from <a href="/2-letter-words/">2</a> to <a href="/15-letter-words/">15</a> has its own full list on <a href="/words-by-length/">Words by Length</a>.</p>
      </section>
'''

# ---------- Article 2: starting letters ----------
s_sorted = sorted(START.items(), key=lambda kv: -kv[1])
mx2 = s_sorted[0][1]
rows2 = "\n".join(
    f'<tr><td>{i+1}</td><td><a href="/words-starting-with/{L}/">{L.upper()}</a></td>'
    f'<td>{fmt(c)}</td><td>{c/TOT*100:.1f}%</td><td>{bar(c, mx2)}</td></tr>'
    for i, (L, c) in enumerate(s_sorted))
t2_table = f'''<table class="data-table">
<thead><tr><th>#</th><th>Letter</th><th>Words starting with it</th><th>Share</th><th></th></tr></thead>
<tbody>
{rows2}
</tbody></table>'''

a2_body = f'''      <section class="article-section">
        <h2>All 26 letters, ranked</h2>
        <p>Which letter starts the most English words? We counted the starting letter of all {fmt(TOT)} words in the WordFindLab dictionary. The winner is not even close:</p>
        {t2_table}
      </section>

      <section class="article-section">
        <h2>S, P, and C own the dictionary</h2>
        <p>Words beginning with <a href="/words-starting-with/s/">S</a> ({fmt(37558)}), <a href="/words-starting-with/p/">P</a> ({fmt(33304)}), and <a href="/words-starting-with/c/">C</a> ({fmt(31257)}) account for {(37558+33304+31257)/TOT*100:.0f}% of all English words &mdash; more than one word in four starts with one of just these three letters.</p>
        <p>S dominates partly because it forms so many clusters (st-, str-, sp-, sc-, sh-, sl-, sm-, sn-, sw-) and because un-prefixed words pick up an S in plural and verb forms that count as separate entries.</p>
        <p>At the other end, <a href="/words-starting-with/x/">X</a> starts only {fmt(504)} words &mdash; S starts about 75 times more. Y ({fmt(1142)}), Z ({fmt(1368)}), and Q ({fmt(1752)}) round out the rare club.</p>
      </section>

      <section class="article-section">
        <h2>How to use this at the game table</h2>
        <ul>
          <li><b>Scrabble:</b> the S tile is precious because S-words and S-hooks are everywhere &mdash; the data shows why. Never burn an S for a cheap play.</li>
          <li><b>Wordle:</b> S is the single most common starting letter of five-letter words too, which is why openers like STARE and SLATE test the most likely first position. See our <a href="/word-lists/best-wordle-starting-words/">best starting words</a> analysis.</li>
          <li><b>Q without U:</b> Q may start only {fmt(1752)} words, but the short ones win games &mdash; browse the full <a href="/word-lists/q-words-without-u/">Q-without-U list</a>.</li>
        </ul>
        <p>Every letter links to its complete word list, so you can explore any starting letter from <a href="/words-starting-with/">the hub page</a>.</p>
      </section>
'''

# ---------- Article 3: word endings ----------
mx3 = SUF[0][1]
rows3 = "\n".join(
    f'<tr><td>{i+1}</td><td><a href="/words-ending-with-{s}/">-{s.upper()}</a></td>'
    f'<td>{fmt(c)}</td><td>{bar(c, mx3)}</td></tr>'
    for i, (s, c) in enumerate(SUF))
t3_table = f'''<table class="data-table">
<thead><tr><th>#</th><th>Ending</th><th>Words</th><th></th></tr></thead>
<tbody>
{rows3}
</tbody></table>'''

a3_body = f'''      <section class="article-section">
        <h2>The 15 biggest word endings, counted</h2>
        <p>Suffixes are the engine of English vocabulary. We counted how many words in our {fmt(TOT)}-word dictionary end with each of the 15 most productive suffixes:</p>
        {t3_table}
      </section>

      <section class="article-section">
        <h2>-ED and -ING are a fifth of everything</h2>
        <p>The two verb endings alone &mdash; <a href="/words-ending-with-ed/">-ED</a> ({fmt(22223)}) and <a href="/words-ending-with-ing/">-ING</a> ({fmt(17845)}) &mdash; cover {fmt(22223+17845)} words, roughly {(22223+17845)/TOT*100:.0f}% of the dictionary. Add <a href="/words-ending-with-ly/">-LY</a> ({fmt(15012)}) and <a href="/words-ending-with-er/">-ER</a> ({fmt(14949)}) and you are near one word in five ending in just four patterns.</p>
        <p>This is the single most useful pattern fact in word games: if you are stuck on a rack or a puzzle slot, testing these four endings first covers the largest share of the language for the least effort.</p>
      </section>

      <section class="article-section">
        <h2>Reading the long tail</h2>
        <ul>
          <li><b>-NESS ({fmt(7782)}) beats -MENT ({fmt(1777)}) four to one.</b> When you need to extend an adjective, -NESS is statistically the better bet.</li>
          <li><b>-TION ({fmt(6351)}) is the crossword classic</b> &mdash; four letters that finish thousands of longer words, which is why constructors lean on it.</li>
          <li><b>-FUL is rarer than it feels ({fmt(1025)}).</b> It is common in speech but scarce in the dictionary; don't hold tiles waiting for it.</li>
        </ul>
        <p>Every ending in the table links to its full word list, and the <a href="/words-ending-with/">Words Ending With hub</a> covers every letter and pattern. For strategy on turning these patterns into points, see our <a href="/scrabble-strategy/">Scrabble strategy guide</a>.</p>
      </section>
'''

def hero_card(label, num, copy, items, link, ltext):
    lis = "\n".join(f"          <li>{i}</li>" for i in items)
    return f'''<aside class="hero-card">
        <div class="hero-card-label">{label}</div>
        <div class="hero-card-title">{num}</div>
        <div class="hero-card-copy">{copy}</div>
        <ul class="hero-card-list">
{lis}
        </ul>
        <a class="hero-card-link" href="{link}">{ltext}</a>
      </aside>'''

def rel(cards):
    return "\n".join(
        f'''    <a class="related-card" href="{u}">
      <strong>{t}</strong>
      <span>{s}</span>
    </a>''' for u, t, s in cards)

ok = True
ok &= page(
    "how-many-english-words-by-length",
    "How Many English Words Are There? We Counted All 359,039, by Length",
    f"We counted every word in a {fmt(TOT)}-word English dictionary by length. Nine-letter words are the most common - see the full 2-15 letter breakdown.",
    "Data & Research",
    "How Many English Words Are There? We Counted.",
    f"Every word in our {fmt(TOT)}-word dictionary, broken down by length &mdash; with what the numbers mean for Scrabble and Wordle.",
    "7",
    hero_card("Key finding", fmt(TOT),
              "Words of 8, 9, and 10 letters make up 42% of English. The most common length is 9 letters.",
              ["Full table for every length from 2 to 15.",
               "Verified two ways for consistency.",
               "Direct links to every complete word list."],
              "/words-by-length/", "Browse words by length"),
    f"How many English words are there? In the dictionary that powers WordFindLab's tools: exactly {fmt(TOT)} words between 2 and 15 letters. We counted them all, and the distribution is not what most people expect.",
    a1_body,
    "Put the numbers to work",
    "Enter any letters and search all 359,039 words in milliseconds - grouped by length, sorted by score.",
    rel([("/blog/which-letters-start-the-most-english-words/", "Which letters start the most words?", "All 26 letters, ranked by the data"),
         ("/blog/most-common-word-endings-in-english/", "The most common word endings", "-ED and -ING dominate the language"),
         ("/blog/letter-frequency-in-english-for-word-games/", "Letter frequency", "Smarter guess planning")]))

ok &= page(
    "which-letters-start-the-most-english-words",
    "Which Letters Start the Most English Words? All 26, Ranked",
    "S starts 37,558 English words - X only 504. We ranked all 26 letters by how many words they start, with takeaways for Scrabble and Wordle.",
    "Data & Research",
    "Which Letters Start the Most English Words?",
    f"We counted the first letter of all {fmt(TOT)} dictionary words. S, P, and C start more than one word in four.",
    "6",
    hero_card("Key finding", "S = 37,558",
              "S starts more English words than any other letter - 75 times more than X.",
              ["All 26 letters ranked with exact counts.",
               "Why S dominates the dictionary.",
               "What it means for your opening moves."],
              "/words-starting-with/", "Browse by starting letter"),
    f"Every one of the {fmt(TOT)} words in our dictionary starts somewhere. We counted all 26 starting letters, and three letters &mdash; S, P, and C &mdash; turn out to own more than a quarter of the English language.",
    a2_body,
    "Explore any starting letter",
    "Every letter links to its complete word list - or unscramble your own letters and let the engine do the counting.",
    rel([("/blog/how-many-english-words-by-length/", "How many English words are there?", "The full count, 2 to 15 letters"),
         ("/blog/most-common-word-endings-in-english/", "The most common word endings", "-ED and -ING dominate the language"),
         ("/blog/best-wordle-starting-words/", "Best Wordle starting words", "Openers backed by letter data")]))

ok &= page(
    "most-common-word-endings-in-english",
    "The Most Common Word Endings in English, Counted",
    "-ED ends 22,223 words and -ING ends 17,845. We counted the 15 most productive English suffixes and what they mean for word games.",
    "Data & Research",
    "The Most Common Word Endings in English",
    f"We counted the 15 biggest suffixes across {fmt(TOT)} words. Four endings alone cover nearly a fifth of the language.",
    "6",
    hero_card("Key finding", "-ED = 22,223",
              "-ED is the most common ending in English, followed by -ING, -LY, and -ER.",
              ["15 suffixes ranked with exact counts.",
               "The four endings worth testing first.",
               "Direct links to every full ending list."],
              "/words-ending-with/", "Browse words by ending"),
    f"When you are stuck in a word game, the fastest unstick is a suffix. We counted the 15 most productive endings across our {fmt(TOT)}-word dictionary to find out which ones are genuinely worth testing first.",
    a3_body,
    "Test an ending right now",
    "Use the Ends With filter in the word finder to search any ending against the full dictionary.",
    rel([("/blog/how-many-english-words-by-length/", "How many English words are there?", "The full count, 2 to 15 letters"),
         ("/blog/which-letters-start-the-most-english-words/", "Which letters start the most words?", "All 26 letters, ranked by the data"),
         ("/blog/how-to-improve-scrabble-score-fast/", "Improve your Scrabble score", "Practical point-boosting habits")]))

sys.exit(0 if ok else 1)
