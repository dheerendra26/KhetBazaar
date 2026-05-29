const crypto   = require("crypto");
const razorpay = require("../utils/razorpay");
const userModel = require("../models/userModel");
const Product   = require("../models/productModel");
const {
  sendOrderConfirmationToCustomer,
  sendOrderNotificationToFarmer,
} = require("../utils/sendEmail");

/* ─────────────────────────────────────────────────────────────────────────────
   POST /payments/razorpay/create-order
   Creates a Razorpay order for the given amount.
   No emails sent here — payment has not been confirmed yet.
───────────────────────────────────────────────────────────────────────────── */
module.exports.createOrder = async (req, res) => {
  const { amount } = req.body;
  try {
    const options = {
      amount:   Math.round(amount * 100), // paise
      currency: "INR",
      receipt:  `kb_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.status(200).json({ order });
  } catch (error) {
    console.error("createOrder error:", error);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   POST /payments/razorpay/verify-payment
   Called by frontend after Razorpay checkout succeeds.

   Request body:
     - razorpay_order_id
     - razorpay_payment_id
     - razorpay_signature
     - buyerEmail       (who is buying)
     - items            (cart items, same shape as /orders route)

   Flow:
     1. Verify Razorpay signature (cryptographic check)
     2. Save order items to buyer's user document
     3. Update product stock / soldCount
     4. Fetch farmer details for each seller
     5. Send rich confirmation email to CUSTOMER (includes farmer contact)
     6. Send rich notification email to each FARMER (includes buyer contact)
     7. Return success
───────────────────────────────────────────────────────────────────────────── */
module.exports.verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    buyerEmail,
    items,
    buyerAddress,   // delivery address entered at checkout — sent to farmer email only
  } = req.body;

  try {
    /* ── Step 1: Verify Razorpay signature ── */
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed — invalid signature",
      });
    }

    /* ── Step 2: Fetch buyer from DB ── */
    const user = await userModel.findOne({ email: buyerEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "Buyer not found" });
    }

    const totalPrice = items.reduce(
      (sum, item) => sum + item.productPrice * item.quantity,
      0
    );

    /* ── Step 3: Save order items to buyer's document ── */
    const orderItemsWithDate = items.map((item) => ({
      productId:     item.productId,
      productName:   item.productName,
      productPrice:  item.productPrice,
      quantity:      item.quantity,
      totalPrice:    item.totalPrice,
      sellerEmail:   item.sellerEmail,
      buyerEmail:    buyerEmail,
      paymentMethod: "razorpay",
      orderDate:     new Date(),
      status:        "placed",
      statusHistory: [{ status: "placed", updatedAt: new Date() }],
    }));

    user.orders.push(...orderItemsWithDate);
    user.notifications.push({
      message: `🎉 Order placed for ${items.length} item(s). Total: ₹${totalPrice}`,
      type: "order",
    });
    await user.save();

    /* ── Step 4: Update product stock + soldCount ── */
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { soldCount: item.quantity, stock: -item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOps);

    /* ── Step 5: Group items by seller & fetch farmer details ── */
    const sellerItemsMap = items.reduce((acc, item) => {
      const se = item.sellerEmail;
      if (!acc[se]) acc[se] = [];
      acc[se].push(item);
      return acc;
    }, {});

    const farmerCache = {}; // sellerEmail -> { name, contact, email }
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const se = item.sellerEmail;
        if (!farmerCache[se]) {
          const farmerDoc = await userModel
            .findOne({ email: se })
            .select("name contact");
          farmerCache[se] = {
            name:    farmerDoc?.name    || se,
            contact: farmerDoc?.contact || "",
            email:   se,
          };
        }
        return {
          ...item,
          farmerName:    farmerCache[se].name,
          farmerContact: farmerCache[se].contact,
        };
      })
    );

    const buyerInfo = {
      name:    user.name    || "",
      email:   buyerEmail,
      contact: user.contact || "",
      // Use the delivery address entered at checkout (overrides profile address).
      // Goes to farmer email only — never returned in any API response.
      address: (buyerAddress && buyerAddress.trim()) ? buyerAddress.trim() : (user.address || ""),
    };

    /* ── Step 6: Email to CUSTOMER (non-blocking) ── */
    sendOrderConfirmationToCustomer({
      buyer:         buyerInfo,
      items:         enrichedItems,
      totalPrice,
      paymentMethod: "razorpay",
    }).catch((err) =>
      console.error("Customer order email failed:", err.message)
    );

    /* ── Step 7: Email to each FARMER (non-blocking) ── */
    for (const [sellerEmail, sellerItems] of Object.entries(sellerItemsMap)) {
      const farmer     = farmerCache[sellerEmail] || { name: sellerEmail, email: sellerEmail };
      const farmerTotal = sellerItems.reduce(
        (sum, i) => sum + i.productPrice * i.quantity,
        0
      );

      sendOrderNotificationToFarmer({
        farmer:        farmer,
        buyer:         buyerInfo,
        items:         sellerItems,
        totalPrice:    farmerTotal,
        paymentMethod: "razorpay",
      }).catch((err) =>
        console.error(`Farmer order email failed (${sellerEmail}):`, err.message)
      );
    }

    /* ── Step 8: Respond ── */
    res.status(200).json({
      success: true,
      message: "Payment verified. Order confirmed! Confirmation emails are being sent.",
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed", error: error.message });
  }
};
