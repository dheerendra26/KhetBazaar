const express = require("express");
const {
    createOrder,
    verifyPayment
} = require("../controllers/razorpayController");

const router = express.Router();

router.post("/create-order", createOrder);

router.post("/verify-payment", verifyPayment);

module.exports = router;