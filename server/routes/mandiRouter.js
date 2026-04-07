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

// ── Mandi raw data ────────────────────────────────────────────────────────────
router.get("/fetch",  fetchAndStoreMandi);
router.get("/prices", getMandiPrices);

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
