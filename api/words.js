"use strict";

const { WORD_INDEX_SOURCE, hasSupabaseConfig, selectRows, selectAllRows } = require("./_lib/supabase");
const { fetchTextFromSources } = require("./_lib/http");

const WORD_SOURCES = {
  all: [
    "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt",
    "https://cdn.jsdelivr.net/gh/dwyl/english-words/words_alpha.txt",
    "https://cdn.jsdelivr.net/gh/dwyl/english-words@master/words_alpha.txt",
  ],
  common: [
    "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt",
    "https://cdn.jsdelivr.net/gh/first20hours/google-10000-english/google-10000-english-usa-no-swears.txt",
    "https://cdn.jsdelivr.net/gh/first20hours/google-10000-english@master/google-10000-english-usa-no-swears.txt",
  ],
};

function parseBool(value) {
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "db"].includes(value.toLowerCase());
}

async function fetchWordsFromDb(setName, limit) {
  if (!hasSupabaseConfig()) return null;
  const isCommon = setName === "common";
  const maxRows = Number.isFinite(limit) && limit > 0 ? limit : 1000000;
  const rows = await selectAllRows("words", {
    columns: "word,word_lower,is_common",
    query: isCommon ? { is_common: "eq.true" } : {},
    order: "word.asc",
    pageSize: 2000,
    maxRows,
  });

  if (!rows.length) return null;

  return rows
    .map((row) => row.word || row.word_lower || "")
    .filter(Boolean)
    .join("\n");
}

module.exports = async function wordsHandler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const setName = String(req.query.set || "all").toLowerCase() === "common" ? "common" : "all";
  const format = String(req.query.format || "text").toLowerCase();
  const wantsDb = parseBool(String(req.query.source || WORD_INDEX_SOURCE || ""));

  let raw = null;

  if (wantsDb) {
    raw = await fetchWordsFromDb(setName, Number(req.query.limit || 0)).catch(() => null);
  }

  if (!raw) {
    raw = await fetchTextFromSources(WORD_SOURCES[setName], {
      timeoutMs: 15000,
      minLength: 100,
    });
  }

  if (!raw) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("");
    return;
  }

  if (format === "json") {
    const words = raw.split(/\r?\n/).map((word) => word.trim()).filter(Boolean);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.end(JSON.stringify({ set: setName, count: words.length, words }));
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  res.end(raw);
};
