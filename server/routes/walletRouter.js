const express = require("express");
const {
  getWalletBalance,
  topUpWallet,
  deductWallet,
} = require("../controllers/walletController");

const router = express.Router();

router.get("/:email", getWalletBalance);

router.post("/topup", topUpWallet);

router.post("/deduct", deductWallet);

module.exports = router;
