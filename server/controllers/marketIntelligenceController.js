const axios = require("axios");
const MandiPrice = require("../models/mandiPriceModel");
const DairyPrice = require("../models/dairyPriceModel");

const FLASK_URL = process.env.FLASK_URL;
const GOV_API_KEY = process.env.GOV_API_KEY;
const GOV_API_BASE = process.env.GOV_API_BASE;

const CATALOGUE = {
  vegetables: [
    "Tomato",
    "Potato",
    "Onion",
    "Brinjal",
    "Cauliflower",
    "Cabbage",
    "Carrot",
    "Spinach",
    "Garlic",
    "Ginger",
    "Ladyfinger",
    "Peas",
  ],
  fruits: [
    "Banana",
    "Mango",
    "Apple",
    "Grapes",
    "Orange",
    "Lemon",
    "Papaya",
    "Pomegranate",
    "Watermelon",
    "Guava",
  ],
  pulses: [
    "Wheat",
    "Rice",
    "Maize",
    "Moong Dal",
    "Chana Dal",
    "Masoor Dal",
    "Arhar Dal",
    "Urad Dal",
    "Soybean",
    "Groundnut",
    "Mustard",
    "Bajra",
  ],
};

const COMMODITY_ALIASES = {
  "arhar dal": ["Arhar(Tur/Red Gram)(Whole)", "Tur", "Arhar Dal", "Pigeon Pea"],
  "chana dal": [
    "Bengal Gram(Split)",
    "Gram(Split)",
    "Chana Dal",
    "Bengal Gram(Whole)",
    "Gram",
  ],
  "masoor dal": ["Lentil", "Masur(Whole)", "Masoor Dal", "Masur Dal"],
  "urad dal": [
    "Black Gram(Urd Beans)(Whole)",
    "Urad(Whole)",
    "Urad Dal",
    "Black Gram",
  ],
  "moong dal": ["Green Gram(Whole)", "Moong(Whole)", "Moong Dal", "Green Gram"],

  maize: ["Maize", "Corn"],
  soybean: ["Soybean", "Soya Bean", "Soyabean"],
  groundnut: [
    "Groundnut",
    "Groundnut (With Shell)",
    "Groundnut(Without Shell)",
  ],
  mustard: ["Mustard", "Mustard Seeds(Black)", "Rapeseed"],
  bajra: ["Bajra", "Pearl Millet", "Bajra(Pearl Millet/Cumbu)"],

  ladyfinger: ["Ladyfinger", "Bhindi(Ladies Finger)", "Okra"],
  brinjal: ["Brinjal", "Brinjal(Vankaya)"],

  pomegranate: ["Pomegranate", "Anar"],
};

function getAliases(cropNorm) {
  const aliases = COMMODITY_ALIASES[cropNorm];
  if (aliases && aliases.length) return aliases;
  const capitalised = cropNorm.charAt(0).toUpperCase() + cropNorm.slice(1);
  return [capitalised, cropNorm];
}

const DAIRY_MRP = [
  {
    product: "milk_full_cream",
    display_name: "Full Cream Milk",
    cooperative: "Amul",
    mrp: 68,
    unit: "litre",
  },
  {
    product: "milk_toned",
    display_name: "Toned Milk",
    cooperative: "Mother Dairy",
    mrp: 56,
    unit: "litre",
  },
  {
    product: "milk_double_toned",
    display_name: "Double Toned Milk",
    cooperative: "Verka",
    mrp: 50,
    unit: "litre",
  },
  {
    product: "curd_500g",
    display_name: "Curd (500g)",
    cooperative: "Amul",
    mrp: 30,
    unit: "500g",
  },
  {
    product: "paneer_200g",
    display_name: "Paneer (200g)",
    cooperative: "Mother Dairy",
    mrp: 96,
    unit: "200g",
  },
  {
    product: "butter_500g",
    display_name: "Butter (500g)",
    cooperative: "Amul",
    mrp: 275,
    unit: "500g",
  },
  {
    product: "ghee_1kg",
    display_name: "Desi Ghee (1kg)",
    cooperative: "Amul",
    mrp: 660,
    unit: "kg",
  },
  {
    product: "cheese_200g",
    display_name: "Cheese Slice (200g)",
    cooperative: "Amul",
    mrp: 135,
    unit: "200g",
  },
];

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

const DAIRY_SEASONAL = {
  milk_full_cream: [
    0, 1.0, 1.0, 1.01, 1.03, 1.04, 1.03, 1.01, 1.0, 1.0, 1.0, 1.01, 1.01,
  ],
  milk_toned: [
    0, 1.0, 1.0, 1.01, 1.03, 1.04, 1.03, 1.01, 1.0, 1.0, 1.0, 1.01, 1.01,
  ],
  milk_double_toned: [
    0, 1.0, 1.0, 1.01, 1.02, 1.03, 1.02, 1.01, 1.0, 1.0, 1.0, 1.0, 1.0,
  ],
  curd_500g: [
    0, 1.0, 1.0, 1.01, 1.02, 1.03, 1.02, 1.01, 1.0, 1.0, 1.0, 1.0, 1.0,
  ],
  paneer_200g: [
    0, 1.01, 1.01, 1.02, 1.04, 1.05, 1.04, 1.02, 1.01, 1.01, 1.01, 1.02, 1.02,
  ],
  butter_500g: [
    0, 1.02, 1.01, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.01, 1.02, 1.03, 1.03,
  ],
  ghee_1kg: [
    0, 1.03, 1.02, 1.01, 1.0, 1.0, 1.0, 1.0, 1.0, 1.01, 1.02, 1.04, 1.04,
  ],
  cheese_200g: [
    0, 1.0, 1.0, 1.0, 1.01, 1.01, 1.01, 1.0, 1.0, 1.0, 1.0, 1.01, 1.01,
  ],
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
  const month = tomorrow.getMonth() + 1;
  const factors = DAIRY_SEASONAL[product];
  const factor = factors ? factors[month] || 1.0 : 1.0;
  const base = todayPrice || mrp;
  if (!base) return null;
  return Math.round(base * factor * 100) / 100;
}

async function getLatestCropPrices(cropNorm, limit = 2) {
  const aliases = getAliases(cropNorm);
  const aliasesLower = [
    ...new Set([cropNorm, ...aliases.map((a) => a.toLowerCase())]),
  ];
  const commodityFilter =
    aliasesLower.length === 1 ? aliasesLower[0] : { $in: aliasesLower };

  const pipeline = [
    { $match: { commodity: commodityFilter, modal_price: { $gt: 0 } } },
    {
      $group: {
        _id: "$arrival_date",
        avg_price: { $avg: "$modal_price" },
        year: { $max: "$year" },
        month: { $max: "$month" },
        day: { $max: "$day" },
        fetched_at: { $max: "$fetched_at" },
        record_count: { $sum: 1 },
      },
    },
    {
      $sort: {
        year: -1,
        month: -1,
        day: -1,
        fetched_at: -1,
      },
    },
    { $limit: limit },
  ];

  const docs = await MandiPrice.aggregate(pipeline);
  return docs
    .filter((d) => Number.isFinite(d.avg_price) && d.avg_price > 0)
    .map((d) => ({
      date: d._id,
      price: Math.round(d.avg_price),
      source: "mandi_record",
      record_count: d.record_count,
    }));
}

async function fetchLiveAndStore(cropName) {
  const aliases = getAliases(cropName.toLowerCase());
  let totalInserted = 0;

  for (const alias of aliases) {
    try {
      const res = await axios.get(GOV_API_BASE, {
        params: {
          "api-key": GOV_API_KEY,
          format: "json",
          limit: 100,
          filters: `commodity:${alias}`,
        },
        timeout: 10000,
      });

      const records = res.data?.records || [];
      if (!records.length) continue;

      for (const r of records) {
        if (!r.arrival_date || !r.modal_price) continue;
        const parts = r.arrival_date.split("/");
        if (parts.length !== 3) continue;
        const [day, month, year] = parts.map(Number);
        if (!day || !month || !year) continue;

        try {
          await MandiPrice.updateOne(
            {
              commodity: cropName.toLowerCase(),
              market: r.market || "",
              arrival_date: r.arrival_date,
            },
            {
              $set: {
                state: r.state || "",
                district: r.district || "",
                market: r.market || "",
                commodity: cropName.toLowerCase(),
                api_commodity: r.commodity.trim(),
                variety: r.variety || "",
                grade: r.grade || "",
                arrival_date: r.arrival_date,
                day,
                month,
                year,
                min_price: +r.min_price || 0,
                max_price: +r.max_price || 0,
                modal_price: +r.modal_price,
                fetched_at: new Date(),
              },
            },
            { upsert: true },
          );
          totalInserted++;
        } catch (e) {
          if (e.code !== 11000) console.error("upsert err:", e.message);
        }
      }

      if (totalInserted > 0) break;
    } catch {}
  }

  return totalInserted;
}

function safeNum(val) {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function flaskPredictTomorrow(cropNorm) {
  try {
    const { data } = await axios.post(
      `${FLASK_URL}/predict-tomorrow`,
      { crop: cropNorm },
      { timeout: 8000 },
    );
    const price = safeNum(data?.predicted_price);
    if (price !== null) return Math.round(price);
  } catch (e1) {
    const status = e1.response?.status;
    if (status && status !== 404) return null;
  }

  try {
    const { day, month, year } = tomorrowDateObj();
    const { data } = await axios.post(
      `${FLASK_URL}/predict`,
      { crop: cropNorm, day, month, year },
      { timeout: 8000 },
    );
    const price = safeNum(data?.predicted_price);
    if (price !== null) return Math.round(price);
  } catch {}

  return null;
}

async function dbFallbackTomorrow(cropNorm) {
  try {
    const records = await getLatestCropPrices(cropNorm, 5);

    const valid = records.filter((r) => safeNum(r.price) !== null);
    if (!valid.length) return null;

    const sum = valid.reduce((s, r) => s + r.price, 0);
    const avg = Math.round(sum / valid.length);

    if (valid.length >= 2) {
      const newest = valid[0].price;
      const oldest = valid[valid.length - 1].price;
      const trendPct = oldest > 0 ? (newest - oldest) / oldest : 0;
      const capped = Math.max(-0.05, Math.min(0.05, trendPct));
      const result = Math.round(avg * (1 + capped));
      return Number.isFinite(result) && result > 0 ? result : avg;
    }

    return avg;
  } catch {
    return null;
  }
}

async function buildCropTimeline(cropName) {
  const cropNorm = cropName.toLowerCase();

  let records = await getLatestCropPrices(cropNorm, 3);

  if (records.length === 0) {
    await fetchLiveAndStore(cropName);
    records = await getLatestCropPrices(cropNorm, 3);
  }

  const todayEntry = records[0] || null;
  const yesterdayEntry = records[1] || null;

  let tomorrowPrice = await flaskPredictTomorrow(cropNorm);
  let tomorrowSource = "ml_predicted";

  if (tomorrowPrice == null) {
    tomorrowPrice = await dbFallbackTomorrow(cropNorm);
    tomorrowSource = tomorrowPrice != null ? "moving_avg_fallback" : "no_data";
  }

  let trend = "stable";
  let trendPct = 0;

  const basePrice =
    safeNum(todayEntry?.price) ?? safeNum(yesterdayEntry?.price) ?? null;
  const safeTomorrow = safeNum(tomorrowPrice);
  if (basePrice && safeTomorrow) {
    const diff = safeTomorrow - basePrice;
    const raw = (diff / basePrice) * 1000;
    trendPct = Number.isFinite(raw) ? Math.round(raw) / 10 : 0;
    trend = diff > 0 ? "up" : diff < 0 ? "down" : "stable";
  }

  const tom = new Date();
  tom.setDate(tom.getDate() + 1);

  return {
    name: cropName,
    unit: "quintal",
    yesterday: {
      price: yesterdayEntry?.price ?? null,
      source: yesterdayEntry ? "mandi_record" : "no_data",
      date: yesterdayEntry?.date ?? null,
      records: yesterdayEntry?.record_count ?? 0,
    },
    today: {
      price: todayEntry?.price ?? null,
      source: todayEntry ? "mandi_record" : "no_data",
      date: todayEntry?.date ?? null,
      records: todayEntry?.record_count ?? 0,
    },
    tomorrow: {
      price: tomorrowPrice ?? null,
      source: tomorrowSource,
      date: fmtDate(tom),
    },
    trend,
    trend_pct: trendPct,
    data_warnings: [
      ...(!todayEntry ? ["today_data_missing"] : []),
      ...(!yesterdayEntry ? ["yesterday_data_missing"] : []),
      ...(tomorrowSource === "moving_avg_fallback"
        ? ["tomorrow_ml_unavailable_used_fallback"]
        : []),
      ...(tomorrowSource === "no_data" ? ["tomorrow_no_data"] : []),
    ],
  };
}

async function ensureDairyMRP() {
  const today = fmtDate(new Date());
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  for (const item of DAIRY_MRP) {
    try {
      await DairyPrice.updateOne(
        { product: item.product, date: today },
        {
          $setOnInsert: {
            display_name: item.display_name,
            category: "dairy",
            cooperative: item.cooperative,
            price: item.mrp,
            unit: item.unit,
            date: today,
            day,
            month,
            year,
            base_price: item.mrp,
            variation: 0,
            fetched_at: new Date(),
          },
        },
        { upsert: true },
      );
    } catch (e) {
      if (e.code !== 11000) console.error("DairyPrice upsert:", e.message);
    }
  }
}

async function buildDairyTimeline(item) {
  const records = await DairyPrice.find(
    { product: item.product, price: { $gt: 0 } },
    { price: 1, date: 1, cooperative: 1 },
  )
    .sort({ year: -1, month: -1, day: -1, fetched_at: -1 })
    .limit(2)
    .lean();

  const todayRec = records[0] || null;
  const yesterdayRec = records[1] || null;

  const effectiveTodayPrice = todayRec?.price ?? item.mrp;
  const todaySource = todayRec ? "cooperative_mrp" : "mrp_fallback";

  const tomorrowRaw = predictDairyTomorrow(
    item.product,
    effectiveTodayPrice,
    item.mrp,
  );
  const tomorrowPrice = tomorrowRaw;
  const tomorrowSource = tomorrowPrice != null ? "seasonal_model" : "no_data";

  const tom = new Date();
  tom.setDate(tom.getDate() + 1);

  let trend = "stable";
  let trendPct = 0;
  if (effectiveTodayPrice && tomorrowPrice) {
    const diff = tomorrowPrice - effectiveTodayPrice;
    trendPct = Math.round((diff / effectiveTodayPrice) * 1000) / 10;
    trend = diff > 0 ? "up" : diff < 0 ? "down" : "stable";
  }

  return {
    name: item.display_name,
    product: item.product,
    unit: item.unit,
    cooperative: item.cooperative,
    yesterday: {
      price: yesterdayRec?.price ?? null,
      source: yesterdayRec ? "cooperative_mrp" : "no_data",
      date: yesterdayRec?.date ?? null,
    },
    today: {
      price: effectiveTodayPrice,
      source: todaySource,
      date: todayRec?.date ?? fmtDate(new Date()),
    },
    tomorrow: {
      price: tomorrowPrice ?? null,
      source: tomorrowSource,
      date: fmtDate(tom),
    },
    trend,
    trend_pct: trendPct,
    data_warnings: [
      ...(!todayRec ? ["today_used_published_mrp"] : []),
      ...(!yesterdayRec ? ["yesterday_data_missing"] : []),
      ...(tomorrowSource === "no_data" ? ["tomorrow_no_data"] : []),
    ],
  };
}

const getMarketIntelligence = async (req, res) => {
  try {
    const category = (req.query.category || "vegetables").toLowerCase();
    const cropsParam = req.query.crops;

    if (category === "dairy") {
      await ensureDairyMRP();
      const results = await Promise.all(DAIRY_MRP.map(buildDairyTimeline));
      return res.json({
        category: "dairy",
        date: fmtDate(new Date()),
        results,
      });
    }

    const crops = cropsParam
      ? cropsParam
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : (CATALOGUE[category] || CATALOGUE.vegetables).slice(0, 12);

    const results = await Promise.all(crops.map(buildCropTimeline));
    return res.json({ category, date: fmtDate(new Date()), results });
  } catch (err) {
    console.error("getMarketIntelligence:", err.message);
    return res
      .status(500)
      .json({ message: "Market intelligence failed", error: err.message });
  }
};

const getMarketPrices = async (req, res) => {
  try {
    const category = (req.query.category || "vegetables").toLowerCase();
    const cropsParam = req.query.crops;
    const crops = cropsParam
      ? cropsParam
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : (CATALOGUE[category] || CATALOGUE.vegetables).slice(0, 12);

    const results = await Promise.all(
      crops.map(async (cropName) => {
        const cropNorm = cropName.toLowerCase();
        let records = await getLatestCropPrices(cropNorm, 2);
        if (records.length < 2) {
          await fetchLiveAndStore(cropName);
          records = await getLatestCropPrices(cropNorm, 2);
        }
        return {
          name: cropName,
          unit: "quintal",
          yesterday: {
            price: records[1]?.price ?? null,
            source: records[1] ? "mandi_record" : "no_data",
            date: records[1]?.date ?? null,
          },
          today: {
            price: records[0]?.price ?? null,
            source: records[0] ? "mandi_record" : "no_data",
            date: records[0]?.date ?? null,
          },
        };
      }),
    );

    return res.json({ category, date: fmtDate(new Date()), results });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "getMarketPrices failed", error: err.message });
  }
};

const getDairyPrices = async (req, res) => {
  try {
    await ensureDairyMRP();
    const results = await Promise.all(DAIRY_MRP.map(buildDairyTimeline));
    return res.json({ category: "dairy", date: fmtDate(new Date()), results });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "getDairyPrices failed", error: err.message });
  }
};

const getCatalogue = (req, res) => {
  res.json({
    categories: {
      vegetables: {
        label: "Vegetables",
        icon: "🥬",
        crops: CATALOGUE.vegetables,
      },
      fruits: { label: "Fruits", icon: "🍎", crops: CATALOGUE.fruits },
      pulses: {
        label: "Pulses & Cereals",
        icon: "🌾",
        crops: CATALOGUE.pulses,
      },
      dairy: {
        label: "Dairy",
        icon: "🥛",
        products: DAIRY_MRP.map((d) => d.display_name),
      },
    },
  });
};

module.exports = {
  getCatalogue,
  getDairyPrices,
  getMarketPrices,
  getMarketIntelligence,
}
