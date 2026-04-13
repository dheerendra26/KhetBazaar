const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userName: String,
  userEmail: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  review: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const productSchema = mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  originalPrice: Number,          // for discount tracking
  marketPrice: Number,            // typical market/mandi price for comparison
  discountPercent: { type: Number, default: 0 },
  email: String,
  location: String,
  lat: Number,
  lng: Number,
  stock: { type: Number, default: 10 },
  images: { type: [String], required: true },
  soldCount: { type: Number, default: 0 },
  category: {
    type: String,
    enum: ["vegetable", "fruit", "dairy", "seeds"],
    default: "vegetable",
  },
  unit: { type: String, default: "kg" },
  isOrganic: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  reviews: [reviewSchema],
  comments: [
    {
      userName: String,
      content: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  isActive: { type: Boolean, default: true },
  deactivatedAt: { type: Date, default: null },
  deactivatedBy: { type: String, default: null }, // admin email
});

module.exports = mongoose.model("product", productSchema);
