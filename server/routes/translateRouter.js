const express = require("express");

const {
  translateText,
  batchTranslate,
} = require("../controllers/translateController");

const router = express.Router();

router.get("/translate", translateText);

router.post("/translate/batch", batchTranslate);

module.exports = router;