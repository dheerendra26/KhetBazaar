/**
 * seed-mandi.js  v2
 *
 * Fetches real mandi data from data.gov.in for all catalogue crops.
 * Uses offset pagination to get as many records as possible (up to 500 per crop).
 * Seeds dairy MRP records for today.
 * Retrains the Flask ML model.
 *
 * Usage:
 *   node seed-mandi.js
 *   node seed-mandi.js --crops Tomato,Potato   (specific crops only)
 */

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const axios    = require("axios");

const MONGO_URI   = process.env.MONGO_URI   || "mongodb+srv://sawanisaxena_db_user:8ezx7RmypsjwZIyn@cluster0.wtnvv3i.mongodb.net/test";
const FLASK_URL   = process.env.FLASK_URL   || "http://localhost:5001";
const GOV_API_KEY = process.env.GOV_API_KEY || "579b464db66ec23bdd0000015c8aa5d6fcd349ab644211178c18504c";
const GOV_API_BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const MandiPrice = require("./models/mandiPriceModel");
const DairyPrice = require("./models/dairyPriceModel");

// All crops across all categories
const ALL_CROPS = [
  // vegetables
  "Tomato","Potato","Onion","Brinjal","Cauliflower","Cabbage","Carrot","Spinach","Garlic","Ginger","Ladyfinger","Peas",
  // fruits
  "Banana","Mango","Apple","Grapes","Orange","Lemon","Papaya","Pomegranate","Watermelon","Guava",
  // pulses/cereals
  "Wheat","Rice","Maize","Moong Dal","Chana Dal","Masoor Dal","Arhar Dal","Urad Dal","Soybean","Groundnut","Mustard","Bajra",
];

const DAIRY_MRP = [
  { product: "milk_full_cream",   display_name: "Full Cream Milk",    cooperative: "Amul",         mrp: 68,  unit: "litre" },
  { product: "milk_toned",        display_name: "Toned Milk",         cooperative: "Mother Dairy", mrp: 56,  unit: "litre" },
  { product: "milk_double_toned", display_name: "Double Toned Milk",  cooperative: "Verka",        mrp: 50,  unit: "litre" },
  { product: "curd_500g",         display_name: "Curd (500g)",        cooperative: "Amul",         mrp: 30,  unit: "500g"  },
  { product: "paneer_200g",       display_name: "Paneer (200g)",      cooperative: "Mother Dairy", mrp: 96,  unit: "200g"  },
  { product: "butter_500g",       display_name: "Butter (500g)",      cooperative: "Amul",         mrp: 275, unit: "500g"  },
  { product: "ghee_1kg",          display_name: "Desi Ghee (1kg)",    cooperative: "Amul",         mrp: 660, unit: "kg"    },
  { product: "cheese_200g",       display_name: "Cheese Slice (200g)",cooperative: "Amul",         mrp: 135, unit: "200g"  },
];

function fmtDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// ── Commodity alias map ────────────────────────────────────────────────────────
// The Agmarknet API uses botanical/trade names, not the dal names farmers use.
// Key   = display name (as in ALL_CROPS, lowercased for matching)
// Value = API commodity strings to try, in order of likelihood
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

function getAliases(cropName) {
  const key = cropName.trim().toLowerCase();
  return COMMODITY_ALIASES[key] || [cropName];
}

async function fetchCropPage(commodity, offset = 0, limit = 100) {
  const res = await axios.get(GOV_API_BASE, {
    params: {
      "api-key": GOV_API_KEY,
      format: "json",
      limit,
      offset,
      "filters[commodity]": commodity,
    },
    timeout: 60000,
  });
  return res.data?.records || [];
}

async function upsertRecords(records, normalisedName) {
  let upserted = 0;
  for (const r of records) {
    if (!r.arrival_date || !r.modal_price) continue;
    const parts = r.arrival_date.split("/");
    if (parts.length !== 3) continue;
    const [day, month, year] = parts.map(Number);
    if (!day || !month || !year) continue;
    try {
      await MandiPrice.updateOne(
        {
          commodity:    normalisedName,          // always the normalised display name
          market:       r.market || "",
          arrival_date: r.arrival_date,
        },
        {
          $set: {
            state: r.state || "", district: r.district || "", market: r.market || "",
            commodity:     normalisedName,        // normalised key — consistent across aliases
            api_commodity: r.commodity.trim(),   // original API value (for debugging)
            variety: r.variety || "", grade: r.grade || "",
            arrival_date: r.arrival_date, day, month, year,
            min_price: +r.min_price || 0, max_price: +r.max_price || 0,
            modal_price: +r.modal_price, fetched_at: new Date(),
          },
        },
        { upsert: true }
      );
      upserted++;
    } catch (e) {
      if (e.code !== 11000) console.error(`  upsert err: ${e.message}`);
    }
  }
  return upserted;
}

async function fetchCrop(cropDisplayName) {
  const normalisedName = cropDisplayName.trim().toLowerCase();
  const aliases        = getAliases(cropDisplayName);
  let totalUpserted    = 0;
  let successAlias     = null;

  // Try each alias until one returns records
  for (const alias of aliases) {
    let aliasUpserted = 0;
    let offset = 0;
    const pageSize   = 100;
    const maxRecords = 500;

    while (offset < maxRecords) {
      try {
        const records = await fetchCropPage(alias, offset, pageSize);
        if (!records.length) break;
        aliasUpserted += await upsertRecords(records, normalisedName);
        if (records.length < pageSize) break;
        offset += pageSize;
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`  ✗ ${cropDisplayName} (alias "${alias}", offset ${offset}): ${err.message}`);
        break;
      }
    }

    if (aliasUpserted > 0) {
      totalUpserted += aliasUpserted;
      successAlias   = alias;
      break; // this alias worked — don't try the rest
    }
  }

  const distinctDates = await MandiPrice.distinct("arrival_date", { commodity: normalisedName });
  const aliasNote     = successAlias && successAlias !== cropDisplayName ? ` (via API name: "${successAlias}")` : "";
  console.log(`  ✓ ${cropDisplayName}${aliasNote}: ${totalUpserted} records, ${distinctDates.length} distinct dates`);
  if (totalUpserted === 0) {
    console.warn(`  ⚠ ${cropDisplayName}: No records found under any alias. Tried: ${aliases.join(", ")}`);
  }
  return totalUpserted;
}

async function seedDairy() {
  const today = fmtDate(new Date());
  const now   = new Date();
  const day   = now.getDate();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  let seeded = 0;
  for (const item of DAIRY_MRP) {
    try {
      const result = await DairyPrice.updateOne(
        { product: item.product, date: today },
        {
          $setOnInsert: {
            display_name: item.display_name,
            category:     "dairy",
            cooperative:  item.cooperative,
            price:        item.mrp,
            unit:         item.unit,
            date:         today,
            day, month, year,
            base_price:   item.mrp,
            variation:    0,
            fetched_at:   new Date(),
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount) seeded++;
    } catch (e) {
      if (e.code !== 11000) console.error(`  dairy err: ${e.message}`);
    }
  }
  console.log(`  ✓ Dairy: ${seeded} new records seeded for ${today} (${DAIRY_MRP.length} products)`);
}

async function retrain() {
  try {
    const res = await axios.post(`${FLASK_URL}/retrain`, {}, { timeout: 90000 });
    console.log(`  ✓ ML model retrained: ${res.data.message}`);
    if (res.data.n_crops) console.log(`  ✓ Crops in model: ${res.data.n_crops}`);
  } catch (err) {
    console.warn(`  ⚠ Could not retrain model: ${err.message}`);
    console.warn(`  → Start Flask first: cd flask-ml && python app.py`);
  }
}

async function main() {
  console.log("🌾 KhetBazaar Mandi Seeder v2\n");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  // Parse --crops flag
  const cropArg = process.argv.find(a => a.startsWith("--crops=") || a.startsWith("--crops"));
  let crops = ALL_CROPS;
  if (cropArg) {
    const val = cropArg.includes("=") ? cropArg.split("=")[1] : process.argv[process.argv.indexOf(cropArg) + 1];
    if (val) crops = val.split(",").map(c => c.trim()).filter(Boolean);
  }

  console.log(`📥 Fetching ${crops.length} crops from data.gov.in …\n`);
  let total = 0;
  for (const crop of crops) {
    total += await fetchCrop(crop);
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n✅ Mandi records in DB: ${await MandiPrice.countDocuments()}\n`);

  console.log("🥛 Seeding dairy MRP records …");
  await seedDairy();

  // Show per-crop distinct date count to verify data quality
  console.log("\n📊 Distinct date counts per crop:");
  for (const crop of crops.slice(0, 8)) {
    const n = await MandiPrice.countDocuments({ commodity: crop.toLowerCase() });
    const dates = await MandiPrice.distinct("arrival_date", { commodity: crop.toLowerCase() });
    console.log(`   ${crop}: ${n} records, ${dates.length} dates. Latest: ${dates.sort().reverse()[0] || "none"}`);
  }

  console.log("\n🤖 Triggering ML model retraining …");
  await retrain();

  console.log("\n🎉 Seed complete!");
  console.log("   - Run: node seed-mandi.js --crops Tomato,Potato to refresh specific crops");
  console.log("   - Market intelligence API: GET /mandi/market-intelligence?category=vegetables");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
