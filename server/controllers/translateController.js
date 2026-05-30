const axios = require("axios");

const CACHE_MAX = 500;
const _cache = new Map();

function cacheGet(text, target) {
  return _cache.get(`${text}||${target}`) ?? null;
}

function cacheSet(text, target, translated) {
  if (_cache.size >= CACHE_MAX) {
    _cache.delete(_cache.keys().next().value);
  }
  _cache.set(`${text}||${target}`, translated);
}

async function googleTranslate(text, target) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_TRANSLATE_API_KEY not set");

  const url = "https://translation.googleapis.com/language/translate/v2";

  const res = await axios.post(
    url,
    {
      q: text,
      target,
      format: "text",
    },
    {
      params: { key: apiKey },
      timeout: 5000,
    }
  );

  return res.data?.data?.translations?.[0]?.translatedText ?? null;
}

async function myMemoryTranslate(text, target) {
  const langPair = `en|${target}`;

  const res = await axios.get(
    "https://api.mymemory.translated.net/get",
    {
      params: {
        q: text,
        langpair: langPair,
      },
      timeout: 5000,
    }
  );

  const translated = res.data?.responseData?.translatedText;

  if (
    !translated ||
    translated.toUpperCase() === "NO TRANSLATION" ||
    translated.trim() === text.trim()
  ) {
    return null;
  }

  return translated;
}

const translateText = async (req, res) => {
  const { text, target = "hi" } = req.query;

  if (!text || !text.trim()) {
    return res.status(400).json({
      message: "text query param is required",
    });
  }

  if (text.trim().length > 500) {
    return res.status(400).json({
      message: "text exceeds 500 character limit",
    });
  }

  const cleanText = text.trim();

  const cached = cacheGet(cleanText, target);

  if (cached) {
    return res.json({
      translatedText: cached,
      source: "cache",
      cached: true,
    });
  }

  try {
    const translated = await googleTranslate(cleanText, target);

    if (translated) {
      cacheSet(cleanText, target, translated);

      return res.json({
        translatedText: translated,
        source: "google",
        cached: false,
      });
    }
  } catch (googleErr) {
    console.warn(
      "[translate] Google API failed:",
      googleErr.message
    );
  }

  try {
    const translated = await myMemoryTranslate(
      cleanText,
      target
    );

    if (translated) {
      cacheSet(cleanText, target, translated);

      return res.json({
        translatedText: translated,
        source: "mymemory",
        cached: false,
      });
    }
  } catch (mmErr) {
    console.warn(
      "[translate] MyMemory fallback failed:",
      mmErr.message
    );
  }

  return res.status(500).json({
    message: "Translation unavailable",
    fallback: cleanText,
  });
};

const batchTranslate = async (req, res) => {
  const { texts, target = "hi" } = req.body;

  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({
      message: "texts array is required",
    });
  }

  if (texts.length > 50) {
    return res.status(400).json({
      message: "Maximum 50 texts per batch",
    });
  }

  const results = [];
  const toFetch = [];

  for (const text of texts) {
    const clean = (text || "").trim();

    const cached = cacheGet(clean, target);

    if (cached) {
      results.push({
        original: clean,
        translatedText: cached,
        source: "cache",
      });
    } else {
      toFetch.push(clean);
      results.push(null);
    }
  }

  if (toFetch.length === 0) {
    return res.json({
      translations: results,
    });
  }

  let googleResults = null;

  try {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (apiKey) {
      const url =
        "https://translation.googleapis.com/language/translate/v2";

      const response = await axios.post(
        url,
        {
          q: toFetch,
          target,
          format: "text",
        },
        {
          params: { key: apiKey },
          timeout: 8000,
        }
      );

      googleResults =
        response.data?.data?.translations?.map(
          (item) => item.translatedText
        ) ?? null;
    }
  } catch (error) {
    console.warn(
      "[translate/batch] Google batch failed:",
      error.message
    );
  }

  let fetchIndex = 0;

  for (let i = 0; i < results.length; i++) {
    if (results[i] !== null) continue;

    const original = toFetch[fetchIndex];

    let translated =
      googleResults?.[fetchIndex] ?? null;

    if (!translated) {
      try {
        translated = await myMemoryTranslate(
          original,
          target
        );
      } catch {}
    }

    translated = translated || original;

    cacheSet(original, target, translated);

    results[i] = {
      original,
      translatedText: translated,
      source: googleResults ? "google" : "mymemory",
    };

    fetchIndex++;
  }

  return res.json({
    translations: results,
  });
};

module.exports = {
  translateText,
  batchTranslate,
};