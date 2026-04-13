/**
 * useTranslate.js
 * ─────────────────────────────────────────────────────────────────────────────
 * React hook + utility that proxies all translation through the backend
 * /api/translate endpoint (which in turn uses Google Translate or MyMemory).
 *
 * Features
 *  • Per-session in-memory cache — same string is never re-fetched
 *  • Graceful fallback — always returns the original text on any error
 *  • translateOne(text)  — async single-string translate
 *  • translateBatch(arr) — async translate up to 50 strings at once
 *  • useTranslatedText(text, lang) — React hook that keeps a translated
 *    string in state and refreshes when the text or lang changes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

// ── Module-level session cache ───────────────────────────────────────────────
const _cache = new Map(); // "text||target" → translatedText

function cacheKey(text, target) {
  return `${text}||${target}`;
}

// ── Core single translate ─────────────────────────────────────────────────────
/**
 * Translate a single string.
 * @param {string} text   – source text (assumed English)
 * @param {string} target – BCP-47 language code, default "hi"
 * @returns {Promise<string>} translated text, or original on failure
 */
export async function translateOne(text, target = "hi") {
  if (!text || !text.trim()) return text;

  const key = cacheKey(text.trim(), target);
  if (_cache.has(key)) return _cache.get(key);

  try {
    const res = await axios.get(`${API}/api/translate`, {
      params: { text: text.trim(), target },
      timeout: 5000,
    });
    const translated = res.data?.translatedText ?? text;
    _cache.set(key, translated);
    return translated;
  } catch {
    // Fallback: return original text so the UI never breaks
    return text;
  }
}

// ── Batch translate ───────────────────────────────────────────────────────────
/**
 * Translate an array of strings in one API round-trip.
 * Returns an array of translated strings in the same order.
 * @param {string[]} texts
 * @param {string}   target
 * @returns {Promise<string[]>}
 */
export async function translateBatch(texts, target = "hi") {
  if (!texts || texts.length === 0) return [];

  // Separate already-cached vs needs-fetch
  const result      = new Array(texts.length);
  const fetchIdxMap = []; // maps toFetch index → original index

  texts.forEach((t, i) => {
    const key = cacheKey((t || "").trim(), target);
    if (_cache.has(key)) {
      result[i] = _cache.get(key);
    } else {
      fetchIdxMap.push(i);
    }
  });

  if (fetchIdxMap.length === 0) return result;

  const toFetch = fetchIdxMap.map(i => texts[i]);

  try {
    const res = await axios.post(
      `${API}/api/translate/batch`,
      { texts: toFetch, target },
      { timeout: 8000 }
    );

    const translations = res.data?.translations ?? [];
    translations.forEach((item, fi) => {
      const originalIdx = fetchIdxMap[fi];
      const translated  = item?.translatedText ?? texts[originalIdx];
      _cache.set(cacheKey(texts[originalIdx].trim(), target), translated);
      result[originalIdx] = translated;
    });
  } catch {
    // Fallback: fill with original texts
    fetchIdxMap.forEach(i => { result[i] = texts[i]; });
  }

  return result;
}

// ── React hook: single auto-translated string ─────────────────────────────────
/**
 * useTranslatedText(text, lang)
 *
 * Returns the translated version of `text`. When `lang === "en"` the original
 * text is returned synchronously with zero API calls.
 *
 * @param {string} text  – source text
 * @param {string} lang  – current app language ("en" | "hi")
 * @returns {{ translated: string, loading: boolean }}
 */
export function useTranslatedText(text, lang = "en") {
  const [translated, setTranslated] = useState(text);
  const [loading, setLoading]       = useState(false);
  const latestText                  = useRef(text);

  useEffect(() => {
    latestText.current = text;

    if (lang === "en" || !text || !text.trim()) {
      setTranslated(text);
      return;
    }

    // Check cache synchronously first to avoid any flash
    const key = cacheKey(text.trim(), lang);
    if (_cache.has(key)) {
      setTranslated(_cache.get(key));
      return;
    }

    setLoading(true);
    translateOne(text, lang).then(result => {
      // Ignore stale results if text changed while request was in flight
      if (latestText.current === text) {
        setTranslated(result);
        setLoading(false);
      }
    });
  }, [text, lang]);

  return { translated, loading };
}

export default translateOne;
