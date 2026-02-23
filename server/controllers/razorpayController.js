const crypto = require("crypto");
const razorpay = require('../utils/razorpay');

module.exports.createOrder = async (req, res) => {
    const { amount } = req.body;

    try {
        const options = {
            amount: amount * 100, // paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({ order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create order" });
    }
};

module.exports.verifyPayment = async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    } = req.body;

    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            return res.status(200).json({ success: true });
        }

        res.status(400).json({ success: false, message: "Invalid signature" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Payment verification failed" });
    }
};
