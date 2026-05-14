"use strict";

const { hasSupabaseConfig, selectRows } = require("./_lib/supabase");
const { fetchTextFromSources } = require("./_lib/http");

const FALLBACK_COMMON_WORDS_URLS = [
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt",
  "https://cdn.jsdelivr.net/gh/first20hours/google-10000-english/google-10000-english-usa-no-swears.txt",
  "https://cdn.jsdelivr.net/gh/first20hours/google-10000-english@master/google-10000-english-usa-no-swears.txt",
];

async function fetchCommonWordsFromDb() {
  if (!hasSupabaseConfig()) return null;
  const rows = await selectRows("words", {
    columns: "word,word_lower,is_common",
    query: {
      is_common: "eq.true",
    },
    order: "word.asc",
    limit: 2000,
  });
  if (!rows.length) return null;
  return rows
    .map((row) => row.word || row.word_lower || "")
    .filter(Boolean)
    .join("\n");
}

module.exports = async function meaningfulWordsHandler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const dbWords = await fetchCommonWordsFromDb().catch(() => null);
  const raw = dbWords || await fetchTextFromSources(FALLBACK_COMMON_WORDS_URLS, {
    timeoutMs: 12000,
    minLength: 100,
  });

  if (!raw) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("");
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  res.end(raw);
};
