"use strict";

const { hasSupabaseConfig, WORD_INDEX_SOURCE } = require("./_lib/supabase");

module.exports = async function healthHandler(req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({
    ok: true,
    dbConfigured: hasSupabaseConfig(),
    wordIndexSource: WORD_INDEX_SOURCE || "proxy",
    timestamp: new Date().toISOString(),
  }));
};
