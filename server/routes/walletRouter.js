const express = require("express");
const {
  getWalletBalance,
  topUpWallet,
  deductWallet,
} = require("../controllers/walletController");

const router = express.Router();

// GET  /wallet/:email        — fetch balance
router.get("/:email", getWalletBalance);

// POST /wallet/topup         — add funds (validated, atomic)
router.post("/topup", topUpWallet);

// POST /wallet/deduct        — internal deduct endpoint
router.post("/deduct", deductWallet);

module.exports = router;
