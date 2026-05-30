const mongoose = require("mongoose");

const dairyPriceSchema = new mongoose.Schema({
  product: { type: String, required: true },
  display_name: { type: String },
  category: { type: String, default: "dairy" },
  cooperative: { type: String },
  price: { type: Number, required: true },
  unit: { type: String, default: "litre" },
  date: { type: String, required: true },
  day: { type: Number },
  month: { type: Number },
  year: { type: Number },
  base_price: { type: Number },
  variation: { type: Number, default: 0 },
  fetched_at: { type: Date, default: Date.now },
});

dairyPriceSchema.index({ product: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DairyPrice", dairyPriceSchema);
