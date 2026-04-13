const express = require("express");
const router  = express.Router();

const {
  fetchAndStoreMandi,
  getMandiPrices,
  predictPrice,
  profitComparison,
  productProfitComparison,
} = require("../controllers/mandiController");

const {
  getMarketPrices,
  getMarketIntelligence,
  getDairyPrices,
  getCatalogue,
} = require("../controllers/marketIntelligenceController");

const { runMandiRefresh } = require("../utils/mandiScheduler");

// ── Mandi raw data ────────────────────────────────────────────────────────────
router.get("/fetch",  fetchAndStoreMandi);
router.get("/prices", getMandiPrices);

// ── Manual trigger for scheduled refresh (admin/testing) ──────────────────────
router.post("/refresh-all", async (req, res) => {
  try {
    // Run in background — respond immediately so the HTTP request doesn't time out
    res.json({ message: "Mandi price refresh started for all crops. Check server logs for progress." });
    await runMandiRefresh();
  } catch (err) {
    console.error("[MandiRouter] refresh-all error:", err.message);
  }
});

// ── ML price prediction ───────────────────────────────────────────────────────
router.post("/predict-price",    predictPrice);
router.post("/profit-comparison", profitComparison);

// ── Farmer product comparison ─────────────────────────────────────────────────
router.get("/product-profit", productProfitComparison);

// ── Market Intelligence (yesterday / today / tomorrow) ────────────────────────
router.get("/market-intelligence", getMarketIntelligence);   // all categories
router.get("/market-prices",       getMarketPrices);          // yesterday+today only
router.get("/dairy-prices",        getDairyPrices);           // dairy only
router.get("/catalogue",           getCatalogue);             // crop lists

module.exports = router;
