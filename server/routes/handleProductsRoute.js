const express = require("express");
const {
  sendOrderConfirmationToCustomer,
  sendOrderNotificationToFarmer,
} = require("../utils/sendEmail");
const userModel    = require("../models/userModel");
const Product      = require("../models/productModel");
const router       = express.Router();

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

/* ─────────────────────────────────────────────────────────────────────────────
   POST /orders
   Called by the frontend after:
     - COD payment selection  → paymentMethod = "cod"
     - Wallet payment success → paymentMethod = "wallet"
   *** NOT called for Razorpay *** (handled inside verifyPayment after
   signature check — see razorpayController.js)
───────────────────────────────────────────────────────────────────────────── */
router.post("/", async (req, res) => {
  // buyerAddress is the delivery address entered at checkout.
  // It is sent ONLY to the farmer via email — never stored in a public field.
  const { buyerEmail, items, paymentMethod, buyerAddress } = req.body;

  try {
    const totalPrice = items.reduce(
      (sum, item) => sum + item.productPrice * item.quantity,
      0
    );

    /* ── 1. Fetch buyer document (for name, contact, address) ── */
    let user;

    if (paymentMethod === "wallet") {
      // Atomic deduction prevents race conditions
      user = await userModel.findOneAndUpdate(
        { email: buyerEmail, walletBalance: { $gte: totalPrice } },
        { $inc: { walletBalance: -totalPrice } },
        { new: true }
      );
      if (!user) {
        const existing = await userModel
          .findOne({ email: buyerEmail })
          .select("walletBalance");
        return res.status(400).json({
          message: "Insufficient wallet balance",
          walletBalance: existing?.walletBalance ?? 0,
          required: totalPrice,
        });
      }
    } else {
      // COD
      user = await userModel.findOne({ email: buyerEmail });
    }

    /* ── 2. Save order items into user document ── */
    if (user) {
      const orderItemsWithDate = items.map((item) => ({
        productId:     item.productId,
        productName:   item.productName,
        productPrice:  item.productPrice,
        quantity:      item.quantity,
        totalPrice:    item.totalPrice,
        sellerEmail:   item.sellerEmail,
        buyerEmail:    buyerEmail,
        paymentMethod: paymentMethod || "cod",
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

      // Update stock + soldCount
      const bulkOps = items.map((item) => ({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { soldCount: item.quantity, stock: -item.quantity } },
        },
      }));
      await Product.bulkWrite(bulkOps);
    }

    /* ── 3. Group items by seller email ── */
    const sellerItemsMap = items.reduce((acc, item) => {
      const se = item.sellerEmail;
      if (!acc[se]) acc[se] = [];
      acc[se].push(item);
      return acc;
    }, {});

    /* ── 4. Fetch farmer details + enrich items with farmerName/farmerContact ── */
    // We need farmer name + contact to include in the customer email,
    // and buyer name + contact + address to include in the farmer email.
    const buyerInfo = {
      name:    user?.name    || "",
      email:   buyerEmail,
      contact: user?.contact || "",
      // Prefer the address entered at checkout; fall back to profile address.
      // This is passed to the farmer email only — never returned to frontend.
      address: (buyerAddress && buyerAddress.trim()) ? buyerAddress.trim() : (user?.address || ""),
    };

    // Enrich each item with the farmer's name & contact
    // (looked up from userModel by sellerEmail)
    const farmerCache = {}; // email -> { name, contact, email }
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

    /* ── 5. Send confirmation email to CUSTOMER ── */
    // Includes farmer name + phone — sent ONLY after order confirmed
    sendOrderConfirmationToCustomer({
      buyer:         buyerInfo,
      items:         enrichedItems,
      totalPrice,
      paymentMethod,
    }).catch((err) =>
      console.error("Customer order email failed:", err.message)
    );

    /* ── 6. Send notification email to each FARMER ── */
    // Includes full buyer details — sent ONLY after order confirmed
    for (const [sellerEmail, sellerItems] of Object.entries(sellerItemsMap)) {
      const farmer = farmerCache[sellerEmail] || { name: sellerEmail, email: sellerEmail };
      const farmerTotal = sellerItems.reduce(
        (sum, i) => sum + i.productPrice * i.quantity,
        0
      );

      sendOrderNotificationToFarmer({
        farmer:        farmer,
        buyer:         buyerInfo,
        items:         sellerItems,
        totalPrice:    farmerTotal,
        paymentMethod,
      }).catch((err) =>
        console.error(`Farmer order email failed (${sellerEmail}):`, err.message)
      );
    }

    /* ── 7. Respond ── */
    res.status(200).json({
      message: "Order placed successfully",
      totalAmount: totalPrice,
      ...(paymentMethod === "wallet" && user
        ? { walletBalance: user.walletBalance }
        : {}),
    });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ message: "Failed to place order", error: error.message });
  }
});

module.exports = router;
