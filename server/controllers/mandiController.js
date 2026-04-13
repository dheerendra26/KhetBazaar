const axios = require("axios");
const MandiPrice = require("../models/mandiPriceModel");

const GOV_API_BASE =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const GOV_API_KEY = process.env.GOV_API_KEY || "579b464db66ec23bdd000001cdd3946e44ce4aad38534209a5a3c9d0"; // public demo key

const FLASK_URL = process.env.FLASK_URL || "http://localhost:5001";

// ── Commodity alias map ────────────────────────────────────────────────────────
// Agmarknet API uses botanical/trade names. This maps display names → API names.
const COMMODITY_ALIASES = {
  "arhar dal":  ["Arhar(Tur/Red Gram)(Whole)", "Tur", "Arhar Dal", "Pigeon Pea"],
  "chana dal":  ["Bengal Gram(Split)", "Gram(Split)", "Chana Dal", "Bengal Gram(Whole)", "Gram"],
  "masoor dal": ["Lentil", "Masur(Whole)", "Masoor Dal", "Masur Dal"],
  "urad dal":   ["Black Gram(Urd Beans)(Whole)", "Urad(Whole)", "Urad Dal", "Black Gram"],
  "moong dal":  ["Green Gram(Whole)", "Moong(Whole)", "Moong Dal", "Green Gram"],
  "maize":      ["Maize", "Corn"],
  "soybean":    ["Soybean", "Soya Bean", "Soyabean"],
  "groundnut":  ["Groundnut", "Groundnut (With Shell)", "Groundnut(Without Shell)"],
  "mustard":    ["Mustard", "Mustard Seeds(Black)", "Rapeseed"],
  "bajra":      ["Bajra", "Pearl Millet", "Bajra(Pearl Millet/Cumbu)"],
  "ladyfinger": ["Ladyfinger", "Bhindi(Ladies Finger)", "Okra"],
  "brinjal":    ["Brinjal", "Brinjal(Vankaya)"],
  "pomegranate":["Pomegranate", "Anar"],
};

function getApiAliases(cropNorm) {
  return COMMODITY_ALIASES[cropNorm] || [
    cropNorm.charAt(0).toUpperCase() + cropNorm.slice(1),
    cropNorm,
  ];
}

// All aliases lowercased — used for DB $in queries to catch records stored under old names
function getAllAliasesLower(cropNorm) {
  const aliases = getApiAliases(cropNorm);
  return [...new Set([cropNorm, ...aliases.map(a => a.toLowerCase())])];
}

// ── Middleman constants (realistic estimates) ─────────────────────────────────
//
// WHAT THESE NUMBERS MEAN:
//
// modal_price from data.gov.in = the price at which the commodity trades at the
// mandi. This is the "market clearing price" negotiated between commission agents
// (arhatias) and wholesale buyers. The FARMER does NOT receive this full amount.
//
// Typical deductions before the farmer gets paid:
//   - Commission agent (arhati) fee : 2–8% of modal price (avg ~6%)
//   - Market fee / mandi tax         : 0.5–2%
//   - Transport to mandi             : ₹1–3/kg (we approximate as % here)
//   - Loading / unloading / weighing : ~1%
//   Total deductions                 ≈ 25–35% of modal price
//
// WITHOUT middleman (selling directly on KhetBazaar / to consumers):
//   The farmer charges a price between mandi modal price and retail price.
//   Retail is typically 1.5–2× the modal price.
//   A fair direct price = modal price × 1.2  (20% above mandi, still below retail)
//   This is realistic because the farmer saves commission + transport costs.
//
// Sources: NABARD reports, CACP price policy papers, eNAM documentation

const FARMER_RECEIVES_PCT  = 0.70;   // farmer gets ~70% of modal price via mandi
const DIRECT_PRICE_MULTIPLIER = 1.20; // direct sale ≈ 20% above modal (consumer pays less than retail, farmer earns more than mandi)

// ── helpers ────────────────────────────────────────────────────────────────────

/** Parse "DD/MM/YYYY" → { day, month, year } */
function parseArrivalDate(dateStr) {
  if (!dateStr) return {};
  const parts = dateStr.split("/");
  if (parts.length !== 3) return {};
  return {
    day:   parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    year:  parseInt(parts[2], 10),
  };
}

/** Normalise commodity names using the synonym mapper so "Aloo" → "potato",
 *  "Tamatar" → "tomato", "Bhindi" → "ladyfinger", etc.
 *  Falls back to plain lowercase if no match found.
 */
const { resolveCategory: _resolveCategory } = require("../utils/categoryMapper");
function normaliseCrop(name) {
  if (!name) return "";
  const resolved = _resolveCategory(name.trim());
  // Use canonical name (lowercased) when we have a confident match
  if (resolved.confidence !== "default") {
    return resolved.canonical.toLowerCase();
  }
  return name.trim().toLowerCase();
}

// ── Profit comparison using farmer's OWN listed product prices ────────────────
// This is the honest comparison:
//   farmer_listed_price = what they charge on KhetBazaar (direct sale)
//   mandi_price         = latest modal price from DB for that crop (middleman route)
//   If no mandi record exists, we fall back to farmer_price * 0.70 as mandi estimate

// ── Static baseline prices (per kg) — mirrors postProductRoute basePrices ──────
// Used as last resort when DB and ML both have no data for a crop.
const BASELINE_PRICES = {
  potato: 18,    tomato: 25,    onion: 20,     garlic: 120,   ginger: 60,
  cauliflower: 25, cabbage: 15, carrot: 30,    spinach: 20,   brinjal: 22,
  ladyfinger: 35,  peas: 45,    capsicum: 40,  "green chilli": 30,
  cucumber: 20,  pumpkin: 18,   "bottle gourd": 20, "bitter gourd": 30,
  radish: 15,    beetroot: 25,  "sweet corn": 20, coriander: 40,
  fenugreek: 30, mushroom: 80,
  mango: 60,     banana: 35,    apple: 120,    grapes: 80,    orange: 50,
  papaya: 25,    watermelon: 15, guava: 35,    pomegranate: 90, lemon: 40,
  pineapple: 45, coconut: 30,   litchi: 70,    plum: 60,      jackfruit: 20,
  milk: 55,      curd: 45,      butter: 500,   ghee: 600,     paneer: 300,
  cheese: 400,   buttermilk: 25, cream: 200,   khoya: 250,
  wheat: 22,     rice: 32,      "mustard seeds": 65, mustard: 65,
  soybean: 40,   groundnut: 70, lentils: 90,   chickpea: 75,
  "moong dal": 90, "urad dal": 95, "arhar dal": 100, bajra: 18,
  jowar: 20,     maize: 20,     sesame: 110,   cotton: 65,    sugarcane: 3,
  default: 30,
};

/**
 * Fetch the real mandi modal price (per kg) for a single crop.
 *
 * Strategy (cheapest → most expensive, bail out as soon as we have a value):
 *   1. DB: most-recent MandiPrice record for the canonical crop name + all its
 *      commodity aliases — gives the actual government mandi modal price.
 *   2. Flask ML: /predict endpoint — trained on historical government data.
 *   3. Static baseline table — deterministic, no variance, labelled clearly.
 *
 * Returns { pricePerKg, source, estimated }
 */
async function fetchMandiPriceForCrop(cropName) {
  const canonicalKey = normaliseCrop(cropName);  // e.g. "potato", "green chilli"

  // All DB aliases (canonical + commodity trade names used in Agmarknet data)
  const aliasesLower = getAllAliasesLower(canonicalKey);
  const dbFilter     = aliasesLower.length === 1
    ? aliasesLower[0]
    : { $in: aliasesLower };

  // ── 1. DB lookup ────────────────────────────────────────────────────────────
  try {
    const pipeline = [
      { $match: { commodity: dbFilter, modal_price: { $gt: 0 } } },
      {
        $group: {
          _id:       "$arrival_date",
          avg_price: { $avg: "$modal_price" },
          year:  { $max: "$year" },
          month: { $max: "$month" },
          day:   { $max: "$day" },
        },
      },
      { $sort: { year: -1, month: -1, day: -1 } },
      { $limit: 3 },
    ];
    const records = await MandiPrice.aggregate(pipeline);
    const valid   = records.filter(r => r.avg_price > 0);
    if (valid.length > 0) {
      // modal_price in DB is per quintal → divide by 100 for per-kg
      const pricePerKg = +(valid[0].avg_price / 100).toFixed(2);
      return { pricePerKg, source: "mandi_db", estimated: false };
    }
  } catch { /* DB error — fall through */ }

  // ── 2. Flask ML ─────────────────────────────────────────────────────────────
  try {
    const now = new Date();
    const flaskRes = await axios.post(
      `${FLASK_URL}/predict`,
      { crop: canonicalKey, day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() },
      { timeout: 5000 }
    );
    const raw = flaskRes.data?.predicted_price;
    if (raw && Number.isFinite(Number(raw)) && Number(raw) > 0) {
      const pricePerKg = +(Number(raw) / 100).toFixed(2); // quintal → kg
      return { pricePerKg, source: "ml_predicted", estimated: true };
    }
  } catch { /* Flask unreachable or crop unknown */ }

  // ── 3. Static baseline ──────────────────────────────────────────────────────
  const base = BASELINE_PRICES[canonicalKey] || BASELINE_PRICES.default;
  // Apply simple seasonal multiplier
  const month    = new Date().getMonth();
  const seasonal = [1.1,1.15,1.1,1.05,1.0,0.95,0.9,0.85,0.9,1.0,1.05,1.1][month];
  const pricePerKg = +(base * seasonal).toFixed(2);
  return { pricePerKg, source: "baseline", estimated: true };
}

exports.productProfitComparison = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "email is required" });

    const Product = require("../models/productModel");

    const products = await Product.find({ email, isActive: { $ne: false } }).select(
      "name price unit stock soldCount category"
    );

    if (!products.length) {
      return res.status(404).json({ message: "No products found for this farmer" });
    }

    const results = await Promise.all(
      products.map(async (p) => {
        const farmerPrice = p.price; // ₹ per unit the farmer charges on KhetBazaar

        // ── Fetch real mandi price for THIS specific product ────────────────
        const { pricePerKg, source, estimated } = await fetchMandiPriceForCrop(p.name);

        // Adjust for non-kg units (per-litre ≈ per-kg for liquids; per-piece needs
        // weight estimate — we keep it as-is since most products are sold by kg)
        const mandiPrice = pricePerKg;

        // What farmer would receive after typical mandi deductions (~30%)
        const mandiEarningsPerUnit  = +(mandiPrice * FARMER_RECEIVES_PCT).toFixed(2);
        // What farmer earns on KhetBazaar (their listed price, zero deductions)
        const directEarningsPerUnit = farmerPrice;

        // Guard against zero to avoid NaN/Infinity in percentage
        const safeMandiEarnings = mandiEarningsPerUnit > 0 ? mandiEarningsPerUnit : 1;

        const gainPerUnit = +(directEarningsPerUnit - mandiEarningsPerUnit).toFixed(2);
        // gain_pct = how much MORE % the farmer earns vs mandi route
        const gainPct     = +(( gainPerUnit / safeMandiEarnings ) * 100).toFixed(1);

        // Progress bar: mandi bar as % of KhetBazaar price (capped at 99% so bar
        // never overflows — and 0% floor so it always shows something)
        const barPct = Math.min(99, Math.max(5,
          Math.round((mandiEarningsPerUnit / Math.max(directEarningsPerUnit, 1)) * 100)
        ));

        const qty                    = p.stock || 1;
        const projectedMandiEarnings = +(mandiEarningsPerUnit * qty).toFixed(2);
        const projectedDirectEarnings= +(directEarningsPerUnit * qty).toFixed(2);
        const projectedGain          = +(projectedDirectEarnings - projectedMandiEarnings).toFixed(2);

        return {
          product_id:            p._id,
          product_name:          p.name,
          category:              p.category,
          unit:                  p.unit || "kg",
          stock:                 qty,
          sold_count:            p.soldCount || 0,
          your_khetbazaar_price: farmerPrice,
          mandi_modal_price:     mandiPrice,
          mandi_source:          source,        // "mandi_db" | "ml_predicted" | "baseline"
          mandi_estimated:       estimated,
          bar_pct:               barPct,        // pre-computed for frontend
          per_unit: {
            via_mandi:     mandiEarningsPerUnit,
            on_khetbazaar: directEarningsPerUnit,
            gain:          gainPerUnit,
            gain_pct:      gainPct,
          },
          projected: {
            quantity:     qty,
            via_mandi:    projectedMandiEarnings,
            on_khetbazaar: projectedDirectEarnings,
            extra_earned: projectedGain,
          },
          note: estimated
            ? `Mandi price estimated from ${source === "ml_predicted" ? "ML model" : "baseline seasonal data"} — live data pending`
            : "Mandi price from government data.gov.in records",
        };
      })
    );

    results.sort((a, b) => b.projected.extra_earned - a.projected.extra_earned);

    const totalExtraEarned = +results.reduce((s, r) => s + r.projected.extra_earned, 0).toFixed(2);

    return res.json({
      email,
      total_products:              results.length,
      total_extra_earned_vs_mandi: totalExtraEarned,
      message: `By selling on KhetBazaar you earn ₹${totalExtraEarned.toLocaleString("en-IN")} more than going through a mandi middleman`,
      products: results,
    });
  } catch (err) {
    console.error("productProfitComparison error:", err.message);
    return res.status(500).json({ message: "Comparison failed", error: err.message });
  }
};

exports.fetchAndStoreMandi = async (req, res) => {
  try {
    const commodity = req.query.commodity || "Tomato";
    const limit     = parseInt(req.query.limit) || 100;
    const normName  = normaliseCrop(commodity);
    const aliases   = getApiAliases(normName);

    let totalInserted = 0;
    let successAlias  = null;

    for (const alias of aliases) {
      let inserted = 0;
      try {
        const govRes = await axios.get(GOV_API_BASE, {
          params: {
            "api-key": GOV_API_KEY,
            format: "json",
            limit,
            filters: `commodity:${alias}`,
          },
          timeout: 15000,
        });

        const records = govRes.data?.records || [];
        if (!records.length) continue;

        for (const r of records) {
          const dateParts = parseArrivalDate(r.arrival_date);
          if (!dateParts.day || !r.modal_price) continue;

          try {
            await MandiPrice.updateOne(
              {
                commodity:    normName,           // always store under normalised name
                market:       r.market || "",
                arrival_date: r.arrival_date || "",
              },
              {
                $set: {
                  state:        r.state || "",
                  district:     r.district || "",
                  market:       r.market || "",
                  commodity:    normName,          // normalised
                  api_commodity: r.commodity.trim(), // original API name
                  variety:      r.variety || "",
                  grade:        r.grade || "",
                  arrival_date: r.arrival_date || "",
                  ...dateParts,
                  min_price:    Number(r.min_price) || 0,
                  max_price:    Number(r.max_price) || 0,
                  modal_price:  Number(r.modal_price),
                  fetched_at:   new Date(),
                },
              },
              { upsert: true }
            );
            inserted++;
          } catch (e) {
            if (e.code !== 11000) console.error("MandiPrice upsert error:", e.message);
          }
        }
      } catch (err) {
        console.error(`fetchAndStoreMandi alias "${alias}" error:`, err.message);
      }

      if (inserted > 0) {
        totalInserted += inserted;
        successAlias   = alias;
        break; // found records — no need to try remaining aliases
      }
    }

    return res.json({
      message:      `Fetched and upserted ${totalInserted} records for "${commodity}"`,
      inserted:     totalInserted,
      api_alias_used: successAlias || "none",
      ...(totalInserted === 0 && {
        hint: `No records found. Tried API names: ${aliases.join(", ")}. The crop may not be in Agmarknet dataset.`,
      }),
    });
  } catch (err) {
    console.error("fetchAndStoreMandi error:", err.message);
    return res.status(500).json({ message: "Failed to fetch mandi data", error: err.message });
  }
};

// ── Get stored mandi records ───────────────────────────────────────────────────

exports.getMandiPrices = async (req, res) => {
  try {
    const { commodity, state, limit = 50 } = req.query;
    const filter = {};

    if (commodity) {
      const norm    = normaliseCrop(commodity);
      const allNames = getAllAliasesLower(norm);
      filter.commodity = allNames.length === 1 ? allNames[0] : { $in: allNames };
    }
    if (state) filter.state = new RegExp(state, "i");

    const data = await MandiPrice.find(filter)
      .sort({ year: -1, month: -1, day: -1 })
      .limit(parseInt(limit));

    return res.json({ count: data.length, data });
  } catch (err) {
    return res.status(500).json({ message: "DB error", error: err.message });
  }
};

// ── Predict price via Flask ML service ────────────────────────────────────────
// Falls back to DB moving-average when Flask is unavailable or the crop is
// unknown. Returns a structured response that includes the data source so the
// caller (frontend / other controllers) always gets a usable number.

exports.predictPrice = async (req, res) => {
  try {
    const { crop, date } = req.body;
    if (!crop) return res.status(400).json({ message: "crop is required" });

    const cropNorm = normaliseCrop(crop);

    let day, month, year;
    if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }
      day   = d.getDate();
      month = d.getMonth() + 1;
      year  = d.getFullYear();
    } else {
      const now = new Date();
      day   = now.getDate();
      month = now.getMonth() + 1;
      year  = now.getFullYear();
    }

    // ── Attempt 1: Flask ML ────────────────────────────────────────────────
    try {
      const flaskRes = await axios.post(
        `${FLASK_URL}/predict`,
        { crop: cropNorm, day, month, year },
        { timeout: 10000 }
      );

      const predicted_price = Number(flaskRes.data?.predicted_price);
      const unit            = flaskRes.data?.unit || "quintal";

      if (Number.isFinite(predicted_price) && predicted_price > 0) {
        return res.json({
          crop,
          date:  date || new Date().toISOString().split("T")[0],
          predicted_price,
          unit,
          source: "ml_predicted",
        });
      }
      // Flask returned a non-numeric / zero — fall through to DB fallback
    } catch (flaskErr) {
      // Log only unexpected errors (not the typical "Flask unavailable" case)
      if (flaskErr.response?.status && flaskErr.response.status < 500) {
        console.error("predictPrice Flask error:", flaskErr.response?.data || flaskErr.message);
      }
    }

    // ── Attempt 2: DB moving-average fallback ────────────────────────────────
    // Group by arrival_date, average modal_price, take up to 5 most recent dates.
    const pipeline = [
      { $match: { commodity: cropNorm, modal_price: { $gt: 0 } } },
      {
        $group: {
          _id:       "$arrival_date",
          avg_price: { $avg: "$modal_price" },
          year:      { $max: "$year" },
          month:     { $max: "$month" },
          day:       { $max: "$day" },
        },
      },
      { $sort: { year: -1, month: -1, day: -1 } },
      { $limit: 5 },
    ];

    const dbRecords = await MandiPrice.aggregate(pipeline);
    const valid     = dbRecords.filter(r => Number.isFinite(r.avg_price) && r.avg_price > 0);

    if (valid.length > 0) {
      const movAvg = valid.reduce((s, r) => s + r.avg_price, 0) / valid.length;

      // Apply small trend projection if we have ≥2 records (capped ±5%)
      let predicted_price = movAvg;
      if (valid.length >= 2) {
        const newest   = valid[0].avg_price;
        const oldest   = valid[valid.length - 1].avg_price;
        const trendPct = Math.max(-0.05, Math.min(0.05, (newest - oldest) / oldest));
        predicted_price = movAvg * (1 + trendPct);
      }

      predicted_price = Math.round(predicted_price * 100) / 100; // 2 dp

      return res.json({
        crop,
        date:  date || new Date().toISOString().split("T")[0],
        predicted_price,
        unit:   "quintal",
        source: valid.length >= 2 ? "moving_avg_fallback" : "mandi_db",
        note:   "ML service unavailable — price derived from recent mandi records",
      });
    }

    // ── No data at all ────────────────────────────────────────────────────────
    return res.status(404).json({
      message: `No price data found for crop: ${crop}. Fetch mandi records first via /mandi/fetch?commodity=${encodeURIComponent(crop)}`,
      crop,
    });

  } catch (err) {
    console.error("predictPrice error:", err.message);
    return res.status(500).json({ message: "Price prediction failed", error: err.message });
  }
};

// ── Profit comparison (with vs without middleman) ─────────────────────────────

exports.profitComparison = async (req, res) => {
  try {
    const { crop, date, quantity_kg } = req.body;
    if (!crop) return res.status(400).json({ message: "crop is required" });

    const qty = parseFloat(quantity_kg) || 100;

    // 1. Get predicted modal price from Flask
    let day, month, year;
    if (date) {
      const d = new Date(date);
      day   = d.getDate();
      month = d.getMonth() + 1;
      year  = d.getFullYear();
    } else {
      const now = new Date();
      day   = now.getDate();
      month = now.getMonth() + 1;
      year  = now.getFullYear();
    }

    let modalPrice = null;
    // Attempt 1: Flask ML
    try {
      const flaskRes = await axios.post(`${FLASK_URL}/predict`, {
        crop: normaliseCrop(crop),
        day, month, year,
      }, { timeout: 10000 });
      const raw = Number(flaskRes.data?.predicted_price);
      if (Number.isFinite(raw) && raw > 0) modalPrice = raw;
    } catch { /* Flask unreachable — fall through */ }

    // Attempt 2: latest DB record
    if (!modalPrice) {
      const latest = await MandiPrice.findOne(
        { commodity: normaliseCrop(crop), modal_price: { $gt: 0 } },
        {},
        { sort: { year: -1, month: -1, day: -1 } }
      );
      if (latest) {
        const raw = Number(latest.modal_price);
        if (Number.isFinite(raw) && raw > 0) modalPrice = raw;
      }
    }

    if (!modalPrice) {
      return res.status(404).json({
        message: `No price data found for crop: ${crop}. Fetch mandi records first via /mandi/fetch?commodity=${encodeURIComponent(crop)}`,
      });
    }

    // 2. Compute earnings (modal_price is per quintal = 100 kg)
    const pricePerKg = modalPrice / 100;

    // What farmer actually receives via mandi (after all deductions)
    const withMiddlemanPerKg    = pricePerKg * FARMER_RECEIVES_PCT;

    // What farmer can charge selling directly (above mandi, below retail)
    const withoutMiddlemanPerKg = pricePerKg * DIRECT_PRICE_MULTIPLIER;

    const earningsWithMiddleman    = +(withMiddlemanPerKg    * qty).toFixed(2);
    const earningsWithoutMiddleman = +(withoutMiddlemanPerKg * qty).toFixed(2);
    const profitGain               = +(earningsWithoutMiddleman - earningsWithMiddleman).toFixed(2);
    const profitGainPct            = +(( profitGain / earningsWithMiddleman ) * 100).toFixed(1);

    return res.json({
      crop,
      quantity_kg:              qty,
      modal_price_per_quintal:  modalPrice,
      price_per_kg:             +pricePerKg.toFixed(2),
      with_middleman: {
        price_per_kg:    +withMiddlemanPerKg.toFixed(2),
        total_earnings:  earningsWithMiddleman,
        note: `Farmer receives ~${(FARMER_RECEIVES_PCT * 100).toFixed(0)}% of modal price after commission agent fees, mandi tax, transport & loading charges`,
        deductions_breakdown: {
          commission_agent: "~6% of modal price",
          mandi_tax:        "~1%",
          transport:        "~2%",
          loading_weighing: "~1%",
          total_approx:     "~30% deducted"
        }
      },
      without_middleman: {
        price_per_kg:    +withoutMiddlemanPerKg.toFixed(2),
        total_earnings:  earningsWithoutMiddleman,
        note: `Direct sale price = ${(DIRECT_PRICE_MULTIPLIER * 100).toFixed(0)}% of modal price — above mandi rate, below retail, fair for both farmer and consumer`,
        basis: "Based on eNAM & FPO direct marketing data: farmers earn 15-25% above modal price when selling directly"
      },
      profit_gain:     profitGain,
      profit_gain_pct: profitGainPct,
    });
  } catch (err) {
    console.error("profitComparison error:", err.message);
    return res.status(500).json({ message: "Profit comparison failed", error: err.message });
  }
};
