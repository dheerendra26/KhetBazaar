const mongoose = require("mongoose");

// Dairy prices are NOT available on data.gov.in in real-time.
// We maintain our own collection based on cooperative published prices
// (Amul, Mother Dairy, Verka, Nandini) with small daily variations applied.

const dairyPriceSchema = new mongoose.Schema({
  product:     { type: String, required: true },   // e.g. "milk_full_cream"
  display_name:{ type: String },                    // e.g. "Full Cream Milk"
  category:    { type: String, default: "dairy" },
  cooperative: { type: String },                    // "Amul" | "Mother Dairy" | "Verka"
  price:       { type: Number, required: true },    // ₹ per unit
  unit:        { type: String, default: "litre" },  // litre / 500g / kg
  date:        { type: String, required: true },    // "DD/MM/YYYY"
  day:         { type: Number },
  month:       { type: Number },
  year:        { type: Number },
  base_price:  { type: Number },                    // cooperative list price
  variation:   { type: Number, default: 0 },        // % variation applied that day
  fetched_at:  { type: Date, default: Date.now },
});

dairyPriceSchema.index({ product: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DairyPrice", dairyPriceSchema);
