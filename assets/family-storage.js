const FAMILY_STORAGE_PREFIX = "wordfindlab:family:";
const FAMILY_SIGNATURE_KEY = FAMILY_STORAGE_PREFIX + "recent-signatures";
const FAMILY_BEST_KEY = FAMILY_STORAGE_PREFIX + "best-score";
const FAMILY_PREFS_KEY = FAMILY_STORAGE_PREFIX + "prefs";

function getJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function setJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {}
}

function getFamilyPreferences() {
  return getJSON(FAMILY_PREFS_KEY, {
    mode: "kids",
    category: "animals",
    difficulty: "easy",
    timer: true,
    sound: false,
  });
}

function saveFamilyPreferences(prefs) {
  setJSON(FAMILY_PREFS_KEY, {
    ...getFamilyPreferences(),
    ...prefs,
  });
}

function getBestScore() {
  return Number(getJSON(FAMILY_BEST_KEY, 0)) || 0;
}

function setBestScore(score) {
  const next = Math.max(getBestScore(), Number(score) || 0);
  setJSON(FAMILY_BEST_KEY, next);
  return next;
}

function getRecentSignatures() {
  const list = getJSON(FAMILY_SIGNATURE_KEY, []);
  return Array.isArray(list) ? list : [];
}

function rememberSignature(signature) {
  if (!signature) return;
  const recent = getRecentSignatures().filter((item) => item !== signature);
  recent.unshift(signature);
  setJSON(FAMILY_SIGNATURE_KEY, recent.slice(0, 10));
}

const WFLFamilyStorage = {
  getJSON,
  setJSON,
  getFamilyPreferences,
  saveFamilyPreferences,
  getBestScore,
  setBestScore,
  getRecentSignatures,
  rememberSignature,
};

export {
  getJSON,
  setJSON,
  getFamilyPreferences,
  saveFamilyPreferences,
  getBestScore,
  setBestScore,
  getRecentSignatures,
  rememberSignature,
};

window.WFLFamilyStorage = WFLFamilyStorage;
