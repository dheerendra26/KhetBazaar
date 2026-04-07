const mongoose = require("mongoose");

const mandiPriceSchema = new mongoose.Schema({
  state:       { type: String, required: true },
  district:    { type: String },
  market:      { type: String },
  commodity:   { type: String, required: true },   // normalised lowercase
  variety:     { type: String },
  grade:       { type: String },
  arrival_date:{ type: String },                    // "DD/MM/YYYY" as stored in API
  day:         { type: Number },
  month:       { type: Number },
  year:        { type: Number },
  min_price:   { type: Number },
  max_price:   { type: Number },
  modal_price: { type: Number, required: true },
  fetched_at:  { type: Date, default: Date.now },
});

// Compound index so we never duplicate the same mandi record
mandiPriceSchema.index(
  { commodity: 1, market: 1, arrival_date: 1 },
  { unique: true }
);

module.exports = mongoose.model("MandiPrice", mandiPriceSchema);
