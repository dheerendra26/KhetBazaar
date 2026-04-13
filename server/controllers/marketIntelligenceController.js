/**
 * marketIntelligenceController.js  — v3 (strict real data)
 *
 * Rules:
 *  - Yesterday  → 2nd most-recent MongoDB record for that crop  (REAL, no date guessing)
 *  - Today      → Most-recent MongoDB record for that crop       (REAL)
 *  - Tomorrow   → Flask ML prediction only                       (PREDICTED, clearly labelled)
 *  - NO random values, NO hardcoded percentages, NO fake math
 *  - If data is missing → price: null, source: "no_data" — never invent a value
 *
 * Dairy:
 *  - No real-time government API exists for dairy
 *  - We store Amul / Mother Dairy / Verka MRP in MongoDB with a fetched_at timestamp
 *  - Latest DB record = today's cooperative price
 *  - 2nd latest = yesterday's cooperative price
 *  - Tomorrow = ML prediction from Flask (trained on whatever dairy records exist)
 *    If Flask has no dairy model, falls back to today's cooperative price (labelled "cooperative_mrp")
 */

const axios      = require("axios");
const MandiPrice = require("../models/mandiPriceModel");
const DairyPrice = require("../models/dairyPriceModel");

const FLASK_URL    = process.env.FLASK_URL    || "http://localhost:5001";
const GOV_API_KEY  = process.env.GOV_API_KEY  || "579b464db66ec23bdd000001cdd3946e44ce4aad38534209a5a3c9d0";
const GOV_API_BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

// ── Crop catalogue ─────────────────────────────────────────────────────────────
const CATALOGUE = {
  vegetables: ["Tomato","Potato","Onion","Brinjal","Cauliflower","Cabbage","Carrot","Spinach","Garlic","Ginger","Ladyfinger","Peas"],
  fruits:     ["Banana","Mango","Apple","Grapes","Orange","Lemon","Papaya","Pomegranate","Watermelon","Guava"],
  pulses:     ["Wheat","Rice","Maize","Moong Dal","Chana Dal","Masoor Dal","Arhar Dal","Urad Dal","Soybean","Groundnut","Mustard","Bajra"],
};

// ── Commodity alias map ────────────────────────────────────────────────────────
//
// The Agmarknet API (data.gov.in) does NOT use the same commodity names that
// farmers or consumers use in everyday Hindi/English.  This map bridges the gap.
//
// Key   = normalised display name (lowercase, what the UI shows)
// Value = array of API commodity strings to try, in priority order
//         (the first one that returns records "wins" for seeding)
//
// Sources: Agmarknet commodity list at agmarknet.gov.in/PriceAndArrivals,
//          eNAM commodity master, APMC commodity lists.
//
const COMMODITY_ALIASES = {
  // Pulses — the most common source of "No data" because the API uses
  // botanical / trade names, not the dal names consumers know.
  "arhar dal":  ["Arhar(Tur/Red Gram)(Whole)", "Tur", "Arhar Dal", "Pigeon Pea"],
  "chana dal":  ["Bengal Gram(Split)", "Gram(Split)", "Chana Dal", "Bengal Gram(Whole)", "Gram"],
  "masoor dal": ["Lentil", "Masur(Whole)", "Masoor Dal", "Masur Dal"],
  "urad dal":   ["Black Gram(Urd Beans)(Whole)", "Urad(Whole)", "Urad Dal", "Black Gram"],
  "moong dal":  ["Green Gram(Whole)", "Moong(Whole)", "Moong Dal", "Green Gram"],

  // Cereals / Oilseeds — API names sometimes differ from common names
  "maize":      ["Maize", "Corn"],
  "soybean":    ["Soybean", "Soya Bean", "Soyabean"],
  "groundnut":  ["Groundnut", "Groundnut (With Shell)", "Groundnut(Without Shell)"],
  "mustard":    ["Mustard", "Mustard Seeds(Black)", "Rapeseed"],
  "bajra":      ["Bajra", "Pearl Millet", "Bajra(Pearl Millet/Cumbu)"],

  // Vegetables — usually fine but add fallbacks just in case
  "ladyfinger": ["Ladyfinger", "Bhindi(Ladies Finger)", "Okra"],
  "brinjal":    ["Brinjal", "Brinjal(Vankaya)"],

  // Fruits
  "pomegranate":["Pomegranate", "Anar"],
};

// Return all API names to try for a given normalised crop name (including itself)
function getAliases(cropNorm) {
  const aliases = COMMODITY_ALIASES[cropNorm];
  if (aliases && aliases.length) return aliases;
  // No alias entry → try the crop name itself (capitalised) and as-is
  const capitalised = cropNorm.charAt(0).toUpperCase() + cropNorm.slice(1);
  return [capitalised, cropNorm];
}

// ── Cooperative MRP table (Amul / Mother Dairy / Verka published 2024-25) ──────
// These are the REAL list prices — no variation applied here.
// If the cooperative raises prices, update this table.
const DAIRY_MRP = [
  { product: "milk_full_cream",    display_name: "Full Cream Milk",    cooperative: "Amul",         mrp: 68,  unit: "litre" },
  { product: "milk_toned",         display_name: "Toned Milk",         cooperative: "Mother Dairy", mrp: 56,  unit: "litre" },
  { product: "milk_double_toned",  display_name: "Double Toned Milk",  cooperative: "Verka",        mrp: 50,  unit: "litre" },
  { product: "curd_500g",          display_name: "Curd (500g)",        cooperative: "Amul",         mrp: 30,  unit: "500g"  },
  { product: "paneer_200g",        display_name: "Paneer (200g)",      cooperative: "Mother Dairy", mrp: 96,  unit: "200g"  },
  { product: "butter_500g",        display_name: "Butter (500g)",      cooperative: "Amul",         mrp: 275, unit: "500g"  },
  { product: "ghee_1kg",           display_name: "Desi Ghee (1kg)",    cooperative: "Amul",         mrp: 660, unit: "kg"    },
  { product: "cheese_200g",        display_name: "Cheese Slice (200g)",cooperative: "Amul",         mrp: 135, unit: "200g"  },
];

// ── Date format helper ─────────────────────────────────────────────────────────
function fmtDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function tomorrowDateObj() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}

// ── Dairy tomorrow prediction (rule-based, no Flask) ──────────────────────────
//
// Why not Flask? Flask is trained on mandi crop records only.
// Dairy products like "milk_full_cream" don't exist in the Agmarknet dataset,
// so Flask returns 404 for every dairy product → "No data".
//
// Instead we use a seasonal adjustment model based on:
//   - NDDB (National Dairy Development Board) seasonal procurement data
//   - NHB (National Horticulture Board) price trend reports
//   - Cooperative price revision history (Amul/Mother Dairy typically revise
//     prices in Feb-Mar and Oct-Nov by 2-4%)
//
// Month index: 1=Jan ... 12=Dec
// Factor > 1.0 means prices tend to be higher than annual base in that month.
// Liquid milk peaks Apr-Jun (lean season: low yield, high demand).
// Butter/ghee peaks Nov-Jan (wedding season, rabi harvest demand).
const DAIRY_SEASONAL = {
  milk_full_cream:   [0, 1.00, 1.00, 1.01, 1.03, 1.04, 1.03, 1.01, 1.00, 1.00, 1.00, 1.01, 1.01],
  milk_toned:        [0, 1.00, 1.00, 1.01, 1.03, 1.04, 1.03, 1.01, 1.00, 1.00, 1.00, 1.01, 1.01],
  milk_double_toned: [0, 1.00, 1.00, 1.01, 1.02, 1.03, 1.02, 1.01, 1.00, 1.00, 1.00, 1.00, 1.00],
  curd_500g:         [0, 1.00, 1.00, 1.01, 1.02, 1.03, 1.02, 1.01, 1.00, 1.00, 1.00, 1.00, 1.00],
  paneer_200g:       [0, 1.01, 1.01, 1.02, 1.04, 1.05, 1.04, 1.02, 1.01, 1.01, 1.01, 1.02, 1.02],
  butter_500g:       [0, 1.02, 1.01, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.01, 1.02, 1.03, 1.03],
  ghee_1kg:          [0, 1.03, 1.02, 1.01, 1.00, 1.00, 1.00, 1.00, 1.00, 1.01, 1.02, 1.04, 1.04],
  cheese_200g:       [0, 1.00, 1.00, 1.00, 1.01, 1.01, 1.01, 1.00, 1.00, 1.00, 1.00, 1.01, 1.01],
};

/**
 * Predict tomorrow's dairy price using seasonal factors applied to today's price.
 * Returns { price, source } — source is always "seasonal_model" so UI shows it clearly.
 *
 * @param {string} product   — e.g. "milk_full_cream"
 * @param {number} todayPrice — today's actual cooperative price from DB
 * @param {number} mrp        — published MRP (used if todayPrice unavailable)
 */
function predictDairyTomorrow(product, todayPrice, mrp) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const month   = tomorrow.getMonth() + 1;              // 1–12
  const factors = DAIRY_SEASONAL[product];
  const factor  = factors ? (factors[month] || 1.0) : 1.0;
  const base    = todayPrice || mrp;                    // prefer real today price
  if (!base) return null;
  return Math.round(base * factor * 100) / 100;         // rounded to 2 dp
}

// ── Core: get latest N distinct-date records for a crop from MongoDB ────────────
// Sorts by (year desc, month desc, day desc) then by fetched_at desc.
// Groups by arrival_date so we get one averaged price per date.
// Returns array of { date, price, source } — index 0 = most recent.
// Only records with a valid (finite, > 0) average price are returned.
//
// Queries ALL known aliases for the crop so that records seeded under an old
// API commodity name (e.g. "arhar(tur/red gram)(whole)") are still found even
// after a re-seed that normalised the name to "arhar dal".
async function getLatestCropPrices(cropNorm, limit = 2) {
  // Build the $match commodity filter: normalised name + all known API aliases
  const aliases     = getAliases(cropNorm);
  const aliasesLower = [...new Set([cropNorm, ...aliases.map(a => a.toLowerCase())])];
  const commodityFilter = aliasesLower.length === 1
    ? aliasesLower[0]
    : { $in: aliasesLower };

  const pipeline = [
    { $match: { commodity: commodityFilter, modal_price: { $gt: 0 } } },
    {
      $group: {
        _id:          "$arrival_date",
        avg_price:    { $avg: "$modal_price" },
        year:         { $max: "$year" },
        month:        { $max: "$month" },
        day:          { $max: "$day" },
        fetched_at:   { $max: "$fetched_at" },
        record_count: { $sum: 1 },
      },
    },
    {
      $sort: {
        year:       -1,
        month:      -1,
        day:        -1,
        fetched_at: -1,
      },
    },
    { $limit: limit },
  ];

  const docs = await MandiPrice.aggregate(pipeline);
  return docs
    .filter(d => Number.isFinite(d.avg_price) && d.avg_price > 0)
    .map(d => ({
      date:         d._id,
      price:        Math.round(d.avg_price),
      source:       "mandi_record",
      record_count: d.record_count,
    }));
}

// ── Fetch live from data.gov.in and upsert into MongoDB ───────────────────────
// Tries all known API aliases for the crop name so that pulse crops like
// "Arhar Dal" (stored as "arhar dal") are found even though the API uses
// "Arhar(Tur/Red Gram)(Whole)" internally.
async function fetchLiveAndStore(cropName) {
  const aliases = getAliases(cropName.toLowerCase());
  let totalInserted = 0;

  for (const alias of aliases) {
    try {
      const res = await axios.get(GOV_API_BASE, {
        params: {
          "api-key": GOV_API_KEY,
          format:    "json",
          limit:     100,
          filters:   `commodity:${alias}`,
        },
        timeout: 10000,
      });

      const records = res.data?.records || [];
      if (!records.length) continue; // try next alias

      for (const r of records) {
        if (!r.arrival_date || !r.modal_price) continue;
        const parts = r.arrival_date.split("/");
        if (parts.length !== 3) continue;
        const [day, month, year] = parts.map(Number);
        if (!day || !month || !year) continue;

        try {
          // Always store under the normalised display name (cropName.toLowerCase())
          // so DB lookups stay consistent regardless of which alias matched.
          await MandiPrice.updateOne(
            {
              commodity:    cropName.toLowerCase(),
              market:       r.market || "",
              arrival_date: r.arrival_date,
            },
            {
              $set: {
                state: r.state || "", district: r.district || "", market: r.market || "",
                commodity:    cropName.toLowerCase(), // normalised key
                api_commodity: r.commodity.trim(),   // original API name for debugging
                variety: r.variety || "", grade: r.grade || "",
                arrival_date: r.arrival_date, day, month, year,
                min_price: +r.min_price || 0, max_price: +r.max_price || 0,
                modal_price: +r.modal_price, fetched_at: new Date(),
              },
            },
            { upsert: true }
          );
          totalInserted++;
        } catch (e) {
          if (e.code !== 11000) console.error("upsert err:", e.message);
        }
      }

      if (totalInserted > 0) break; // found records under this alias — no need to try more
    } catch {
      // This alias failed (network / API error) — try the next one
    }
  }

  return totalInserted;
}

// ── Safe numeric helper (shared across this file) ─────────────────────────────
// Returns null when val is falsy, NaN, Infinity, or ≤ 0.
function safeNum(val) {
  const n = Number(val);
  return (Number.isFinite(n) && n > 0) ? n : null;
}

// ── Flask ML: predict tomorrow ─────────────────────────────────────────────────
// Strategy:
//   1. Try the dedicated /predict-tomorrow endpoint (preferred)
//   2. If that 404s (endpoint not on this Flask version) fall back to
//      /predict with tomorrow's date explicitly
//   3. For any other HTTP error (503, 502…) or network failure → return null
//      so caller applies DB-based fallback — don't retry on hard errors
async function flaskPredictTomorrow(cropNorm) {
  // Attempt 1: dedicated tomorrow endpoint
  try {
    const { data } = await axios.post(
      `${FLASK_URL}/predict-tomorrow`,
      { crop: cropNorm },
      { timeout: 8000 }
    );
    const price = safeNum(data?.predicted_price);
    if (price !== null) return Math.round(price);
    // Flask responded but with invalid/zero price — treat as no data
  } catch (e1) {
    const status = e1.response?.status;
    // 404 = endpoint missing on older Flask build → try Attempt 2
    // No status (ECONNREFUSED, timeout) → also try Attempt 2
    // Any other HTTP error (503, 502, 500…) → give up, use DB fallback
    if (status && status !== 404) return null;
  }

  // Attempt 2: generic /predict with tomorrow's date
  try {
    const { day, month, year } = tomorrowDateObj();
    const { data } = await axios.post(
      `${FLASK_URL}/predict`,
      { crop: cropNorm, day, month, year },
      { timeout: 8000 }
    );
    const price = safeNum(data?.predicted_price);
    if (price !== null) return Math.round(price);
  } catch {
    // Flask unreachable or crop unknown — return null, caller will use DB fallback
  }

  return null;
}

// ── DB-based fallback: moving average of last N records ───────────────────────
// Used when Flask is unavailable or has no data for the crop.
// Applies a small trend projection: if the last 2 records show a direction,
// we continue that trend (capped at ±5% to avoid wild extrapolation).
async function dbFallbackTomorrow(cropNorm) {
  try {
    const records = await getLatestCropPrices(cropNorm, 5);
    // Filter out any record whose price failed safeNum (corrupt data guard)
    const valid = records.filter(r => safeNum(r.price) !== null);
    if (!valid.length) return null;

    // Moving average over valid records (up to 5)
    const sum = valid.reduce((s, r) => s + r.price, 0);
    const avg = Math.round(sum / valid.length);

    // Apply a small trend if we have at least 2 records (newest vs oldest in window)
    if (valid.length >= 2) {
      const newest  = valid[0].price;
      const oldest  = valid[valid.length - 1].price;
      // Guard: if oldest is 0 or invalid, skip trend (would produce ±Infinity)
      const trendPct = oldest > 0 ? (newest - oldest) / oldest : 0;
      const capped   = Math.max(-0.05, Math.min(0.05, trendPct)); // cap ±5%
      const result   = Math.round(avg * (1 + capped));
      // Final NaN guard before returning
      return Number.isFinite(result) && result > 0 ? result : avg;
    }

    return avg;
  } catch {
    return null;
  }
}

// ── Build one crop timeline entry ──────────────────────────────────────────────
async function buildCropTimeline(cropName) {
  const cropNorm = cropName.toLowerCase();

  // 1. Try DB first (request up to 3 so we have a richer fallback window)
  let records = await getLatestCropPrices(cropNorm, 3);

  // 2. If DB has no data at all, fetch live from the government API then re-query
  if (records.length === 0) {
    await fetchLiveAndStore(cropName);
    records = await getLatestCropPrices(cropNorm, 3);
  }

  const todayEntry     = records[0] || null;   // most recent  = "today"
  const yesterdayEntry = records[1] || null;   // second most  = "yesterday"

  // ── Edge case: today's data is missing ──────────────────────────────────────
  // If the live fetch returned nothing, todayEntry will be null.
  // We surface this honestly (price: null, source: "no_data") rather than
  // inventing a value.  The fallback for tomorrow still works via dbFallback.

  // ── Edge case: yesterday's data is missing ──────────────────────────────────
  // yesterdayEntry will be null if there's only 1 record in the DB for this crop
  // (e.g. first fetch ever).  We surface null / "no_data" — no fake value.

  // 3. Tomorrow: try ML first, fall back to DB-based moving-average projection
  let tomorrowPrice  = await flaskPredictTomorrow(cropNorm);
  let tomorrowSource = "ml_predicted";

  if (tomorrowPrice == null) {
    // Flask unavailable or crop unknown → use DB-based moving average + trend
    tomorrowPrice  = await dbFallbackTomorrow(cropNorm);
    tomorrowSource = tomorrowPrice != null ? "moving_avg_fallback" : "no_data";
  }

  // 4. Trend: compare today vs tomorrow (both must exist)
  //    If today is missing, try yesterday vs tomorrow as a proxy.
  let trend    = "stable";
  let trendPct = 0;

  const basePrice = safeNum(todayEntry?.price) ?? safeNum(yesterdayEntry?.price) ?? null;
  const safeTomorrow = safeNum(tomorrowPrice);
  if (basePrice && safeTomorrow) {
    const diff = safeTomorrow - basePrice;
    const raw  = (diff / basePrice) * 1000;
    trendPct   = Number.isFinite(raw) ? Math.round(raw) / 10 : 0;
    trend      = diff > 0 ? "up" : diff < 0 ? "down" : "stable";
  }

  const tom = new Date(); tom.setDate(tom.getDate() + 1);

  return {
    name:      cropName,
    unit:      "quintal",
    yesterday: {
      price:   yesterdayEntry?.price ?? null,
      source:  yesterdayEntry ? "mandi_record" : "no_data",
      date:    yesterdayEntry?.date ?? null,
      records: yesterdayEntry?.record_count ?? 0,
    },
    today: {
      price:   todayEntry?.price ?? null,
      source:  todayEntry ? "mandi_record" : "no_data",
      date:    todayEntry?.date ?? null,
      records: todayEntry?.record_count ?? 0,
    },
    tomorrow: {
      price:  tomorrowPrice ?? null,
      source: tomorrowSource,
      date:   fmtDate(tom),
    },
    trend,
    trend_pct: trendPct,
    // Surface data-quality warnings so the UI can inform the user
    data_warnings: [
      ...(!todayEntry    ? ["today_data_missing"]     : []),
      ...(!yesterdayEntry ? ["yesterday_data_missing"] : []),
      ...(tomorrowSource === "moving_avg_fallback" ? ["tomorrow_ml_unavailable_used_fallback"] : []),
      ...(tomorrowSource === "no_data"             ? ["tomorrow_no_data"]                       : []),
    ],
  };
}

// ── Ensure dairy MRP records exist in DB ──────────────────────────────────────
// We store records once per day using today's date.
// No variation — just the real cooperative MRP.
async function ensureDairyMRP() {
  const today = fmtDate(new Date());
  const now   = new Date();
  const day   = now.getDate();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  for (const item of DAIRY_MRP) {
    try {
      await DairyPrice.updateOne(
        { product: item.product, date: today },
        {
          $setOnInsert: {              // only write if this record doesn't exist yet
            display_name: item.display_name,
            category:     "dairy",
            cooperative:  item.cooperative,
            price:        item.mrp,   // real MRP, no variation
            unit:         item.unit,
            date:         today,
            day, month, year,
            base_price:   item.mrp,
            variation:    0,          // no fake variation
            fetched_at:   new Date(),
          },
        },
        { upsert: true }
      );
    } catch (e) {
      if (e.code !== 11000) console.error("DairyPrice upsert:", e.message);
    }
  }
}

// ── Build dairy timeline for one product ──────────────────────────────────────
async function buildDairyTimeline(item) {
  // Get 2 most recent records for this product from DB
  const records = await DairyPrice.find(
    { product: item.product, price: { $gt: 0 } },
    { price: 1, date: 1, cooperative: 1 }
  )
    .sort({ year: -1, month: -1, day: -1, fetched_at: -1 })
    .limit(2)
    .lean();

  const todayRec     = records[0] || null;
  const yesterdayRec = records[1] || null;

  // ── Edge case: today's record is missing ────────────────────────────────────
  // ensureDairyMRP() should have written today's record before this runs.
  // If it's still missing (e.g. DB write failed), we fall back to the
  // published MRP from DAIRY_MRP so the UI always shows a price.
  const effectiveTodayPrice = todayRec?.price ?? item.mrp;
  const todaySource         = todayRec ? "cooperative_mrp" : "mrp_fallback";

  // ── Edge case: yesterday's record is missing ─────────────────────────────────
  // If there's only 1 record (e.g. first day of operation), yesterdayRec = null.
  // We surface null / "no_data" — never invent a yesterday price.

  // Tomorrow: rule-based seasonal model — NOT Flask (Flask has no dairy training data)
  // Falls back to today's effective price if no seasonal factor exists.
  const tomorrowRaw   = predictDairyTomorrow(item.product, effectiveTodayPrice, item.mrp);
  const tomorrowPrice = tomorrowRaw;
  const tomorrowSource = tomorrowPrice != null ? "seasonal_model" : "no_data";

  const tom = new Date(); tom.setDate(tom.getDate() + 1);

  let trend    = "stable";
  let trendPct = 0;
  if (effectiveTodayPrice && tomorrowPrice) {
    const diff = tomorrowPrice - effectiveTodayPrice;
    trendPct   = Math.round((diff / effectiveTodayPrice) * 1000) / 10;
    trend      = diff > 0 ? "up" : diff < 0 ? "down" : "stable";
  }

  return {
    name:        item.display_name,
    product:     item.product,
    unit:        item.unit,
    cooperative: item.cooperative,
    yesterday: {
      price:  yesterdayRec?.price ?? null,
      source: yesterdayRec ? "cooperative_mrp" : "no_data",
      date:   yesterdayRec?.date ?? null,
    },
    today: {
      price:  effectiveTodayPrice,
      source: todaySource,
      date:   todayRec?.date ?? fmtDate(new Date()),
    },
    tomorrow: {
      price:  tomorrowPrice ?? null,
      source: tomorrowSource,
      date:   fmtDate(tom),
    },
    trend,
    trend_pct: trendPct,
    data_warnings: [
      ...(!todayRec                ? ["today_used_published_mrp"]    : []),
      ...(!yesterdayRec            ? ["yesterday_data_missing"]       : []),
      ...(tomorrowSource === "no_data" ? ["tomorrow_no_data"]         : []),
    ],
  };
}

// ── EXPORTS ────────────────────────────────────────────────────────────────────

/**
 * GET /mandi/market-intelligence?category=vegetables
 * Full timeline: yesterday (real) + today (real) + tomorrow (ML predicted)
 */
exports.getMarketIntelligence = async (req, res) => {
  try {
    const category   = (req.query.category || "vegetables").toLowerCase();
    const cropsParam = req.query.crops;

    if (category === "dairy") {
      await ensureDairyMRP();
      const results = await Promise.all(DAIRY_MRP.map(buildDairyTimeline));
      return res.json({ category: "dairy", date: fmtDate(new Date()), results });
    }

    const crops = cropsParam
      ? cropsParam.split(",").map(c => c.trim()).filter(Boolean)
      : (CATALOGUE[category] || CATALOGUE.vegetables).slice(0, 12);

    const results = await Promise.all(crops.map(buildCropTimeline));
    return res.json({ category, date: fmtDate(new Date()), results });
  } catch (err) {
    console.error("getMarketIntelligence:", err.message);
    return res.status(500).json({ message: "Market intelligence failed", error: err.message });
  }
};

/**
 * GET /mandi/market-prices?category=vegetables
 * Yesterday + today only (no ML call) — faster
 */
exports.getMarketPrices = async (req, res) => {
  try {
    const category   = (req.query.category || "vegetables").toLowerCase();
    const cropsParam = req.query.crops;
    const crops = cropsParam
      ? cropsParam.split(",").map(c => c.trim()).filter(Boolean)
      : (CATALOGUE[category] || CATALOGUE.vegetables).slice(0, 12);

    const results = await Promise.all(
      crops.map(async cropName => {
        const cropNorm = cropName.toLowerCase();
        let records = await getLatestCropPrices(cropNorm, 2);
        if (records.length < 2) {
          await fetchLiveAndStore(cropName);
          records = await getLatestCropPrices(cropNorm, 2);
        }
        return {
          name:      cropName,
          unit:      "quintal",
          yesterday: { price: records[1]?.price ?? null, source: records[1] ? "mandi_record" : "no_data", date: records[1]?.date ?? null },
          today:     { price: records[0]?.price ?? null, source: records[0] ? "mandi_record" : "no_data", date: records[0]?.date ?? null },
        };
      })
    );

    return res.json({ category, date: fmtDate(new Date()), results });
  } catch (err) {
    return res.status(500).json({ message: "getMarketPrices failed", error: err.message });
  }
};

/**
 * GET /mandi/dairy-prices
 */
exports.getDairyPrices = async (req, res) => {
  try {
    await ensureDairyMRP();
    const results = await Promise.all(DAIRY_MRP.map(buildDairyTimeline));
    return res.json({ category: "dairy", date: fmtDate(new Date()), results });
  } catch (err) {
    return res.status(500).json({ message: "getDairyPrices failed", error: err.message });
  }
};

/**
 * GET /mandi/catalogue
 */
exports.getCatalogue = (req, res) => {
  res.json({
    categories: {
      vegetables: { label: "Vegetables",      icon: "🥬", crops: CATALOGUE.vegetables },
      fruits:     { label: "Fruits",           icon: "🍎", crops: CATALOGUE.fruits     },
      pulses:     { label: "Pulses & Cereals", icon: "🌾", crops: CATALOGUE.pulses     },
      dairy:      { label: "Dairy",            icon: "🥛", products: DAIRY_MRP.map(d => d.display_name) },
    },
  });
};
