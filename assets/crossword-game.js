import { buildCrosswordPuzzle, loadCrosswordClueBank } from "/assets/crossword-generator.js";
import {
  getBestCrosswordScore,
  getCrosswordPreferences,
  getDailyCrosswordStatus,
  getRecentPuzzleSignatures,
  rememberPuzzleSignature,
  saveCrosswordPreferences,
  setBestCrosswordScore,
  setDailyCrosswordStatus,
} from "/assets/crossword-storage.js";

const TYPE_TITLES = {
  mini: "Mini Crossword",
  kids: "Kids Crossword",
  themed: "Themed Crossword",
  vocabulary: "Vocabulary Crossword",
  daily: "Daily Crossword",
};

const TYPE_METAS = {
  mini: "7x7 • 4–6 words • 5 minutes",
  kids: "7x7 • 4–6 words • 5 minutes",
  themed: "9x9+ • 7–14 words • up to 10 minutes",
  vocabulary: "9x9 • 7–10 words • 7 minutes",
  daily: "Daily puzzle • varies by difficulty",
};

const MODE_COPY = {
  kids: {
    bodyClass: "crossword-kids-mode",
    note: "Kids Mode loaded. Let?s play!",
    startPuzzle: "Let?s Play!",
    hint: "Help Me!",
    check: "Check It!",
    revealWord: "Show Word",
    revealAll: "You solved it!",
    ready: "Find the word! Tap a square or choose a clue to begin.",
    solved: "Yay! You found a word!",
    complete: "Amazing! You solved the crossword!",
    retry: "Almost there! Want to try one more puzzle?",
    celebrate: ["A", "B", "C", "W", "O", "R", "D"],
    retryLetters: ["T", "R", "Y", "A", "G", "A", "I", "N"],
  },
  adults: {
    bodyClass: "crossword-adults-mode",
    note: "Adults Mode loaded. Start your challenge!",
    startPuzzle: "Start Challenge",
    hint: "Hint",
    check: "Check Answers",
    revealWord: "Solve the Clue",
    revealAll: "Reveal Puzzle",
    ready: "Solve the clue and build your score.",
    solved: "Nice solve!",
    complete: "Amazing! You solved the crossword!",
    retry: "Almost there! Want to try one more puzzle?",
    celebrate: ["A", "C", "E", "D", "W", "O", "R", "D"],
    retryLetters: ["T", "R", "Y", "A", "G", "A", "I", "N"],
  },
};

const KEY_ROWS = [
  "QWERTYUIOP",
  "ASDFGHJKL",
  "ZXCVBNM",
];

const DOM = {};
const state = {
  preferences: getCrosswordPreferences(),
  sound: getCrosswordPreferences().sound !== false,
  puzzle: null,
  placementCells: new Map(),
  typed: [],
  selected: null,
  direction: "across",
  currentPlacementId: null,
  score: 0,
  letterScore: 0,
  completedBonus: 0,
  hintCount: 0,
  revealCount: 0,
  timerId: null,
  remaining: 0,
  totalSeconds: 0,
  started: false,
  finished: false,
  checkMode: false,
  solvedCount: 0,
  lastSolvedCount: 0,
  totalWords: 0,
  dailyKey: "",
  bestScore: getBestCrosswordScore(),
  resultOpen: false,
  audioContext: null,
  revealedWords: new Set(),
  boardFresh: false,
};

function getGameMode(type = DOM.type?.value) {
  return type === "kids" ? "kids" : "adults";
}

function getModeCopy(mode = getGameMode()) {
  return MODE_COPY[mode] || MODE_COPY.adults;
}

function applyModeTheme() {
  if (!document.body) return;
  const mode = getGameMode();
  document.body.classList.toggle("crossword-kids-mode", mode === "kids");
  document.body.classList.toggle("crossword-adults-mode", mode !== "kids");
}

function updateModeSwitchUI() {
  const mode = getGameMode();
  const kidsActive = mode === "kids";
  if (DOM.modeKids) DOM.modeKids.classList.toggle("is-active", kidsActive);
  if (DOM.modeAdults) DOM.modeAdults.classList.toggle("is-active", !kidsActive);
  if (DOM.modeNote) DOM.modeNote.textContent = getModeCopy(mode).note;
}

function applyModeLabels() {
  const copy = getModeCopy();
  if (DOM.newPuzzle) DOM.newPuzzle.textContent = copy.startPuzzle;
  if (DOM.hint) DOM.hint.textContent = copy.hint;
  if (DOM.check) DOM.check.textContent = copy.check;
  if (DOM.revealWord) DOM.revealWord.textContent = copy.revealWord;
  if (DOM.revealAll) DOM.revealAll.textContent = copy.revealAll;
}

function $(id) {
  return document.getElementById(id);
}

function todayKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function setStatus(message, kind = "info") {
  if (!DOM.status) return;
  DOM.status.textContent = message || "";
  DOM.status.dataset.kind = kind;
}

function setCurrentClue(message) {
  if (!DOM.currentClue) return;
  DOM.currentClue.textContent = message || "Select a word to begin.";
}

function playTone(kind) {
  if (!state.sound) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    if (!state.audioContext) state.audioContext = new AudioContext();
    const ctx = state.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const presets = {
      tap: { freq: 720, end: 0.055, gain: 0.02 },
      success: { freq: 540, end: 0.12, gain: 0.03 },
      hint: { freq: 400, end: 0.12, gain: 0.025 },
      error: { freq: 220, end: 0.14, gain: 0.03 },
    };
    const preset = presets[kind] || presets.tap;
    osc.type = "triangle";
    osc.frequency.value = preset.freq;
    gain.gain.value = preset.gain;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.end);
    osc.stop(now + preset.end + 0.02);
  } catch (err) {}
}

function syncSoundButton() {
  if (!DOM.soundToggle) return;
  DOM.soundToggle.textContent = state.sound ? "Sound On" : "Sound Off";
  DOM.soundToggle.setAttribute("aria-pressed", state.sound ? "true" : "false");
}

function normalizeSettings() {
  const type = DOM.type.value;
  let difficulty = DOM.difficulty.value;
  let category = DOM.category.value;

  if (type === "kids") {
    difficulty = "easy";
    category = "kids";
  } else if (type === "vocabulary") {
    difficulty = "medium";
    category = "vocabulary";
  } else if (type === "daily") {
    category = "all";
  }

  return { type, difficulty, category };
}

function applyTypeRules() {
  const type = DOM.type.value;
  const isKids = type === "kids";
  const isVocabulary = type === "vocabulary";
  const isDaily = type === "daily";

  DOM.difficulty.disabled = isKids || isVocabulary;
  DOM.category.disabled = isKids || isVocabulary || isDaily;

  if (isKids) {
    DOM.difficulty.value = "easy";
    DOM.category.value = "kids";
  } else if (isVocabulary) {
    DOM.difficulty.value = "medium";
    DOM.category.value = "vocabulary";
  } else if (isDaily) {
    DOM.category.value = "all";
  }

  applyModeTheme();
  updateModeSwitchUI();
  applyModeLabels();
}

function persistPreferences() {
  const { type, difficulty, category } = normalizeSettings();
  saveCrosswordPreferences({
    type,
    difficulty,
    category,
    sound: state.sound,
  });
}

function setSelection(row, col) {
  if (!state.puzzle) return;
  const cell = state.puzzle.cells[row]?.[col];
  if (!cell || cell.block) return;

  const sameCell = state.selected && state.selected.row === row && state.selected.col === col;
  const availableAcross = Boolean(cell.across);
  const availableDown = Boolean(cell.down);

  if (sameCell && availableAcross && availableDown) {
    state.direction = state.direction === "across" ? "down" : "across";
  } else if (!(state.direction === "across" ? availableAcross : availableDown)) {
    state.direction = availableAcross ? "across" : "down";
  }

  state.selected = { row, col };
  state.currentPlacementId = state.direction === "across" ? cell.across : cell.down;
  renderAll();
}

function getPlacementById(id) {
  if (!state.puzzle || !id) return null;
  return state.puzzle.placements.find((placement) => placement.id === id) || null;
}

function getCellPlacements(row, col) {
  if (!state.puzzle) return [];
  const cell = state.puzzle.cells[row]?.[col];
  if (!cell || cell.block) return [];
  return [cell.across, cell.down].filter(Boolean).map(getPlacementById).filter(Boolean);
}

function getCurrentPlacement() {
  return getPlacementById(state.currentPlacementId);
}

function getPlacementCells(placement) {
  if (!placement || !state.placementCells) return [];
  return state.placementCells.get(placement.id) || [];
}

function isPlacementSolved(placement) {
  if (!placement || !state.puzzle) return false;
  const cells = getPlacementCells(placement);
  if (!cells.length) return false;
  return cells.every(({ row, col, letter }) => (state.typed[row]?.[col] || "").toUpperCase() === letter);
}

function isCellCorrect(row, col) {
  if (!state.puzzle) return false;
  const expected = state.puzzle.cells[row]?.[col]?.letter || "";
  return expected && (state.typed[row]?.[col] || "").toUpperCase() === expected;
}

function isCellWrong(row, col) {
  if (!state.puzzle) return false;
  const expected = state.puzzle.cells[row]?.[col];
  if (!expected || expected.block) return false;
  const typed = (state.typed[row]?.[col] || "").toUpperCase();
  return Boolean(typed) && typed !== expected.letter;
}

function buildPlacementCellMap(puzzle) {
  const map = new Map();
  puzzle.placements.forEach((placement) => {
    const coords = [];
    for (let i = 0; i < placement.word.length; i++) {
      coords.push({
        row: placement.row + (placement.direction === "down" ? i : 0),
        col: placement.col + (placement.direction === "across" ? i : 0),
        letter: placement.word[i],
      });
    }
    map.set(placement.id, coords);
  });
  return map;
}

function initializeState(puzzle, settings) {
  puzzle.placements.forEach((placement) => {
    placement.completed = false;
    placement._bonusAwarded = false;
  });
  state.puzzle = puzzle;
  state.placementCells = buildPlacementCellMap(puzzle);
  state.typed = Array.from({ length: puzzle.size }, () => Array(puzzle.size).fill(""));
  state.selected = null;
  state.direction = "across";
  state.currentPlacementId = null;
  state.score = 0;
  state.letterScore = 0;
  state.completedBonus = 0;
  state.hintCount = 0;
  state.revealCount = 0;
  state.remaining = puzzle.timeLimit;
  state.totalSeconds = puzzle.timeLimit;
  state.started = true;
  state.finished = false;
  state.checkMode = false;
  state.resultOpen = false;
  state.solvedCount = 0;
  state.lastSolvedCount = 0;
  state.totalWords = puzzle.placements.length;
  state.dailyKey = todayKey();
  state.bestScore = getBestCrosswordScore();
  state.revealedWords = new Set();
  state.boardFresh = true;
  const firstPlacement = puzzle.placements[0];
  if (firstPlacement) {
    state.selected = { row: firstPlacement.row, col: firstPlacement.col };
    state.direction = firstPlacement.direction;
    state.currentPlacementId = firstPlacement.id;
  }
  stopTimer();
  updateModeSwitchUI();
  applyModeLabels();
  updateHeroCopy(settings);
  updateProgressDisplay();

  if (settings.type === "daily") {
    const dailyStatus = getDailyCrosswordStatus(state.dailyKey);
    if (dailyStatus && dailyStatus.signature === puzzle.signature && dailyStatus.completed) {
      setStatus("Today's crossword has already been completed here. You can still replay it.", "info");
    } else {
      setStatus("Daily puzzle loaded. Start solving when you?re ready.", "info");
    }
  } else {
    setStatus(getModeCopy().ready, "info");
  }
}

function updateScore() {
  const timeBonus = Math.max(0, Math.floor(state.remaining));
  const penalty = state.hintCount * 20 + state.revealCount * 50;
  state.score = Math.max(0, state.letterScore + state.completedBonus + timeBonus - penalty);
  state.bestScore = setBestCrosswordScore(state.score);

  if (DOM.score) DOM.score.textContent = String(state.score);
  if (DOM.best) DOM.best.textContent = String(state.bestScore);
  if (DOM.heroScore) DOM.heroScore.textContent = String(state.score);
  if (DOM.heroBest) DOM.heroBest.textContent = String(state.bestScore);
  if (DOM.hints) DOM.hints.textContent = String(state.hintCount);
}

function updateTimerDisplay() {
  const display = formatTime(state.remaining);
  if (DOM.timer) DOM.timer.textContent = display;
  if (DOM.heroTimer) DOM.heroTimer.textContent = display;
}

function updateProgressDisplay() {
  if (DOM.heroWords) DOM.heroWords.textContent = `${state.solvedCount}/${state.totalWords}`;
}

function recomputeStats() {
  let correctLetters = 0;
  let solvedWords = 0;

  if (!state.puzzle) return;

  state.puzzle.placements.forEach((placement) => {
    const solved = isPlacementSolved(placement);
    placement.completed = solved;
    if (solved) {
      solvedWords += 1;
      if (!placement._bonusAwarded) {
        placement._bonusAwarded = true;
        state.completedBonus += 50;
        playTone("success");
      }
    }
  });

  for (let row = 0; row < state.puzzle.size; row++) {
    for (let col = 0; col < state.puzzle.size; col++) {
      const cell = state.puzzle.cells[row][col];
      if (cell && !cell.block && isCellCorrect(row, col)) {
        correctLetters += 1;
      }
    }
  }

  state.letterScore = correctLetters * 10;
  state.solvedCount = solvedWords;
  updateScore();
  updateProgressDisplay();

  if (solvedWords > state.lastSolvedCount && solvedWords < state.totalWords) {
    setStatus(`${getModeCopy().solved} ${solvedWords}/${state.totalWords} words solved.`, "success");
  }
  state.lastSolvedCount = solvedWords;

  if (state.puzzle.type === "daily" && solvedWords === state.totalWords) {
    setDailyCrosswordStatus(state.dailyKey, {
      completed: true,
      signature: state.puzzle.signature,
      score: state.score,
      finishedAt: new Date().toISOString(),
    });
  }

  if (solvedWords === state.totalWords && state.totalWords > 0) {
    finishGame(true);
  }
}

function moveSelectionByDelta(deltaRow, deltaCol) {
  if (!state.puzzle || !state.selected) return;
  let row = state.selected.row;
  let col = state.selected.col;

  while (true) {
    row += deltaRow;
    col += deltaCol;
    if (row < 0 || col < 0 || row >= state.puzzle.size || col >= state.puzzle.size) return;
    const cell = state.puzzle.cells[row][col];
    if (cell && !cell.block) {
      setSelection(row, col);
      return;
    }
  }
}

function moveWithinWord(delta) {
  if (!state.puzzle || !state.selected) return;
  const placement = getCurrentPlacement();
  if (!placement) return;
  const cells = getPlacementCells(placement);
  const index = cells.findIndex((item) => item.row === state.selected.row && item.col === state.selected.col);
  if (index < 0) return;
  const next = cells[index + delta];
  if (next) {
    setSelection(next.row, next.col);
  }
}

function ensureSelection() {
  if (state.selected) return;
  if (!state.puzzle) return;
  const first = state.puzzle.placements[0];
  if (first) setSelection(first.row, first.col);
}

function setCellValue(row, col, letter) {
  if (!state.puzzle) return;
  const cell = state.puzzle.cells[row]?.[col];
  if (!cell || cell.block) return;
  state.typed[row][col] = letter ? String(letter).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1) : "";
}

function typeLetter(letter) {
  if (!state.puzzle || state.finished) return;
  ensureSelection();
  const selected = state.selected;
  if (!selected) return;
  const cell = state.puzzle.cells[selected.row][selected.col];
  if (!cell || cell.block) return;

  const value = String(letter || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1);
  if (!value) return;

  setCellValue(selected.row, selected.col, value);
  playTone("tap");
  state.checkMode = false;
  recomputeStats();
  renderAll();
  moveWithinWord(1);
}

function clearCurrentCell() {
  if (!state.puzzle || !state.selected || state.finished) return;
  const { row, col } = state.selected;
  if (state.typed[row][col]) {
    setCellValue(row, col, "");
    playTone("tap");
    state.checkMode = false;
    recomputeStats();
    renderAll();
    moveWithinWord(-1);
    return;
  }
  const placement = getCurrentPlacement();
  if (placement) {
    const cells = getPlacementCells(placement);
    const index = cells.findIndex((item) => item.row === row && item.col === col);
    if (index > 0) {
      const prev = cells[index - 1];
      setSelection(prev.row, prev.col);
      setCellValue(prev.row, prev.col, "");
      playTone("tap");
      state.checkMode = false;
      recomputeStats();
      renderAll();
    }
  }
}

function toggleDirection() {
  if (!state.puzzle || !state.selected) return;
  const cell = state.puzzle.cells[state.selected.row][state.selected.col];
  if (!cell || cell.block) return;
  if (cell.across && cell.down) {
    state.direction = state.direction === "across" ? "down" : "across";
    state.currentPlacementId = state.direction === "across" ? cell.across : cell.down;
    renderAll();
  }
}

function selectPlacement(placementId) {
  const placement = getPlacementById(placementId);
  if (!placement) return;
  state.direction = placement.direction;
  state.currentPlacementId = placement.id;
  setSelection(placement.row, placement.col);
}

function buildBoardHTML() {
  if (!state.puzzle) return "";
  const currentPlacement = getCurrentPlacement();
  const currentCells = new Set(getPlacementCells(currentPlacement).map(({ row, col }) => `${row}:${col}`));
  const rows = [];

  for (let row = 0; row < state.puzzle.size; row++) {
    for (let col = 0; col < state.puzzle.size; col++) {
      const cell = state.puzzle.cells[row][col];
      const cellKey = `${row}:${col}`;
      if (cell.block) {
        rows.push('<div class="cw-block" aria-hidden="true"></div>');
        continue;
      }

      const typed = state.typed[row][col] || "";
      const classes = ["cw-cell"];
      const placementSolved = state.puzzle.placements.some((placement) => placement.completed && getPlacementCells(placement).some((item) => item.row === row && item.col === col));
      if (state.selected && state.selected.row === row && state.selected.col === col) classes.push("is-selected");
      if (currentCells.has(cellKey)) classes.push("is-current-word");
      if (placementSolved) classes.push("is-complete");
      if (typed && state.checkMode && isCellCorrect(row, col)) classes.push("is-correct");
      if (typed && state.checkMode && isCellWrong(row, col)) classes.push("is-wrong");
      if (typed && !state.checkMode && isCellCorrect(row, col)) classes.push("is-correct");
      if (state.revealedWords && state.revealedWords.has(`${row}:${col}`)) classes.push("is-revealed");

      const number = cell.number ? `<span class="cw-cell-number">${cell.number}</span>` : "";
      const letter = typed ? typed : "";
      const aria = `Row ${row + 1}, column ${col + 1}${cell.number ? `. Clue ${cell.number}` : ""}. ${typed ? `Letter ${typed}.` : "Blank square."}`;
      const order = row * state.puzzle.size + col;

      rows.push(`
        <button
          type="button"
          class="${classes.join(" ")}"
          role="gridcell"
          aria-label="${aria}"
          data-row="${row}"
          data-col="${col}"
          data-placement-across="${cell.across || ""}"
          data-placement-down="${cell.down || ""}"
          style="--cw-order:${order}"
        >
          ${number}
          <span class="cw-cell-letter">${letter}</span>
        </button>
      `);
    }
  }

  return rows.join("");
}

function buildClueListHTML(direction) {
  if (!state.puzzle) return "";
  const items = state.puzzle[direction] || [];
  return items.map((placement) => {
    const active = placement.id === state.currentPlacementId ? " is-active" : "";
    const complete = placement.completed ? " is-complete" : "";
    return `
      <button type="button" class="cw-clue-item${active}${complete}" data-placement-id="${placement.id}">
        <span class="cw-clue-number">${placement.number}</span>
        <span class="cw-clue-text">${placement.clue}</span>
      </button>
    `;
  }).join("");
}

function buildKeyboardHTML() {
  const rows = KEY_ROWS.map((row) => `
    <div class="cw-key-row">
      ${row.split("").map((letter) => `<button type="button" class="cw-key" data-letter="${letter}" aria-label="Letter ${letter}">${letter}</button>`).join("")}
    </div>
  `);

  const controls = `
    <div class="cw-key-row cw-key-row--actions">
      <button type="button" class="cw-key is-soft" data-key="backspace" aria-label="Backspace">⌫ Backspace</button>
      <button type="button" class="cw-key is-soft" data-key="toggle" aria-label="Switch direction">↔ Direction</button>
      <button type="button" class="cw-key is-primary" data-key="hint" aria-label="Take a hint">Hint</button>
      <button type="button" class="cw-key is-primary" data-key="check" aria-label="Check answer">Check</button>
    </div>
  `;

  return [...rows, controls].join("");
}

function updateHeroCopy(settings) {
  const mode = getGameMode(settings?.type || DOM.type?.value);
  const copy = getModeCopy(mode);
  if (DOM.puzzleTitle) DOM.puzzleTitle.textContent = TYPE_TITLES[settings.type] || "Crossword Game";
  if (DOM.puzzleMeta) DOM.puzzleMeta.textContent = TYPE_METAS[settings.type] || TYPE_METAS.mini;
  if (DOM.heroBest) DOM.heroBest.textContent = String(state.bestScore);
  if (DOM.heroTimer) DOM.heroTimer.textContent = formatTime(state.remaining);
  if (DOM.heroScore) DOM.heroScore.textContent = String(state.score);
  if (DOM.heroWords) DOM.heroWords.textContent = `${state.solvedCount}/${state.totalWords}`;
  if (DOM.modeNote) DOM.modeNote.textContent = copy.note;
  if (DOM.status && !state.puzzle) setStatus(copy.ready, "info");
}

function renderClues() {
  if (DOM.acrossClues) DOM.acrossClues.innerHTML = buildClueListHTML("across");
  if (DOM.downClues) DOM.downClues.innerHTML = buildClueListHTML("down");
}

function renderBoard() {
  if (!DOM.grid) return;
  DOM.grid.style.setProperty("--cw-size", String(state.puzzle?.size || 7));
  DOM.grid.classList.toggle("is-new-puzzle", Boolean(state.boardFresh));
  DOM.grid.innerHTML = buildBoardHTML();
  if (state.boardFresh) {
    window.requestAnimationFrame(() => {
      state.boardFresh = false;
      if (DOM.grid) DOM.grid.classList.remove("is-new-puzzle");
    });
  }
}

function renderKeyboard() {
  if (!DOM.keyboard) return;
  DOM.keyboard.innerHTML = buildKeyboardHTML();
}

function renderAll() {
  if (!state.puzzle) return;
  updateHeroCopy(state.preferences);
  updateTimerDisplay();
  updateScore();
  updateProgressDisplay();
  renderBoard();
  renderClues();
  updateActiveClueText();
}

function updateActiveClueText() {
  const placement = getCurrentPlacement();
  if (!placement) {
    setCurrentClue(getModeCopy().ready);
    return;
  }
  const direction = placement.direction === "across" ? "Across" : "Down";
  setCurrentClue(`${direction} ${placement.number}: ${placement.clue}`);
}

function revealPlacement(placement, applyPenalty = true) {
  if (!placement || !state.puzzle) return;
  const cells = getPlacementCells(placement);
  cells.forEach(({ row, col, letter }) => {
    setCellValue(row, col, letter);
    if (!state.revealedWords) state.revealedWords = new Set();
    state.revealedWords.add(`${row}:${col}`);
  });
  if (applyPenalty) {
    state.revealCount += 1;
    playTone("hint");
  }
  state.checkMode = false;
  recomputeStats();
  renderAll();
}

function revealCurrentWord() {
  if (!state.puzzle || state.finished) return;
  const placement = getCurrentPlacement();
  if (!placement) {
    setStatus("Pick a clue first so I know which word to reveal.", "warn");
    return;
  }
  revealPlacement(placement, true);
  setStatus(`${getModeCopy().solved} Revealed word ${placement.number}.`, "info");
}

function revealAll() {
  if (!state.puzzle || state.finished) return;
  const ok = window.confirm("Reveal the full crossword? This will apply a score penalty.");
  if (!ok) return;
  state.revealedWords = new Set();
  state.puzzle.placements.forEach((placement) => {
    getPlacementCells(placement).forEach(({ row, col, letter }) => {
      setCellValue(row, col, letter);
      state.revealedWords.add(`${row}:${col}`);
    });
    placement.completed = true;
    placement._bonusAwarded = true;
  });
  state.revealCount += 1;
  state.checkMode = false;
  state.finished = true;
  stopTimer();
  recomputeStats();
  renderAll();
  openResultModal(true);
  setStatus("Full crossword revealed.", "warn");
}

function takeHint() {
  if (!state.puzzle || state.finished) return;
  let placement = getCurrentPlacement();
  if (!placement || placement.completed) {
    placement = state.puzzle.placements.find((item) => !item.completed) || null;
  }
  if (!placement) {
    setStatus("No incomplete word is available for a hint.", "warn");
    return;
  }

  const empties = getPlacementCells(placement).filter(({ row, col }) => !(state.typed[row][col] || ""));
  if (!empties.length) {
    setStatus("That word is already filled.", "info");
    return;
  }

  const pick = empties[Math.floor(Math.random() * empties.length)];
  setCellValue(pick.row, pick.col, pick.letter);
  state.hintCount += 1;
  state.checkMode = false;
  playTone("hint");
  setSelection(pick.row, pick.col);
  recomputeStats();
  renderAll();
  setStatus(`Hint filled one square in clue ${placement.number}.`, "info");
}

function checkAnswer() {
  if (!state.puzzle || state.finished) return;
  state.checkMode = true;
  playTone("tap");
  recomputeStats();
  renderAll();

  const correct = state.letterScore / 10;
  const total = state.puzzle.cells.flat().filter((cell) => cell && !cell.block).length;
  const wrong = total - correct;
  setStatus(`${correct} letters correct, ${wrong} still off or empty.`, wrong ? "warn" : "info");
}

function restartPuzzle() {
  if (!state.puzzle) return;
  initializeState(state.puzzle, state.preferences);
  renderAll();
  renderKeyboard();
  setStatus("Puzzle restarted. Same board, fresh attempt.", "info");
}

async function shareResult() {
  if (!state.puzzle) return;
  const solved = state.solvedCount;
  const total = state.totalWords;
  const text = `I played WordFindLab Crossword Game: ${state.score} points, ${solved}/${total} words solved, ${formatTime(state.remaining)} left. Try it at https://wordfindlab.com/crossword-game/`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "WordFindLab Crossword Game",
        text,
        url: "https://wordfindlab.com/crossword-game/",
      });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setStatus("Result copied to clipboard.", "info");
    } else {
      setStatus(text, "info");
    }
  } catch (err) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      setStatus("Result copied to clipboard.", "info");
    }
  }
}

function buildModalActions(completed) {
  const mode = getGameMode();
  if (completed) {
    return `
      <button type="button" class="cw-action cw-action--soft" data-modal-action="play-again">Play Again</button>
      <button type="button" class="cw-action cw-action--soft" data-modal-action="try-kids">Try Kids Mode</button>
      <button type="button" class="cw-action cw-action--soft" data-modal-action="try-adults">Try Adults Mode</button>
      <button type="button" class="cw-action cw-action--primary" data-modal-action="share">Share Result</button>
    `;
  }
  return `
    <button type="button" class="cw-action cw-action--soft" data-modal-action="retry">Retry Puzzle</button>
    <button type="button" class="cw-action cw-action--soft" data-modal-action="new-puzzle">New Puzzle</button>
    <button type="button" class="cw-action cw-action--primary" data-modal-action="hint">Get a Hint</button>
  `;
}

function buildModalArt(completed) {
  const mode = getGameMode();
  const letters = completed ? getModeCopy(mode).celebrate : getModeCopy(mode).retryLetters;
  return letters.map((letter) => `<span class="cw-float-letter">${letter}</span>`).join("");
}

function openResultModal(completed) {
  if (!DOM.resultModal) return;
  const solved = state.puzzle.placements.filter((placement) => placement.completed);
  const missed = state.puzzle.placements.filter((placement) => !placement.completed);
  const mode = getGameMode();
  const copy = getModeCopy(mode);
  const remaining = formatTime(state.remaining);

  DOM.resultTitle.textContent = completed ? copy.complete : copy.retry;
  DOM.modalMessage.textContent = completed ? (mode === "kids" ? "Great job!" : "Nice solve!") : "Keep going!";
  DOM.resultSummary.textContent = `Score ${state.score} | ${remaining} left | ${solved.length} of ${state.totalWords} words solved.`;
  DOM.resultMeta.textContent = completed ? "Amazing! You solved the crossword!" : "Your next puzzle is waiting below.";
  DOM.solvedWords.innerHTML = solved.length
    ? solved.map((placement) => `<div class="cw-result-item">${placement.number}. ${placement.word}</div>`).join("")
    : '<div class="cw-result-item">No words solved yet.</div>';
  DOM.missedWords.innerHTML = missed.length
    ? missed.map((placement) => `<div class="cw-result-item">${placement.number}. ${placement.word}</div>`).join("")
    : '<div class="cw-result-item">Nothing missed. Nice work!</div>';
  DOM.modalArt.innerHTML = buildModalArt(completed);
  DOM.modalArt.classList.toggle("is-try-again", !completed);
  DOM.modalLetters.innerHTML = buildModalArt(completed);
  DOM.modalLetters.classList.toggle("is-try-again", !completed);
  DOM.modalActions.innerHTML = buildModalActions(completed);
  DOM.resultModal.hidden = false;
  DOM.resultModal.setAttribute("aria-hidden", "false");
  state.resultOpen = true;
}

function closeResultModal() {
  if (!DOM.resultModal) return;
  DOM.resultModal.hidden = true;
  DOM.resultModal.setAttribute("aria-hidden", "true");
  state.resultOpen = false;
}

function finishGame(completed) {
  if (state.finished) return;
  state.finished = true;
  stopTimer();
  if (completed) {
    playTone("success");
    if (state.puzzle.type === "daily") {
      setDailyCrosswordStatus(state.dailyKey, {
        completed: true,
        signature: state.puzzle.signature,
        score: state.score,
        finishedAt: new Date().toISOString(),
      });
    }
    setStatus(getModeCopy().complete, "success");
  } else {
    setStatus(getModeCopy().retry, "warn");
  }
  openResultModal(completed);
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startTimer() {
  stopTimer();
  state.timerId = setInterval(() => {
    if (state.finished) {
      stopTimer();
      return;
    }
    state.remaining -= 1;
    if (state.remaining <= 0) {
      state.remaining = 0;
      updateTimerDisplay();
      updateScore();
      finishGame(false);
      return;
    }
    updateTimerDisplay();
    updateScore();
  }, 1000);
}

function normalizeRecent() {
  return getRecentPuzzleSignatures();
}

async function generatePuzzle() {
  const settings = normalizeSettings();
  state.preferences = { ...state.preferences, ...settings, sound: state.sound };
  saveCrosswordPreferences(state.preferences);
  applyTypeRules();

  setStatus("Building a fresh crossword...", "info");
  const bank = await loadCrosswordClueBank();
  const recent = normalizeRecent();
  const seed = settings.type === "daily" ? todayKey() : `${Date.now()}-${Math.random()}`;
  const puzzle = await buildCrosswordPuzzle(bank, {
    ...settings,
    seed,
    recentSignatures: settings.type === "daily" ? [] : recent,
  });

  rememberPuzzleSignature(puzzle.signature);
  initializeState(puzzle, settings);
  renderKeyboard();
  renderAll();
  startTimer();
  setStatus(`Loaded a ${TYPE_TITLES[settings.type] || "crossword"} with ${puzzle.placements.length} words.`, "info");
}

function handleBoardClick(event) {
  const button = event.target.closest(".cw-cell");
  if (!button || !DOM.grid.contains(button)) return;
  const row = Number(button.dataset.row);
  const col = Number(button.dataset.col);
  if (Number.isNaN(row) || Number.isNaN(col)) return;
  const sameCell = state.selected && state.selected.row === row && state.selected.col === col;
  const cell = state.puzzle?.cells[row]?.[col];
  if (sameCell && cell && cell.across && cell.down) {
    toggleDirection();
    playTone("tap");
    return;
  }
  setSelection(row, col);
  playTone("tap");
}

function handleClueClick(event) {
  const button = event.target.closest(".cw-clue-item");
  if (!button) return;
  const placementId = button.dataset.placementId;
  if (!placementId) return;
  selectPlacement(placementId);
  playTone("tap");
}

function handleKeyboardClick(event) {
  const button = event.target.closest(".cw-key");
  if (!button) return;
  const letter = button.dataset.letter;
  const key = button.dataset.key;

  if (letter) {
    typeLetter(letter);
    return;
  }
  if (key === "backspace") {
    clearCurrentCell();
    return;
  }
  if (key === "toggle") {
    toggleDirection();
    playTone("tap");
    return;
  }
  if (key === "hint") {
    takeHint();
    return;
  }
  if (key === "check") {
    checkAnswer();
  }
}

function handleDocumentKeydown(event) {
  if (!state.puzzle || state.finished) return;

  if (event.key.length === 1 && /^[a-zA-Z]$/.test(event.key)) {
    event.preventDefault();
    typeLetter(event.key);
    return;
  }

  switch (event.key) {
    case "Backspace":
      event.preventDefault();
      clearCurrentCell();
      break;
    case "ArrowLeft":
      event.preventDefault();
      moveSelectionByDelta(0, -1);
      break;
    case "ArrowRight":
      event.preventDefault();
      moveSelectionByDelta(0, 1);
      break;
    case "ArrowUp":
      event.preventDefault();
      moveSelectionByDelta(-1, 0);
      break;
    case "ArrowDown":
      event.preventDefault();
      moveSelectionByDelta(1, 0);
      break;
    case "Tab":
    case " ":
      event.preventDefault();
      toggleDirection();
      break;
    case "Enter":
      event.preventDefault();
      checkAnswer();
      break;
    default:
      break;
  }
}

function updateSettingsFromUI() {
  applyTypeRules();
  const settings = normalizeSettings();
  state.preferences = { ...state.preferences, ...settings, sound: state.sound };
  saveCrosswordPreferences(state.preferences);
  updateHeroCopy(settings);
}

function initControls() {
  const initialType = state.preferences.type && state.preferences.type !== "mini"
    ? state.preferences.type
    : "themed";
  DOM.type.value = initialType;
  if (initialType === "kids") {
    DOM.difficulty.value = "easy";
    DOM.category.value = "kids";
  } else if (initialType === "vocabulary") {
    DOM.difficulty.value = "medium";
    DOM.category.value = "vocabulary";
  } else if (initialType === "daily") {
    DOM.difficulty.value = state.preferences.difficulty || "easy";
    DOM.category.value = "all";
  } else {
    DOM.difficulty.value = state.preferences.difficulty === "hard" ? "hard" : "medium";
    DOM.category.value = "themed";
  }
  state.sound = state.preferences.sound !== false;
  syncSoundButton();
  applyTypeRules();
  updateSettingsFromUI();

  const goToMode = (mode) => {
    if (mode === "kids") {
      DOM.type.value = "kids";
      DOM.difficulty.value = "easy";
      DOM.category.value = "kids";
    } else {
      DOM.type.value = "themed";
      DOM.difficulty.value = DOM.difficulty.value === "hard" ? "hard" : "medium";
      DOM.category.value = "themed";
    }
    updateSettingsFromUI();
    generatePuzzle().catch((err) => {
      console.error(err);
      setStatus(err.message || "Unable to build a crossword right now.", "warn");
    });
  };

  DOM.modeKids.addEventListener("click", () => goToMode("kids"));
  DOM.modeAdults.addEventListener("click", () => goToMode("adults"));

  DOM.type.addEventListener("change", () => {
    const type = DOM.type.value;
    if (type === "kids") {
      DOM.difficulty.value = "easy";
      DOM.category.value = "kids";
    } else if (type === "vocabulary") {
      DOM.difficulty.value = "medium";
      DOM.category.value = "vocabulary";
    } else if (type === "daily") {
      DOM.category.value = "all";
    }
    updateSettingsFromUI();
  });

  DOM.difficulty.addEventListener("change", updateSettingsFromUI);
  DOM.category.addEventListener("change", updateSettingsFromUI);
  DOM.newPuzzle.addEventListener("click", () => {
    generatePuzzle().catch((err) => {
      console.error(err);
      setStatus(err.message || "Unable to build a crossword right now.", "warn");
    });
  });
  DOM.soundToggle.addEventListener("click", () => {
    state.sound = !state.sound;
    persistPreferences();
    syncSoundButton();
    playTone("tap");
  });
}

function initEventDelegation() {
  DOM.grid.addEventListener("click", handleBoardClick);
  DOM.acrossClues.addEventListener("click", handleClueClick);
  DOM.downClues.addEventListener("click", handleClueClick);
  DOM.keyboard.addEventListener("click", handleKeyboardClick);
  DOM.hint.addEventListener("click", takeHint);
  DOM.check.addEventListener("click", checkAnswer);
  DOM.revealWord.addEventListener("click", revealCurrentWord);
  DOM.revealAll.addEventListener("click", revealAll);
  DOM.restart.addEventListener("click", restartPuzzle);
  DOM.share.addEventListener("click", shareResult);
  DOM.resultClose.addEventListener("click", closeResultModal);
  DOM.modalActions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-modal-action]");
    if (!button) return;
    const action = button.dataset.modalAction;
    if (action === "play-again") {
      closeResultModal();
      restartPuzzle();
    } else if (action === "new-puzzle") {
      closeResultModal();
      DOM.newPuzzle.click();
    } else if (action === "retry") {
      closeResultModal();
      restartPuzzle();
    } else if (action === "hint") {
      closeResultModal();
      takeHint();
    } else if (action === "share") {
      shareResult();
    } else if (action === "try-kids") {
      closeResultModal();
      DOM.modeKids.click();
    } else if (action === "try-adults") {
      closeResultModal();
      DOM.modeAdults.click();
    }
  });
  DOM.resultModal.addEventListener("click", (event) => {
    if (event.target === DOM.resultModal) closeResultModal();
  });
  document.addEventListener("keydown", handleDocumentKeydown);
}

async function boot() {
  DOM.type = $("cwType");
  DOM.difficulty = $("cwDifficulty");
  DOM.category = $("cwCategory");
  DOM.newPuzzle = $("cwNewPuzzle");
  DOM.soundToggle = $("cwSound");
  DOM.heroTimer = $("cwHeroTimer");
  DOM.heroScore = $("cwHeroScore");
  DOM.heroBest = $("cwHeroBest");
  DOM.heroWords = $("cwHeroWords");
  DOM.puzzleTitle = $("cwPuzzleTitle");
  DOM.puzzleMeta = $("cwPuzzleMeta");
  DOM.timer = $("cwTimer");
  DOM.score = $("cwScore");
  DOM.best = $("cwBest");
  DOM.hints = $("cwHints");
  DOM.status = $("cwStatus");
  DOM.currentClue = $("cwCurrentClue");
  DOM.grid = $("cwGrid");
  DOM.keyboard = $("cwKeyboard");
  DOM.acrossClues = $("cwAcrossClues");
  DOM.downClues = $("cwDownClues");
  DOM.hint = $("cwHint");
  DOM.check = $("cwCheck");
  DOM.revealWord = $("cwRevealWord");
  DOM.revealAll = $("cwRevealAll");
  DOM.restart = $("cwRestart");
  DOM.share = $("cwShare");
  DOM.resultModal = $("cwResultModal");
  DOM.resultTitle = $("cwResultTitle");
  DOM.modeKids = $("cwModeKids");
  DOM.modeAdults = $("cwModeAdults");
  DOM.modeNote = $("cwModeNote");
  DOM.modalArt = $("cwModalArt");
  DOM.modalMessage = $("cwModalMessage");
  DOM.resultSummary = $("cwResultSummary");
  DOM.resultMeta = $("cwResultMeta");
  DOM.modalLetters = $("cwModalLetters");
  DOM.modalActions = $("cwModalActions");
  DOM.solvedWords = $("cwSolvedWords");
  DOM.missedWords = $("cwMissedWords");
  DOM.resultClose = $("cwResultClose");

  initControls();
  initEventDelegation();

  try {
    await generatePuzzle();
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Unable to generate a crossword right now.", "warn");
  }
}

document.addEventListener("DOMContentLoaded", boot);
