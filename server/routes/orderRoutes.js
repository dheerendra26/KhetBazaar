const express = require("express");

const { placeOrder } = require("../controllers/orderController");

const router = express.Router();

router.post("/", placeOrder);

module.exports = router;