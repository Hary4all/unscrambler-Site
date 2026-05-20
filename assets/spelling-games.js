import { FACEBOOK_PAGE_URL, copyLink, openFacebookShare, wireShareGroup } from "/assets/family-social.js";
import { getFamilyPreferences, saveFamilyPreferences, getBestScore, setBestScore } from "/assets/family-storage.js";

const DATA_URL = "/data/family-word-games.json?v=20260519";

const MODE_META = {
  beginner: {
    title: "Little Learner",
    copy: "Simple clues, gentle encouragement, and quick wins.",
    rounds: 6,
  },
  easy: {
    title: "Word Explorer",
    copy: "Playful spelling practice with friendly hints.",
    rounds: 7,
  },
  challenge: {
    title: "Spelling Star",
    copy: "A bigger brain workout with stronger clues.",
    rounds: 8,
  },
};

const CATEGORY_LABELS = {
  all: "All Categories",
  animals: "Animals",
  food: "Food",
  school: "School",
  nature: "Nature",
  family: "Family",
  colors: "Colors",
  space: "Space",
};

const state = {
  data: null,
  queue: [],
  index: 0,
  score: 0,
  best: getBestScore(),
  streak: 0,
  hints: 0,
  finished: false,
  settings: {
    category: "all",
    difficulty: "beginner",
  },
};

const els = {};

function $(id) { return document.getElementById(id); }
function shuffle(items) { return [...items].sort(() => Math.random() - 0.5); }

async function loadData() {
  if (state.data) return state.data;
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Unable to load spelling game data");
  state.data = await res.json();
  return state.data;
}

function filteredItems() {
  const pool = (state.data?.spelling || []).filter((item) => {
    if (state.settings.category !== "all" && item.category !== state.settings.category) return false;
    if (state.settings.difficulty !== "all" && item.difficulty !== state.settings.difficulty) return false;
    return true;
  });
  return shuffle(pool);
}

function createQueue() {
  const meta = MODE_META[state.settings.difficulty] || MODE_META.beginner;
  const pool = filteredItems();
  const queue = pool.slice(0, Math.min(meta.rounds, pool.length || meta.rounds));
  if (!queue.length && pool.length) queue.push(...pool.slice(0, meta.rounds));
  return queue;
}

function updateTopBar() {
  els.modeTitle.textContent = MODE_META[state.settings.difficulty]?.title || "Beginner";
  els.modeCopy.textContent = MODE_META[state.settings.difficulty]?.copy || "Friendly spelling fun.";
  els.categoryLabel.textContent = CATEGORY_LABELS[state.settings.category] || "All Categories";
  els.scoreText.textContent = String(state.score);
  els.bestText.textContent = String(state.best);
  els.streakText.textContent = String(state.streak);
  els.progressText.textContent = `${Math.min(state.index + 1, state.queue.length)}/${state.queue.length || 0}`;
}

function currentItem() {
  return state.queue[state.index];
}

function renderItem() {
  const item = currentItem();
  if (!item) return;
  els.emoji.textContent = item.emoji || "✨";
  els.clue.textContent = item.clue;
  els.answer.value = "";
  els.feedback.textContent = state.settings.difficulty === "challenge"
    ? "Take your time and type the spelling."
    : "Type the word that matches the clue.";
  els.input.focus();
  updateTopBar();
}

function showFeedback(message, good = true) {
  els.feedback.textContent = message;
  els.feedback.classList.toggle("is-good", good);
  els.feedback.classList.toggle("is-bad", !good);
}

function correctAnswer() {
  const item = currentItem();
  if (!item) return;
  state.score += 10 + item.word.length * 5;
  state.streak += 1;
  state.best = setBestScore(state.score);
  els.currentWord.classList.add("is-correct");
  showFeedback(
    state.settings.difficulty === "beginner"
      ? "Yay! Great job!"
      : state.settings.difficulty === "challenge"
        ? "Spelling Star!"
        : "Great spelling!",
    true
  );
  updateTopBar();
  window.setTimeout(() => {
    els.currentWord.classList.remove("is-correct");
    nextRound(true);
  }, 900);
}

function wrongAnswer() {
  state.streak = 0;
  state.score = Math.max(0, state.score - 5);
  els.currentWord.classList.add("is-wrong");
  showFeedback("Almost there — try again!", false);
  updateTopBar();
  window.setTimeout(() => els.currentWord.classList.remove("is-wrong"), 320);
}

function nextRound(autoCorrect = false) {
  const item = currentItem();
  if (autoCorrect && item) {
    els.solvedList.insertAdjacentHTML("beforeend", `<span class="family-word-pill is-found">${item.word}</span>`);
  }
  state.index += 1;
  if (state.index >= state.queue.length) {
    finishGame();
    return;
  }
  renderItem();
}

function finishGame() {
  state.finished = true;
  state.best = setBestScore(state.score);
  updateTopBar();
  els.modalTitle.textContent = state.settings.difficulty === "challenge" ? "Spelling Star!" : "Amazing!";
  els.modalMessage.textContent = "You finished the spelling adventure!";
  els.modalEmoji.textContent = "🌟";
  els.modalScore.textContent = String(state.score);
  els.modalStreak.textContent = String(state.streak);
  els.modalBest.textContent = String(state.best);
  els.modalFacebook.href = FACEBOOK_PAGE_URL;
  els.modalFacebook.target = "_blank";
  els.modalFacebook.rel = "noopener noreferrer";
  els.modalShare.dataset.facebookShare = window.location.href;
  els.modalCopy.dataset.copyLink = window.location.href;
  els.modal.classList.add("is-open");
  els.modal.hidden = false;
}

function resetGame() {
  state.finished = false;
  state.score = 0;
  state.streak = 0;
  state.hints = 0;
  state.index = 0;
  state.queue = createQueue();
  els.solvedList.innerHTML = "";
  updateTopBar();
  if (!state.queue.length) {
    els.feedback.textContent = "No spelling cards match this filter yet. Try All Categories.";
    return;
  }
  renderItem();
}

function applyMode(mode) {
  state.settings.difficulty = mode;
  saveFamilyPreferences({ spellingMode: mode });
  syncModeBody();
  resetGame();
}

function applyCategory(category) {
  state.settings.category = category;
  saveFamilyPreferences({ spellingCategory: category });
  resetGame();
}

function syncModeBody() {
  document.body.classList.toggle("spelling-beginner", state.settings.difficulty === "beginner");
  document.body.classList.toggle("spelling-easy", state.settings.difficulty === "easy");
  document.body.classList.toggle("spelling-challenge", state.settings.difficulty === "challenge");
}

function giveHint() {
  const item = currentItem();
  if (!item) return;
  const prefix = item.word.slice(0, 1);
  els.answer.value = prefix;
  state.hints += 1;
  state.score = Math.max(0, state.score - 10);
  showFeedback(`Hint: it starts with ${prefix}.`, true);
  updateTopBar();
  els.input.focus();
}

function checkAnswer() {
  if (state.finished) return;
  const item = currentItem();
  if (!item) return;
  const value = (els.answer.value || "").trim().toUpperCase();
  if (value === item.word) {
    correctAnswer();
  } else {
    wrongAnswer();
  }
}

function wireButtons() {
  els.modeButtons.forEach((button) => {
    button.addEventListener("click", () => applyMode(button.dataset.mode));
  });
  els.categoryButtons.forEach((button) => {
    button.addEventListener("click", () => applyCategory(button.dataset.category));
  });
  els.check.addEventListener("click", checkAnswer);
  els.hint.addEventListener("click", giveHint);
  els.next.addEventListener("click", () => nextRound(false));
  els.playAgain.addEventListener("click", () => {
    els.modal.hidden = true;
    els.modal.classList.remove("is-open");
    resetGame();
  });
  els.modalPlayAgain.addEventListener("click", () => {
    els.modal.hidden = true;
    els.modal.classList.remove("is-open");
    resetGame();
  });
  els.modalClose.addEventListener("click", () => {
    els.modal.hidden = true;
    els.modal.classList.remove("is-open");
  });
  els.shareFacebook.addEventListener("click", () => openFacebookShare(window.location.href, document.title));
  els.copyLink.addEventListener("click", async () => {
    const ok = await copyLink(window.location.href);
    els.copyLink.textContent = ok ? "Copied!" : "Copy failed";
    window.setTimeout(() => { els.copyLink.textContent = "Copy Link"; }, 1200);
  });
}

function wireInput() {
  els.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkAnswer();
    }
  });
}

async function init() {
  await loadData();
  els.modeTitle = $("spellingModeTitle");
  els.modeCopy = $("spellingModeCopy");
  els.categoryLabel = $("spellingCategoryLabel");
  els.scoreText = $("spellingScore");
  els.bestText = $("spellingBest");
  els.streakText = $("spellingStreak");
  els.progressText = $("spellingProgress");
  els.emoji = $("spellingEmoji");
  els.clue = $("spellingClue");
  els.answer = $("spellingAnswer");
  els.input = els.answer;
  els.feedback = $("spellingFeedback");
  els.currentWord = $("spellingCurrentWord");
  els.check = $("spellingCheck");
  els.hint = $("spellingHint");
  els.next = $("spellingNext");
  els.playAgain = $("spellingPlayAgain");
  els.shareFacebook = $("spellingShareFacebook");
  els.copyLink = $("spellingCopyLink");
  els.modal = $("spellingModal");
  els.modalClose = $("spellingModalClose");
  els.modalTitle = $("spellingModalTitle");
  els.modalMessage = $("spellingModalMessage");
  els.modalEmoji = $("spellingModalEmoji");
  els.modalScore = $("spellingModalScore");
  els.modalStreak = $("spellingModalStreak");
  els.modalBest = $("spellingModalBest");
  els.modalFacebook = $("spellingModalFacebook");
  els.modalShare = $("spellingModalShare");
  els.modalCopy = $("spellingModalCopy");
  els.modalPlayAgain = $("spellingModalPlayAgain");
  els.solvedList = $("spellingSolvedList");
  els.modeButtons = Array.from(document.querySelectorAll("[data-spelling-mode]"));
  els.categoryButtons = Array.from(document.querySelectorAll("[data-spelling-category]"));

  const prefs = getFamilyPreferences();
  if (prefs.spellingMode) state.settings.difficulty = prefs.spellingMode;
  if (prefs.spellingCategory) state.settings.category = prefs.spellingCategory;
  syncModeBody();
  els.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.spellingMode === state.settings.difficulty);
  });
  els.categoryButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.spellingCategory === state.settings.category);
  });

  wireButtons();
  wireInput();
  wireShareGroup(document);
  resetGame();
}

window.addEventListener("DOMContentLoaded", init);


