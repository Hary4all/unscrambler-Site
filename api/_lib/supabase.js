"use strict";

const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = String(
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ""
);
const WORD_INDEX_SOURCE = String(process.env.WORD_INDEX_SOURCE || "db").toLowerCase();

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function buildTableUrl(table, query = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function supabaseRequest(table, options = {}) {
  if (!hasSupabaseConfig()) {
    return {
      ok: false,
      status: 503,
      data: null,
      error: "Supabase is not configured.",
    };
  }

  const method = options.method || "GET";
  const query = options.query || {};
  const body = options.body;
  const headers = Object.assign(
    {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    options.headers || {}
  );

  if (options.prefer) {
    headers.Prefer = options.prefer;
  }

  const res = await fetch(buildTableUrl(table, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = text;
    }
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
    headers: res.headers,
  };
}

async function selectRows(table, options = {}) {
  const query = Object.assign({}, options.query || {});
  query.select = options.columns || "*";
  if (options.order) query.order = options.order;
  if (options.limit !== undefined) query.limit = options.limit;
  if (options.offset !== undefined) query.offset = options.offset;

  const result = await supabaseRequest(table, { query });
  return Array.isArray(result.data) ? result.data : [];
}

async function selectAllRows(table, options = {}) {
  const pageSize = Math.max(1, Math.min(options.pageSize || 1000, 5000));
  const maxRows = options.maxRows || Infinity;
  const rows = [];
  let offset = Number(options.offset || 0);

  while (rows.length < maxRows) {
    const page = await selectRows(table, {
      columns: options.columns || "*",
      order: options.order,
      query: options.query || {},
      limit: pageSize,
      offset,
    });

    if (!page.length) break;
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += page.length;
  }

  return rows.slice(0, maxRows);
}

async function upsertRows(table, rows, options = {}) {
  const payload = Array.isArray(rows) ? rows : [rows];
  return supabaseRequest(table, {
    method: "POST",
    body: payload,
    query: options.query || {},
    prefer: options.prefer || "resolution=merge-duplicates,return=representation",
  });
}

module.exports = {
  SUPABASE_URL,
  SUPABASE_KEY,
  WORD_INDEX_SOURCE,
  hasSupabaseConfig,
  supabaseRequest,
  selectRows,
  selectAllRows,
  upsertRows,
};
