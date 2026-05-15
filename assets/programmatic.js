(function () {
  "use strict";

  const CATEGORY_FILTERS = {
    "two-letter-words": {
      minLen: 2,
      maxLen: 2,
      title: "Two-Letter Words"
    },
    "three-letter-words": {
      minLen: 3,
      maxLen: 3,
      title: "Three-Letter Words"
    },
    "four-letter-words": {
      minLen: 4,
      maxLen: 4,
      title: "Four-Letter Words"
    },
    "five-letter-words": {
      minLen: 5,
      maxLen: 5,
      title: "Five-Letter Words"
    },
    "palindromes": {
      extraFilter: function (word) {
        return word === word.split("").reverse().join("");
      },
      title: "Palindromes"
    },
    "double-letters": {
      extraFilter: function (word) {
        return /(.)\1/.test(word);
      },
      title: "Words With Double Letters"
    },
    "q-without-u": {
      extraFilter: function (word) {
        return word.indexOf("Q") !== -1 && word.indexOf("QU") === -1;
      },
      title: "Q Words Without U"
    },
    "vowel-heavy": {
      extraFilter: function (word) {
        return (word.match(/[AEIOU]/g) || []).length >= Math.ceil(word.length / 2);
      },
      title: "Vowel Heavy Words"
    },
    "high-scoring-scrabble-words": {
      extraFilter: function (word) {
        return window.WFL && window.WFL.scrabbleScore(word) >= 20;
      },
      title: "High Scoring Scrabble Words"
    },
    "wordle-helpers": {
      minLen: 5,
      maxLen: 5,
      title: "Wordle Helper Words"
    },
    "words-with-j": {
      extraFilter: function (word) {
        return word.indexOf("J") !== -1;
      },
      title: "Words With J"
    },
    "words-with-x": {
      extraFilter: function (word) {
        return word.indexOf("X") !== -1;
      },
      title: "Words With X"
    },
    "words-with-z": {
      extraFilter: function (word) {
        return word.indexOf("Z") !== -1;
      },
      title: "Words With Z"
    },
    "words-with-vowel-pair": {
      extraFilter: function (word) {
        return /(AI|EA|EE|IE|OA|OE|OI|OO|OU|UI)/.test(word);
      },
      title: "Words With Vowel Pairs"
    },
    "words-starting-with-vowel": {
      extraFilter: function (word) {
        return /^[AEIOU]/.test(word);
      },
      title: "Words Starting With Vowel"
    },
    "words-ending-with-vowel": {
      extraFilter: function (word) {
        return /[AEIOU]$/.test(word);
      },
      title: "Words Ending With Vowel"
    }
  };

  function cleanPattern(value) {
    return (value || "").toUpperCase().replace(/[^A-Z]/g, "");
  }

  function toHumanLabel(value) {
    return (value || "")
      .split("-")
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function lengthLabel(minLen, maxLen) {
    if (minLen && maxLen && minLen === maxLen) return minLen + "-letter";
    if (minLen && maxLen) return minLen + " to " + maxLen + " letters";
    if (minLen) return minLen + "+ letters";
    if (maxLen) return "Up to " + maxLen + " letters";
    return "";
  }

  function readConfig(root) {
    const mode = (root.dataset.programmaticMode || "start").toLowerCase();
    const pattern = cleanPattern(root.dataset.programmaticPattern);
    const category = (root.dataset.programmaticCategory || "").toLowerCase();
    const minLen = root.dataset.programmaticMinLen ? parseInt(root.dataset.programmaticMinLen, 10) : 2;
    const maxLen = root.dataset.programmaticMaxLen ? parseInt(root.dataset.programmaticMaxLen, 10) : 15;
    const limit = root.dataset.programmaticLimit ? parseInt(root.dataset.programmaticLimit, 10) : 120;
    const title = root.dataset.programmaticTitle || "";
    const summary = root.dataset.programmaticSummary || "";
    return { mode, pattern, category, minLen, maxLen, limit, title, summary };
  }

  function buildFilters(cfg) {
    const out = {
      minLen: cfg.minLen,
      maxLen: cfg.maxLen,
      limit: cfg.limit
    };

    if (cfg.mode === "end") out.endsWith = cfg.pattern;
    else if (cfg.mode === "contains") out.contains = cfg.pattern;
    else if (cfg.mode === "start" || cfg.mode === "question") out.startsWith = cfg.pattern;
    else if (cfg.mode === "category") {
      const preset = CATEGORY_FILTERS[cfg.category] || {};
      if (preset.minLen) out.minLen = preset.minLen;
      if (preset.maxLen) out.maxLen = preset.maxLen;
      if (preset.extraFilter) out.extraFilter = preset.extraFilter;
      if (preset.scoreMode) out.scoreFn = preset.scoreMode;
    }

    if (cfg.mode === "question" && cfg.category && CATEGORY_FILTERS[cfg.category]) {
      const questionPreset = CATEGORY_FILTERS[cfg.category];
      if (questionPreset.minLen) out.minLen = questionPreset.minLen;
      if (questionPreset.maxLen) out.maxLen = questionPreset.maxLen;
      if (questionPreset.extraFilter) out.extraFilter = questionPreset.extraFilter;
    }

    return out;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  async function boot() {
    const root = document.querySelector("[data-programmatic-mode]");
    if (!root || !window.WFL || !window.WFL.loadDictionary) return;

    const cfg = readConfig(root);
    const categoryPreset = cfg.category ? CATEGORY_FILTERS[cfg.category] : null;
    const title = cfg.title || root.querySelector("h1")?.textContent || "Word Pattern Explorer";
    const summary = cfg.summary || "";

    setText("programmatic-title", title);
    if (summary) setText("programmatic-summary-copy", summary);
    setText("programmatic-pattern", cfg.pattern || (categoryPreset && categoryPreset.title) || toHumanLabel(cfg.category));
    setText("programmatic-length", lengthLabel(cfg.minLen, cfg.maxLen));

    const summaryCount = document.getElementById("programmatic-count");
    const resultsMeta = document.getElementById("programmatic-results-meta");
    const noResults = document.getElementById("programmatic-no-results");
    const results = document.getElementById("programmatic-results");

    if (resultsMeta) resultsMeta.textContent = "Loading matching words...";

    const dictReady = await window.WFL.loadDictionary("all");
    if (!dictReady) {
      if (resultsMeta) resultsMeta.textContent = "Dictionary unavailable right now.";
      return;
    }

    const filters = buildFilters(cfg);
    const data = window.WFL.collectWordsByPattern(filters);

    if (summaryCount) summaryCount.textContent = data.total.toLocaleString();
    if (resultsMeta) {
      resultsMeta.textContent = data.total.toLocaleString() + " matching words found. Showing the strongest matches first.";
    }
    if (noResults) noResults.hidden = data.total > 0;

    if (results && window.WFL.renderWordGroups) {
      window.WFL.renderWordGroups("programmatic-results", data.words, data.scoreFn);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
