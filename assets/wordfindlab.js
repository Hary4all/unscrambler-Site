/* ============================================================
   WordFindLab - Shared Engine
   Loaded by every tool page.

   Exports (globals):
     SCRABBLE_POINTS, WWF_POINTS
     loadDictionary(which)   -> Promise<bool>
     uniqueSortedSubsets(letters, minLen, maxLen) -> string[]
     expandWildcards(letters) -> string[][] | null
     scrabbleScore(word) -> number
     wwfScore(word) -> number
     setStatus(html, cls)
     copyWord(el, word)
     injectNav()
============================================================ */

/* ---------- Point tables ---------- */

const SCRABBLE_POINTS = {
  A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,
  N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10
};

const WWF_POINTS = {
  A:1,B:4,C:4,D:2,E:1,F:4,G:3,H:3,I:1,J:10,K:5,L:2,M:4,
  N:2,O:1,P:4,Q:10,R:1,S:1,T:1,U:2,V:5,W:4,X:8,Y:3,Z:10
};

/* ---------- Dictionary ---------- */

const DICT_URLS = {
  all: [
    "/api/words?set=all&format=text",
    "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt",
    "https://cdn.jsdelivr.net/gh/dwyl/english-words/words_alpha.txt",
    "https://cdn.jsdelivr.net/gh/dwyl/english-words@master/words_alpha.txt",
  ],
  common: [
    "/api/meaningful-words?format=text",
    "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt",
    "https://cdn.jsdelivr.net/gh/first20hours/google-10000-english/google-10000-english-usa-no-swears.txt",
    "https://cdn.jsdelivr.net/gh/first20hours/google-10000-english@master/google-10000-english-usa-no-swears.txt",
  ]
};

const CACHE_VERSION = "v4";
let DICT_INDEX  = {};     // sorted-key -> [UPPERCASE words]
let DICT_SET    = new Set();
let CURRENT_DICT = null;

async function loadDictionary(which) {
  which = which || "all";
  if (CURRENT_DICT === which) return true;

  setStatus('<span class="loader"></span> Loading ' + (which === "all" ? "full" : "common") + " dictionary...");

  const cacheKey = "wordfindlab:" + CACHE_VERSION + ":" + which;
  let raw = null;

  // Try localStorage cache first
  try { raw = localStorage.getItem(cacheKey); } catch(e) {}

  // Try each URL in order until one works (30s timeout each)
  if (!raw) {
    const urls = DICT_URLS[which] || [];
    for (const url of urls) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 30000);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) continue;
        raw = await res.text();
        if (raw && raw.length > 100) {
          try { localStorage.setItem(cacheKey, raw); } catch(e) { /* quota */ }
          break; // success
        }
      } catch(err) {
        // timed out or network error - try next URL
      }
    }
  }

  if (!raw || raw.length < 100) {
    setStatus("Couldn't load the dictionary - check your connection and refresh.", "warn");
    return false;
  }

  _buildIndex(raw);
  CURRENT_DICT = which;
  setStatus("Dictionary ready.", "good");
  return true;
}

function _buildIndex(text) {
  DICT_INDEX = {};
  DICT_SET   = new Set();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const w = lines[i].trim().toUpperCase();
    if (w.length < 2 || w.length > 15) continue;
    if (!/^[A-Z]+$/.test(w)) continue;
    DICT_SET.add(w);
    const key = w.split("").sort().join("");
    if (!DICT_INDEX[key]) DICT_INDEX[key] = [];
    DICT_INDEX[key].push(w);
  }
}

/* ---------- Algorithm ---------- */

// All unique sorted subsets of a multiset of letters, within [minLen, maxLen].
function uniqueSortedSubsets(letters, minLen, maxLen) {
  const sorted = letters.slice().sort();
  const results = new Set();
  const n = sorted.length;
  const buf = [];
  function recurse(start) {
    if (buf.length >= minLen) results.add(buf.join(""));
    if (buf.length === maxLen) return;
    let prev = null;
    for (let i = start; i < n; i++) {
      if (sorted[i] === prev) continue;
      prev = sorted[i];
      buf.push(sorted[i]);
      recurse(i + 1);
      buf.pop();
    }
  }
  recurse(0);
  return Array.from(results);
}

// Expand ?/* wildcards into every concrete letter set (max 3 wildcards).
function expandWildcards(letters) {
  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const positions = [];
  const fixed = [];
  for (let i = 0; i < letters.length; i++) {
    const ch = letters[i];
    if (ch === "?" || ch === "*") positions.push(i);
    else fixed.push(ch);
  }
  if (positions.length === 0) return [letters];
  if (positions.length > 3) return null;
  const variations = [];
  function gen(idx, current) {
    if (idx === positions.length) { variations.push(current); return; }
    for (const c of ALPHA) gen(idx + 1, current.concat(c));
  }
  gen(0, fixed);
  return variations;
}

// Core search - returns filtered word array
function runSearch(rawInput, opts) {
  opts = opts || {};
  const minLen    = opts.minLen    !== undefined ? opts.minLen    : 2;
  const maxLen    = opts.maxLen    !== undefined ? opts.maxLen    : rawInput.length;
  const startsWith = (opts.startsWith || "").toUpperCase().replace(/[^A-Z]/g, "");
  const endsWith   = (opts.endsWith   || "").toUpperCase().replace(/[^A-Z]/g, "");
  const contains   = (opts.contains   || "").toUpperCase().replace(/[^A-Z]/g, "");
  const exactOnly  = !!opts.exactOnly; // must use all letters

  const variations = expandWildcards(rawInput.split(""));
  if (variations === null) return { error: "too_many_wildcards" };

  const found = new Set();
  for (const variant of variations) {
    if (exactOnly) {
      const key = variant.slice().sort().join("");
      const words = DICT_INDEX[key];
      if (words) words.forEach(w => found.add(w));
    } else {
      const subsets = uniqueSortedSubsets(variant, minLen, maxLen);
      for (const key of subsets) {
        const words = DICT_INDEX[key];
        if (words) words.forEach(w => found.add(w));
      }
    }
  }

  const filtered = [...found].filter(w => {
    if (startsWith && !w.startsWith(startsWith)) return false;
    if (endsWith   && !w.endsWith(endsWith))     return false;
    if (contains   && !w.includes(contains))     return false;
    return true;
  });

  return { words: filtered };
}

/* ---------- Scoring ---------- */

function scrabbleScore(word) {
  let s = 0;
  for (const c of word) s += SCRABBLE_POINTS[c] || 0;
  return s;
}

function wwfScore(word) {
  let s = 0;
  for (const c of word) s += WWF_POINTS[c] || 0;
  return s;
}

/* ---------- Render helpers ---------- */

function setStatus(html, cls) {
  const s = document.getElementById("status");
  if (!s) return;
  s.className = "status " + (cls || "");
  s.innerHTML = html;
}

function groupByLength(words) {
  const groups = {};
  for (const w of words) {
    (groups[w.length] = groups[w.length] || []).push(w);
  }
  return groups;
}

function renderWordGroups(containerId, words, scoreFn) {
  scoreFn = scoreFn || scrabbleScore;
  const out = document.getElementById(containerId);
  if (!out) return;
  out.innerHTML = "";

  if (!words || words.length === 0) {
    out.innerHTML = '<div class="empty">No words found - try removing a filter or adding more letters.</div>';
    return;
  }

  const groups = groupByLength(words);
  const lengths = Object.keys(groups).map(Number).sort((a, b) => b - a);
  for (const len of lengths) {
    groups[len].sort((a, b) => scoreFn(b) - scoreFn(a) || a.localeCompare(b));
    const topScore = scoreFn(groups[len][0]);
    const g   = document.createElement("div");
    g.className = "group";
    const h = document.createElement("h3");
    h.textContent = len + " letters - " + groups[len].length;
    g.appendChild(h);
    const wrap = document.createElement("div");
    wrap.className = "words";
    let isBest = true;
    for (const w of groups[len]) {
      const pts = scoreFn(w);
      const el  = document.createElement("span");
      el.className = "word";
      el.title = "Click for definition | Shift-click to copy | " + pts + " pts";
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("data-dictionary-word", w);
      let badge = "";
      if (isBest && pts === topScore && topScore >= 8) {
        badge = '<span class="badge-best">Best</span>';
        isBest = false;
      }
      el.innerHTML = w + '<span class="pts' + (pts >= 10 ? " pts-high" : "") + '">' + pts + '</span>' + badge;
      wrap.appendChild(el);
    }
    g.appendChild(wrap);
    out.appendChild(g);
  }
}

function collectWordsByPattern(opts) {
  opts = opts || {};
  const startsWith = (opts.startsWith || "").toUpperCase().replace(/[^A-Z]/g, "");
  const endsWith = (opts.endsWith || "").toUpperCase().replace(/[^A-Z]/g, "");
  const contains = (opts.contains || "").toUpperCase().replace(/[^A-Z]/g, "");
  const minLen = opts.minLen !== undefined ? opts.minLen : 2;
  const maxLen = opts.maxLen !== undefined ? opts.maxLen : 15;
  const limit = opts.limit !== undefined ? opts.limit : 120;
  const scoreFn = opts.scoreFn === "wwf" ? wwfScore : scrabbleScore;
  const extraFilter = typeof opts.extraFilter === "function" ? opts.extraFilter : null;

  const words = [];
  DICT_SET.forEach((word) => {
    if (word.length < minLen || word.length > maxLen) return;
    if (startsWith && !word.startsWith(startsWith)) return;
    if (endsWith && !word.endsWith(endsWith)) return;
    if (contains && !word.includes(contains)) return;
    if (extraFilter && !extraFilter(word)) return;
    words.push(word);
  });

  words.sort((a, b) => scoreFn(b) - scoreFn(a) || a.localeCompare(b));
  return {
    total: words.length,
    words: words.slice(0, limit),
    scoreFn
  };
}

function copyWord(el, word) {
  if (navigator.clipboard) navigator.clipboard.writeText(word).catch(() => {});
  const prev = el.style.borderColor;
  el.style.borderColor = "var(--good)";
  setTimeout(() => { el.style.borderColor = prev; }, 600);
}

/* ---------- Nav injection ---------- */

const NAV_LINKS = [
  { href: "/scrabble-word-finder/",     label: "Scrabble Finder" },
  { href: "/wordle-solver/",            label: "Wordle Solver" },
  { href: "/anagram-solver/",           label: "Anagram Solver" },
  { href: "/words-with-friends-cheat/", label: "Words With Friends" },
  { href: "/jumble-solver/",            label: "Jumble Solver" },
  { href: "/word-patterns/",            label: "Patterns" },
  { href: "/word-of-the-day/",          label: "Word of the Day" },
  { href: "/guides/",                   label: "Guides" },
  { href: "/dictionary/",               label: "Dictionary" },
  { href: "/blog/",                     label: "Blog" },
];

const SIDEBAR_TOOLS = [
  { href: "/scrabble-word-finder/",    badge: "SF",  label: "Scrabble Finder"    },
  { href: "/wordle-solver/",           badge: "WL",  label: "Wordle Solver"      },
  { href: "/anagram-solver/",          badge: "AN",  label: "Anagram Solver"     },
  { href: "/words-with-friends-cheat/",badge: "WWF", label: "Words With Friends" },
  { href: "/jumble-solver/",           badge: "JS",  label: "Jumble Solver"      },
  { href: "/word-patterns/",           badge: "WP",  label: "Word Patterns"      },
  { href: "/word-of-the-day/",         badge: "WD",  label: "Word of the Day"    },
];

const GROW = {
  src: "https://faves.grow.me/main.js",
  siteId: "U2l0ZTpmNTM4OGI3Ny04N2JmLTQxNzYtOGJkNS1kNGNmMmNmNDM2MzY="
};

let growBooted = false;

function injectNav() {
  const nav  = document.createElement("nav");
  nav.className = "site-nav";
  const inner = document.createElement("div");
  inner.className = "nav-inner";

  // Logo
  const logo = document.createElement("a");
  logo.className = "nav-logo";
  logo.href = "/";
  logo.innerHTML = '<span class="nav-logo-mark">WF</span><span class="nav-logo-copy"><span class="nav-logo-text">WordFindLab</span><span class="nav-logo-sub">Find the Word. Win the Board.</span></span>';
  inner.appendChild(logo);

  // Nav links
  const links = document.createElement("div");
  links.className = "nav-links";
  links.id = "siteNavLinks";

  const currentPath = window.location.pathname.replace(/\/index\.html$/, "/");

  NAV_LINKS.forEach(item => {
    const a = document.createElement("a");
    a.href  = item.href;
    a.innerHTML = item.label + (item.caret ? '<span class="nav-caret" aria-hidden="true"></span>' : "");
    const isHome  = item.href === "/" && (currentPath === "/" || currentPath === "");
    const isMatch = item.href !== "/" && currentPath.startsWith(item.href);
    if (isHome || isMatch) a.className = "active";
    links.appendChild(a);
  });

  const actions = document.createElement("div");
  actions.className = "nav-actions";
  actions.innerHTML = `
    <a class="nav-action nav-action--primary" href="/#search">Try Now Free</a>
  `;

  // Mobile hamburger toggle
  const toggle = document.createElement("button");
  toggle.className = "nav-toggle";
  toggle.setAttribute("aria-label", "Open navigation menu");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "&#9776;"; // menu
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.innerHTML = open ? "&#10005;" : "&#9776;"; // close / menu
  });
  // Close menu when a link is clicked
  links.addEventListener("click", e => {
    if (e.target.tagName === "A") {
      links.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = "&#9776;";
    }
  });

  inner.appendChild(links);
  inner.appendChild(actions);
  inner.appendChild(toggle);
  nav.appendChild(inner);

  // Insert before first element or hero section
  const firstEl = document.body.firstElementChild;
  document.body.insertBefore(nav, firstEl);
}

function injectGrowMe() {
  if (growBooted) return;
  growBooted = true;

  if (document.querySelector('script[src="' + GROW.src + '"]')) return;

  window.growMe = window.growMe || function (e) {
    window.growMe._.push(e);
  };
  window.growMe._ = window.growMe._ || [];

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = GROW.src;
  script.defer = true;
  script.setAttribute("data-grow-initializer", "");
  script.setAttribute("data-grow-faves-site-id", GROW.siteId);

  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
}

document.addEventListener("DOMContentLoaded", injectNav);
document.addEventListener("DOMContentLoaded", injectGrowMe);

window.WFL = window.WFL || {};
window.WFL.loadDictionary = loadDictionary;
window.WFL.collectWordsByPattern = collectWordsByPattern;
window.WFL.renderWordGroups = renderWordGroups;
window.WFL.scrabbleScore = scrabbleScore;
window.WFL.wwfScore = wwfScore;
window.WFL.runSearch = runSearch;



