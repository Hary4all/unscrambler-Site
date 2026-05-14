"use strict";

const { getDictionaryEntry, normalizeWord } = require("./_lib/dictionary");

module.exports = async function dictionaryHandler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const rawWord = req.query.word || req.query.q || req.query.term || "";
  const word = normalizeWord(Array.isArray(rawWord) ? rawWord[0] : rawWord);

  if (!word) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Missing word parameter." }));
    return;
  }

  const entry = await getDictionaryEntry(word);

  if (!entry) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "No dictionary entry found for this word." }));
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  res.end(JSON.stringify(entry));
};
