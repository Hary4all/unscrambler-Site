"use strict";

const { hasSupabaseConfig, selectRows } = require("./_lib/supabase");
const { getDictionaryEntry } = require("./_lib/dictionary");

const FALLBACK_WOTD_LIST = [
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

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
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

async function loadDatabaseWordOfTheDay() {
  if (!hasSupabaseConfig()) return null;
  const rows = await selectRows("wotd_words", {
    columns: "day_slot,word,word_lower,active",
    query: {
      active: "eq.true",
    },
    order: "day_slot.asc",
    limit: 400,
  });

  if (!rows.length) return null;
  const index = getDayOfYear(new Date()) % rows.length;
  return rows[index] && (rows[index].word || rows[index].word_lower) || null;
}

async function buildWordOfTheDayPayload(word, source) {
  const entry = await getDictionaryEntry(word);
  const date = formatWordOfTheDayDate();
  return {
    word: entry?.word || word,
    phonetic: entry?.phonetic || "",
    primaryPartOfSpeech: entry?.primaryPartOfSpeech || "",
    primaryDefinition: entry?.primaryDefinition || "",
    primaryExample: entry?.primaryExample || "",
    meanings: entry?.meanings || [],
    synonyms: entry?.synonyms || [],
    antonyms: entry?.antonyms || [],
    dateLabel: `Word of the Day — ${date}`,
    source,
  };
}

module.exports = async function wotdHandler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const dbWord = await loadDatabaseWordOfTheDay().catch(() => null);
  const fallbackWord = FALLBACK_WOTD_LIST[getDayOfYear(new Date()) % FALLBACK_WOTD_LIST.length];
  const word = dbWord || fallbackWord;
  const source = dbWord ? "db" : "fallback";
  const payload = await buildWordOfTheDayPayload(word, source);

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.end(JSON.stringify(payload));
};
