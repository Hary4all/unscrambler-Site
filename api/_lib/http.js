"use strict";

async function fetchText(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTextFromSources(urls, options = {}) {
  const list = Array.isArray(urls) ? urls : [];
  const timeoutMs = options.timeoutMs || 8000;
  const minLength = options.minLength || 100;

  for (const url of list) {
    const raw = await fetchText(url, timeoutMs);
    if (raw && raw.length >= minLength) return raw;
  }

  return null;
}

module.exports = {
  fetchText,
  fetchJson,
  fetchTextFromSources,
};
