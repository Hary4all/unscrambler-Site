const PREFIX = "wordfindlab:crossword";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {}
}

export function getCrosswordPreferences() {
  const prefs = readJSON(`${PREFIX}:prefs`, {});
  return {
    type: prefs.type || "mini",
    category: prefs.category || "all",
    difficulty: prefs.difficulty || "easy",
    theme: prefs.theme || "classic",
    sound: prefs.sound !== false,
  };
}

export function saveCrosswordPreferences(nextPrefs) {
  const current = getCrosswordPreferences();
  writeJSON(`${PREFIX}:prefs`, {
    ...current,
    ...nextPrefs,
  });
}

export function getBestCrosswordScore() {
  return Number(localStorage.getItem(`${PREFIX}:bestScore`) || 0) || 0;
}

export function setBestCrosswordScore(score) {
  const current = getBestCrosswordScore();
  const next = Math.max(current, Number(score) || 0);
  try {
    localStorage.setItem(`${PREFIX}:bestScore`, String(next));
  } catch (err) {}
  return next;
}

export function getRecentPuzzleSignatures() {
  const list = readJSON(`${PREFIX}:recentSignatures`, []);
  return Array.isArray(list) ? list.slice(0, 10) : [];
}

export function rememberPuzzleSignature(signature) {
  if (!signature) return getRecentPuzzleSignatures();
  const current = getRecentPuzzleSignatures().filter((item) => item !== signature);
  current.unshift(signature);
  const trimmed = current.slice(0, 10);
  writeJSON(`${PREFIX}:recentSignatures`, trimmed);
  return trimmed;
}

export function isRecentPuzzleSignature(signature) {
  return getRecentPuzzleSignatures().includes(signature);
}

export function getDailyCrosswordStatus(dateKey) {
  if (!dateKey) return null;
  return readJSON(`${PREFIX}:daily:${dateKey}`, null);
}

export function setDailyCrosswordStatus(dateKey, payload) {
  if (!dateKey) return;
  writeJSON(`${PREFIX}:daily:${dateKey}`, payload);
}

export function getDailyCrosswordStreak() {
  const prefix = `${PREFIX}:daily:`;
  const completedDates = [];
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(prefix)) continue;
      const value = readJSON(key, null);
      if (value && value.completed) {
        completedDates.push(key.slice(prefix.length));
      }
    }
  } catch (err) {}

  if (!completedDates.length) return 0;

  const completedSet = new Set(completedDates);
  let cursor = new Date(`${completedDates.sort().slice(-1)[0]}T00:00:00Z`);
  if (Number.isNaN(cursor.getTime())) return 0;

  let streak = 0;
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!completedSet.has(key)) break;
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}
