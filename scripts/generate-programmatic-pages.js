const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://wordfindlab.com";
const TODAY = "2026-05-15";
const HREF_BASE = "/word-patterns";

const PREFIXES = [
  "a","ab","ad","af","ag","al","an","ap","ar","as",
  "at","auto","anti","arch","audio","bi","bio","co","com",
  "contra","counter","de","dia","dis","en","em","ex","extra","geo",
  "hyper","hypo","im","in","inter","intro","micro","mid","mis","mono",
  "multi","non","omni","over","out","pan","per","pre","post","pro",
  "re","retro","semi","sub","super","sym","syn","tele","trans","ultra",
  "un","under","uni","up","vice","circum","infra","intra","pseudo","quin"
];

const EXTRA_PREFIXES = [
  "bl","br","cl","cr","dr","fl","fr","gl","gr","pl",
  "pr","sl","sm","sn","sp","sw","tr","tw","wh","wr"
];

const SUFFIXES = [
  "a","able","ac","age","al","ally","an","ant","ar","ard",
  "ary","ate","ed","ee","el","ence","end","er","est","et",
  "ful","hood","ial","ible","ic","ical","id","ie","ier","ish",
  "ism","ist","ity","ive","less","like","ling","ly","ment","ness",
  "oid","or","ous","ship","some","tion","sion","tude","ward","wise",
  "y","en","ing","ory","ure","dom","es","s","st","th",
  "cious","eous","ferous","graphy","logy","scopy","meter","proof","free","minded"
];

const EXTRA_SUFFIXES = [
  "acy","ance","ancy","archy","ette","ify","ious","istic","ology","worthy"
];

const CONTAINS = [
  "th","he","in","er","an","re","on","at","en","nd",
  "ti","es","or","te","of","ed","is","it","al","ar",
  "st","to","nt","ng","se","ha","as","ou","io","le",
  "ve","co","me","de","hi","ri","ro","ic","ne","ea",
  "ra","ce","li","ch","ll","be","ma","si","om","ur",
  "ck","qu","sh","ph","wh","wr","kn","spl","spr","str",
  "scr","thr","dge","tch","ight","ough","eigh","tion","sion","ness"
];

const EXTRA_CONTAINS = [
  "bb","cc","dd","ff","gg","hh","jj","kk","ll","mm",
  "nn","pp","rr","ss","zz"
];

const PREFIX_LIST = Array.from(new Set([...PREFIXES, ...EXTRA_PREFIXES]));
const SUFFIX_LIST = Array.from(new Set([...SUFFIXES, ...EXTRA_SUFFIXES]));
const CONTAINS_LIST = Array.from(new Set([...CONTAINS, ...EXTRA_CONTAINS]));

const CATEGORIES = [
  { slug: "two-letter-words", title: "Two-Letter Words", mode: "category", category: "two-letter-words", minLen: 2, maxLen: 2, summary: "Quick two-letter plays for tight boards, Scrabble hooks, and fast clean-ups." },
  { slug: "three-letter-words", title: "Three-Letter Words", mode: "category", category: "three-letter-words", minLen: 3, maxLen: 3, summary: "Small but useful words that help you connect boards and score efficiently." },
  { slug: "four-letter-words", title: "Four-Letter Words", mode: "category", category: "four-letter-words", minLen: 4, maxLen: 4, summary: "Compact four-letter words that fit common Wordle and Scrabble layouts." },
  { slug: "five-letter-words", title: "Five-Letter Words", mode: "category", category: "five-letter-words", minLen: 5, maxLen: 5, summary: "Five-letter words are perfect for Wordle, daily puzzles, and board-game momentum." },
  { slug: "wordle-helpers", title: "Wordle Helper Words", mode: "category", category: "wordle-helpers", minLen: 5, maxLen: 5, summary: "Strong five-letter helper words for eliminating letters and finding the answer faster." },
  { slug: "q-without-u", title: "Q Words Without U", mode: "category", category: "q-without-u", summary: "High-value Q words that help in Scrabble and challenge boards when U is unavailable." },
  { slug: "palindromes", title: "Palindromes", mode: "category", category: "palindromes", summary: "Palindromic words that read the same forward and backward." },
  { slug: "double-letters", title: "Words With Double Letters", mode: "category", category: "double-letters", summary: "Words with repeated letters are useful for hooks, bingo setups, and pattern spotting." },
  { slug: "vowel-heavy", title: "Vowel Heavy Words", mode: "category", category: "vowel-heavy", summary: "Words packed with vowels are useful for solving awkward racks and letter-poor puzzles." },
  { slug: "high-scoring-scrabble-words", title: "High Scoring Scrabble Words", mode: "category", category: "high-scoring-scrabble-words", summary: "Top-value Scrabble words sorted for fast discovery and board control." },
  { slug: "words-with-j", title: "Words With J", mode: "category", category: "words-with-j", summary: "J words are rare, powerful, and often valuable in Scrabble and WWF." },
  { slug: "words-with-x", title: "Words With X", mode: "category", category: "words-with-x", summary: "X words are great for scoring and for surprising board openings." },
  { slug: "words-with-z", title: "Words With Z", mode: "category", category: "words-with-z", summary: "Z words can turn a tricky rack into a big scoring opportunity." },
  { slug: "words-with-vowel-pair", title: "Words With Vowel Pairs", mode: "category", category: "words-with-vowel-pair", summary: "Words with vowel pairs are useful for Wordle, crosswords, and pattern solving." },
  { slug: "words-starting-with-vowel", title: "Words Starting With Vowel", mode: "category", category: "words-starting-with-vowel", summary: "Vowel-first words are useful for boards that need a clean opening move." },
  { slug: "words-ending-with-vowel", title: "Words Ending With Vowel", mode: "category", category: "words-ending-with-vowel", summary: "Vowel-ending words help with hooks, links, and many puzzle strategies." },
  { slug: "scrabble-bingo-words", title: "Scrabble Bingo Words", mode: "category", category: "high-scoring-scrabble-words", minLen: 7, summary: "Seven-letter plays that help you chase the 50-point bingo bonus." },
  { slug: "best-wordle-starting-words", title: "Best Wordle Starting Words", mode: "category", category: "five-letter-words", minLen: 5, maxLen: 5, summary: "Practical starting words and opening ideas for Wordle players who want better results." },
  { slug: "high-value-3-letter-words", title: "High Value 3 Letter Words", mode: "category", category: "three-letter-words", minLen: 3, maxLen: 3, summary: "Short, high-value words that can swing a board position fast." },
  { slug: "words-by-score", title: "Words By Score", mode: "category", category: "high-scoring-scrabble-words", summary: "Browse stronger words first and move quickly toward the best scoring options." }
];

const QUESTION_SPECS = [
  { slug: "how-many-words-start-with-re", title: "How Many Words Start With RE?", mode: "start", pattern: "re", summary: "A quick answer page for readers who want to browse and count words starting with RE." },
  { slug: "how-many-words-start-with-un", title: "How Many Words Start With UN?", mode: "start", pattern: "un", summary: "A quick answer page for readers who want to browse and count words starting with UN." },
  { slug: "how-many-words-start-with-pre", title: "How Many Words Start With PRE?", mode: "start", pattern: "pre", summary: "A quick answer page for readers who want to browse and count words starting with PRE." },
  { slug: "how-many-words-start-with-dis", title: "How Many Words Start With DIS?", mode: "start", pattern: "dis", summary: "A quick answer page for readers who want to browse and count words starting with DIS." },
  { slug: "how-many-words-start-with-inter", title: "How Many Words Start With INTER?", mode: "start", pattern: "inter", summary: "A quick answer page for readers who want to browse and count words starting with INTER." },
  { slug: "how-many-words-start-with-trans", title: "How Many Words Start With TRANS?", mode: "start", pattern: "trans", summary: "A quick answer page for readers who want to browse and count words starting with TRANS." },
  { slug: "what-5-letter-words-start-with-th", title: "What 5 Letter Words Start With TH?", mode: "start", pattern: "th", minLen: 5, maxLen: 5, summary: "A Wordle-friendly question page focused on 5-letter words that start with TH." },
  { slug: "what-5-letter-words-start-with-re", title: "What 5 Letter Words Start With RE?", mode: "start", pattern: "re", minLen: 5, maxLen: 5, summary: "A Wordle-friendly question page focused on 5-letter words that start with RE." },
  { slug: "what-words-end-with-ing", title: "What Words End With ING?", mode: "end", pattern: "ing", summary: "Browse words ending in ING for writing help, word games, and pattern search." },
  { slug: "what-words-end-with-ion", title: "What Words End With ION?", mode: "end", pattern: "ion", summary: "Browse words ending in ION for word games and pattern-based searches." },
  { slug: "what-words-end-with-ly", title: "What Words End With LY?", mode: "end", pattern: "ly", summary: "Browse words ending in LY for quick puzzle answers and common suffix searches." },
  { slug: "what-words-end-with-ed", title: "What Words End With ED?", mode: "end", pattern: "ed", summary: "Browse words ending in ED for quick puzzle answers and common suffix searches." },
  { slug: "what-words-end-with-ness", title: "What Words End With NESS?", mode: "end", pattern: "ness", summary: "Browse words ending in NESS for quick puzzle answers and common suffix searches." },
  { slug: "what-words-contain-qu", title: "What Words Contain QU?", mode: "contains", pattern: "qu", summary: "Find words that contain QU and use them in puzzles, board games, and quick solves." },
  { slug: "what-words-contain-th", title: "What Words Contain TH?", mode: "contains", pattern: "th", summary: "Find words containing TH for pattern searches and word-game planning." },
  { slug: "what-words-contain-sh", title: "What Words Contain SH?", mode: "contains", pattern: "sh", summary: "Find words containing SH for pattern searches and word-game planning." },
  { slug: "what-words-contain-ck", title: "What Words Contain CK?", mode: "contains", pattern: "ck", summary: "Find words containing CK for pattern searches and word-game planning." }
];

const HUB_LINKS = [
  { href: "/scrabble-word-finder/", label: "Scrabble Finder" },
  { href: "/wordle-solver/", label: "Wordle Solver" },
  { href: "/anagram-solver/", label: "Anagram Solver" },
  { href: "/words-with-friends-cheat/", label: "Words With Friends" },
  { href: "/jumble-solver/", label: "Jumble Solver" },
  { href: "/dictionary/", label: "Dictionary" },
  { href: "/guides/", label: "Guides" },
  { href: "/blog/", label: "Blog" }
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function slugToWords(slug) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lengthLabel(minLen, maxLen) {
  if (minLen === maxLen) return `${minLen} letters`;
  if (maxLen >= 15 && minLen >= 12) return `${minLen}+ letters`;
  return `${minLen} to ${maxLen} letters`;
}

function buildLengthBuckets(pattern) {
  const base = pattern.length;
  return [
    { slug: "", label: "All lengths", minLen: Math.max(base, 2), maxLen: 15 },
    { slug: "short", label: lengthLabel(Math.max(base, 2), Math.min(15, base + 1)), minLen: Math.max(base, 2), maxLen: Math.min(15, base + 1) },
    { slug: "short-plus", label: lengthLabel(Math.min(15, base + 2), Math.min(15, base + 3)), minLen: Math.min(15, base + 2), maxLen: Math.min(15, base + 3) },
    { slug: "mid", label: lengthLabel(Math.min(15, base + 4), Math.min(15, base + 5)), minLen: Math.min(15, base + 4), maxLen: Math.min(15, base + 5) },
    { slug: "long", label: lengthLabel(Math.min(15, base + 6), Math.min(15, base + 7)), minLen: Math.min(15, base + 6), maxLen: Math.min(15, base + 7) },
    { slug: "longer", label: lengthLabel(Math.min(15, base + 8), Math.min(15, base + 9)), minLen: Math.min(15, base + 8), maxLen: Math.min(15, base + 9) },
    { slug: "very-long", label: lengthLabel(Math.min(15, base + 10), Math.min(15, base + 12)), minLen: Math.min(15, base + 10), maxLen: Math.min(15, base + 12) },
    { slug: "extended", label: lengthLabel(Math.min(15, base + 13), 15), minLen: Math.min(15, base + 13), maxLen: 15 }
  ];
}

function pagePath(kind, pattern, bucketSlug) {
  const parts = [HREF_BASE, kind, pattern];
  if (bucketSlug) parts.push(bucketSlug);
  return parts.join("/") + "/";
}

function pageFilePath(kind, pattern, bucketSlug) {
  const parts = [ROOT, "word-patterns", kind, pattern];
  if (bucketSlug) parts.push(bucketSlug);
  return path.join.apply(path, parts) + path.sep + "index.html";
}

function buildRelatedLinks(kind, pattern, bucketSlug) {
  const related = [];
  if (kind !== "start") related.push({ href: pagePath("start", pattern), label: `Words Starting With ${pattern.toUpperCase()}` });
  if (kind !== "end") related.push({ href: pagePath("end", pattern), label: `Words Ending With ${pattern.toUpperCase()}` });
  if (kind !== "contains") related.push({ href: pagePath("contains", pattern), label: `Words Containing ${pattern.toUpperCase()}` });
  if (bucketSlug) {
    related.push({ href: pagePath(kind, pattern), label: "All lengths" });
  }
  related.push({ href: "/word-patterns/", label: "Pattern hub" });
  related.push({ href: "/scrabble-word-finder/", label: "Scrabble Finder" });
  related.push({ href: "/wordle-solver/", label: "Wordle Solver" });
  return related.slice(0, 6);
}

function renderPage(spec) {
  const title = escapeHtml(spec.title);
  const description = escapeHtml(spec.description);
  const canonical = spec.canonical;
  const patternText = escapeHtml(spec.patternText || spec.pattern.toUpperCase());
  const lengthText = escapeHtml(spec.lengthText || "All lengths");
  const summary = escapeHtml(spec.summary);
  const intro = escapeHtml(spec.intro);
  const relatedLinks = (spec.relatedLinks || []).map((link) => `<a class="pattern-link" href="${link.href}">${escapeHtml(link.label)}</a>`).join("");
  const faq = (spec.faq || []).map((item) => `
    <div class="faq-item">
      <div class="faq-q">${escapeHtml(item.q)}</div>
      <div class="faq-a">${escapeHtml(item.a)}</div>
    </div>
  `).join("");

  const breadcrumbHref = escapeHtml(spec.breadcrumbHref || spec.canonical);
  const breadcrumbLabel = escapeHtml(spec.breadcrumbLabel || title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | WordFindLab</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title} | WordFindLab">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${title} | WordFindLab",
  "description": "${description}",
  "url": "${canonical}",
  "isPartOf": {
    "@type": "WebSite",
    "name": "WordFindLab",
    "url": "https://wordfindlab.com/"
  }
}
</script>
</head>
<body class="programmatic-page">
<main class="page-wrap programmatic-shell" data-programmatic-mode="${spec.mode}" data-programmatic-pattern="${spec.pattern}" data-programmatic-category="${spec.category || ""}" data-programmatic-min-len="${spec.minLen}" data-programmatic-max-len="${spec.maxLen}" data-programmatic-limit="120" data-programmatic-title="${title}" data-programmatic-summary="${summary}">
  <section class="programmatic-main">
    <div class="breadcrumb"><a href="/">Home</a> <span style="margin:0 5px;color:var(--muted)">&rsaquo;</span> <a href="/word-patterns/">Word Patterns</a> <span style="margin:0 5px;color:var(--muted)">&rsaquo;</span> <a href="${breadcrumbHref}">${breadcrumbLabel}</a>${spec.bucketSlug ? ` <span style="margin:0 5px;color:var(--muted)">&rsaquo;</span> <span>${escapeHtml(spec.bucketLabel)}</span>` : ""}</div>
    <section class="card programmatic-hero">
      <div class="programmatic-kicker">Word Pattern Explorer</div>
      <h1 id="programmatic-title">${title}</h1>
      <p class="lede" id="programmatic-summary-copy">${intro}</p>
      <div class="programmatic-summary">
        <span class="summary-pill">Pattern: <strong id="programmatic-pattern">${patternText}</strong></span>
        <span class="summary-pill">Length: <strong id="programmatic-length">${lengthText}</strong></span>
        <span class="summary-pill"><strong id="programmatic-count">Loading</strong> matches</span>
      </div>
    </section>

    <div class="ad-wrap ad-top">
      <span class="ad-label">Advertisement</span>
      <div class="ad-slot ad-slot-banner adsterra-slot" data-adsterra-placement="top"></div>
    </div>

    <section class="card">
      <div class="results-head">
        <h2>Live Matches</h2>
        <div class="meta" id="programmatic-results-meta">Loading matching words...</div>
      </div>
      <div id="programmatic-results"></div>
      <div id="programmatic-no-results" class="empty" hidden>No matches yet. Try a different length range or another pattern.</div>
    </section>

    <div class="ad-wrap ad-mid-content">
      <span class="ad-label">Advertisement</span>
      <div class="ad-slot ad-slot-rect adsterra-slot" data-adsterra-placement="mid"></div>
    </div>

    <section class="card seo-section">
      <h2>Why this page is useful</h2>
      <p>${intro} The live word list loads in the browser, while the page copy stays stable for search engines and readers who want a quick answer.</p>

      <h2>How to use this page</h2>
      <ol>
        <li>Start with the pattern shown at the top of the page.</li>
        <li>Scan the results by length and score to find the best fit.</li>
        <li>Use the related links to jump to other patterns, guides, or word tools.</li>
      </ol>

      <h2>Related searches</h2>
      <div class="pattern-links">${relatedLinks}</div>

      <h2>Frequently Asked Questions</h2>
      <div class="programmatic-faq">
        ${faq}
      </div>
    </section>
  </section>

  <aside class="page-sidebar programmatic-sidebar">
    <div class="ad-slot ad-slot-sidebar adsterra-slot" data-adsterra-placement="lower"></div>
    <div class="card">
      <div class="tools-widget-title">Quick Connections</div>
      <div class="pattern-links">
        ${[
          { href: "/word-patterns/", label: "Pattern Hub" },
          { href: "/word-lists/", label: "Word Lists" },
          { href: "/dictionary/", label: "Dictionary" },
          { href: "/guides/", label: "Guides" },
          { href: "/blog/", label: "Blog" }
        ].map((link) => `<a class="pattern-link" href="${link.href}">${escapeHtml(link.label)}</a>`).join("")}
      </div>
    </div>
    <div class="card">
      <div class="tools-widget-title">Word Tools</div>
      <div class="tools-widget-links">
        ${HUB_LINKS.map((link) => `<a href="${link.href}">${escapeHtml(link.label)}</a>`).join("")}
      </div>
    </div>
  </aside>
</main>

<div class="ad-wrap ad-mobile-bottom">
  <span class="ad-label">Advertisement</span>
  <div class="ad-slot ad-slot-mobile-bottom adsterra-slot" data-adsterra-placement="mobile-bottom"></div>
</div>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-links">
      <a href="/word-patterns/">Word Patterns</a>
      <a href="/word-lists/">Word Lists</a>
      <a href="/dictionary/">Dictionary</a>
      <a href="/guides/">Guides</a>
      <a href="/blog/">Blog</a>
    </div>
    <div class="footer-copy">&copy; 2026 WordFindLab &nbsp;&middot;&nbsp; <a href="/privacy-policy/" style="color:#8891a8">Privacy Policy</a> &nbsp;&middot;&nbsp; <a href="/terms/" style="color:#8891a8">Terms</a></div>
  </div>
</footer>

<script src="/assets/sitewide-ads.js?v=20260515"></script>
<script src="/assets/wordfindlab.js?v=20260515"></script>
<script src="/assets/programmatic.js?v=20260515"></script>
</body>
</html>`;
}

function renderHubPage() {
  const featured = [
    { href: "/word-patterns/start/re/", label: "Words Starting With RE", desc: "A useful pattern for everyday plays, hooks, and expansions." },
    { href: "/word-patterns/end/ing/", label: "Words Ending With ING", desc: "Great for Wordle, writing, and suffix-based solving." },
    { href: "/word-patterns/contains/qu/", label: "Words Containing QU", desc: "Useful when you need the Q and U combination quickly." },
    { href: "/word-patterns/categories/q-without-u/", label: "Q Words Without U", desc: "High-value words that are useful in Scrabble and WWF." }
  ];

  const questionLinks = QUESTION_SPECS.slice(0, 6).map((item) => `<a class="pattern-link" href="/word-patterns/questions/${item.slug}/">${escapeHtml(item.title)}</a>`).join("");
  const categoryLinks = CATEGORIES.slice(0, 8).map((item) => `<a class="pattern-link" href="/word-patterns/categories/${item.slug}/">${escapeHtml(item.title)}</a>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Word Patterns | WordFindLab</title>
<meta name="description" content="Browse programmatic word pattern pages for letters, prefixes, suffixes, categories, and common question searches on WordFindLab.">
<link rel="canonical" href="${SITE}/word-patterns/">
<meta property="og:title" content="Word Patterns | WordFindLab">
<meta property="og:description" content="Browse programmatic word pattern pages for letters, prefixes, suffixes, categories, and common question searches on WordFindLab.">
<meta property="og:url" content="${SITE}/word-patterns/">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Word Patterns",
  "url": "${SITE}/word-patterns/",
  "description": "Browse programmatic word pattern pages for letters, prefixes, suffixes, categories, and common question searches on WordFindLab."
}
</script>
</head>
<body>
<main class="page-wrap programmatic-shell">
  <section class="programmatic-main">
    <section class="card programmatic-hero">
      <div class="programmatic-kicker">Pattern Hub</div>
      <h1>Word Patterns</h1>
      <p class="lede">Explore thousands of clean, indexable pages built around letters, prefixes, suffixes, categories, and common questions. Every page stays aligned with WordFindLab and keeps the layout useful for readers.</p>
      <div class="programmatic-summary">
        <span class="summary-pill">Start pages: ${PREFIX_LIST.length} patterns</span>
        <span class="summary-pill">End pages: ${SUFFIX_LIST.length} patterns</span>
        <span class="summary-pill">Contains pages: ${CONTAINS_LIST.length} patterns</span>
        <span class="summary-pill">Question pages: ${QUESTION_SPECS.length}</span>
      </div>
    </section>

    <div class="ad-wrap ad-top">
      <span class="ad-label">Advertisement</span>
      <div class="ad-slot ad-slot-banner adsterra-slot" data-adsterra-placement="top"></div>
    </div>

    <section class="card">
      <h2>Featured pages</h2>
      <div class="programmatic-grid">
        ${featured.map((item) => `
          <a class="card" href="${item.href}" style="display:block;text-decoration:none;color:inherit;margin-bottom:0">
            <h3 style="margin:0 0 6px">${escapeHtml(item.label)}</h3>
            <p style="margin:0;color:var(--ink-2)">${escapeHtml(item.desc)}</p>
          </a>
        `).join("")}
      </div>
    </section>

    <div class="ad-wrap ad-mid-content">
      <span class="ad-label">Advertisement</span>
      <div class="ad-slot ad-slot-rect adsterra-slot" data-adsterra-placement="mid"></div>
    </div>

    <section class="card seo-section">
      <h2>Browse by intent</h2>
      <div class="pattern-links">
        ${[
          { href: "/word-patterns/start/re/", label: "Start patterns" },
          { href: "/word-patterns/end/ing/", label: "End patterns" },
          { href: "/word-patterns/contains/qu/", label: "Contains patterns" },
          { href: "/word-patterns/categories/q-without-u/", label: "Category pages" },
          { href: "/word-patterns/questions/how-many-words-start-with-re/", label: "Question pages" }
        ].map((link) => `<a class="pattern-link" href="${link.href}">${escapeHtml(link.label)}</a>`).join("")}
      </div>

      <h2>Popular questions</h2>
      <div class="pattern-links">${questionLinks}</div>

      <h2>Popular categories</h2>
      <div class="pattern-links">${categoryLinks}</div>

      <h2>How this hub helps</h2>
      <p>The hub keeps the page structure simple: a clear headline, a helpful intro, a live results area, and a small set of focused links. That combination works well for readers and gives search engines enough context to understand what each page is about.</p>
    </section>
  </section>

  <aside class="page-sidebar programmatic-sidebar">
    <div class="ad-slot ad-slot-sidebar adsterra-slot" data-adsterra-placement="lower"></div>
    <div class="card">
      <div class="tools-widget-title">Word Tools</div>
      <div class="tools-widget-links">
        ${HUB_LINKS.map((link) => `<a href="${link.href}">${escapeHtml(link.label)}</a>`).join("")}
      </div>
    </div>
    <div class="card">
      <div class="tools-widget-title">Quick Links</div>
      <div class="pattern-links">
        <a class="pattern-link" href="/guides/">Guides</a>
        <a class="pattern-link" href="/blog/">Blog</a>
        <a class="pattern-link" href="/dictionary/">Dictionary</a>
      </div>
    </div>
  </aside>
</main>

<div class="ad-wrap ad-mobile-bottom">
  <span class="ad-label">Advertisement</span>
  <div class="ad-slot ad-slot-mobile-bottom adsterra-slot" data-adsterra-placement="mobile-bottom"></div>
</div>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-links">
      <a href="/word-patterns/">Word Patterns</a>
      <a href="/word-lists/">Word Lists</a>
      <a href="/guides/">Guides</a>
      <a href="/blog/">Blog</a>
    </div>
    <div class="footer-copy">&copy; 2026 WordFindLab &nbsp;&middot;&nbsp; <a href="/privacy-policy/" style="color:#8891a8">Privacy Policy</a> &nbsp;&middot;&nbsp; <a href="/terms/" style="color:#8891a8">Terms</a></div>
  </div>
</footer>

<script src="/assets/sitewide-ads.js?v=20260515"></script>
<script src="/assets/wordfindlab.js?v=20260515"></script>
<script src="/assets/programmatic.js?v=20260515"></script>
</body>
</html>`;
}

function pageMetaFromSpec(spec) {
  const humanPattern = spec.pattern.toUpperCase();
  const family = spec.mode === "start" ? "Starting With" : spec.mode === "end" ? "Ending With" : "Containing";
  const lengthLabelText = spec.bucketLabel || "All lengths";
  const title = spec.bucketSlug ? `Words ${family} ${humanPattern} - ${lengthLabelText}` : `Words ${family} ${humanPattern}`;
  const description = spec.bucketSlug
    ? `Browse ${lengthLabelText.toLowerCase()} English words ${spec.mode === "start" ? "starting with" : spec.mode === "end" ? "ending with" : "containing"} ${humanPattern}. Sort by score, length, and usefulness.`
    : `Browse English words ${spec.mode === "start" ? "starting with" : spec.mode === "end" ? "ending with" : "containing"} ${humanPattern}. Sort by score, length, and usefulness.`;

  return { title, description };
}

function buildPatternSpec(kind, pattern, bucket) {
  const base = pageMetaFromSpec({ mode: kind, pattern, bucketSlug: bucket.slug, bucketLabel: bucket.label });
  const page = {
    mode: kind,
    pattern,
    category: "",
    minLen: bucket.minLen,
    maxLen: bucket.maxLen,
    title: base.title,
    description: base.description,
    canonical: `${SITE}${pagePath(kind, pattern, bucket.slug)}`,
    patternText: pattern.toUpperCase(),
    lengthText: bucket.label,
    summary: kind === "start"
      ? `Find words starting with ${pattern.toUpperCase()} and compare short, mid, long, and extended matches.`
      : kind === "end"
        ? `Find words ending with ${pattern.toUpperCase()} and compare short, mid, long, and extended matches.`
        : `Find words containing ${pattern.toUpperCase()} and compare short, mid, long, and extended matches.`,
    intro: kind === "start"
      ? `Use this page to browse English words starting with ${pattern.toUpperCase()}. The live list stays sorted by score and stays easy to scan on mobile.`
      : kind === "end"
        ? `Use this page to browse English words ending with ${pattern.toUpperCase()}. The live list stays sorted by score and stays easy to scan on mobile.`
        : `Use this page to browse English words containing ${pattern.toUpperCase()}. The live list stays sorted by score and stays easy to scan on mobile.`,
    bucketSlug: bucket.slug,
    bucketLabel: bucket.label,
    breadcrumbHref: pagePath(kind, pattern),
    breadcrumbLabel: kind === "start" ? `Starting With ${pattern.toUpperCase()}` : kind === "end" ? `Ending With ${pattern.toUpperCase()}` : `Containing ${pattern.toUpperCase()}`,
    relatedLinks: buildRelatedLinks(kind, pattern, bucket.slug),
    faq: [
      { q: `How do I use words ${kind === "start" ? "starting" : kind === "end" ? "ending" : "containing"} ${pattern.toUpperCase()}?`, a: "Use the live results to compare lengths, spot stronger scoring words, and jump to the best fit for the board or puzzle." },
      { q: `Why are the results grouped this way?`, a: "Grouping by length and score keeps the page readable while still showing enough words to help with quick decisions." }
    ]
  };

  return page;
}

function buildCategorySpec(category) {
  return {
    mode: category.mode,
    pattern: "",
    category: category.category,
    minLen: category.minLen || 2,
    maxLen: category.maxLen || 15,
    title: category.title,
    description: `${category.summary} Browse the live word list and compare better options quickly on WordFindLab.`,
    canonical: `${SITE}/word-patterns/categories/${category.slug}/`,
    patternText: category.title,
    lengthText: category.minLen && category.maxLen ? lengthLabel(category.minLen, category.maxLen) : "All lengths",
    summary: category.summary,
    intro: category.summary,
    bucketSlug: "",
    bucketLabel: "",
    breadcrumbHref: `/word-patterns/categories/${category.slug}/`,
    breadcrumbLabel: category.title,
    relatedLinks: [
      { href: "/word-patterns/", label: "Pattern Hub" },
      { href: "/word-patterns/start/re/", label: "Start patterns" },
      { href: "/word-patterns/end/ing/", label: "End patterns" },
      { href: "/word-patterns/contains/qu/", label: "Contains patterns" },
      { href: "/word-lists/", label: "Word Lists" },
      { href: "/dictionary/", label: "Dictionary" }
    ],
    faq: [
      { q: `What does this category help with?`, a: category.summary },
      { q: `Can I use this on mobile?`, a: "Yes. The layout is built to stay readable, with ad placements kept out of the way of the main results." }
    ]
  };
}

function buildQuestionSpec(spec) {
  const lengthPart = spec.minLen && spec.maxLen ? ` ${lengthLabel(spec.minLen, spec.maxLen)}` : "";
  return {
    mode: spec.mode,
    pattern: spec.pattern,
    category: "",
    minLen: spec.minLen || Math.max(spec.pattern.length, 2),
    maxLen: spec.maxLen || 15,
    title: spec.title,
    description: `${spec.summary} Browse the live results on WordFindLab.`,
    canonical: `${SITE}/word-patterns/questions/${spec.slug}/`,
    patternText: spec.pattern.toUpperCase(),
    lengthText: spec.minLen && spec.maxLen ? lengthLabel(spec.minLen, spec.maxLen) : "All lengths",
    summary: spec.summary,
    intro: `${spec.summary}${lengthPart ? ` This page narrows the live results to ${lengthPart.trim().toLowerCase()}.` : ""}`,
    bucketSlug: "",
    bucketLabel: "",
    breadcrumbHref: `/word-patterns/questions/${spec.slug}/`,
    breadcrumbLabel: spec.title,
    relatedLinks: [
      { href: "/word-patterns/", label: "Pattern Hub" },
      { href: `/word-patterns/${spec.mode}/${spec.pattern}/`, label: `${spec.pattern.toUpperCase()} page` },
      { href: "/word-lists/", label: "Word Lists" },
      { href: "/guides/", label: "Guides" },
      { href: "/dictionary/", label: "Dictionary" }
    ],
    faq: [
      { q: "Why is this page useful?", a: "It gives a short, search-friendly answer while still showing a live pattern list that readers can use right away." },
      { q: "What if I need a different length?", a: "Use the related links or jump back to the hub to find a different pattern page." }
    ]
  };
}

function writeFile(target, content) {
  ensureDir(target);
  fs.writeFileSync(target, content, "utf8");
}

function updateSitemap(urls) {
  const sitemapPath = path.join(ROOT, "sitemap.xml");
  const existing = fs.readFileSync(sitemapPath, "utf8");
  const blockRegex = /<url>\s*<loc>(.*?)<\/loc>[\s\S]*?<\/url>/g;
  const seen = new Set();
  const blocks = [];

  let match;
  while ((match = blockRegex.exec(existing)) !== null) {
    const url = match[1].trim();
    if (seen.has(url)) continue;
    seen.add(url);
    blocks.push(match[0]);
  }

  urls.forEach((url) => {
    if (seen.has(url)) return;
    seen.add(url);
    blocks.push(`  <url>\n    <loc>${url}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
  });

  fs.writeFileSync(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${blocks.join("\n")}\n</urlset>\n`, "utf8");
}

function main() {
  const generatedUrls = [];

  writeFile(path.join(ROOT, "word-patterns", "index.html"), renderHubPage());
  generatedUrls.push(`${SITE}/word-patterns/`);

  const patternGroups = [
    { kind: "start", items: PREFIX_LIST },
    { kind: "end", items: SUFFIX_LIST },
    { kind: "contains", items: CONTAINS_LIST }
  ];

  patternGroups.forEach((group) => {
    group.items.forEach((pattern) => {
      const buckets = buildLengthBuckets(pattern);
      const overview = buckets[0];
      const overviewSpec = buildPatternSpec(group.kind, pattern, overview);
      const overviewPath = pageFilePath(group.kind, pattern, "");
      writeFile(overviewPath, renderPage(overviewSpec));
      generatedUrls.push(overviewSpec.canonical);

      buckets.slice(1).forEach((bucket) => {
        const spec = buildPatternSpec(group.kind, pattern, bucket);
        const bucketPath = pageFilePath(group.kind, pattern, bucket.slug);
        writeFile(bucketPath, renderPage(spec));
        generatedUrls.push(spec.canonical);
      });
    });
  });

  CATEGORIES.forEach((category) => {
    const spec = buildCategorySpec(category);
    const file = path.join(ROOT, "word-patterns", "categories", category.slug, "index.html");
    writeFile(file, renderPage(spec));
    generatedUrls.push(spec.canonical);
  });

  QUESTION_SPECS.forEach((spec) => {
    const page = buildQuestionSpec(spec);
    const file = path.join(ROOT, "word-patterns", "questions", spec.slug, "index.html");
    writeFile(file, renderPage(page));
    generatedUrls.push(page.canonical);
  });

  updateSitemap(generatedUrls);
  console.log(`Generated ${generatedUrls.length} programmatic SEO pages.`);
}

main();
