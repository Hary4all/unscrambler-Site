import { FACEBOOK_PAGE_URL, copyLink, openFacebookShare, wireShareGroup } from "/assets/family-social.js";
import { getFamilyPreferences, saveFamilyPreferences } from "/assets/family-storage.js";

const DATA_URL = "/data/family-word-games.json?v=20260722";
const SIZE_BY_DIFFICULTY = { easy: 10, medium: 12, hard: 14 };
const WORD_COUNT_BY_DIFFICULTY = { easy: 8, medium: 10, hard: 12 };
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIRECTIONS = [
  [0, 1], [1, 0], [0, -1], [-1, 0],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

const state = {
  data: null,
  puzzle: null,
  settings: {
    category: "animals",
    difficulty: "easy",
    answerKey: false,
  },
};

const els = {};

function $(id) { return document.getElementById(id); }
function shuffle(items) { return [...items].sort(() => Math.random() - 0.5); }
function cleanWord(word) { return (word || "").toUpperCase().replace(/[^A-Z]/g, ""); }
function cellKey(row, col) { return `${row}:${col}`; }

function trackWFL(eventName, data = {}) {
  const tracker = typeof window.trackWFL === "function"
    ? window.trackWFL
    : (window.WFLMeasurement && typeof window.WFLMeasurement.track === "function"
        ? window.WFLMeasurement.track
        : null);
  const payload = {
    page_path: window.location.pathname,
    page_title: document.title || "",
    tool_name: "printable_word_search",
    action_location: "printable_word_search_page",
    ...data,
  };
  if (tracker) return tracker(eventName, payload);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...payload });
  return payload;
}

async function loadData() {
  if (state.data) return state.data;
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Unable to load puzzle data");
  state.data = await res.json();
  return state.data;
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function filteredWords() {
  const pool = (state.data?.wordSearch || []).filter((item) => {
    if (item.difficulty !== state.settings.difficulty) return false;
    if (state.settings.category !== "all" && item.category !== state.settings.category) return false;
    return cleanWord(item.word).length <= SIZE_BY_DIFFICULTY[state.settings.difficulty];
  });
  return shuffle(pool);
}

function createGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
}

function fits(grid, word, row, col, dr, dc) {
  const size = grid.length;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || c < 0 || r >= size || c >= size) return false;
    const current = grid[r][c];
    if (current && current !== word[i]) return false;
  }
  return true;
}

function placeWord(grid, word) {
  const size = grid.length;
  for (let attempt = 0; attempt < 250; attempt++) {
    const [dr, dc] = randomChoice(DIRECTIONS);
    const rowMin = dr < 0 ? word.length - 1 : 0;
    const rowMax = dr > 0 ? size - word.length : size - 1;
    const colMin = dc < 0 ? word.length - 1 : 0;
    const colMax = dc > 0 ? size - word.length : size - 1;
    if (rowMax < rowMin || colMax < colMin) continue;
    const row = Math.floor(Math.random() * (rowMax - rowMin + 1)) + rowMin;
    const col = Math.floor(Math.random() * (colMax - colMin + 1)) + colMin;
    if (!fits(grid, word, row, col, dr, dc)) continue;
    const cells = [];
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      grid[r][c] = word[i];
      cells.push(cellKey(r, c));
    }
    return { word, cells, row, col, direction: [dr, dc] };
  }
  return null;
}

function fillGrid(grid) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid.length; c++) {
      if (!grid[r][c]) grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
  }
}

function buildPuzzle() {
  const size = SIZE_BY_DIFFICULTY[state.settings.difficulty] || 10;
  const count = WORD_COUNT_BY_DIFFICULTY[state.settings.difficulty] || 6;
  const pool = filteredWords();
  for (let attempt = 0; attempt < 60; attempt++) {
    const chosen = shuffle(pool).slice(0, count).map((item) => ({ ...item, word: cleanWord(item.word) }));
    if (!chosen.length) return null;
    const grid = createGrid(size);
    const placements = [];
    let ok = true;
    for (const item of chosen.sort((a, b) => b.word.length - a.word.length)) {
      const placement = placeWord(grid, item.word);
      if (!placement) {
        ok = false;
        break;
      }
      placements.push({ ...item, ...placement });
    }
    if (!ok) continue;
    fillGrid(grid);
    return { grid, placements, size, signature: placements.map((p) => p.word).sort().join("|") };
  }
  return null;
}

function renderPuzzle() {
  state.puzzle = buildPuzzle();
  if (!state.puzzle) {
    els.status.textContent = "We could not build a puzzle yet. Try another category or difficulty.";
    return;
  }
  const { size, grid, placements } = state.puzzle;
  els.sheet.style.setProperty("--family-grid-size", size);
  els.grid.innerHTML = "";
  els.answerGrid.innerHTML = "";

  grid.forEach((row, rowIndex) => {
    row.forEach((letter, colIndex) => {
      const cell = document.createElement("div");
      cell.className = "family-print-cell";
      cell.textContent = letter;
      els.grid.appendChild(cell);

      const keyCell = document.createElement("div");
      keyCell.className = "family-print-cell";
      keyCell.textContent = letter;
      if (placements.some((item) => item.cells.includes(cellKey(rowIndex, colIndex)))) {
        keyCell.classList.add("is-answer");
      } else {
        keyCell.classList.add("is-hidden");
      }
      els.answerGrid.appendChild(keyCell);
    });
  });

  els.wordList.innerHTML = placements.map((item) => `<span class="family-word-pill">${item.display || item.word}</span>`).join("");
  els.answerWords.innerHTML = placements.map((item) => `<span class="family-word-pill is-found">${item.display || item.word}</span>`).join("");
  els.answerSheet.hidden = !state.settings.answerKey;
  els.title.textContent = `${els.category.options[els.category.selectedIndex].text} Word Search`;
  els.meta.textContent = `${state.settings.difficulty.charAt(0).toUpperCase() + state.settings.difficulty.slice(1)} - ${placements.length} words - A4 printable`;
  els.status.textContent = state.settings.answerKey ? "Answer key is visible for easy checking." : "Hidden words ready to print and solve.";
  trackWFL("pdf_tool_clicked", {
    action_location: "generate_puzzle",
    filter_type: "category_difficulty",
    result_count: placements.length,
  });
}


function printSheets() {
  const existing = document.getElementById("wflPrintRoot");
  if (existing) existing.remove();
  const root = document.createElement("div");
  root.id = "wflPrintRoot";
  const page1 = els.sheet.cloneNode(true);
  page1.removeAttribute("id");
  page1.classList.add("wfl-print-page");
  root.appendChild(page1);
  if (state.settings.answerKey) {
    const page2 = els.answerSheet.cloneNode(true);
    page2.removeAttribute("id");
    page2.hidden = false;
    page2.classList.add("wfl-print-page");
    root.appendChild(page2);
  }
  document.body.appendChild(root);
  document.body.classList.add("wfl-printing");
  const cleanup = () => {
    document.body.classList.remove("wfl-printing");
    root.remove();
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
  window.setTimeout(cleanup, 2000);
}

function bindControls() {
  els.category.addEventListener("change", () => {
    state.settings.category = els.category.value;
    saveFamilyPreferences({ printableCategory: state.settings.category });
    trackWFL("filter_used", {
      action_location: "category_selector",
      filter_type: "category",
      value: state.settings.category,
    });
    renderPuzzle();
  });
  els.difficulty.addEventListener("change", () => {
    state.settings.difficulty = els.difficulty.value;
    saveFamilyPreferences({ printableDifficulty: state.settings.difficulty });
    trackWFL("filter_used", {
      action_location: "difficulty_selector",
      filter_type: "difficulty",
      value: state.settings.difficulty,
    });
    renderPuzzle();
  });
  els.answerKey.addEventListener("change", () => {
    state.settings.answerKey = els.answerKey.checked;
    saveFamilyPreferences({ printableAnswerKey: state.settings.answerKey });
    trackWFL("filter_used", {
      action_location: "answer_key_toggle",
      filter_type: "answer_key",
      value: state.settings.answerKey ? "on" : "off",
    });
    renderPuzzle();
  });
  els.generate.addEventListener("click", () => {
    trackWFL("pdf_tool_clicked", {
      action_location: "generate_button",
      result_count: state.puzzle?.placements?.length || 0,
    });
    renderPuzzle();
  });
  els.print.addEventListener("click", () => {
    trackWFL("pdf_tool_clicked", {
      action_location: "print_button",
      result_count: state.puzzle?.placements?.length || 0,
    });
    printSheets();
  });
  els.facebook.addEventListener("click", () => {
    trackWFL("share_clicked", {
      action_location: "printable_share",
      share_platform: "facebook",
    });
    openFacebookShare(window.location.href, document.title);
  });
  els.copy.addEventListener("click", async () => {
    trackWFL("share_clicked", {
      action_location: "printable_share",
      share_platform: "copy_link",
    });
    const ok = await copyLink(window.location.href);
    els.copy.textContent = ok ? "Copied!" : "Copy failed";
    window.setTimeout(() => { els.copy.textContent = "Copy Link"; }, 1200);
  });
}

async function init() {
  await loadData();
  els.title = $("printableTitle");
  els.meta = $("printableMeta");
  els.status = $("printableStatus");
  els.sheet = $("printableSheet");
  els.answerSheet = $("printableAnswerSheet");
  els.grid = $("printableGrid");
  els.answerGrid = $("printableAnswerGrid");
  els.wordList = $("printableWordList");
  els.answerWords = $("printableAnswerWords");
  els.category = $("printableCategory");
  els.difficulty = $("printableDifficulty");
  els.answerKey = $("printableAnswerKey");
  els.generate = $("printableGenerate");
  els.print = $("printablePrint");
  els.facebook = $("printableFacebook");
  els.copy = $("printableCopy");

  const prefs = getFamilyPreferences();
  state.settings.category = prefs.printableCategory || "animals";
  state.settings.difficulty = prefs.printableDifficulty || "easy";
  state.settings.answerKey = !!prefs.printableAnswerKey;

  els.category.value = state.settings.category;
  els.difficulty.value = state.settings.difficulty;
  els.answerKey.checked = state.settings.answerKey;
  bindControls();
  wireShareGroup(document);
  renderPuzzle();
}

window.addEventListener("DOMContentLoaded", init);
