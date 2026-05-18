const CLUE_URL = "/data/crossword-clues.json";

let clueBankPromise = null;

function rngFactory(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleCopy(items, rng) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function uniqueLetters(word) {
  return Array.from(new Set(word.split("")));
}

function wordOverlapScore(word, sharedLetters) {
  let score = 0;
  for (const letter of uniqueLetters(word)) {
    if (sharedLetters.has(letter)) score += 3;
  }
  return score;
}

function chooseRandom(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

function cloneBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function inBounds(size, row, col) {
  return row >= 0 && col >= 0 && row < size && col < size;
}

function keyFor(row, col) {
  return `${row}:${col}`;
}

function normalizeWordEntry(entry, rng) {
  const word = String(entry.word || "").trim().toUpperCase();
  const clues = Array.isArray(entry.clues) ? entry.clues.filter(Boolean) : [];
  if (!word || clues.length === 0) return null;
  return {
    ...entry,
    word,
    clue: chooseRandom(rng, clues),
  };
}

export async function loadCrosswordClueBank() {
  if (!clueBankPromise) {
    clueBankPromise = fetch(CLUE_URL, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Unable to load crossword clues (${res.status})`);
        return res.json();
      })
      .then((list) => Array.isArray(list) ? list : []);
  }
  return clueBankPromise;
}

function filterClues(bank, options) {
  const type = options.type || "mini";
  const category = (options.category || "all").toLowerCase();
  const difficulty = (options.difficulty || "easy").toLowerCase();

  return bank.filter((entry) => {
    if (!entry || entry.approved !== true) return false;
    const word = String(entry.word || "").trim().toUpperCase();
    if (!word || !/^[A-Z]+$/.test(word)) return false;
    if (difficulty !== "all" && String(entry.difficulty || "").toLowerCase() !== difficulty) return false;
    if (category !== "all" && String(entry.category || "").toLowerCase() !== category) return false;

    if (type === "kids") return String(entry.category || "").toLowerCase() === "kids";
    if (type === "vocabulary") return String(entry.category || "").toLowerCase() === "vocabulary";
    if (type === "daily") return true;
    if (type === "themed") return category !== "all";
    return true;
  });
}

function targetConfig(type, difficulty) {
  const normalizedDifficulty = (difficulty || "easy").toLowerCase();
  if (type === "daily") {
    if (normalizedDifficulty === "hard") return { size: 11, min: 10, max: 14, time: 600 };
    if (normalizedDifficulty === "medium") return { size: 9, min: 7, max: 10, time: 420 };
    return { size: 7, min: 4, max: 6, time: 300 };
  }
  if (normalizedDifficulty === "hard") return { size: 11, min: 10, max: 14, time: 600 };
  if (normalizedDifficulty === "medium") return { size: 9, min: 7, max: 10, time: 420 };
  return { size: 7, min: 4, max: 6, time: 300 };
}

function pickWordSet(pool, targetCount, rng) {
  const sorted = pool.slice().sort((a, b) => {
    const scoreDiff = b.word.length - a.word.length;
    if (scoreDiff) return scoreDiff;
    return a.word.localeCompare(b.word);
  });

  if (sorted.length < targetCount) return null;

  const seedCandidates = sorted.slice(0, Math.min(sorted.length, 12));
  const seedEntry = chooseRandom(rng, seedCandidates);
  const selected = [seedEntry];
  const used = new Set([seedEntry.word]);
  const shared = new Set(uniqueLetters(seedEntry.word));

  while (selected.length < targetCount) {
    const ranked = sorted
      .filter((entry) => !used.has(entry.word))
      .map((entry) => {
        const overlap = wordOverlapScore(entry.word, shared);
        const score = overlap * 12 + Math.min(8, entry.word.length) + (entry.category === seedEntry.category ? 2 : 0);
        return { entry, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.entry.word.length - a.entry.word.length);

    if (!ranked.length) break;

    const topSlice = ranked.slice(0, Math.min(8, ranked.length));
    const chosen = chooseRandom(rng, topSlice).entry;
    selected.push(chosen);
    used.add(chosen.word);
    uniqueLetters(chosen.word).forEach((letter) => shared.add(letter));
  }

  if (selected.length < targetCount) return null;
  return selected;
}

function placeWordOnBoard(board, placement, size, placements) {
  const { word, row, col, direction } = placement;
  for (let i = 0; i < word.length; i++) {
    const r = row + (direction === "down" ? i : 0);
    const c = col + (direction === "across" ? i : 0);
    if (!inBounds(size, r, c)) return false;
    const existing = board[r][c];
    if (existing && existing.letter !== word[i]) return false;
  }

  for (let i = 0; i < word.length; i++) {
    const r = row + (direction === "down" ? i : 0);
    const c = col + (direction === "across" ? i : 0);
    const existing = board[r][c];
    if (!existing) {
      board[r][c] = {
        letter: word[i],
        placements: [],
      };
    }
    board[r][c].placements.push(placement.id);
  }

  placements.push(placement);
  return true;
}

function canFitWord(board, word, row, col, direction, size, requireCrossing) {
  let crossings = 0;

  for (let i = 0; i < word.length; i++) {
    const r = row + (direction === "down" ? i : 0);
    const c = col + (direction === "across" ? i : 0);
    if (!inBounds(size, r, c)) return null;
    const existing = board[r][c];
    if (existing) {
      if (existing.letter !== word[i]) return null;
      crossings++;
    }
  }

  if (requireCrossing && crossings === 0) return null;
  return crossings;
}

function findPlacementsForWord(board, word, placements, size) {
  const candidates = [];
  if (!placements.length) {
    const row = Math.floor(size / 2);
    const col = Math.max(0, Math.floor((size - word.length) / 2));
    if (col + word.length <= size) {
      candidates.push({
        row,
        col,
        direction: "across",
        crossings: 0,
        centerDistance: Math.abs(row - Math.floor(size / 2)) + Math.abs(col - Math.floor(size / 2)),
      });
    }
    if (word.length <= size) {
      const downRow = Math.max(0, Math.floor((size - word.length) / 2));
      candidates.push({
        row: downRow,
        col: Math.floor(size / 2),
        direction: "down",
        crossings: 0,
        centerDistance: Math.abs(downRow - Math.floor(size / 2)),
      });
    }
    return candidates;
  }

  placements.forEach((placement) => {
    for (let i = 0; i < word.length; i++) {
      const matchLetter = word[i];
      for (let j = 0; j < placement.word.length; j++) {
        if (placement.word[j] !== matchLetter) continue;
        const direction = placement.direction === "across" ? "down" : "across";
        const row = placement.row + (placement.direction === "down" ? j : 0) - (direction === "down" ? i : 0);
        const col = placement.col + (placement.direction === "across" ? j : 0) - (direction === "across" ? i : 0);
        const crossings = canFitWord(board, word, row, col, direction, size, true);
        if (crossings !== null && crossings > 0) {
          candidates.push({
            row,
            col,
            direction,
            crossings,
            centerDistance: Math.abs(row - Math.floor(size / 2)) + Math.abs(col - Math.floor(size / 2)),
          });
        }
      }
    }
  });

  candidates.sort((a, b) => {
    if (b.crossings !== a.crossings) return b.crossings - a.crossings;
    if (a.centerDistance !== b.centerDistance) return a.centerDistance - b.centerDistance;
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  return candidates;
}

function createEmptyPuzzle(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null));
}

function assignNumbers(placements) {
  const startMap = new Map();
  const sorted = placements.slice().sort((a, b) => a.row - b.row || a.col - b.col || a.direction.localeCompare(b.direction));
  let number = 1;

  for (const placement of sorted) {
    const key = keyFor(placement.row, placement.col);
    if (!startMap.has(key)) {
      startMap.set(key, number++);
    }
    placement.number = startMap.get(key);
  }

  return startMap;
}

function createCellMatrix(size, placements) {
  const cells = Array.from({ length: size }, () => Array.from({ length: size }, () => ({
    block: true,
    letter: "",
    across: null,
    down: null,
    number: null,
  })));

  placements.forEach((placement) => {
    for (let i = 0; i < placement.word.length; i++) {
      const row = placement.row + (placement.direction === "down" ? i : 0);
      const col = placement.col + (placement.direction === "across" ? i : 0);
      const cell = cells[row][col];
      cell.block = false;
      cell.letter = placement.word[i];
      if (placement.direction === "across") cell.across = placement.id;
      if (placement.direction === "down") cell.down = placement.id;
      if (i === 0) cell.number = placement.number;
    }
  });

  return cells;
}

function resolveSelectedCategory(category, type) {
  if (type === "kids") return "kids";
  if (type === "vocabulary") return "vocabulary";
  if (type === "daily") return "all";
  if (type === "themed") return category && category !== "all" ? category : "themed";
  return category || "all";
}

function getDateSeed() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

function buildSignature(words) {
  return words.map((item) => item.word).slice().sort().join("|");
}

function layoutForDifficulty(difficulty) {
  const value = (difficulty || "easy").toLowerCase();
  if (value === "hard") return { size: 11, min: 10, max: 14, time: 600 };
  if (value === "medium") return { size: 9, min: 7, max: 10, time: 420 };
  return { size: 7, min: 4, max: 6, time: 300 };
}

function tryBuildSinglePuzzle(selectedWords, size, rng) {
  const board = createEmptyPuzzle(size);
  const placements = [];
  const sortedWords = selectedWords.slice().sort((a, b) => b.word.length - a.word.length || a.word.localeCompare(b.word));

  const first = sortedWords.shift();
  if (!first || first.word.length > size) return null;

  const firstPlacement = {
    id: `p0`,
    word: first.word,
    clue: first.clue,
    category: first.category,
    difficulty: first.difficulty,
    row: Math.floor(size / 2),
    col: Math.max(0, Math.floor((size - first.word.length) / 2)),
    direction: "across",
    completed: false,
  };
  if (!placeWordOnBoard(board, firstPlacement, size, placements)) return null;

  for (let index = 0; index < sortedWords.length; index++) {
    const entry = sortedWords[index];
    if (entry.word.length > size) return null;
    const candidates = findPlacementsForWord(board, entry.word, placements, size);
    if (!candidates.length) return null;
    const pick = candidates.slice(0, Math.min(8, candidates.length));
    const chosen = chooseRandom(rng, pick);
    const placement = {
      id: `p${index + 1}`,
      word: entry.word,
      clue: entry.clue,
      category: entry.category,
      difficulty: entry.difficulty,
      row: chosen.row,
      col: chosen.col,
      direction: chosen.direction,
      completed: false,
    };
    if (!placeWordOnBoard(board, placement, size, placements)) return null;
  }

  assignNumbers(placements);
  const cells = createCellMatrix(size, placements);
  const signature = buildSignature(selectedWords);
  const clues = placements.slice().sort((a, b) => a.number - b.number);
  const across = clues.filter((item) => item.direction === "across");
  const down = clues.filter((item) => item.direction === "down");

  return {
    size,
    cells,
    placements,
    across,
    down,
    signature,
  };
}

export async function buildCrosswordPuzzle(bank, options = {}) {
  const type = options.type || "mini";
  const difficulty = options.difficulty || "easy";
  const category = resolveSelectedCategory(options.category || "all", type);
  const layout = layoutForDifficulty(difficulty);
  const seed = options.seed ? hashString(String(options.seed)) : hashString(`${getDateSeed()}|${type}|${difficulty}|${category}|${Math.random()}`);
  const rng = rngFactory(seed);
  const recent = new Set(Array.isArray(options.recentSignatures) ? options.recentSignatures : []);

  function attemptLayout(layoutInfo, minWords, maxWords, targetWordCount, allowRecent = true) {
    let pool = filterClues(bank, { type, category, difficulty });
    if (pool.length < minWords) {
      pool = filterClues(bank, { type, category: "all", difficulty });
    }
    if (pool.length < minWords) {
      pool = bank.filter((entry) => entry && entry.approved === true).map((entry) => normalizeWordEntry(entry, rng)).filter(Boolean);
    }

    pool = pool
      .map((entry) => normalizeWordEntry(entry, rng))
      .filter(Boolean)
      .filter((entry) => entry.word.length <= layoutInfo.size);

    if (pool.length < minWords) {
      return null;
    }

    const maxAttempts = options.maxAttempts || 60;
    const finalTarget = Math.max(minWords, Math.min(maxWords, targetWordCount || maxWords));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const shuffled = shuffleCopy(pool, rng);
      const selected = pickWordSet(shuffled, finalTarget, rng);
      if (!selected || selected.length < minWords) continue;

      const puzzle = tryBuildSinglePuzzle(selected, layoutInfo.size, rng);
      if (!puzzle) continue;
      if (allowRecent && type !== "daily" && recent.has(puzzle.signature)) continue;

      const clueChoices = new Map();
      selected.forEach((entry) => clueChoices.set(entry.word, entry.clue));

      const placements = puzzle.placements.map((placement) => ({
        ...placement,
        clue: clueChoices.get(placement.word) || placement.clue,
      }));
      const across = placements.filter((item) => item.direction === "across");
      const down = placements.filter((item) => item.direction === "down");

      return {
        type,
        category,
        difficulty,
        size: puzzle.size,
        timeLimit: layoutInfo.time,
        cells: puzzle.cells,
        placements,
        across,
        down,
        signature: puzzle.signature,
        wordCount: placements.length,
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  }

  const minWords = options.minWords || layout.min;
  const maxWords = options.maxWords || layout.max;
  const targetCount = Math.max(minWords, Math.min(maxWords, options.wordCount || maxWords));

  const primary = attemptLayout(layout, minWords, maxWords, targetCount, true);
  if (primary) return primary;

  const fallbackMin = 4;
  const fallbackMax = Math.max(4, Math.min(6, layout.max));
  if (type !== "kids" && fallbackMax >= fallbackMin) {
    const fallbackLayout = { ...layout, min: fallbackMin, max: fallbackMax };
    const fallback = attemptLayout(fallbackLayout, fallbackMin, fallbackMax, fallbackMax, true);
    if (fallback) return fallback;
  }

  throw new Error("Could not generate a crossword puzzle. Try a different filter.");
}
