const cron = require("node-cron");
const axios = require("axios");
const MandiPrice = require("../models/mandiPriceModel");

const GOV_API_BASE = process.env.GOV_API_BASE;
const GOV_API_KEY = process.env.GOV_API_KEY;

const CROPS_TO_REFRESH = [
  "Tomato",
  "Potato",
  "Onion",
  "Wheat",
  "Rice",
  "Maize",
  "Brinjal",
  "Cauliflower",
  "Cabbage",
  "Carrot",
  "Spinach",
  "Garlic",
  "Ginger",
  "Banana",
  "Mango",
  "Apple",
  "Grapes",
  "Orange",
  "Groundnut",
  "Soybean",
  "Mustard",
];

const COMMODITY_ALIASES = {
  "arhar dal": ["Arhar(Tur/Red Gram)(Whole)", "Tur", "Arhar Dal"],
  "chana dal": ["Bengal Gram(Split)", "Gram(Split)", "Chana Dal"],
  "masoor dal": ["Lentil", "Masur(Whole)", "Masoor Dal"],
  "urad dal": ["Black Gram(Urd Beans)(Whole)", "Urad(Whole)", "Urad Dal"],
  "moong dal": ["Green Gram(Whole)", "Moong(Whole)", "Moong Dal"],
  maize: ["Maize", "Corn"],
  soybean: ["Soybean", "Soya Bean"],
  groundnut: ["Groundnut", "Groundnut (With Shell)"],
  mustard: ["Mustard", "Mustard Seeds(Black)"],
  ladyfinger: ["Ladyfinger", "Bhindi(Ladies Finger)"],
  brinjal: ["Brinjal"],
  pomegranate: ["Pomegranate", "Anar"],
};

function getAliases(cropNorm) {
  if (COMMODITY_ALIASES[cropNorm]) return COMMODITY_ALIASES[cropNorm];
  return [cropNorm.charAt(0).toUpperCase() + cropNorm.slice(1), cropNorm];
}

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

async function fetchCrop(crop) {
  const normName = crop.trim().toLowerCase();
  const aliases = getAliases(normName);
  let totalInserted = 0;
  let aliasUsed = null;

  for (const alias of aliases) {
    let inserted = 0;
    try {
      const govRes = await axios.get(GOV_API_BASE, {
        params: {
          "api-key": GOV_API_KEY,
          format: "json",
          limit: 100,
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
            console.error(
              `[MandiScheduler] upsert error for ${crop}:`,
              e.message,
            );
        }
      }
    } catch (err) {
      console.error(`[MandiScheduler] API error for "${alias}":`, err.message);
    }

    if (inserted > 0) {
      totalInserted += inserted;
      aliasUsed = alias;
      break;
    }
  }
  return { crop, inserted: totalInserted, aliasUsed };
}

async function runMandiRefresh() {
  console.log(
    `[MandiScheduler] ⏰ Daily mandi refresh started at ${new Date().toISOString()}`,
  );
  let totalInserted = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  for (const crop of CROPS_TO_REFRESH) {
    try {
      const { inserted, aliasUsed } = await fetchCrop(crop);
      if (inserted > 0) {
        console.log(
          `[MandiScheduler] ✅ ${crop}: ${inserted} records (alias: ${aliasUsed})`,
        );
        totalInserted += inserted;
        totalSuccess++;
      } else {
        console.log(`[MandiScheduler] ⚠️  ${crop}: no records found`);
        totalFailed++;
      }
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`[MandiScheduler] ❌ ${crop} failed:`, err.message);
      totalFailed++;
    }
  }

  console.log(
    `[MandiScheduler] ✔ Refresh complete — ${totalSuccess} crops updated, ` +
      `${totalFailed} with no data, ${totalInserted} total records upserted.`,
  );
}

function startMandiScheduler() {
  cron.schedule("30 0 * * *", runMandiRefresh, {
    scheduled: true,
    timezone: "Asia/Kolkata",
  });
  console.log(
    "[MandiScheduler] 🗓  Scheduled: daily mandi price refresh at 06:00 IST",
  );
}

module.exports = { startMandiScheduler, runMandiRefresh };
