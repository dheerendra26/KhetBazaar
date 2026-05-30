const axios = require("axios");
const MandiPrice = require("../models/mandiPriceModel");

const GOV_API_BASE = process.env.GOV_API_BASE;
const GOV_API_KEY = process.env.GOV_API_KEY;

const FLASK_URL = process.env.FLASK_URL;

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

function getApiAliases(cropNorm) {
  return (
    COMMODITY_ALIASES[cropNorm] || [
      cropNorm.charAt(0).toUpperCase() + cropNorm.slice(1),
      cropNorm,
    ]
  );
}

function getAllAliasesLower(cropNorm) {
  const aliases = getApiAliases(cropNorm);
  return [...new Set([cropNorm, ...aliases.map((a) => a.toLowerCase())])];
}

const FARMER_RECEIVES_PCT = 0.7;
const DIRECT_PRICE_MULTIPLIER = 1.2;

function parseArrivalDate(dateStr) {
  if (!dateStr) return {};
  const parts = dateStr.split("/");
  if (parts.length !== 3) return {};
  return {
    day: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    year: parseInt(parts[2], 10),
  };
}

const {
  resolveCategory: _resolveCategory,
} = require("../utils/categoryMapper");
function normaliseCrop(name) {
  if (!name) return "";
  const resolved = _resolveCategory(name.trim());
  if (resolved.confidence !== "default") {
    return resolved.canonical.toLowerCase();
  }
  return name.trim().toLowerCase();
}

const BASELINE_PRICES = {
  potato: 18,
  tomato: 25,
  onion: 20,
  garlic: 120,
  ginger: 60,
  cauliflower: 25,
  cabbage: 15,
  carrot: 30,
  spinach: 20,
  brinjal: 22,
  ladyfinger: 35,
  peas: 45,
  capsicum: 40,
  "green chilli": 30,
  cucumber: 20,
  pumpkin: 18,
  "bottle gourd": 20,
  "bitter gourd": 30,
  radish: 15,
  beetroot: 25,
  "sweet corn": 20,
  coriander: 40,
  fenugreek: 30,
  mushroom: 80,
  mango: 60,
  banana: 35,
  apple: 120,
  grapes: 80,
  orange: 50,
  papaya: 25,
  watermelon: 15,
  guava: 35,
  pomegranate: 90,
  lemon: 40,
  pineapple: 45,
  coconut: 30,
  litchi: 70,
  plum: 60,
  jackfruit: 20,
  milk: 55,
  curd: 45,
  butter: 500,
  ghee: 600,
  paneer: 300,
  cheese: 400,
  buttermilk: 25,
  cream: 200,
  khoya: 250,
  wheat: 22,
  rice: 32,
  "mustard seeds": 65,
  mustard: 65,
  soybean: 40,
  groundnut: 70,
  lentils: 90,
  chickpea: 75,
  "moong dal": 90,
  "urad dal": 95,
  "arhar dal": 100,
  bajra: 18,
  jowar: 20,
  maize: 20,
  sesame: 110,
  cotton: 65,
  sugarcane: 3,
  default: 30,
};

async function fetchMandiPriceForCrop(cropName) {
  const canonicalKey = normaliseCrop(cropName);

  const aliasesLower = getAllAliasesLower(canonicalKey);
  const dbFilter =
    aliasesLower.length === 1 ? aliasesLower[0] : { $in: aliasesLower };

  try {
    const pipeline = [
      { $match: { commodity: dbFilter, modal_price: { $gt: 0 } } },
      {
        $group: {
          _id: "$arrival_date",
          avg_price: { $avg: "$modal_price" },
          year: { $max: "$year" },
          month: { $max: "$month" },
          day: { $max: "$day" },
        },
      },
      { $sort: { year: -1, month: -1, day: -1 } },
      { $limit: 3 },
    ];
    const records = await MandiPrice.aggregate(pipeline);
    const valid = records.filter((r) => r.avg_price > 0);
    if (valid.length > 0) {
      const pricePerKg = +(valid[0].avg_price / 100).toFixed(2);
      return { pricePerKg, source: "mandi_db", estimated: false };
    }
  } catch {}

  try {
    const now = new Date();
    const flaskRes = await axios.post(
      `${FLASK_URL}/predict`,
      {
        crop: canonicalKey,
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
      { timeout: 5000 },
    );
    const raw = flaskRes.data?.predicted_price;
    if (raw && Number.isFinite(Number(raw)) && Number(raw) > 0) {
      const pricePerKg = +(Number(raw) / 100).toFixed(2);
      return { pricePerKg, source: "ml_predicted", estimated: true };
    }
  } catch {}

  const base = BASELINE_PRICES[canonicalKey] || BASELINE_PRICES.default;

  const month = new Date().getMonth();
  const seasonal = [
    1.1, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85, 0.9, 1.0, 1.05, 1.1,
  ][month];
  const pricePerKg = +(base * seasonal).toFixed(2);
  return { pricePerKg, source: "baseline", estimated: true };
}

exports.productProfitComparison = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "email is required" });

    const Product = require("../models/productModel");

    const products = await Product.find({
      email,
      isActive: { $ne: false },
    }).select("name price unit stock soldCount category");

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found for this farmer" });
    }

    const results = await Promise.all(
      products.map(async (p) => {
        const farmerPrice = p.price;

        const { pricePerKg, source, estimated } = await fetchMandiPriceForCrop(
          p.name,
        );

        const mandiPrice = pricePerKg;

        const mandiEarningsPerUnit = +(
          mandiPrice * FARMER_RECEIVES_PCT
        ).toFixed(2);

        const directEarningsPerUnit = farmerPrice;

        const safeMandiEarnings =
          mandiEarningsPerUnit > 0 ? mandiEarningsPerUnit : 1;

        const gainPerUnit = +(
          directEarningsPerUnit - mandiEarningsPerUnit
        ).toFixed(2);

        const gainPct = +((gainPerUnit / safeMandiEarnings) * 100).toFixed(1);

        const barPct = Math.min(
          99,
          Math.max(
            5,
            Math.round(
              (mandiEarningsPerUnit / Math.max(directEarningsPerUnit, 1)) * 100,
            ),
          ),
        );

        const qty = p.stock || 1;
        const projectedMandiEarnings = +(mandiEarningsPerUnit * qty).toFixed(2);
        const projectedDirectEarnings = +(directEarningsPerUnit * qty).toFixed(
          2,
        );
        const projectedGain = +(
          projectedDirectEarnings - projectedMandiEarnings
        ).toFixed(2);

        return {
          product_id: p._id,
          product_name: p.name,
          category: p.category,
          unit: p.unit || "kg",
          stock: qty,
          sold_count: p.soldCount || 0,
          your_khetbazaar_price: farmerPrice,
          mandi_modal_price: mandiPrice,
          mandi_source: source,
          mandi_estimated: estimated,
          bar_pct: barPct,
          per_unit: {
            via_mandi: mandiEarningsPerUnit,
            on_khetbazaar: directEarningsPerUnit,
            gain: gainPerUnit,
            gain_pct: gainPct,
          },
          projected: {
            quantity: qty,
            via_mandi: projectedMandiEarnings,
            on_khetbazaar: projectedDirectEarnings,
            extra_earned: projectedGain,
          },
          note: estimated
            ? `Mandi price estimated from ${source === "ml_predicted" ? "ML model" : "baseline seasonal data"} — live data pending`
            : "Mandi price from government data.gov.in records",
        };
      }),
    );

    results.sort((a, b) => b.projected.extra_earned - a.projected.extra_earned);

    const totalExtraEarned = +results
      .reduce((s, r) => s + r.projected.extra_earned, 0)
      .toFixed(2);

    return res.json({
      email,
      total_products: results.length,
      total_extra_earned_vs_mandi: totalExtraEarned,
      message: `By selling on KhetBazaar you earn ₹${totalExtraEarned.toLocaleString("en-IN")} more than going through a mandi middleman`,
      products: results,
    });
  } catch (err) {
    console.error("productProfitComparison error:", err.message);
    return res
      .status(500)
      .json({ message: "Comparison failed", error: err.message });
  }
};

exports.fetchAndStoreMandi = async (req, res) => {
  try {
    const commodity = req.query.commodity || "Tomato";
    const limit = parseInt(req.query.limit) || 100;
    const normName = normaliseCrop(commodity);
    const aliases = getApiAliases(normName);

    let totalInserted = 0;
    let successAlias = null;

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
                commodity: normName,
                market: r.market || "",
                arrival_date: r.arrival_date || "",
              },
              {
                $set: {
                  state: r.state || "",
                  district: r.district || "",
                  market: r.market || "",
                  commodity: normName,
                  api_commodity: r.commodity.trim(),
                  variety: r.variety || "",
                  grade: r.grade || "",
                  arrival_date: r.arrival_date || "",
                  ...dateParts,
                  min_price: Number(r.min_price) || 0,
                  max_price: Number(r.max_price) || 0,
                  modal_price: Number(r.modal_price),
                  fetched_at: new Date(),
                },
              },
              { upsert: true },
            );
            inserted++;
          } catch (e) {
            if (e.code !== 11000)
              console.error("MandiPrice upsert error:", e.message);
          }
        }
      } catch (err) {
        console.error(
          `fetchAndStoreMandi alias "${alias}" error:`,
          err.message,
        );
      }

      if (inserted > 0) {
        totalInserted += inserted;
        successAlias = alias;
        break;
      }
    }

    return res.json({
      message: `Fetched and upserted ${totalInserted} records for "${commodity}"`,
      inserted: totalInserted,
      api_alias_used: successAlias || "none",
      ...(totalInserted === 0 && {
        hint: `No records found. Tried API names: ${aliases.join(", ")}. The crop may not be in Agmarknet dataset.`,
      }),
    });
  } catch (err) {
    console.error("fetchAndStoreMandi error:", err.message);
    return res
      .status(500)
      .json({ message: "Failed to fetch mandi data", error: err.message });
  }
};

exports.getMandiPrices = async (req, res) => {
  try {
    const { commodity, state, limit = 50 } = req.query;
    const filter = {};

    if (commodity) {
      const norm = normaliseCrop(commodity);
      const allNames = getAllAliasesLower(norm);
      filter.commodity =
        allNames.length === 1 ? allNames[0] : { $in: allNames };
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

exports.predictPrice = async (req, res) => {
  try {
    const { crop, date } = req.body;
    if (!crop) return res.status(400).json({ message: "crop is required" });

    const cropNorm = normaliseCrop(crop);

    let day, month, year;
    if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return res
          .status(400)
          .json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }
      day = d.getDate();
      month = d.getMonth() + 1;
      year = d.getFullYear();
    } else {
      const now = new Date();
      day = now.getDate();
      month = now.getMonth() + 1;
      year = now.getFullYear();
    }

    try {
      const flaskRes = await axios.post(
        `${FLASK_URL}/predict`,
        { crop: cropNorm, day, month, year },
        { timeout: 10000 },
      );

      const predicted_price = Number(flaskRes.data?.predicted_price);
      const unit = flaskRes.data?.unit || "quintal";

      if (Number.isFinite(predicted_price) && predicted_price > 0) {
        return res.json({
          crop,
          date: date || new Date().toISOString().split("T")[0],
          predicted_price,
          unit,
          source: "ml_predicted",
        });
      }
    } catch (flaskErr) {
      if (flaskErr.response?.status && flaskErr.response.status < 500) {
        console.error(
          "predictPrice Flask error:",
          flaskErr.response?.data || flaskErr.message,
        );
      }
    }

    const pipeline = [
      { $match: { commodity: cropNorm, modal_price: { $gt: 0 } } },
      {
        $group: {
          _id: "$arrival_date",
          avg_price: { $avg: "$modal_price" },
          year: { $max: "$year" },
          month: { $max: "$month" },
          day: { $max: "$day" },
        },
      },
      { $sort: { year: -1, month: -1, day: -1 } },
      { $limit: 5 },
    ];

    const dbRecords = await MandiPrice.aggregate(pipeline);
    const valid = dbRecords.filter(
      (r) => Number.isFinite(r.avg_price) && r.avg_price > 0,
    );

    if (valid.length > 0) {
      const movAvg = valid.reduce((s, r) => s + r.avg_price, 0) / valid.length;

      let predicted_price = movAvg;
      if (valid.length >= 2) {
        const newest = valid[0].avg_price;
        const oldest = valid[valid.length - 1].avg_price;
        const trendPct = Math.max(
          -0.05,
          Math.min(0.05, (newest - oldest) / oldest),
        );
        predicted_price = movAvg * (1 + trendPct);
      }

      predicted_price = Math.round(predicted_price * 100) / 100; // 2 dp

      return res.json({
        crop,
        date: date || new Date().toISOString().split("T")[0],
        predicted_price,
        unit: "quintal",
        source: valid.length >= 2 ? "moving_avg_fallback" : "mandi_db",
        note: "ML service unavailable — price derived from recent mandi records",
      });
    }

    return res.status(404).json({
      message: `No price data found for crop: ${crop}. Fetch mandi records first via /mandi/fetch?commodity=${encodeURIComponent(crop)}`,
      crop,
    });
  } catch (err) {
    console.error("predictPrice error:", err.message);
    return res
      .status(500)
      .json({ message: "Price prediction failed", error: err.message });
  }
};

exports.profitComparison = async (req, res) => {
  try {
    const { crop, date, quantity_kg } = req.body;
    if (!crop) return res.status(400).json({ message: "crop is required" });

    const qty = parseFloat(quantity_kg) || 100;

    let day, month, year;
    if (date) {
      const d = new Date(date);
      day = d.getDate();
      month = d.getMonth() + 1;
      year = d.getFullYear();
    } else {
      const now = new Date();
      day = now.getDate();
      month = now.getMonth() + 1;
      year = now.getFullYear();
    }

    let modalPrice = null;
    try {
      const flaskRes = await axios.post(
        `${FLASK_URL}/predict`,
        {
          crop: normaliseCrop(crop),
          day,
          month,
          year,
        },
        { timeout: 10000 },
      );
      const raw = Number(flaskRes.data?.predicted_price);
      if (Number.isFinite(raw) && raw > 0) modalPrice = raw;
    } catch {}

    if (!modalPrice) {
      const latest = await MandiPrice.findOne(
        { commodity: normaliseCrop(crop), modal_price: { $gt: 0 } },
        {},
        { sort: { year: -1, month: -1, day: -1 } },
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

    const pricePerKg = modalPrice / 100;

    const withMiddlemanPerKg = pricePerKg * FARMER_RECEIVES_PCT;

    const withoutMiddlemanPerKg = pricePerKg * DIRECT_PRICE_MULTIPLIER;

    const earningsWithMiddleman = +(withMiddlemanPerKg * qty).toFixed(2);
    const earningsWithoutMiddleman = +(withoutMiddlemanPerKg * qty).toFixed(2);
    const profitGain = +(
      earningsWithoutMiddleman - earningsWithMiddleman
    ).toFixed(2);
    //const profitGainPct            = +(( profitGain / earningsWithMiddleman ) * 100).toFixed(1);

    return res.json({
      crop,
      quantity_kg: qty,
      modal_price_per_quintal: modalPrice,
      price_per_kg: +pricePerKg.toFixed(2),
      with_middleman: {
        price_per_kg: +withMiddlemanPerKg.toFixed(2),
        total_earnings: earningsWithMiddleman,
        note: `Farmer receives ~${(FARMER_RECEIVES_PCT * 100).toFixed(0)}% of modal price after commission agent fees, mandi tax, transport & loading charges`,
        deductions_breakdown: {
          commission_agent: "~6% of modal price",
          mandi_tax: "~1%",
          transport: "~2%",
          loading_weighing: "~1%",
          total_approx: "~30% deducted",
        },
      },
      without_middleman: {
        price_per_kg: +withoutMiddlemanPerKg.toFixed(2),
        total_earnings: earningsWithoutMiddleman,
        note: `Direct sale price = ${(DIRECT_PRICE_MULTIPLIER * 100).toFixed(0)}% of modal price — above mandi rate, below retail, fair for both farmer and consumer`,
        basis:
          "Based on eNAM & FPO direct marketing data: farmers earn 15-25% above modal price when selling directly",
      },
      profit_gain: profitGain,
      // profit_gain_pct: profitGainPct,
    });
  } catch (err) {
    console.error("profitComparison error:", err.message);
    return res
      .status(500)
      .json({ message: "Profit comparison failed", error: err.message });
  }
};
