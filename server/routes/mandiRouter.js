const express = require("express");
const router = express.Router();

const {
  fetchAndStoreMandi,
  getMandiPrices,
  predictPrice,
  profitComparison,
  productProfitComparison,
  refreshAll
} = require("../controllers/mandiController");

const {
  getMarketPrices,
  getMarketIntelligence,
  getDairyPrices,
  getCatalogue,
} = require("../controllers/marketIntelligenceController");

const { runMandiRefresh } = require("../utils/mandiScheduler");

router.get("/fetch", fetchAndStoreMandi);
router.get("/prices", getMandiPrices);

router.post("/refresh-all", refreshAll);

router.post("/predict-price", predictPrice);
router.post("/profit-comparison", profitComparison);

router.get("/product-profit", productProfitComparison);

router.get("/market-intelligence", getMarketIntelligence);
router.get("/market-prices", getMarketPrices);
router.get("/dairy-prices", getDairyPrices);
router.get("/catalogue", getCatalogue);

module.exports = router;
