const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    productName: String,
    productPrice: Number,
    quantity: Number,
    totalPrice: Number,
    sellerEmail: String,
    orderDate: {
      type: Date,
      default: Date.now
    }
  });
  
  const userSchema = mongoose.Schema({
    name: String,
    email: String,
    contact: String,
    address: String,
    otp: String,
    orders: [orderItemSchema]
  });
  
module.exports = mongoose.model("user", userSchema);
