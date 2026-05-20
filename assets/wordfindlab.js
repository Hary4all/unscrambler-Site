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
  { href: "/",                          label: "Home" },
  { href: "/crossword-game/",           label: "Crossword Game", badge: "NEW" },
  { href: "/scrabble-word-finder/",     label: "Scrabble Finder" },
  { href: "/wordle-solver/",            label: "Wordle Solver" },
  { href: "/anagram-solver/",           label: "Anagram Solver" },
  { href: "/words-with-friends-cheat/", label: "Words With Friends" },
  { href: "/jumble-solver/",            label: "Jumble Solver" },
  { href: "/word-patterns/",            label: "Patterns" },
  { href: "/guides/",                   label: "Guides" },
  { href: "/dictionary/",               label: "Dictionary" },
  { href: "/blog/",                     label: "Blog" },
];

const SIDEBAR_TOOLS = [
  { href: "/scrabble-word-finder/",     badge: "SF",  icon: "SF",  label: "Scrabble Finder"    },
  { href: "/wordle-solver/",            badge: "WL",  icon: "WL",  label: "Wordle Solver"      },
  { href: "/anagram-solver/",           badge: "AN",  icon: "AN",  label: "Anagram Solver"     },
  { href: "/words-with-friends-cheat/", badge: "WWF", icon: "WWF", label: "Words With Friends" },
  { href: "/jumble-solver/",            badge: "JS",  icon: "JS",  label: "Jumble Solver"      },
  { href: "/crossword-game/",           badge: "CW",  icon: "CW",  label: "Crossword Game"     },
  { href: "/word-patterns/",            badge: "WP",  icon: "WP",  label: "Word Patterns"      },
];

const FOOTER_LINKS = [
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
  { href: "/disclaimer/", label: "Disclaimer" },
  { href: "/privacy-policy/", label: "Privacy Policy" },
  { href: "/terms/", label: "Terms" },
  { href: "/crossword-game/", label: "Crossword Game" },
  { href: "https://www.facebook.com/profile.php?id=61589971622325", label: "Facebook", external: true },
];

const SUPPORT_URL = "";

function normalizePathForPrefill(path) {
  return (path || "/").replace(/\/index\.html$/, "/").replace(/\/+$/, "/") || "/";
}

function prefillStorageKey(path) {
  return "wordfindlab:prefill:" + normalizePathForPrefill(path);
}

function savePrefill(path, letters) {
  const value = (letters || "").trim();
  if (!value) return;
  try {
    localStorage.setItem(prefillStorageKey(path), value);
  } catch (err) {}
}

function consumePrefill(path) {
  const key = prefillStorageKey(path);
  try {
    const value = localStorage.getItem(key);
    if (!value) return "";
    localStorage.removeItem(key);
    return value;
  } catch (err) {
    return "";
  }
}

function installPrefillLinks() {
  if (window.__wflPrefillLinksInstalled) return;
  window.__wflPrefillLinksInstalled = true;

  document.addEventListener("click", function (event) {
    const link = event.target && event.target.closest ? event.target.closest("a[data-prefill-letters]") : null;
    if (!link) return;
    const letters = link.getAttribute("data-prefill-letters") || "";
    if (!letters) return;
    savePrefill(link.getAttribute("href") || "/", letters);
  });
}

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
    a.classList.toggle("nav-link--spotlight", item.badge === "NEW");
    a.innerHTML = `
      <span class="nav-link-label">${item.label}</span>
      ${item.badge ? `<span class="nav-link-badge">${item.badge}</span>` : ""}
      ${item.caret ? '<span class="nav-caret" aria-hidden="true"></span>' : ""}
    `;
    const isHome  = item.href === "/" && (currentPath === "/" || currentPath === "");
    const isMatch = item.href !== "/" && currentPath.startsWith(item.href);
    if (isHome || isMatch) a.classList.add("active");
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

function injectFooterLinks() {
  const groups = document.querySelectorAll(".footer-links, .site-footer-links");
  groups.forEach(group => {
    if (!group || group.dataset.wflFooterReady === "1") return;
    group.dataset.wflFooterReady = "1";

    const existing = new Set(
      Array.from(group.querySelectorAll("a"))
        .map(a => (a.getAttribute("href") || "").replace(/^https:\/\/wordfindlab\.com/, ""))
    );

    FOOTER_LINKS.forEach(item => {
      if (existing.has(item.href)) return;
      const a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      if (item.external) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      group.appendChild(a);
    });
  });
}

function injectSupportCard() {
  if (!SUPPORT_URL) return;
  if (document.querySelector(".support-card")) return;

  const footer = document.querySelector(".site-footer");
  if (!footer) return;

  const wrap = document.createElement("section");
  wrap.className = "card support-card";
  wrap.style.maxWidth = "970px";
  wrap.style.margin = "32px auto 16px";
  wrap.style.borderRadius = "16px";

  wrap.innerHTML = `
    <div class="support-card-kicker">Support this free tool</div>
    <h2 class="support-card-title">WordFindLab is free to use</h2>
    <p class="support-card-copy">If it helped you solve a puzzle, win a word game, or save time, you can support future improvements with a small coffee.</p>
    <a class="btn support-card-btn" href="${SUPPORT_URL}" target="_blank" rel="noopener noreferrer">☕ Support WordFindLab</a>
  `;

  footer.parentNode.insertBefore(wrap, footer);
}

function injectCatMascot() {
  if (document.querySelector(".wfl-cat-mascot")) return;
  if (!document.body) return;

  const wrap = document.createElement("div");
  wrap.className = "wfl-cat-mascot";
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = `
    <svg class="wfl-cat-mascot__svg" viewBox="0 0 260 260" role="presentation" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id="wfl-cat-fur" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffbb54" />
          <stop offset="42%" stop-color="#ff8b1f" />
          <stop offset="100%" stop-color="#f46b00" />
        </linearGradient>
        <radialGradient id="wfl-cat-highlight" cx="30%" cy="22%" r="80%">
          <stop offset="0%" stop-color="#ffdca6" stop-opacity=".95" />
          <stop offset="55%" stop-color="#ffd18e" stop-opacity=".45" />
          <stop offset="100%" stop-color="#ffd18e" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="wfl-cat-belly" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stop-color="#fff8ef" />
          <stop offset="100%" stop-color="#ffe4c8" />
        </radialGradient>
        <radialGradient id="wfl-cat-eye" cx="35%" cy="32%" r="70%">
          <stop offset="0%" stop-color="#4c2300" />
          <stop offset="100%" stop-color="#120900" />
        </radialGradient>
        <linearGradient id="wfl-cat-collar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="100%" stop-color="#b91c1c" />
        </linearGradient>
        <radialGradient id="wfl-cat-bell" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#fff3a4" />
          <stop offset="100%" stop-color="#f59e0b" />
        </radialGradient>
        <filter id="wfl-cat-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#0f172a" flood-opacity=".18"/>
        </filter>
      </defs>
      <g filter="url(#wfl-cat-shadow)">
        <ellipse cx="132" cy="181" rx="84" ry="62" fill="url(#wfl-cat-fur)" />
        <ellipse cx="128" cy="189" rx="56" ry="42" fill="url(#wfl-cat-belly)" />
        <ellipse cx="119" cy="111" rx="72" ry="62" fill="url(#wfl-cat-fur)" />
        <ellipse cx="118" cy="92" rx="64" ry="52" fill="url(#wfl-cat-highlight)" opacity=".7" />
        <polygon points="72,78 92,31 112,84" fill="url(#wfl-cat-fur)" />
        <polygon points="176,83 196,31 218,78" fill="url(#wfl-cat-fur)" />
        <polygon points="83,72 93,45 103,76" fill="#ffd9c9" />
        <polygon points="186,74 194,46 205,73" fill="#ffd9c9" />
        <ellipse cx="109" cy="101" rx="18" ry="22" fill="#fff" />
        <ellipse cx="148" cy="101" rx="18" ry="22" fill="#fff" />
        <circle cx="109" cy="104" r="10" fill="url(#wfl-cat-eye)" />
        <circle cx="148" cy="104" r="10" fill="url(#wfl-cat-eye)" />
        <circle cx="104" cy="98" r="3.5" fill="#fff" />
        <circle cx="143" cy="98" r="3.5" fill="#fff" />
        <ellipse cx="129" cy="120" rx="24" ry="20" fill="#fff5eb" />
        <path d="M121 123 C127 117 134 117 140 123" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <path d="M128 123 L122 130" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" />
        <path d="M128 123 L134 130" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" />
        <path d="M92 122 L57 112" stroke="#fff1e5" stroke-width="2.5" stroke-linecap="round" />
        <path d="M91 128 L53 129" stroke="#fff1e5" stroke-width="2.5" stroke-linecap="round" />
        <path d="M92 134 L58 145" stroke="#fff1e5" stroke-width="2.5" stroke-linecap="round" />
        <path d="M167 122 L202 112" stroke="#fff1e5" stroke-width="2.5" stroke-linecap="round" />
        <path d="M168 128 L206 129" stroke="#fff1e5" stroke-width="2.5" stroke-linecap="round" />
        <path d="M168 134 L202 145" stroke="#fff1e5" stroke-width="2.5" stroke-linecap="round" />
        <rect x="74" y="167" width="32" height="38" rx="15" fill="url(#wfl-cat-fur)" />
        <rect x="112" y="173" width="32" height="36" rx="15" fill="url(#wfl-cat-fur)" />
        <rect x="150" y="167" width="32" height="38" rx="15" fill="url(#wfl-cat-fur)" />
        <rect x="184" y="174" width="26" height="36" rx="13" fill="url(#wfl-cat-fur)" />
        <path d="M206 168 C230 158 234 134 220 122 C210 113 198 115 192 124" fill="none" stroke="url(#wfl-cat-fur)" stroke-width="18" stroke-linecap="round"/>
        <path d="M206 168 C225 160 230 137 217 126" fill="none" stroke="#ffd18e" stroke-width="6" stroke-linecap="round"/>
        <path d="M91 151 C104 144 118 142 132 142 C146 142 160 144 173 151" fill="none" stroke="url(#wfl-cat-collar)" stroke-width="16" stroke-linecap="round"/>
        <circle cx="132" cy="158" r="14" fill="url(#wfl-cat-bell)" />
        <path d="M132 150 C137 154 137 160 132 164 C127 160 127 154 132 150Z" fill="#7c2d12" opacity=".85"/>
        <path d="M132 144 L132 138" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>
        <path d="M208 123 C214 110 214 95 207 83 C200 71 192 66 184 62" fill="none" stroke="#e85f00" stroke-width="8" stroke-linecap="round"/>
      </g>
    </svg>
  `;

  document.body.appendChild(wrap);
}

function normalizeFooterStatus() {
  document.querySelectorAll("#dictStat").forEach(el => {
    if (!el || el.dataset.wflFooterStatus === "1") return;
    el.dataset.wflFooterStatus = "1";
    const text = (el.textContent || "").trim().toLowerCase();
    if (!text || text.includes("loading") || text.includes("indexed")) {
      el.textContent = "Word tools and strategy.";
    }
  });
}

function normalizeBrandLinks() {
  document.querySelectorAll("a").forEach(a => {
    const text = (a.textContent || "").trim();
    if (text === "Word Unscrambler") {
      a.textContent = "Word Finder";
    }
  });
}

document.addEventListener("DOMContentLoaded", injectNav);
document.addEventListener("DOMContentLoaded", injectFooterLinks);
document.addEventListener("DOMContentLoaded", injectSupportCard);
document.addEventListener("DOMContentLoaded", injectCatMascot);
document.addEventListener("DOMContentLoaded", normalizeFooterStatus);
document.addEventListener("DOMContentLoaded", normalizeBrandLinks);
document.addEventListener("DOMContentLoaded", installPrefillLinks);

window.WFL = window.WFL || {};
window.WFL.loadDictionary = loadDictionary;
window.WFL.collectWordsByPattern = collectWordsByPattern;
window.WFL.renderWordGroups = renderWordGroups;
window.WFL.scrabbleScore = scrabbleScore;
window.WFL.wwfScore = wwfScore;
window.WFL.runSearch = runSearch;
window.WFL.savePrefill = savePrefill;
window.WFL.consumePrefill = consumePrefill;



