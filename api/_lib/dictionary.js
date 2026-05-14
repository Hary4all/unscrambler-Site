"use strict";

const { hasSupabaseConfig, selectRows, upsertRows } = require("./supabase");

const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/";

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

function normalizeEntry(entry) {
  const phonetics = Array.isArray(entry && entry.phonetics) ? entry.phonetics : [];
  const meanings = Array.isArray(entry && entry.meanings) ? entry.meanings : [];
  const primaryMeaning = meanings.find((meaning) => Array.isArray(meaning.definitions) && meaning.definitions.length) || meanings[0] || {};
  const primaryDefinition = Array.isArray(primaryMeaning.definitions) && primaryMeaning.definitions.length
    ? primaryMeaning.definitions[0]
    : {};

  const definitionGroups = meanings.slice(0, 3).map((meaning) => {
    const defs = Array.isArray(meaning.definitions) ? meaning.definitions.slice(0, 3) : [];
    return {
      partOfSpeech: meaning.partOfSpeech || "",
      definitions: defs.map((def) => ({
        definition: def.definition || "",
        example: def.example || "",
      })),
    };
  });

  const synonyms = uniqueList(
    meanings.flatMap((meaning) => Array.isArray(meaning.synonyms) ? meaning.synonyms : [])
  ).slice(0, 4);

  const antonyms = uniqueList(
    meanings.flatMap((meaning) => Array.isArray(meaning.antonyms) ? meaning.antonyms : [])
  ).slice(0, 4);

  const phonetic = phonetics.find((item) => item && item.text && String(item.text).trim())?.text || entry.phonetic || "";

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

function rowToEntry(row) {
  if (!row) return null;
  return {
    word: row.word || row.word_lower || "",
    phonetic: row.phonetic || "",
    primaryPartOfSpeech: row.primary_part_of_speech || "",
    primaryDefinition: row.primary_definition || "",
    primaryExample: row.primary_example || "",
    meanings: Array.isArray(row.meanings) ? row.meanings : [],
    synonyms: Array.isArray(row.synonyms) ? row.synonyms : [],
    antonyms: Array.isArray(row.antonyms) ? row.antonyms : [],
    raw: row.raw || {},
  };
}

async function getCachedEntry(word) {
  if (!hasSupabaseConfig()) return null;
  const rows = await selectRows("dictionary_cache", {
    columns: "word,word_lower,phonetic,primary_part_of_speech,primary_definition,primary_example,meanings,synonyms,antonyms,raw",
    query: {
      word_lower: `eq.${word}`,
    },
    limit: 1,
  });
  return rows.length ? rowToEntry(rows[0]) : null;
}

async function storeCachedEntry(entry) {
  if (!hasSupabaseConfig() || !entry) return;
  const payload = {
    word_lower: normalizeWord(entry.word),
    word: entry.word || normalizeWord(entry.word),
    phonetic: entry.phonetic || "",
    primary_part_of_speech: entry.primaryPartOfSpeech || "",
    primary_definition: entry.primaryDefinition || "",
    primary_example: entry.primaryExample || "",
    meanings: entry.meanings || [],
    synonyms: entry.synonyms || [],
    antonyms: entry.antonyms || [],
    raw: entry.raw || {},
    updated_at: new Date().toISOString(),
  };

  await upsertRows("dictionary_cache", [payload], {
    query: { on_conflict: "word_lower" },
  });
}

async function fetchExternalEntry(word) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(DICTIONARY_API + encodeURIComponent(word), {
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    return entry ? normalizeEntry(entry) : null;
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getDictionaryEntry(word) {
  const normalized = normalizeWord(word);
  if (!normalized) return null;

  const cached = await getCachedEntry(normalized);
  if (cached) return cached;

  const external = await fetchExternalEntry(normalized);
  if (!external) return null;

  if (hasSupabaseConfig()) {
    storeCachedEntry(external).catch(() => {});
  }

  return external;
}

module.exports = {
  DICTIONARY_API,
  normalizeWord,
  normalizeEntry,
  getDictionaryEntry,
  getCachedEntry,
  storeCachedEntry,
};
