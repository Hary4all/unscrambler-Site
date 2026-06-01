const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://wordfindlab.com";
const BUILD_DATE = "2026-05-23";

const NAV_LINKS = [
  { href: "/scrabble-word-finder/", label: "Scrabble Finder" },
  { href: "/wordle-solver/", label: "Wordle Solver" },
  { href: "/anagram-solver/", label: "Anagram Solver" },
  { href: "/words-with-friends-cheat/", label: "Words With Friends" },
  { href: "/jumble-solver/", label: "Jumble Solver" },
  { href: "/word-patterns/", label: "Word Patterns" },
  { href: "/dictionary/", label: "Dictionary" }
];

const FOOTER_LINKS = [
  { href: "/word-lists/", label: "Word Lists" },
  { href: "/word-patterns/", label: "Word Patterns" },
  { href: "/guides/", label: "Guides" },
  { href: "/blog/", label: "Blog" },
  { href: "/scrabble-word-finder/", label: "Scrabble Finder" },
  { href: "/wordle-solver/", label: "Wordle Solver" },
  { href: "/anagram-solver/", label: "Anagram Solver" },
  { href: "/dictionary/", label: "Dictionary" }
];

const TOOL_LINKS = [
  { href: "/scrabble-word-finder/", label: "Scrabble Finder", note: "Score-first search" },
  { href: "/wordle-solver/", label: "Wordle Solver", note: "Clue helper" },
  { href: "/anagram-solver/", label: "Anagram Solver", note: "Mixed letters" },
  { href: "/jumble-solver/", label: "Jumble Solver", note: "Daily puzzle" },
  { href: "/dictionary/", label: "Dictionary", note: "Word meanings" },
  { href: "/word-lists/", label: "Word Lists", note: "Curated word pages" }
];

const COUNT_PAGES = [
  {
    count: 0,
    title: "Words With 0 Vowels",
    description:
      "Browse words with no standard vowels for Scrabble, crossword challenges, and rare-letter puzzle play.",
    intro:
      "Words with zero vowels are rare and memorable. This family counts only A, E, I, O, and U, so words like crypt, glyph, and rhythm fit neatly here. Use this page when you want a challenge rack or an unusual pattern that feels sharp and compact.",
    summary: "Rare-letter challenge words and tricky board plays.",
    samples: ["crypt", "glyph", "rhythm", "lynx", "myth", "shyly", "nymph", "why", "spry", "tryst"],
    why:
      "Zero-vowel words are useful for challenge boards because they eliminate a lot of vowel-heavy noise and leave you with clean, uncommon letter shapes.",
    faq: [
      {
        q: "Do you count Y as a vowel here?",
        a: "No. This family counts the five standard vowels only: A, E, I, O, and U."
      },
      {
        q: "Why are zero-vowel words useful?",
        a: "They can help with rare-letter racks, challenge rounds, and tricky crossword or Scrabble-style boards."
      }
    ]
  },
  {
    count: 1,
    title: "Words With 1 Vowel",
    description:
      "Browse words with exactly one vowel for compact puzzle plays, clean racks, and quick pattern checks.",
    intro:
      "One-vowel words are compact, familiar, and very common in puzzle play. They are a handy middle ground: enough vowel support to feel natural, but still lean enough to fit tight boards and letter constraints.",
    summary: "Compact puzzle words with a lean vowel shape.",
    samples: ["cat", "dog", "brick", "world", "march", "jump", "blink", "plant", "crisp", "track"],
    why:
      "One-vowel words are especially useful when you want a board-friendly word that keeps the vowel count low without becoming obscure.",
    faq: [
      {
        q: "Are one-vowel words common in word games?",
        a: "Yes. They show up often because they are short, practical, and easy to fit into a board."
      },
      {
        q: "Can these help with Wordle?",
        a: "Yes. One-vowel words are great for testing consonant-heavy shapes and narrowing the board quickly."
      }
    ]
  },
  {
    count: 2,
    title: "Words With 2 Vowels",
    description:
      "Browse words with exactly two vowels for balanced puzzle words, Wordle helpers, and everyday word-game searches.",
    intro:
      "Two-vowel words are the sweet spot for many players. They feel natural, they are easy to scan, and they often provide enough structure to fit both clue-based puzzles and letter-based solving.",
    summary: "Balanced words that feel natural and flexible.",
    samples: ["apple", "table", "river", "music", "flower", "broken", "paper", "bucket", "travel", "pencil"],
    why:
      "Two-vowel words often strike the best balance between readability and flexibility, which is why they are so useful in daily puzzle work.",
    faq: [
      {
        q: "Why are two-vowel words a strong search target?",
        a: "They are common, flexible, and easy to use across many puzzle types."
      },
      {
        q: "Do these pages help with Scrabble?",
        a: "Yes. They help you compare letter balance and spot words that fit awkward racks."
      }
    ]
  },
  {
    count: 3,
    title: "Words With 3 Vowels",
    description:
      "Browse words with exactly three vowels for mid-length puzzle words, clue solving, and balanced letter patterns.",
    intro:
      "Three-vowel words give you a more open shape without becoming overly long. They are useful when you want a word that feels balanced, readable, and practical for puzzles that reward pattern awareness.",
    summary: "Mid-balance words that work well in many games.",
    samples: ["banana", "camera", "orange", "animal", "cereal", "holiday", "private", "balance", "junior", "quality"],
    why:
      "Three-vowel words often fit the sweet spot between compact and expressive, making them good for broad puzzle hunting.",
    faq: [
      {
        q: "Are three-vowel words good for crossword clues?",
        a: "Yes. They are often easy to read, easy to place, and easy to scan by eye."
      },
      {
        q: "Do vowel-count pages help with vocabulary?",
        a: "Yes. They encourage you to notice how many vowels a word uses and how that affects the word shape."
      }
    ]
  },
  {
    count: 4,
    title: "Words With 4 Vowels",
    description:
      "Browse words with exactly four vowels for longer puzzle-friendly words and flexible board-search strategies.",
    intro:
      "Four-vowel words are rich, readable, and often feel more descriptive. They are useful when you need a word with a little more sound and shape, but still want the result to stay practical for board games and daily puzzles.",
    summary: "Rich, readable words with a fuller vowel shape.",
    samples: ["adventure", "mountain", "delicate", "operate", "unusual", "aerobic", "auditor", "equality", "awesome", "elevator"],
    why:
      "Four-vowel words are especially helpful when you need more openness in the word shape without jumping to the very longest entries.",
    faq: [
      {
        q: "Why are four-vowel words interesting?",
        a: "They often feel fuller and more flexible, which can make them stand out in clue-based puzzles."
      },
      {
        q: "Can I use this page to compare board options?",
        a: "Yes. It is a quick way to compare words with a fuller vowel profile."
      }
    ]
  },
  {
    count: 5,
    title: "Words With 5 Vowels",
    description:
      "Browse words with exactly five vowels for vowel-rich searches, strategy practice, and long-form word browsing.",
    intro:
      "Five-vowel words are vowel-rich and easy to recognize once you start looking for them. They can be especially handy when you want a fuller word shape or when you are comparing longer puzzle answers against a vowel-heavy rack.",
    summary: "Vowel-rich words for longer searches and deeper pattern browsing.",
    samples: ["beautiful", "bureaucrat", "education", "equation", "automaton", "aureole", "meticulous", "inaugural", "sequoia", "aeronaut"],
    why:
      "Five-vowel words are useful because they combine readability with a strong vowel profile, which makes them easy to remember in puzzle work.",
    faq: [
      {
        q: "Are five-vowel words rare?",
        a: "They are less common than one- or two-vowel words, so they stand out more in searches."
      },
      {
        q: "Why make a whole hub for vowel counts?",
        a: "Because vowel count is a quick, practical way to compare word shape across many games and search tasks."
      }
    ]
  },
  {
    count: 6,
    title: "Words With 6 Vowels",
    description:
      "Browse words with exactly six vowels for rich long-form word searches, advanced puzzle play, and pattern discovery.",
    intro:
      "Six-vowel words are the richest end of this family and are often longer, more expressive, and more interesting to scan. They can be useful when you want a fuller letter shape, a higher-information puzzle answer, or a longer word that still feels easy to explain.",
    summary: "Longer, richer words with a strong vowel profile.",
    samples: ["autobiography", "aeronautic", "counteraction", "questionable", "equatorial", "simultaneous", "unavoidable", "communication", "counterbalance", "overeducated"],
    why:
      "Six-vowel words are the most vowel-rich entries in this family and can be useful when you want to browse longer, more descriptive words.",
    faq: [
      {
        q: "Why do six-vowel words matter?",
        a: "They create a strong vowel-heavy profile that is useful for advanced searches and long-form word browsing."
      },
      {
        q: "Do these pages change how Google sees the site?",
        a: "Yes, in a good way. They add real evergreen indexable content instead of redirect-only stubs."
      }
    ]
  }
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function validateSamples() {
  for (const page of COUNT_PAGES) {
    for (const word of page.samples) {
      const actual = vowelCount(word);
      if (actual !== page.count) {
        throw new Error(`Sample word "${word}" has ${actual} vowels, expected ${page.count}`);
      }
    }
  }
}

function vowelCount(word) {
  return String(word).toLowerCase().split("").filter((char) => "aeiou".includes(char)).length;
}

function renderNav() {
  const links = NAV_LINKS.map((item) => `<li><a href="${item.href}">${escapeHtml(item.label)}</a></li>`).join("");
  return `
<nav class="site-nav">
  <a class="nav-logo" href="/">WordFindLab</a>
  <ul>
    ${links}
  </ul>
</nav>`;
}

function renderFooter() {
  const links = FOOTER_LINKS.map((item) => `<a href="${item.href}">${escapeHtml(item.label)}</a>`).join("");
  return `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-links">
      ${links}
    </div>
    <div class="footer-copy">&copy; 2026 WordFindLab &mdash; <a href="/privacy-policy/">Privacy Policy</a> &mdash; <a href="/terms/">Terms</a></div>
  </div>
</footer>`;
}

function renderCountsTabs(currentCount) {
  return COUNT_PAGES.map((page) => {
    const active = page.count === currentCount ? " current" : "";
    return `<a class="vowel-tab${active}" href="/words-by-vowel-count/${page.count}/">${page.count} vowel${page.count === 1 ? "" : "s"}</a>`;
  }).join("");
}

function renderSampleChips(samples) {
  return samples.map((word) => `<span class="sample-chip">${escapeHtml(word)}</span>`).join("");
}

function renderFAQ(faqs) {
  return faqs.map((item) => `
    <div class="faq-item">
      <div class="faq-q">${escapeHtml(item.q)}</div>
      <div class="faq-a">${escapeHtml(item.a)}</div>
    </div>`).join("");
}

function renderHead({ title, description, canonical, robots, jsonLd, extraStyles }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
<script data-grow-initializer="">!(function(){window.growMe||((window.growMe=function(e){window.growMe._.push(e);}),(window.growMe._=[]));var e=document.createElement("script");(e.type="text/javascript"),(e.src="https://faves.grow.me/main.js"),(e.defer=!0),e.setAttribute("data-grow-faves-site-id","U2l0ZTpmNTM4OGI3Ny04N2JmLTQxNzYtOGJkNS1kNGNmMmNmNDM2MzY=");var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t);})();</script>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T55GC2PM');</script>
<!-- End Google Tag Manager -->
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-2BKVHJW1RE"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-2BKVHJW1RE');
</script>
<script>
  window.dataLayer = window.dataLayer || [];
  window.trackWFL = window.trackWFL || function(eventName, data = {}) {
    window.dataLayer.push({
      event: eventName,
      page_path: window.location.pathname,
      page_title: document.title || "",
      ...data
    });
  };
</script>
<script defer src="/assets/wfl-measurement.js?v=20260601"></script>

<meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="p:domain_verify" content="ce85f169c38454cb352a510f074a7c62" />
  <title>${escapeHtml(title)} | WordFindLab</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${robots || "index,follow"}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)} | WordFindLab">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/assets/style.css">
  <style>
    .vowel-shell { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; align-items: start; }
    .vowel-hero { display: grid; gap: 10px; }
    .vowel-kicker { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; background: rgba(37,99,235,.08); color: var(--accent); border-radius: 999px; padding: 7px 12px; font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
    .vowel-summary { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .vowel-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 999px; background: var(--bg); border: 1px solid var(--border); color: var(--ink-2); font-size: 13px; font-weight: 600; }
    .vowel-pill strong { color: var(--ink); }
    .vowel-tabbar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .vowel-tab { display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--ink); font-weight: 700; font-size: 13px; text-decoration: none; }
    .vowel-tab:hover, .vowel-tab.current { background: var(--accent); border-color: var(--accent); color: #fff; text-decoration: none; }
    .sample-chip-grid, .live-word-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .sample-chip, .live-word-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 999px; background: var(--bg); border: 1px solid var(--border); color: var(--ink); font-weight: 700; }
    .sample-chip { letter-spacing: .02em; }
    .live-word-chip { background: #fff; }
    .live-word-chip small { color: var(--muted); font-weight: 600; }
    .live-status { color: var(--muted); font-size: 13px; margin-bottom: 10px; }
    .count-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .count-card { border: 1px solid var(--border); background: var(--surface); border-radius: 12px; padding: 14px; text-decoration: none; color: var(--ink); box-shadow: var(--shadow-sm); transition: transform .15s, border-color .15s; }
    .count-card:hover { transform: translateY(-1px); border-color: var(--accent); text-decoration: none; }
    .count-card .num { font-size: 28px; font-weight: 900; color: var(--accent); line-height: 1; }
    .count-card .label { margin-top: 4px; font-size: 13px; font-weight: 800; }
    .count-card .copy { margin-top: 8px; font-size: 12.5px; color: var(--ink-2); line-height: 1.45; }
    .count-stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
    .count-stat { padding: 12px; border-radius: 12px; border: 1px solid var(--border); background: linear-gradient(180deg, rgba(37,99,235,.05), rgba(37,99,235,.02)); }
    .count-stat strong { display: block; font-size: 20px; line-height: 1; margin-bottom: 4px; }
    .count-stat span { color: var(--ink-2); font-size: 12px; }
    .count-note { margin-top: 10px; color: var(--muted); font-size: 13px; line-height: 1.6; }
    .count-footer-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .count-footer-links a { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 999px; border: 1px solid var(--border); background: var(--bg); color: var(--ink); text-decoration: none; font-size: 13px; font-weight: 700; }
    .count-footer-links a:hover { border-color: var(--accent); color: var(--accent); text-decoration: none; }
    .ad-wrap { margin: 0 0 14px; }
    .vowel-faq .faq-item:first-child { border-top: 0; }
    @media (max-width: 900px) {
      .vowel-shell { grid-template-columns: 1fr; }
      .count-stat-grid { grid-template-columns: 1fr; }
      .count-grid { grid-template-columns: 1fr; }
    }
  </style>
  <script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7302891841207454" crossorigin="anonymous"></script>
  <script src="/assets/noindex-query.js?v=20260518"></script>
${extraStyles || ""}
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T55GC2PM"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
${renderNav()}
`;
}

function renderSidebar(currentCount) {
  const links = COUNT_PAGES.map((page) => {
    const active = page.count === currentCount ? ' style="border-color:var(--accent);color:var(--accent)"' : "";
    return `<a href="/words-by-vowel-count/${page.count}/"${active}>${page.count} vowel${page.count === 1 ? "" : "s"}</a>`;
  }).join("");

  const tools = TOOL_LINKS.map((item) => `<a href="${item.href}">${escapeHtml(item.label)}<span>${escapeHtml(item.note)}</span></a>`).join("");

  return `
    <div class="ad-wrap">
      <div class="ad-slot ad-slot-sidebar adsterra-slot" data-adsterra-placement="lower"></div>
    </div>
    <section class="card">
      <div class="tools-widget-title">Browse counts</div>
      <div class="count-footer-links" style="margin-top:10px">${links}</div>
    </section>
    <section class="card">
      <div class="tools-widget-title">Word Tools</div>
      <div class="tools-widget-links">${tools}</div>
    </section>
  `;
}

function renderHubPage() {
  const title = "Words By Vowel Count";
  const description =
    "Browse words grouped by vowel count, from zero-vowel challenge words to richer vowel-heavy options.";
  const canonical = `${SITE}/words-by-vowel-count/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${title} | WordFindLab`,
    description,
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: "WordFindLab",
      url: SITE
    }
  };

  const cards = COUNT_PAGES.map((page) => `
    <a class="count-card" href="/words-by-vowel-count/${page.count}/">
      <div class="num">${page.count}</div>
      <div class="label">${page.count} vowel${page.count === 1 ? "" : "s"}</div>
      <div class="copy">${escapeHtml(page.summary)}</div>
    </a>
  `).join("");

  const intro = `
    <div class="card vowel-hero">
      <div class="vowel-kicker">Vowel Count Hub</div>
      <h1>${title}</h1>
      <p class="lede">Browse English words grouped by the number of standard vowels they contain. Start with 0 vowels for rare challenge words or move up to 6 vowels for richer long-form browsing. This family counts A, E, I, O, and U only.</p>
      <div class="vowel-summary">
        <span class="vowel-pill">Standard vowels: <strong>A, E, I, O, U</strong></span>
        <span class="vowel-pill">Great for <strong>Scrabble</strong></span>
        <span class="vowel-pill">Helpful for <strong>Wordle</strong></span>
        <span class="vowel-pill">Indexable hub pages</span>
      </div>
    </div>`;

  const main = `
  <div class="page-wrap">
    <main class="page-main">
      <div class="breadcrumb"><a href="/">Home</a> <span style="margin:0 5px;color:var(--muted)">&rsaquo;</span> <a href="/word-lists/">Word Lists</a> <span style="margin:0 5px;color:var(--muted)">&rsaquo;</span> <span>Words By Vowel Count</span></div>
      ${intro}
      <section class="card">
        <h2>Pick a vowel count</h2>
        <p>Use these cards to jump straight into the exact count you want. Each page is a real indexable hub, not a redirect stub.</p>
        <div class="count-grid">
          ${cards}
        </div>
      </section>
      <section class="card">
        <h2>Why this family helps</h2>
        <p>Vowel count is a fast way to compare word shape. It helps with rack balancing, clue scanning, and pattern-based searching across Scrabble, Wordle, crosswords, and other word games.</p>
        <p class="count-note">If you want a cleaner board shape, move lower. If you want richer, more vowel-heavy words, move higher.</p>
      </section>
      <section class="card">
        <h2>Frequently asked questions</h2>
        <div class="vowel-faq">
          <div class="faq-item">
            <div class="faq-q">Do you count Y as a vowel?</div>
            <div class="faq-a">No. This family counts only A, E, I, O, and U so the pages stay consistent and easy to compare.</div>
          </div>
          <div class="faq-item">
            <div class="faq-q">Can these pages help with puzzle solving?</div>
            <div class="faq-a">Yes. They are useful for Scrabble, Wordle, crosswords, and any puzzle where word shape matters.</div>
          </div>
          <div class="faq-item">
            <div class="faq-q">Are these pages indexable?</div>
            <div class="faq-a">Yes. The pretty URLs are real pages, and the old redirect-only files can continue pointing here for legacy traffic.</div>
          </div>
        </div>
      </section>
    </main>
    <aside class="page-sidebar">
      ${renderSidebar(-1)}
    </aside>
  </div>`;

  return `${renderHead({
    title,
    description,
    canonical,
    jsonLd
  })}
${main}
${renderFooter()}
<script src="/assets/adsterra.js?v=20260522" defer></script>
<script src="/assets/sitewide-ads.js?v=20260601"></script>
</body>
</html>`;
}

function renderCountPage(page) {
  const title = page.title;
  const description = page.description;
  const canonical = `${SITE}/words-by-vowel-count/${page.count}/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${title} | WordFindLab`,
    description,
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: "WordFindLab",
      url: SITE
    }
  };

  const samples = renderSampleChips(page.samples);
  const faqs = renderFAQ(page.faq);

  const main = `
  <div class="page-wrap">
    <main class="page-main">
      <div class="breadcrumb"><a href="/">Home</a> <span style="margin:0 5px;color:var(--muted)">&rsaquo;</span> <a href="/word-lists/">Word Lists</a> <span style="margin:0 5px;color:var(--muted)">&rsaquo;</span> <a href="/words-by-vowel-count/">Words By Vowel Count</a> <span style="margin:0 5px;color:var(--muted)">&rsaquo;</span> <span>${page.count} vowels</span></div>
      <div class="page-header">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(page.intro)}</p>
      </div>
      <div class="card">
        <div class="vowel-kicker">Exact vowel count</div>
        <div class="vowel-summary">
          <span class="vowel-pill">Current count: <strong>${page.count}</strong></span>
          <span class="vowel-pill">Standard vowels: <strong>A, E, I, O, U</strong></span>
          <span class="vowel-pill">${escapeHtml(page.summary)}</span>
        </div>
        <div class="count-stat-grid">
          <div class="count-stat"><strong>${page.count}</strong><span>Vowels in this family</span></div>
          <div class="count-stat"><strong>Live</strong><span>Dictionary-powered list</span></div>
          <div class="count-stat"><strong>Fast</strong><span>Useful for word games</span></div>
        </div>
      </div>
      <section class="card">
        <h2>Jump to another count</h2>
        <div class="vowel-tabbar">
          ${renderCountsTabs(page.count)}
        </div>
      </section>
      <section class="card">
        <h2>Quick examples</h2>
        <p>These sample words make the count easy to spot at a glance.</p>
        <div class="sample-chip-grid">
          ${samples}
        </div>
      </section>
      <section class="card">
        <h2>Live dictionary list</h2>
        <div class="live-status" id="vowelStatus">Loading words with ${page.count} vowels...</div>
        <div class="live-word-grid" id="vowelResults"></div>
        <button class="load-more-btn" id="vowelLoadMore" type="button" hidden>Load more</button>
        <p class="count-note">The live list loads from the WordFindLab word API and filters every result to this exact vowel count.</p>
      </section>
      <section class="card">
        <h2>Why this page is useful</h2>
        <p>${escapeHtml(page.why)}</p>
        <p>It is especially useful when you want to compare vowel balance across board-game plays, clue answers, or search results without having to sift through every unrelated word family.</p>
      </section>
      <section class="card">
        <h2>Frequently asked questions</h2>
        <div class="vowel-faq">
          ${faqs}
        </div>
      </section>
      <section class="card">
        <h2>Related WordFindLab pages</h2>
        <div class="count-footer-links">
          <a href="/word-lists/">Word Lists</a>
          <a href="/word-patterns/">Word Patterns</a>
          <a href="/scrabble-word-finder/">Scrabble Finder</a>
          <a href="/wordle-solver/">Wordle Solver</a>
          <a href="/anagram-solver/">Anagram Solver</a>
          <a href="/dictionary/">Dictionary</a>
        </div>
      </section>
    </main>
    <aside class="page-sidebar">
      ${renderSidebar(page.count)}
    </aside>
  </div>`;

  const pageScript = `
<script>
(function () {
  var COUNT = ${page.count};
  var STATUS = document.getElementById("vowelStatus");
  var RESULTS = document.getElementById("vowelResults");
  var LOAD_MORE = document.getElementById("vowelLoadMore");
  var allWords = [];
  var shown = 0;
  var BATCH = 120;
  var SCRABBLE = {A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};

  function countVowels(word) {
    var count = 0;
    for (var i = 0; i < word.length; i++) {
      if ("aeiou".indexOf(word[i]) !== -1) count++;
    }
    return count;
  }

  function score(word) {
    var total = 0;
    for (var i = 0; i < word.length; i++) {
      total += SCRABBLE[word[i].toUpperCase()] || 0;
    }
    return total;
  }

  function createChip(word) {
    var chip = document.createElement("span");
    chip.className = "live-word-chip";
    chip.innerHTML = "<strong>" + word.toUpperCase() + "</strong><small>" + word.length + " letters · " + score(word) + " pts</small>";
    return chip;
  }

  function render(reset) {
    if (reset) RESULTS.innerHTML = "";
    var end = Math.min(shown + BATCH, allWords.length);
    for (var i = shown; i < end; i++) {
      RESULTS.appendChild(createChip(allWords[i]));
    }
    shown = end;
    LOAD_MORE.hidden = shown >= allWords.length;
  }

  LOAD_MORE.addEventListener("click", function () {
    render(false);
  });

  fetch("/api/words?set=all&format=text", { cache: "force-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("word API failed");
      return res.text();
    })
    .then(function (text) {
      allWords = text
        .split(/\\r?\\n/)
        .map(function (w) { return w.trim().toLowerCase(); })
        .filter(function (w) { return /^[a-z]+$/.test(w) && countVowels(w) === COUNT; })
        .sort(function (a, b) { return score(b) - score(a) || a.localeCompare(b); });

      STATUS.textContent = allWords.length.toLocaleString() + " words found with " + COUNT + " vowels.";
      render(true);
    })
    .catch(function () {
      STATUS.textContent = "The live word list is loading slowly right now. The sample words above still help with browsing.";
      LOAD_MORE.hidden = true;
    });
})();
</script>`;

  return `${renderHead({
    title,
    description,
    canonical,
    jsonLd
  })}
${main}
${renderFooter()}
${pageScript}
<script src="/assets/adsterra.js?v=20260522" defer></script>
<script src="/assets/sitewide-ads.js?v=20260601"></script>
</body>
</html>`;
}

function writePage(filePath, html) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, html, "utf8");
}

function main() {
  validateSamples();

  writePage(path.join(ROOT, "words-by-vowel-count", "index.html"), renderHubPage());
  for (const page of COUNT_PAGES) {
    writePage(path.join(ROOT, "words-by-vowel-count", String(page.count), "index.html"), renderCountPage(page));
  }

  console.log(`Generated ${COUNT_PAGES.length + 1} vowel-count indexable pages.`);
}

main();
