(function () {
  "use strict";

  const DICTIONARY_API_URLS = [
    "/api/dictionary?word=",
    "https://api.dictionaryapi.dev/api/v2/entries/en/",
  ];
  const COMMON_WORDS_URLS = [
    "/api/meaningful-words?format=text",
    "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt",
    "https://cdn.jsdelivr.net/gh/first20hours/google-10000-english/google-10000-english-usa-no-swears.txt",
    "https://cdn.jsdelivr.net/gh/first20hours/google-10000-english@master/google-10000-english-usa-no-swears.txt",
  ];
  const COMMON_WORDS_CACHE_KEY = "wordfindlab:meaningful-words:v1";
  const COMMON_WORDS_LIMIT = 2000;
  const WOTD_API_URL = "/api/wotd";

  const WOTD_LIST = [
    "serendipity", "ephemeral", "melancholy", "eloquent", "resilience",
    "perspicacity", "luminous", "ubiquitous", "sycophant", "loquacious",
    "pernicious", "cacophony", "ethereal", "arduous", "tenacious",
    "labyrinth", "vivacious", "oblivious", "meticulous", "quixotic",
    "gregarious", "magnanimous", "languid", "ebullient", "pensive",
    "verbose", "whimsical", "inexorable", "ostentatious", "sagacious",
    "trepidation", "voluminous", "perennial", "audacious", "inquisitive",
    "pragmatic", "stoic", "transient", "unfettered", "zealous",
    "deliberate", "radiant", "notable", "vivid", "improvise",
    "horizon", "context", "discover", "remarkable", "spectrum",
  ];

  const FALLBACK_COMMON_WORDS = new Set([
    "the", "and", "for", "you", "that", "with", "this", "from", "have", "your",
    "word", "words", "find", "solve", "play", "game", "games", "brain", "help",
    "learn", "learning", "kids", "child", "children", "daily", "simple", "best",
    "good", "great", "make", "take", "use", "used", "using", "work", "works",
    "can", "could", "should", "would", "will", "just", "more", "most", "some",
    "any", "all", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "zero", "wordle", "scrabble", "anagram", "jumble", "friend", "friends",
    "letter", "letters", "tile", "tiles", "score", "scores", "value", "values",
    "search", "guess", "guesses", "answer", "answers", "puzzle", "puzzles", "clue",
    "clues", "common", "commoner", "commonest", "vocabulary", "language", "study",
    "brainy", "focus", "focuses", "focuses", "helpful", "useful", "clear", "simple",
    "bright", "happy", "smart", "fast", "quick", "easy", "hard", "learned", "daily",
    "today", "tomorrow", "yesterday", "world", "people", "place", "thing", "time",
  ]);

  const defCache = new Map();
  let meaningfulWordsPromise = null;
  let meaningfulWordsSet = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeWord(word) {
    return String(word || "").trim().toLowerCase().replace(/[^a-z]/g, "");
  }

  function uniqueList(items) {
    const out = [];
    const seen = new Set();
    for (const item of items || []) {
      const value = String(item || "").trim();
      const key = value.toLowerCase();
      if (!value || seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
    return out;
  }

  function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / 86400000);
  }

  function formatWordOfTheDayDate(date = new Date()) {
    try {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } catch (err) {
      return date.toDateString();
    }
  }

  function getWordOfTheDay(date = new Date()) {
    if (!WOTD_LIST.length) return "resilience";
    const idx = getDayOfYear(date) % WOTD_LIST.length;
    return WOTD_LIST[idx];
  }

  async function fetchText(url, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs || 8000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return null;
      return await res.text();
    } catch (err) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchJson(url, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs || 8000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchDefinition(word) {
    const normalized = normalizeWord(word);
    if (!normalized) return null;
    if (defCache.has(normalized)) return defCache.get(normalized);

    for (const baseUrl of DICTIONARY_API_URLS) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch(baseUrl + encodeURIComponent(normalized), {
          signal: ctrl.signal,
        });
        if (!res.ok) continue;

        const data = await res.json();
        const entry = Array.isArray(data) ? data[0] : null;
        if (!entry) continue;

        const result = normalizeEntry(entry);
        defCache.set(normalized, result);
        return result;
      } catch (err) {
        // Try the next source.
      } finally {
        clearTimeout(timer);
      }
    }

    defCache.set(normalized, null);
    return null;
  }

  function normalizeEntry(entry) {
    const phonetics = Array.isArray(entry.phonetics) ? entry.phonetics : [];
    const meanings = Array.isArray(entry.meanings) ? entry.meanings : [];
    const primaryMeaning = meanings.find(m => Array.isArray(m.definitions) && m.definitions.length) || meanings[0] || {};
    const primaryDefinition = Array.isArray(primaryMeaning.definitions) && primaryMeaning.definitions.length
      ? primaryMeaning.definitions[0]
      : {};

    const definitionGroups = meanings.slice(0, 3).map(meaning => {
      const defs = Array.isArray(meaning.definitions) ? meaning.definitions.slice(0, 3) : [];
      return {
        partOfSpeech: meaning.partOfSpeech || "",
        definitions: defs.map(def => ({
          definition: def.definition || "",
          example: def.example || "",
        })),
      };
    });

    const synonyms = uniqueList(
      meanings.flatMap(m => Array.isArray(m.synonyms) ? m.synonyms : [])
    ).slice(0, 4);

    const antonyms = uniqueList(
      meanings.flatMap(m => Array.isArray(m.antonyms) ? m.antonyms : [])
    ).slice(0, 4);

    const phonetic = phonetics.find(p => p && p.text && String(p.text).trim())?.text || entry.phonetic || "";

    return {
      word: entry.word || "",
      phonetic,
      primaryPartOfSpeech: primaryMeaning.partOfSpeech || "",
      primaryDefinition: primaryDefinition.definition || "",
      primaryExample: primaryDefinition.example || "",
      meanings: definitionGroups,
      synonyms,
      antonyms,
      raw: entry,
    };
  }

  async function loadMeaningfulWords() {
    if (meaningfulWordsSet) return meaningfulWordsSet;
    if (meaningfulWordsPromise) return meaningfulWordsPromise;

    meaningfulWordsPromise = (async () => {
      let raw = null;
      try {
        raw = localStorage.getItem(COMMON_WORDS_CACHE_KEY);
      } catch (err) {
        raw = null;
      }

      if (!raw) {
        for (const url of COMMON_WORDS_URLS) {
          raw = await fetchText(url, 15000);
          if (raw && raw.length > 100) {
            try {
              localStorage.setItem(COMMON_WORDS_CACHE_KEY, raw);
            } catch (err) {
              /* ignore cache quota issues */
            }
            break;
          }
        }
      }

      const set = new Set();
      const source = raw ? raw.split(/\r?\n/) : [];
      for (const line of source) {
        const w = normalizeWord(line);
        if (!w) continue;
        set.add(w);
        if (set.size >= COMMON_WORDS_LIMIT) break;
      }

      if (!set.size) {
        FALLBACK_COMMON_WORDS.forEach(word => set.add(word));
      }

      meaningfulWordsSet = set;
      return set;
    })();

    try {
      return await meaningfulWordsPromise;
    } finally {
      meaningfulWordsPromise = null;
    }
  }

  function preloadMeaningfulWords() {
    loadMeaningfulWords().catch(() => {});
  }

  async function filterMeaningfulWords(words, enabled) {
    if (!enabled) return Array.isArray(words) ? words : [];
    const set = await loadMeaningfulWords();
    return (Array.isArray(words) ? words : []).filter(word => set.has(normalizeWord(word)));
  }

  function getDefinitionPanel() {
    return document.getElementById("definition-panel");
  }

  function ensureDefinitionPanel() {
    let panel = getDefinitionPanel();
    if (panel) return panel;

    const section = document.createElement("section");
    section.className = "card definition-panel";
    section.id = "definition-panel";
    section.hidden = true;
    section.innerHTML = [
      '<div class="definition-panel-head">',
      '  <div>',
      '    <p class="definition-label">Dictionary definition</p>',
      '    <h2 class="definition-word" id="definition-word"></h2>',
      '    <p class="definition-phonetic" id="definition-phonetic"></p>',
      '  </div>',
      '  <div class="definition-actions">',
      '    <button class="btn ghost" type="button" id="definition-copy">Copy</button>',
      '    <button class="btn ghost" type="button" id="definition-close">Close</button>',
      '  </div>',
      '</div>',
      '<div class="definition-meta">',
      '  <span class="definition-pos" id="definition-pos"></span>',
      '  <span class="definition-source">Free Dictionary API</span>',
      '</div>',
      '<p class="definition-primary" id="definition-primary"></p>',
      '<p class="definition-example" id="definition-example"></p>',
      '<div class="definition-sections" id="definition-sections"></div>',
      '<div class="definition-pills" id="definition-synonyms"></div>',
      '<div class="definition-pills definition-antonyms" id="definition-antonyms"></div>',
      '<p class="definition-note" id="definition-note"></p>',
    ].join("");

    const anchor = document.getElementById("resultsCard") || document.querySelector("[data-definition-anchor]");
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(section, anchor.nextSibling);
    } else {
      const main = document.querySelector(".page-main") || document.body;
      main.appendChild(section);
    }

    panel = section;
    wireDefinitionPanelControls(panel);
    return panel;
  }

  function wireDefinitionPanelControls(panel) {
    const copyBtn = panel.querySelector("#definition-copy");
    const closeBtn = panel.querySelector("#definition-close");
    if (copyBtn && !copyBtn.dataset.bound) {
      copyBtn.dataset.bound = "1";
      copyBtn.addEventListener("click", async () => {
        const word = panel.dataset.currentWord || "";
        if (!word) return;
        try {
          await navigator.clipboard.writeText(word);
          copyBtn.textContent = "Copied";
          setTimeout(() => { copyBtn.textContent = "Copy"; }, 900);
        } catch (err) {
          copyBtn.textContent = "Copy failed";
          setTimeout(() => { copyBtn.textContent = "Copy"; }, 900);
        }
      });
    }
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = "1";
      closeBtn.addEventListener("click", () => {
        panel.hidden = true;
      });
    }
  }

  function renderPills(container, values, emptyLabel) {
    if (!container) return;
    const list = Array.isArray(values) ? values.filter(Boolean) : [];
    if (!list.length) {
      container.innerHTML = emptyLabel ? `<span class="definition-note">${escapeHtml(emptyLabel)}</span>` : "";
      return;
    }
    container.innerHTML = list.map(value => `<span class="definition-pill">${escapeHtml(value)}</span>`).join("");
  }

  function renderDefinitionIntoPanel(panel, data, lookupWord) {
    const word = data?.word || lookupWord || "";
    panel.dataset.currentWord = word;
    panel.hidden = false;

    const wordEl = panel.querySelector("#definition-word");
    const phoneticEl = panel.querySelector("#definition-phonetic");
    const posEl = panel.querySelector("#definition-pos");
    const primaryEl = panel.querySelector("#definition-primary");
    const exampleEl = panel.querySelector("#definition-example");
    const sectionsEl = panel.querySelector("#definition-sections");
    const synonymsEl = panel.querySelector("#definition-synonyms");
    const antonymsEl = panel.querySelector("#definition-antonyms");
    const noteEl = panel.querySelector("#definition-note");

    if (wordEl) wordEl.textContent = word || lookupWord || "Word";
    if (phoneticEl) phoneticEl.textContent = data?.phonetic || "";
    if (posEl) posEl.textContent = data?.primaryPartOfSpeech || "dictionary entry";
    if (primaryEl) {
      primaryEl.innerHTML = data?.primaryDefinition
        ? escapeHtml(data.primaryDefinition)
        : "No dictionary entry found.";
    }
    if (exampleEl) {
      exampleEl.innerHTML = data?.primaryExample
        ? `<em>Example:</em> ${escapeHtml(data.primaryExample)}`
        : "";
    }

    if (sectionsEl) {
      if (Array.isArray(data?.meanings) && data.meanings.length) {
        sectionsEl.innerHTML = data.meanings.map((meaning) => {
          const defs = meaning.definitions || [];
          const defsHtml = defs.map(def => {
            const example = def.example ? `<div class="definition-example">"${escapeHtml(def.example)}"</div>` : "";
            return `<li>${escapeHtml(def.definition)}${example}</li>`;
          }).join("");
          return [
            '<section class="definition-section">',
            `  <div class="definition-section-title">${escapeHtml(meaning.partOfSpeech || "meaning")}</div>`,
            `  <ol class="definition-list">${defsHtml}</ol>`,
            '</section>',
          ].join("");
        }).join("");
      } else {
        sectionsEl.innerHTML = "";
      }
    }

    renderPills(synonymsEl, data?.synonyms || [], "No synonyms listed.");
    renderPills(antonymsEl, data?.antonyms || [], "");

    if (noteEl) {
      noteEl.textContent = data
        ? "Tap another word to compare meanings."
        : "No dictionary entry found for this word.";
    }
  }

  async function showDefinition(word, options = {}) {
    const lookupWord = normalizeWord(word);
    if (!lookupWord) return null;

    const panel = ensureDefinitionPanel();
    panel.hidden = false;
    panel.dataset.currentWord = lookupWord;

    const wordEl = panel.querySelector("#definition-word");
    const phoneticEl = panel.querySelector("#definition-phonetic");
    const posEl = panel.querySelector("#definition-pos");
    const primaryEl = panel.querySelector("#definition-primary");
    const exampleEl = panel.querySelector("#definition-example");
    const sectionsEl = panel.querySelector("#definition-sections");
    const synonymsEl = panel.querySelector("#definition-synonyms");
    const antonymsEl = panel.querySelector("#definition-antonyms");
    const noteEl = panel.querySelector("#definition-note");

    if (wordEl) wordEl.textContent = lookupWord;
    if (phoneticEl) phoneticEl.textContent = "Loading...";
    if (posEl) posEl.textContent = "";
    if (primaryEl) primaryEl.textContent = `Looking up ${lookupWord}...`;
    if (exampleEl) exampleEl.textContent = "";
    if (sectionsEl) sectionsEl.innerHTML = "";
    if (synonymsEl) synonymsEl.innerHTML = "";
    if (antonymsEl) antonymsEl.innerHTML = "";
    if (noteEl) noteEl.textContent = "";

    const data = await fetchDefinition(lookupWord);
    renderDefinitionIntoPanel(panel, data, lookupWord);

    if (options.scroll !== false) {
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    return data;
  }

  function bindDefinitionTriggers() {
    if (document.body.dataset.dictionaryTriggersBound === "1") return;
    document.body.dataset.dictionaryTriggersBound = "1";

    document.addEventListener("click", (evt) => {
      const target = evt.target.closest("[data-dictionary-word]");
      if (!target) return;

      const word = target.dataset.dictionaryWord || target.textContent || "";
      if (!word) return;

      evt.preventDefault();
      evt.stopPropagation();

      if (evt.shiftKey || evt.altKey || evt.ctrlKey || evt.metaKey) {
        navigator.clipboard?.writeText(normalizeWord(word)).catch(() => {});
        return;
      }

      showDefinition(word);
    });

    document.addEventListener("keydown", (evt) => {
      const active = document.activeElement;
      if (!active || !active.matches || !active.matches("[data-dictionary-word]")) return;
      if (evt.key !== "Enter" && evt.key !== " ") return;
      evt.preventDefault();
      showDefinition(active.dataset.dictionaryWord || active.textContent || "");
    });
  }

  async function populateWordOfTheDayWidget(widget) {
    if (!widget) return;

    const dateEl = widget.querySelector("[data-wotd-date]");
    const wordEl = widget.querySelector("[data-wotd-word]");
    const phoneticEl = widget.querySelector("[data-wotd-phonetic]");
    const posEl = widget.querySelector("[data-wotd-pos]");
    const definitionEl = widget.querySelector("[data-wotd-definition]");
    const exampleEl = widget.querySelector("[data-wotd-example]");
    const synonymsEl = widget.querySelector("[data-wotd-synonyms]");
    const stateEl = widget.querySelector("[data-wotd-state]");

    if (wordEl) wordEl.textContent = "Loading...";
    if (phoneticEl) phoneticEl.textContent = "Loading...";
    if (posEl) posEl.textContent = "";
    if (definitionEl) definitionEl.textContent = "Fetching a definition...";
    if (exampleEl) exampleEl.textContent = "";
    if (synonymsEl) synonymsEl.innerHTML = "";
    if (stateEl) stateEl.textContent = "";

    const dateLabel = `Word of the Day — ${formatWordOfTheDayDate()}`;
    if (dateEl) dateEl.textContent = dateLabel;

    const apiEntry = await fetchJson(WOTD_API_URL, 5000);
    if (apiEntry && apiEntry.word) {
      if (wordEl) wordEl.textContent = apiEntry.word;
      if (phoneticEl) phoneticEl.textContent = apiEntry.phonetic || "";
      if (posEl) posEl.textContent = apiEntry.primaryPartOfSpeech || "noun";
      if (definitionEl) definitionEl.textContent = apiEntry.primaryDefinition || "Definition unavailable.";
      if (exampleEl) {
        exampleEl.textContent = apiEntry.primaryExample
          ? `Example: ${apiEntry.primaryExample}`
          : "";
      }
      if (synonymsEl) {
        const pills = (apiEntry.synonyms || []).slice(0, widget.dataset.wotdCompact === "true" ? 3 : 4);
        synonymsEl.innerHTML = pills.map(item => `<span class="wotd-pill">${escapeHtml(item)}</span>`).join("");
      }
      if (stateEl) stateEl.textContent = apiEntry.source === "db" ? "Synced from database" : "Live dictionary lookup";
      return;
    }

    const word = getWordOfTheDay();
    const entry = await fetchDefinition(word);
    if (!entry) {
      if (phoneticEl) phoneticEl.textContent = "";
      if (definitionEl) definitionEl.textContent = "We could not load today's definition right now.";
      if (stateEl) stateEl.textContent = "Try again later.";
      return;
    }

    if (wordEl) wordEl.textContent = entry.word || word;
    if (phoneticEl) phoneticEl.textContent = entry.phonetic || "";
    if (posEl) posEl.textContent = entry.primaryPartOfSpeech || "noun";
    if (definitionEl) definitionEl.textContent = entry.primaryDefinition || "Definition unavailable.";
    if (exampleEl) {
      exampleEl.textContent = entry.primaryExample
        ? `Example: ${entry.primaryExample}`
        : "";
    }
    if (synonymsEl) {
      const pills = entry.synonyms.slice(0, widget.dataset.wotdCompact === "true" ? 3 : 4);
      synonymsEl.innerHTML = pills.map(item => `<span class="wotd-pill">${escapeHtml(item)}</span>`).join("");
    }
  }

  function populateWordOfTheDayWidgets() {
    document.querySelectorAll("[data-wotd-widget]").forEach(widget => {
      populateWordOfTheDayWidget(widget).catch(() => {});
    });
  }

  async function lookupWord(word) {
    return showDefinition(word, { scroll: true });
  }

  function setupLookupPage() {
    const form = document.querySelector("[data-dictionary-lookup-form]");
    if (!form || form.dataset.dictionaryLookupBound === "1") return;
    form.dataset.dictionaryLookupBound = "1";

    const input = form.querySelector("[data-dictionary-input]");
    const button = form.querySelector("[data-dictionary-submit]");
    const clearBtn = form.querySelector("[data-dictionary-clear]");
    const examples = form.querySelectorAll("[data-dictionary-example]");

    const runLookup = async () => {
      const value = normalizeWord(input ? input.value : "");
      if (!value) return;
      await lookupWord(value);
    };

    if (button) {
      button.addEventListener("click", runLookup);
    }

    if (input) {
      input.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter") {
          evt.preventDefault();
          runLookup();
        }
      });
    }

    if (clearBtn && input) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        input.focus();
      });
    }

    examples.forEach(example => {
      example.addEventListener("click", () => {
        if (!input) return;
        input.value = example.dataset.dictionaryExample || example.textContent || "";
        runLookup();
      });
    });
  }

  function init() {
    bindDefinitionTriggers();
    populateWordOfTheDayWidgets();
    setupLookupPage();
    if (document.querySelector("[data-meaningful-toggle]")) {
      preloadMeaningfulWords();
    }
  }

  const api = {
    fetchDefinition,
    lookupWord,
    showDefinition,
    getWordOfTheDay,
    formatWordOfTheDayDate,
    loadMeaningfulWords,
    preloadMeaningfulWords,
    filterMeaningfulWords,
    populateWordOfTheDayWidget,
    populateWordOfTheDayWidgets,
    ensureDefinitionPanel,
    normalizeWord,
  };

  window.WordFindLabDictionary = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
