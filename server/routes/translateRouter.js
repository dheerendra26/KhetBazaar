/**
 * translateRouter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/translate?text=potato&target=hi
 *
 * Primary  : Google Cloud Translation API v2 (requires GOOGLE_TRANSLATE_API_KEY)
 * Fallback : MyMemory free API  (no key required, 5 000 chars/day)
 * Cache    : in-process LRU-style Map (max 500 entries) so identical strings
 *            never hit the external API twice in the same server session.
 *
 * Response shape
 *   200 { translatedText, source, cached }
 *   400 { message }
 *   500 { message, fallback }      ← original text echoed so UI never breaks
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();

// ── Simple in-process translation cache ──────────────────────────────────────
const CACHE_MAX  = 500;
const _cache     = new Map();   // key: "text||target"  value: translatedText

function cacheGet(text, target) {
  return _cache.get(`${text}||${target}`) ?? null;
}

function cacheSet(text, target, translated) {
  if (_cache.size >= CACHE_MAX) {
    // Evict oldest entry (Map preserves insertion order)
    _cache.delete(_cache.keys().next().value);
  }
  _cache.set(`${text}||${target}`, translated);
}

// ── Google Translate API v2 ───────────────────────────────────────────────────
async function googleTranslate(text, target) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_TRANSLATE_API_KEY not set");

  const url = "https://translation.googleapis.com/language/translate/v2";
  const res = await axios.post(
    url,
    { q: text, target, format: "text" },
    { params: { key: apiKey }, timeout: 5000 }
  );
  return res.data?.data?.translations?.[0]?.translatedText ?? null;
}

// ── MyMemory fallback (free, no key) ─────────────────────────────────────────
async function myMemoryTranslate(text, target) {
  const langPair = `en|${target}`;
  const res = await axios.get("https://api.mymemory.translated.net/get", {
    params: { q: text, langpair: langPair },
    timeout: 5000,
  });
  const t = res.data?.responseData?.translatedText;
  // MyMemory returns the original text (or "NO TRANSLATION") when it can't
  if (!t || t.toUpperCase() === "NO TRANSLATION" || t.trim() === text.trim()) {
    return null;
  }
  return t;
}

// ── Main handler ─────────────────────────────────────────────────────────────
router.get("/translate", async (req, res) => {
  const { text, target = "hi" } = req.query;

  if (!text || !text.trim()) {
    return res.status(400).json({ message: "text query param is required" });
  }
  if (text.trim().length > 500) {
    return res.status(400).json({ message: "text exceeds 500 character limit" });
  }

  const cleanText = text.trim();

  // 1. Serve from cache if available
  const cached = cacheGet(cleanText, target);
  if (cached) {
    return res.json({ translatedText: cached, source: "cache", cached: true });
  }

  // 2. Try Google Translate
  try {
    const translated = await googleTranslate(cleanText, target);
    if (translated) {
      cacheSet(cleanText, target, translated);
      return res.json({ translatedText: translated, source: "google", cached: false });
    }
  } catch (googleErr) {
    console.warn("[translate] Google API failed:", googleErr.message);
  }

  // 3. Fallback to MyMemory
  try {
    const translated = await myMemoryTranslate(cleanText, target);
    if (translated) {
      cacheSet(cleanText, target, translated);
      return res.json({ translatedText: translated, source: "mymemory", cached: false });
    }
  } catch (mmErr) {
    console.warn("[translate] MyMemory fallback failed:", mmErr.message);
  }

  // 4. All APIs failed — return original text so the UI never breaks
  return res.status(500).json({
    message: "Translation unavailable",
    fallback: cleanText,   // UI should display this
  });
});

// ── Batch translate  POST /api/translate/batch ────────────────────────────────
// Body: { texts: string[], target: "hi" }
// Used by the Dashboard to translate a list of product names in one request.
router.post("/translate/batch", async (req, res) => {
  const { texts, target = "hi" } = req.body;

  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ message: "texts array is required" });
  }
  if (texts.length > 50) {
    return res.status(400).json({ message: "Maximum 50 texts per batch" });
  }

  const results = [];

  // Split into cached vs needs-translation
  const toFetch = [];
  for (const t of texts) {
    const clean  = (t || "").trim();
    const cached = cacheGet(clean, target);
    if (cached) {
      results.push({ original: clean, translatedText: cached, source: "cache" });
    } else {
      toFetch.push(clean);
      results.push(null); // placeholder; filled below
    }
  }

  if (toFetch.length === 0) {
    return res.json({ translations: results });
  }

  // Try Google batch translate
  let googleResults = null;
  try {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (apiKey) {
      const url = "https://translation.googleapis.com/language/translate/v2";
      const gRes = await axios.post(
        url,
        { q: toFetch, target, format: "text" },
        { params: { key: apiKey }, timeout: 8000 }
      );
      googleResults = gRes.data?.data?.translations?.map(t => t.translatedText) ?? null;
    }
  } catch (e) {
    console.warn("[translate/batch] Google batch failed:", e.message);
  }

  // Fill in results
  let fetchIdx = 0;
  for (let i = 0; i < results.length; i++) {
    if (results[i] !== null) continue; // already cached

    const original   = toFetch[fetchIdx];
    let   translated = googleResults?.[fetchIdx] ?? null;

    // Per-item MyMemory fallback if Google failed
    if (!translated) {
      try {
        translated = await myMemoryTranslate(original, target);
      } catch { /* silent */ }
    }

    translated = translated || original; // ultimate fallback: original text
    cacheSet(original, target, translated);
    results[i] = { original, translatedText: translated, source: googleResults ? "google" : "mymemory" };
    fetchIdx++;
  }

  return res.json({ translations: results });
});

module.exports = router;
