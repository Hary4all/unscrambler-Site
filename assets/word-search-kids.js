import { FACEBOOK_PAGE_URL, copyLink, openFacebookShare, wireShareGroup } from "/assets/family-social.js";
import { getFamilyPreferences, rememberSignature, saveFamilyPreferences, setBestScore, getBestScore } from "/assets/family-storage.js";

const DATA_URL = "/data/family-word-games.json?v=20260519";
const DIFFICULTY_META = {
  easy: { size: 10, words: 5, minutes: 5, maxLength: 7 },
  medium: { size: 12, words: 7, minutes: 7, maxLength: 9 },
  hard: { size: 14, words: 9, minutes: 10, maxLength: 12 },
};

const DIRECTIONS = [
  [0, 1], [1, 0], [0, -1], [-1, 0],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const state = {
  data: null,
  puzzle: null,
  settings: getFamilyPreferences(),
  found: new Set(),
  score: 0,
  best: getBestScore(),
  timerId: null,
  remaining: 0,
  dragStart: null,
  selectedPath: [],
  timerStarted: false,
  finished: false,
};

const els = {};

function $(id) { return document.getElementById(id); }

function trackWFL(eventName, data = {}) {
  const tracker = typeof window.trackWFL === "function"
    ? window.trackWFL
    : (window.WFLMeasurement && typeof window.WFLMeasurement.track === "function"
        ? window.WFLMeasurement.track
        : null);
  const payload = {
    page_path: window.location.pathname,
    page_title: document.title || "",
    tool_name: "word_search_for_kids",
    action_location: "word_search_page",
    ...data,
  };
  if (tracker) return tracker(eventName, payload);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...payload });
  return payload;
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function cleanWord(word) {
  return (word || "").toUpperCase().replace(/[^A-Z]/g, "");
}

function cellKey(row, col) {
  return `${row}:${col}`;
}

function parseCellKey(key) {
  const [row, col] = key.split(":").map(Number);
  return { row, col };
}

function buildLinePath(from, to) {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const absR = Math.abs(dr);
  const absC = Math.abs(dc);
  if (!(from.row === to.row || from.col === to.col || absR === absC)) return [];
  const stepR = dr === 0 ? 0 : dr / absR;
  const stepC = dc === 0 ? 0 : dc / absC;
  const len = Math.max(absR, absC) + 1;
  const path = [];
  for (let i = 0; i < len; i++) {
    path.push(cellKey(from.row + stepR * i, from.col + stepC * i));
  }
  return path;
}

function placementMatchesPath(placement, path) {
  if (!placement || !path.length) return false;
  const forward = placement.cells.join(",");
  const reverse = [...placement.cells].reverse().join(",");
  const selected = path.join(",");
  return selected === forward || selected === reverse;
}

function getDifficultyMeta() {
  return DIFFICULTY_META[state.settings.difficulty] || DIFFICULTY_META.easy;
}

function getCategoryLabel(category) {
  const map = {
    all: "All Categories",
    animals: "Animals",
    food: "Food",
    school: "School",
    nature: "Nature",
    family: "Family",
    colors: "Colors",
  };
  return map[category] || "Kids";
}

async function loadData() {
  if (state.data) return state.data;
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load family word data");
  state.data = await res.json();
  return state.data;
}

function chooseWordPool() {
  const difficulty = state.settings.difficulty || "easy";
  const category = state.settings.category || "animals";
  const meta = getDifficultyMeta();
  const pool = (state.data?.wordSearch || []).filter((item) => {
    if (item.difficulty !== difficulty) return false;
    if (category !== "all" && item.category !== category) return false;
    return cleanWord(item.word).length <= meta.maxLength;
  });
  return shuffle(pool);
}

function getWordCount() {
  return getDifficultyMeta().words;
}

function createEmptyGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
}

function fitsWord(grid, word, row, col, dr, dc) {
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

function placeWord(grid, word, tries = 300) {
  const size = grid.length;
  for (let attempt = 0; attempt < tries; attempt++) {
    const [dr, dc] = randomChoice(DIRECTIONS);
    const rowMin = dr < 0 ? word.length - 1 : 0;
    const rowMax = dr > 0 ? size - word.length : size - 1;
    const colMin = dc < 0 ? word.length - 1 : 0;
    const colMax = dc > 0 ? size - word.length : size - 1;
    if (rowMax < rowMin || colMax < colMin) continue;
    const row = Math.floor(Math.random() * (rowMax - rowMin + 1)) + rowMin;
    const col = Math.floor(Math.random() * (colMax - colMin + 1)) + colMin;
    if (!fitsWord(grid, word, row, col, dr, dc)) continue;
    const cells = [];
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      grid[r][c] = word[i];
      cells.push(cellKey(r, c));
    }
    return { word, row, col, direction: [dr, dc], cells };
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
  const meta = getDifficultyMeta();
  const pool = chooseWordPool();
  const count = Math.min(getWordCount(), pool.length);
  if (!count) return null;

  const recent = new Set((window.WFLFamilyStorage?.getRecentSignatures?.() || []));

  for (let attempt = 0; attempt < 80; attempt++) {
    const chosen = shuffle(pool).slice(0, count).map((item) => ({
      ...item,
      word: cleanWord(item.word),
    }));
    const signature = chosen.map((item) => item.word).sort().join("|");
    if (recent.has(signature)) continue;

    const grid = createEmptyGrid(meta.size);
    const placements = [];
    let ok = true;
    for (const entry of chosen.sort((a, b) => b.word.length - a.word.length)) {
      const placement = placeWord(grid, entry.word);
      if (!placement) {
        ok = false;
        break;
      }
      placements.push({
        ...entry,
        ...placement,
        clue: entry.hint,
        found: false,
        number: placements.length + 1,
      });
    }
    if (!ok) continue;
    fillGrid(grid);
    return { grid, placements, signature, size: meta.size };
  }
  return null;
}

function setHeroText() {
  const kids = document.body.classList.contains("family-kids-mode");
  els.heroTitle.textContent = kids ? "Play, Learn & Have Fun!" : "Sharpen Your Mind. Solve the Puzzle.";
  els.heroSubtitle.textContent = kids
    ? "Fun word adventures for smart kids and families."
    : "Premium puzzle play for calm, focused word lovers.";
  els.heroPrimary.textContent = kids ? "Start Playing" : "Start Puzzle";
  els.heroSecondary.textContent = kids ? "Daily Puzzle" : "Daily Challenge";
  els.modeLabel.textContent = kids ? "Kids Mode" : "Adults Mode";
  els.modeCopy.textContent = kids
    ? "Pastel colors, bigger squares, easy clues, and cheerful rewards."
    : "Clean colors, smarter clues, and a real challenge.";
}

function setMode(mode) {
  const cleanMode = mode === "adult" ? "adult" : "kids";
  document.body.classList.toggle("family-kids-mode", cleanMode === "kids");
  document.body.classList.toggle("family-adults-mode", cleanMode === "adult");
  state.settings.mode = cleanMode;
  if (cleanMode === "kids") {
    state.settings.category = "animals";
    state.settings.difficulty = "easy";
    state.settings.timer = false;
  } else {
    state.settings.category = "all";
    state.settings.difficulty = "medium";
    state.settings.timer = true;
  }
  saveFamilyPreferences(state.settings);
  setHeroText();
  if (els.category) els.category.value = state.settings.category;
  if (els.difficulty) els.difficulty.value = state.settings.difficulty;
  if (els.timerToggle) els.timerToggle.value = state.settings.timer ? "true" : "false";
  generateNewPuzzle();
}

function setThemeClasses() {
  document.body.classList.remove(
    "family-theme-candy",
    "family-theme-jungle",
    "family-theme-underwater",
    "family-theme-space",
    "family-theme-dinosaur",
    "family-theme-magic",
    "family-theme-school",
    "family-theme-superhero",
    "family-theme-classic"
  );
  document.body.classList.add("family-theme-" + (state.settings.theme || "candy"));
  if (els.themeName) {
    els.themeName.textContent = state.settings.theme ? state.settings.theme[0].toUpperCase() + state.settings.theme.slice(1) + " World" : "Candy World";
  }
}

function renderPuzzle() {
  const puzzle = state.puzzle;
  if (!puzzle) return;
  els.grid.style.setProperty("--family-grid-size", puzzle.size);
  els.grid.innerHTML = "";
  puzzle.cells = new Map();
  puzzle.grid.forEach((row, rowIndex) => {
    row.forEach((letter, colIndex) => {
      const key = cellKey(rowIndex, colIndex);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "family-cell";
      button.textContent = letter;
      button.dataset.row = rowIndex;
      button.dataset.col = colIndex;
      button.setAttribute("aria-label", `Row ${rowIndex + 1}, Column ${colIndex + 1}, letter ${letter}`);
      button.addEventListener("pointerdown", onCellPointerDown);
      button.addEventListener("pointerenter", onCellPointerEnter);
      button.addEventListener("pointerup", onCellPointerUp);
      button.addEventListener("click", onCellClick);
      puzzle.cells.set(key, button);
      els.grid.appendChild(button);
    });
  });
  renderWordList();
}

function renderWordList() {
  const words = state.puzzle.placements;
  els.wordList.innerHTML = "";
  words.forEach((placement) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "family-word-pill";
    chip.textContent = placement.display || placement.word;
    chip.title = placement.clue;
    chip.dataset.word = placement.word;
    chip.addEventListener("click", () => {
      trackWFL("result_word_clicked", {
        action_location: "word_list_chip",
        result_count: state.puzzle.placements.length,
      });
      flashPlacement(placement.word);
    });
    if (state.found.has(placement.word)) chip.classList.add("is-found");
    els.wordList.appendChild(chip);
  });
  updateProgressText();
}

function updateProgressText() {
  const total = state.puzzle ? state.puzzle.placements.length : 0;
  const solved = state.found.size;
  els.progressText.textContent = `${solved}/${total} words found`;
  els.scoreText.textContent = String(state.score);
  els.bestText.textContent = String(state.best);
  els.timerText.textContent = formatTime(state.remaining);
  els.statusText.textContent = state.finished
    ? "Puzzle complete!"
    : (state.settings.mode === "kids" ? "Find the words and have fun!" : "Solve the clues and beat the timer.");
}

function formatTime(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function startTimer() {
  if (state.timerId) window.clearInterval(state.timerId);
  if (!state.settings.timer) {
    state.remaining = 0;
    updateProgressText();
    return;
  }
  state.remaining = getDifficultyMeta().minutes * 60;
  updateProgressText();
  state.timerId = window.setInterval(() => {
    if (state.finished) return;
    state.remaining = Math.max(0, state.remaining - 1);
    updateProgressText();
    if (state.remaining === 0) {
      endGame(false);
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function flashPlacement(word) {
  if (!state.puzzle) return;
  const placement = state.puzzle.placements.find((item) => item.word === word);
  if (!placement) return;
  clearSelection();
  placement.cells.forEach((key) => {
    const cell = state.puzzle.cells.get(key);
    if (cell) cell.classList.add("is-selected");
  });
  state.selectedPath = [...placement.cells];
  window.setTimeout(() => clearSelection(), 900);
}

function clearSelection() {
  if (!state.puzzle) return;
  state.puzzle.cells.forEach((cell) => cell.classList.remove("is-selected", "family-grid-path"));
  state.selectedPath = [];
}

function highlightPath(path) {
  clearSelection();
  state.selectedPath = path;
  path.forEach((key) => {
    const cell = state.puzzle.cells.get(key);
    if (cell) cell.classList.add("is-selected");
  });
}

function markFound(word) {
  const placement = state.puzzle.placements.find((item) => item.word === word);
  if (!placement || state.found.has(word)) return;
  state.found.add(word);
  placement.found = true;
  placement.cells.forEach((key) => {
    const cell = state.puzzle.cells.get(key);
    if (cell) {
      cell.classList.add("is-found");
      cell.classList.remove("is-selected");
    }
  });
  state.score += placement.word.length * 10 + 50 + Math.max(0, Math.floor(state.remaining / 2));
  state.best = setBestScore(state.score);
  updateProgressText();
  renderWordList();
  if (state.settings.mode === "kids") {
    els.statusText.textContent = "Yay! You found a word!";
  } else {
    els.statusText.textContent = "Nice solve!";
  }
  if (state.found.size === state.puzzle.placements.length) {
    trackWFL("word_search_completed", {
      action_location: "auto_complete",
      result_count: state.puzzle.placements.length,
    });
    endGame(true);
  }
}

function showWrong(path) {
  path.forEach((key) => {
    const cell = state.puzzle.cells.get(key);
    if (cell) {
      cell.classList.add("is-wrong");
      window.setTimeout(() => cell.classList.remove("is-wrong"), 420);
    }
  });
}

function finalizeSelection(endCell) {
  if (!state.dragStart || !state.puzzle) return;
  const from = state.dragStart;
  const to = endCell;
  const path = buildLinePath(from, to);
  if (!path.length) {
    clearSelection();
    state.dragStart = null;
    return;
  }
  highlightPath(path);
  const letters = path.map((key) => {
    const { row, col } = parseCellKey(key);
    return state.puzzle.grid[row][col];
  }).join("");
  const reversed = letters.split("").reverse().join("");
  const match = state.puzzle.placements.find((placement) => !state.found.has(placement.word) && (placement.word === letters || placement.word === reversed || placement.word === letters.toUpperCase() || placement.word === reversed.toUpperCase()) && placementMatchesPath(placement, path));
  if (match) {
    markFound(match.word);
  } else {
    showWrong(path);
  }
  state.dragStart = null;
}

function onCellPointerDown(event) {
  if (state.finished) return;
  const cell = event.currentTarget;
  state.dragStart = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  highlightPath([cellKey(state.dragStart.row, state.dragStart.col)]);
  cell.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function onCellPointerEnter(event) {
  if (!state.dragStart || state.finished) return;
  const cell = event.currentTarget;
  const end = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  const path = buildLinePath(state.dragStart, end);
  if (path.length) highlightPath(path);
}

function onCellPointerUp(event) {
  if (state.finished) return;
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const cell = target && target.closest ? target.closest(".family-cell") : null;
  if (!cell) {
    state.dragStart = null;
    return;
  }
  finalizeSelection({ row: Number(cell.dataset.row), col: Number(cell.dataset.col) });
}

function onCellClick() {
  // handled via pointer selection; click stays for accessibility.
}

function currentMissingWords() {
  return state.puzzle.placements.filter((placement) => !state.found.has(placement.word));
}

function showHint() {
  if (state.finished || !state.puzzle) return;
  const missing = currentMissingWords();
  if (!missing.length) return;
  const placement = randomChoice(missing);
  const key = randomChoice(placement.cells);
  const cell = state.puzzle.cells.get(key);
  if (cell) {
    cell.classList.add("is-selected");
    window.setTimeout(() => cell.classList.remove("is-selected"), 900);
  }
  state.score = Math.max(0, state.score - 20);
  updateProgressText();
  els.statusText.textContent = `Hint: look for ${placement.clue}`;
}

function checkPuzzle() {
  const total = state.puzzle.placements.length;
  const found = state.found.size;
  els.statusText.textContent = `${found}/${total} words found so far.`;
  if (found === total) {
    trackWFL("word_search_completed", {
      action_location: "check_button",
      result_count: total,
    });
    endGame(true);
  }
}

function revealWord() {
  if (state.finished || !state.puzzle) return;
  const missing = currentMissingWords();
  if (!missing.length) return;
  const placement = randomChoice(missing);
  placement.cells.forEach((key) => {
    const cell = state.puzzle.cells.get(key);
    if (cell) cell.classList.add("is-selected");
  });
  state.score = Math.max(0, state.score - 50);
  updateProgressText();
  els.statusText.textContent = `Revealed: ${placement.clue}`;
}

function endGame(success) {
  if (state.finished) return;
  state.finished = true;
  stopTimer();
  if (success) {
    rememberSignature(state.puzzle.signature);
    const trophy = state.settings.mode === "kids" ? "Wow! Amazing!" : "Puzzle Complete";
    showModal({
      title: trophy,
      message: state.settings.mode === "kids"
        ? "You solved the crossword! Great job!"
        : "Great work. You solved every word.",
      emoji: state.settings.mode === "kids" ? "" : "",
    });
  } else {
    showModal({
      title: "Almost there!",
      message: "Want to try one more puzzle?",
      emoji: "*",
      retry: true,
    });
  }
}

function showModal({ title, message, emoji, retry = false }) {
  els.modalTitle.textContent = title;
  els.modalMessage.textContent = message;
  els.modalEmoji.textContent = emoji;
  els.modalScore.textContent = String(state.score);
  els.modalTime.textContent = formatTime(state.remaining);
  els.modalWords.textContent = `${state.found.size}/${state.puzzle.placements.length}`;
  els.modalFacebook.href = FACEBOOK_PAGE_URL;
  els.modalFacebook.target = "_blank";
  els.modalFacebook.rel = "noopener noreferrer";
  els.modalShareBtn.dataset.facebookShare = window.location.href;
  els.modalCopyBtn.dataset.copyLink = window.location.href;
  els.modalRetry.style.display = retry ? "" : "none";
  els.modal.classList.add("is-open");
  els.modal.hidden = false;
  els.modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  els.modal.classList.remove("is-open");
  els.modal.hidden = true;
  els.modal.setAttribute("aria-hidden", "true");
}

function celebrateIfNeeded() {
  if (!state.puzzle) return;
  if (state.found.size === state.puzzle.placements.length) {
    endGame(true);
  }
}

function newPuzzle() {
  state.puzzle = buildPuzzle();
  state.found = new Set();
  state.score = 0;
  state.finished = false;
  state.dragStart = null;
  state.selectedPath = [];
  closeModal();
  if (!state.puzzle) {
    els.statusText.textContent = "No puzzle could be created. Try another mode or category.";
    return;
  }
  els.puzzleTitle.textContent = `${getCategoryLabel(state.settings.category)} ${state.settings.mode === "kids" ? "Kids" : "Family"} Search`;
  els.puzzleMeta.textContent = `${getDifficultyMeta().minutes} minutes - ${state.puzzle.placements.length} words - ${getCategoryLabel(state.settings.category)}`;
  els.timerText.textContent = formatTime(getDifficultyMeta().minutes * 60);
  els.hintToggle.textContent = state.settings.mode === "kids" ? "Hint" : "Hint";
  renderPuzzle();
  if (state.puzzle) {
    trackWFL("word_search_started", {
      action_location: "new_puzzle",
      result_count: state.puzzle.placements.length,
    });
  }
  state.remaining = getDifficultyMeta().minutes * 60;
  updateProgressText();
  if (state.settings.timer) startTimer();
  else stopTimer();
  setThemeClasses();
  saveFamilyPreferences(state.settings);
  wireShareGroup(document);
}

function bindControls() {
  if (els.modeKids) els.modeKids.addEventListener("click", () => setMode("kids"));
  if (els.modeAdults) els.modeAdults.addEventListener("click", () => setMode("adult"));
  els.category.addEventListener("change", () => {
    state.settings.category = els.category.value;
    trackWFL("filter_used", {
      action_location: "category_selector",
      filter_type: "category",
      value: state.settings.category,
    });
    saveFamilyPreferences(state.settings);
    newPuzzle();
  });
  els.difficulty.addEventListener("change", () => {
    state.settings.difficulty = els.difficulty.value;
    trackWFL("filter_used", {
      action_location: "difficulty_selector",
      filter_type: "difficulty",
      value: state.settings.difficulty,
    });
    saveFamilyPreferences(state.settings);
    newPuzzle();
  });
  els.timerToggle.addEventListener("change", () => {
    state.settings.timer = els.timerToggle.value === "true";
    trackWFL("filter_used", {
      action_location: "timer_toggle",
      filter_type: "timer",
      value: state.settings.timer ? "on" : "off",
    });
    saveFamilyPreferences(state.settings);
    newPuzzle();
  });
  els.newPuzzle.addEventListener("click", newPuzzle);
  els.playAgain.addEventListener("click", newPuzzle);
  els.hint.addEventListener("click", showHint);
  els.check.addEventListener("click", checkPuzzle);
  els.reveal.addEventListener("click", revealWord);
  els.modalClose.addEventListener("click", closeModal);
  els.modalRetry.addEventListener("click", newPuzzle);
  els.modalNew.addEventListener("click", () => {
    closeModal();
    newPuzzle();
  });
}

function bindKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (state.finished) return;
    if (!state.puzzle) return;
    if (event.key === "Escape") {
      clearSelection();
      state.dragStart = null;
      return;
    }
    if (event.key === "h" || event.key === "H") {
      showHint();
      return;
    }
  });
}

async function init() {
  await loadData();
  els.modeKids = $("wordSearchKids");
  els.modeAdults = $("wordSearchAdults");
  els.modeLabel = $("wordSearchModeLabel");
  els.modeCopy = $("wordSearchModeCopy");
  els.heroTitle = $("wordSearchTitle");
  els.heroSubtitle = $("wordSearchSubtitle");
  els.heroPrimary = $("wordSearchPrimary");
  els.heroSecondary = $("wordSearchSecondary");
  els.category = $("wordSearchCategory");
  els.difficulty = $("wordSearchDifficulty");
  els.timerToggle = $("wordSearchTimer");
  els.newPuzzle = $("wordSearchNew");
  els.playAgain = $("wordSearchPlayAgain");
  els.hint = $("wordSearchHint");
  els.check = $("wordSearchCheck");
  els.reveal = $("wordSearchReveal");
  els.grid = $("wordSearchGrid");
  els.wordList = $("wordSearchList");
  els.puzzleTitle = $("wordSearchPuzzleTitle");
  els.puzzleMeta = $("wordSearchPuzzleMeta");
  els.timerText = $("wordSearchTimerText");
  els.scoreText = $("wordSearchScoreText");
  els.bestText = $("wordSearchBestText");
  els.progressText = $("wordSearchProgressText");
  els.statusText = $("wordSearchStatus");
  els.themeName = $("wordSearchThemeName");
  els.facebookFollow = $("wordSearchFacebook");
  els.copyLink = $("wordSearchCopy");
  els.shareFacebook = $("wordSearchShare");
  els.modal = $("wordSearchModal");
  els.modalClose = $("wordSearchModalClose");
  els.modalTitle = $("wordSearchModalTitle");
  els.modalMessage = $("wordSearchModalMessage");
  els.modalEmoji = $("wordSearchModalEmoji");
  els.modalScore = $("wordSearchModalScore");
  els.modalTime = $("wordSearchModalTime");
  els.modalWords = $("wordSearchModalWords");
  els.modalRetry = $("wordSearchModalRetry");
  els.modalNew = $("wordSearchModalNew");
  els.modalFacebook = $("wordSearchModalFacebook");
  els.modalShareBtn = $("wordSearchModalShare");
  els.modalCopyBtn = $("wordSearchModalCopy");

  const prefs = getFamilyPreferences();
  if (prefs.mode === "adult" || location.search.includes("mode=adult")) setMode("adult");
  else setMode("kids");
  if (prefs.category) els.category.value = prefs.category;
  if (prefs.difficulty) els.difficulty.value = prefs.difficulty;
  if (typeof prefs.timer === "boolean") els.timerToggle.value = prefs.timer ? "true" : "false";

  bindControls();
  bindKeyboard();
  setThemeClasses();
  setHeroText();
  newPuzzle();
}

window.addEventListener("DOMContentLoaded", init);
