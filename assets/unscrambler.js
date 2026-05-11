/* ============================================================
   WordToolbox — Shared Engine
   Loaded by every tool page.

   Exports (globals):
     SCRABBLE_POINTS, WWF_POINTS
     loadDictionary(which)   → Promise<bool>
     uniqueSortedSubsets(letters, minLen, maxLen) → string[]
     expandWildcards(letters) → string[][] | null
     scrabbleScore(word) → number
     wwfScore(word) → number
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
    "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt",
    "https://cdn.jsdelivr.net/gh/dwyl/english-words/words_alpha.txt",
    "https://cdn.jsdelivr.net/gh/dwyl/english-words@master/words_alpha.txt",
  ],
  common: [
    "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt",
    "https://cdn.jsdelivr.net/gh/first20hours/google-10000-english/google-10000-english-usa-no-swears.txt",
    "https://cdn.jsdelivr.net/gh/first20hours/google-10000-english@master/google-10000-english-usa-no-swears.txt",
  ]
};

const CACHE_VERSION = "v3";
let DICT_INDEX  = {};     // sorted-key → [UPPERCASE words]
let DICT_SET    = new Set();
let CURRENT_DICT = null;

async function loadDictionary(which) {
  which = which || "all";
  if (CURRENT_DICT === which) return true;

  setStatus('<span class="loader"></span> Loading ' + (which === "all" ? "full" : "common") + " dictionary…");

  const cacheKey = "unscrambler:" + CACHE_VERSION + ":" + which;
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
        // timed out or network error — try next URL
      }
    }
  }

  if (!raw || raw.length < 100) {
    setStatus("Couldn't load the dictionary — check your connection and refresh.", "warn");
    return false;
  }

  _buildIndex(raw);
  CURRENT_DICT = which;

  const el = document.getElementById("dictStat");
  if (el) el.textContent = DICT_SET.size.toLocaleString() + " words loaded";
  setStatus("Ready — " + DICT_SET.size.toLocaleString() + " words indexed.", "good");
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

// Core search — returns filtered word array
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
    out.innerHTML = '<div class="empty">No words found — try removing a filter or adding more letters.</div>';
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
    h.textContent = len + " letters · " + groups[len].length;
    g.appendChild(h);
    const wrap = document.createElement("div");
    wrap.className = "words";
    let isBest = true;
    for (const w of groups[len]) {
      const pts = scoreFn(w);
      const el  = document.createElement("span");
      el.className = "word";
      el.title = "Click to copy · " + pts + " pts";
      let badge = "";
      if (isBest && pts === topScore && topScore >= 8) {
        badge = '<span class="badge-best">Best</span>';
        isBest = false;
      }
      el.innerHTML = w + '<span class="pts' + (pts >= 10 ? " pts-high" : "") + '">' + pts + '</span>' + badge;
      el.addEventListener("click", () => copyWord(el, w));
      wrap.appendChild(el);
    }
    g.appendChild(wrap);
    out.appendChild(g);
  }
}

function copyWord(el, word) {
  if (navigator.clipboard) navigator.clipboard.writeText(word).catch(() => {});
  const prev = el.style.borderColor;
  el.style.borderColor = "var(--good)";
  setTimeout(() => { el.style.borderColor = prev; }, 600);
}

/* ---------- Nav injection ---------- */

const NAV_LINKS = [
  { href: "/",                         label: "Word Unscrambler"   },
  { href: "/scrabble-word-finder/",    label: "Scrabble Finder"    },
  { href: "/wordle-solver/",           label: "Wordle Solver"      },
  { href: "/anagram-solver/",          label: "Anagram Solver"     },
  { href: "/words-with-friends-cheat/",label: "Words With Friends" },
  { href: "/jumble-solver/",           label: "Jumble Solver"      },
];

const SIDEBAR_TOOLS = [
  { href: "/",                         icon: "🔀", label: "Word Unscrambler"   },
  { href: "/scrabble-word-finder/",    icon: "🎯", label: "Scrabble Finder"    },
  { href: "/wordle-solver/",           icon: "🟩", label: "Wordle Solver"      },
  { href: "/anagram-solver/",          icon: "🔤", label: "Anagram Solver"     },
  { href: "/words-with-friends-cheat/",icon: "💬", label: "Words With Friends" },
  { href: "/jumble-solver/",           icon: "🗞️",  label: "Jumble Solver"      },
];

function injectNav() {
  const nav  = document.createElement("nav");
  nav.className = "site-nav";
  const inner = document.createElement("div");
  inner.className = "nav-inner";

  // Logo
  const logo = document.createElement("a");
  logo.className = "nav-logo";
  logo.href = "/";
  logo.textContent = "🔤 WordFindLab";
  inner.appendChild(logo);

  // Nav links
  const links = document.createElement("div");
  links.className = "nav-links";
  links.id = "siteNavLinks";

  const currentPath = window.location.pathname.replace(/\/index\.html$/, "/");

  NAV_LINKS.forEach(item => {
    const a = document.createElement("a");
    a.href  = item.href;
    a.textContent = item.label;
    const isHome  = item.href === "/" && (currentPath === "/" || currentPath === "");
    const isMatch = item.href !== "/" && currentPath.startsWith(item.href);
    if (isHome || isMatch) a.className = "active";
    links.appendChild(a);
  });

  // Mobile hamburger toggle
  const toggle = document.createElement("button");
  toggle.className = "nav-toggle";
  toggle.setAttribute("aria-label", "Open navigation menu");
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = "&#9776;"; // ☰
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.innerHTML = open ? "&#10005;" : "&#9776;"; // ✕ / ☰
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
  inner.appendChild(toggle);
  nav.appendChild(inner);

  // Insert before first element or hero section
  const firstEl = document.body.firstElementChild;
  document.body.insertBefore(nav, firstEl);
}

document.addEventListener("DOMContentLoaded", injectNav);
