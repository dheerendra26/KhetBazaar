const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: String,
  productName: String,
  productPrice: Number,
  quantity: Number,
  totalPrice: Number,
  sellerEmail: String,
  buyerEmail: String,
  paymentMethod: { type: String, default: "razorpay" },
  orderDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["placed", "packed", "out_for_delivery", "delivered", "cancelled"],
    default: "placed",
  },
  statusHistory: [
    {
      status: String,
      updatedAt: { type: Date, default: Date.now },
    },
  ],
});

const notificationSchema = new mongoose.Schema({
  message: String,
  type: {
    type: String,
    enum: ["order", "price_drop", "new_product", "general"],
    default: "general",
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  address: String,
  otp: String,
  role: { type: Number, enum: [1, 2, 3, 4] },
  orders: [orderItemSchema],
  notifications: [notificationSchema],
  walletBalance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  deactivatedAt: { type: Date, default: null },
  deactivatedBy: { type: String, default: null },
});

module.exports = mongoose.model("user", userSchema);
