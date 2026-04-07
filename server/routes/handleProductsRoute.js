const express = require("express");
const { sendMail } = require("../utils/sendEmail");
const userModel = require("../models/userModel");
const Product = require("../models/productModel");
const router = express.Router();

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

router.post("/", async (req, res) => {
  const { buyerEmail, items, paymentMethod } = req.body;

  try {
    const totalPrice = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

    let user;

    // Wallet payment: atomic conditional deduction (prevents race conditions)
    if (paymentMethod === "wallet") {
      user = await userModel.findOneAndUpdate(
        { email: buyerEmail, walletBalance: { $gte: totalPrice } },
        { $inc: { walletBalance: -totalPrice } },
        { new: true }
      );
      if (!user) {
        const existing = await userModel.findOne({ email: buyerEmail }).select("walletBalance");
        const balance = existing?.walletBalance ?? 0;
        return res.status(400).json({
          message: "Insufficient wallet balance",
          walletBalance: balance,
          required: totalPrice,
        });
      }
    } else {
      user = await userModel.findOne({ email: buyerEmail });
    }

    // Cash on Delivery: no balance check needed

    const buyerEmailContent = `<!DOCTYPE html><html><body style="font-family:Arial;max-width:600px;margin:auto">
      <div style="background:#4CAF50;color:white;padding:20px;text-align:center"><h2>Order Confirmation ✅</h2></div>
      <div style="padding:20px">
        <p>Dear Customer, thank you for your purchase from <strong>KhetBazaar</strong>!</p>
        <p><strong>Payment Method:</strong> ${paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "wallet" ? "Wallet" : "Online Payment"}</p>
        <h3>Order Summary:</h3>
        ${items.map(item => `<div style="border-bottom:1px solid #eee;padding:10px 0">
          <p><strong>${item.productName}</strong></p>
          <p>Price: ${formatCurrency(item.productPrice)} × ${item.quantity} = ${formatCurrency(item.productPrice * item.quantity)}</p>
          <p>Seller: ${item.sellerEmail}</p>
        </div>`).join("")}
        <p style="font-size:18px;font-weight:bold">Total: ${formatCurrency(totalPrice)}</p>
        <p>Track your order in your profile under <strong>Order History</strong>.</p>
      </div>
      <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:12px">KhetBazaar - Fresh From Farm</div>
    </body></html>`;

    await sendMail({ to: buyerEmail, subject: "Order Confirmation - KhetBazaar", html: buyerEmailContent });

    if (user) {
      const orderItemsWithDate = items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        sellerEmail: item.sellerEmail,
        paymentMethod: paymentMethod || "razorpay",
        orderDate: new Date(),
        status: "placed",
        statusHistory: [{ status: "placed", updatedAt: new Date() }],
      }));

      user.orders.push(...orderItemsWithDate);
      user.notifications.push({
        message: `🎉 Order placed for ${items.length} item(s). Total: ₹${totalPrice}`,
        type: "order",
      });
      await user.save();

      // Update stock + soldCount
      const bulkOps = items.map(item => ({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { soldCount: item.quantity, stock: -item.quantity } },
        },
      }));
      await Product.bulkWrite(bulkOps);
    }

    // Notify sellers
    const sellerItems = items.reduce((acc, item) => {
      if (!acc[item.sellerEmail]) acc[item.sellerEmail] = [];
      acc[item.sellerEmail].push(item);
      return acc;
    }, {});

    for (const [sellerEmail, sellerProducts] of Object.entries(sellerItems)) {
      const sellerTotal = sellerProducts.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
      const sellerEmailContent = `<!DOCTYPE html><html><body style="font-family:Arial;max-width:600px;margin:auto">
        <div style="background:#4CAF50;color:white;padding:20px;text-align:center"><h2>New Order Received 🛒</h2></div>
        <div style="padding:20px">
          <p>You have a new order from <strong>${buyerEmail}</strong></p>
          ${sellerProducts.map(item => `<div style="border-bottom:1px solid #eee;padding:10px 0">
            <p><strong>${item.productName}</strong> × ${item.quantity}</p>
            <p>Amount: ${formatCurrency(item.productPrice * item.quantity)}</p>
          </div>`).join("")}
          <p style="font-weight:bold">Total: ${formatCurrency(sellerTotal)}</p>
          <p>Please pack the order and update status in your dashboard.</p>
        </div>
      </body></html>`;
      await sendMail({ to: sellerEmail, subject: "New Order - KhetBazaar", html: sellerEmailContent });
    }

    res.status(200).json({
      message: "Order placed successfully",
      totalAmount: totalPrice,
      ...(paymentMethod === "wallet" && user ? { walletBalance: user.walletBalance } : {}),
    });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ message: "Failed to place order", error: error.message });
  }
});

module.exports = router;
