import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const CROP_SUGGESTIONS = [
  "Wheat", "Rice", "Tomato", "Onion", "Potato", "Carrot", "Spinach",
  "Cauliflower", "Cabbage", "Brinjal", "Mango", "Banana", "Apple",
  "Grapes", "Orange", "Milk", "Mustard", "Soybean", "Corn", "Lentils",
  "Chickpea", "Peas", "Groundnut",
];

const PricePrediction = () => {
  const [form, setForm] = useState({ cropName: "", quantity: "", location: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "cropName") {
      const filtered = CROP_SUGGESTIONS.filter((c) =>
        c.toLowerCase().startsWith(value.toLowerCase()) && value.length > 0
      );
      setSuggestions(filtered.slice(0, 5));
    }
  };

  const selectSuggestion = (crop) => {
    setForm((prev) => ({ ...prev, cropName: crop }));
    setSuggestions([]);
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    setSuggestions([]);

    try {
      const res = await axios.get(`${API}/products/predict-price`, {
        params: { cropName: form.cropName, location: form.location },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const expectedRevenue = result && form.quantity
    ? (result.predictedRange.avg * Number(form.quantity)).toFixed(0)
    : null;

  const tomorrowRevenue = result && form.quantity && result.tomorrow?.avg
    ? (result.tomorrow.avg * Number(form.quantity)).toFixed(0)
    : null;

  // Map source key to a human-readable label + badge colour
  const sourceInfo = {
    ml_predicted:          { label: "ML Model",              color: "bg-green-100 text-green-700" },
    mandi_db:              { label: "Mandi Records",          color: "bg-blue-100 text-blue-700"  },
    moving_avg_fallback:   { label: "Moving Avg (fallback)",  color: "bg-yellow-100 text-yellow-700" },
    baseline_estimate:     { label: "Baseline Estimate",      color: "bg-red-100 text-red-700"    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-yellow-50 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">🌾 AI Crop Price Predictor</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Get AI-powered price predictions based on historical data, seasonal trends & market demand
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white/70 backdrop-blur rounded-xl p-4 mb-6 border border-green-100">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">How It Works</p>
          <div className="flex gap-4 flex-wrap text-xs text-gray-600">
            <span className="flex items-center gap-1">📊 Historical market data</span>
            <span className="flex items-center gap-1">🌤️ Seasonal trends</span>
            <span className="flex items-center gap-1">📈 Demand & supply patterns</span>
            <span className="flex items-center gap-1">📍 Location premium</span>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-8 border border-green-100 mb-6">
          <form onSubmit={handlePredict} className="space-y-5">

            {/* Crop Name with autocomplete */}
            <div className="relative">
              <label className="text-sm font-medium text-gray-600 block mb-1">Crop Name *</label>
              <input
                name="cropName"
                value={form.cropName}
                onChange={handleChange}
                placeholder="e.g. Tomato, Wheat, Onion..."
                required
                autoComplete="off"
                className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <div
                      key={s}
                      onClick={() => selectSuggestion(s)}
                      className="px-4 py-2 text-sm hover:bg-green-50 cursor-pointer text-gray-700"
                    >
                      🌱 {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Quantity (kg) — for revenue estimate</label>
              <input
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
                placeholder="e.g. 100"
                min={1}
                className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Location / City</label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Delhi, Punjab, Mumbai..."
                className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {error && <div className="bg-red-100 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={loading || !form.cropName}
              className={`w-full py-3 rounded-lg font-semibold shadow-md transition duration-300 ${
                loading || !form.cropName
                  ? "bg-green-400 text-white opacity-50 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Predicting...
                </span>
              ) : (
                "🔮 Predict Price"
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg p-8 border border-green-100 animate-pulse-once">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              📊 Price Prediction for <span className="text-green-600">{result.cropName}</span>
            </h2>
            <p className="text-gray-400 text-sm mb-5">📍 {result.location} • Season: {result.season}</p>

            {/* Price Range Cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                <p className="text-xs text-gray-500 mb-1">Min Price</p>
                <p className="text-2xl font-bold text-red-600">₹{result.predictedRange.min}</p>
                <p className="text-xs text-gray-400">per kg</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200 ring-2 ring-green-400">
                <p className="text-xs text-gray-500 mb-1">Avg Price</p>
                <p className="text-2xl font-bold text-green-600">₹{result.predictedRange.avg}</p>
                <p className="text-xs text-green-500 font-medium">Recommended</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                <p className="text-xs text-gray-500 mb-1">Max Price</p>
                <p className="text-2xl font-bold text-blue-600">₹{result.predictedRange.max}</p>
                <p className="text-xs text-gray-400">per kg</p>
              </div>
            </div>

            {/* Revenue Estimate */}
            {expectedRevenue && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600">
                  💰 <strong>Expected Revenue</strong> for {form.quantity} kg at today's avg price:
                </p>
                <p className="text-3xl font-bold text-yellow-700 mt-1">₹{Number(expectedRevenue).toLocaleString("en-IN")}</p>
              </div>
            )}

            {/* Tomorrow's Prediction */}
            {result.tomorrow && result.tomorrow.avg != null && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">🔮 Tomorrow's Prediction</p>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Min</p>
                    <p className="text-lg font-bold text-red-500">₹{result.tomorrow.min}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Avg</p>
                    <p className="text-xl font-bold text-indigo-600">₹{result.tomorrow.avg}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Max</p>
                    <p className="text-lg font-bold text-blue-500">₹{result.tomorrow.max}</p>
                  </div>
                </div>
                {tomorrowRevenue && (
                  <p className="text-sm text-indigo-700 font-medium">
                    📦 {form.quantity} kg tomorrow → ₹{Number(tomorrowRevenue).toLocaleString("en-IN")}
                  </p>
                )}
                {result.trend_pct !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    Change vs today: <span className={result.trend_pct > 0 ? "text-green-600 font-semibold" : result.trend_pct < 0 ? "text-red-600 font-semibold" : "text-gray-500"}>
                      {result.trend_pct > 0 ? "+" : ""}{result.trend_pct}%
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Trend & Recommendation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-4 border">
                <p className="text-xs text-gray-500 font-semibold mb-1">MARKET TREND</p>
                <p className="text-sm font-medium text-gray-700">{result.trend}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border">
                <p className="text-xs text-gray-500 font-semibold mb-1">CONFIDENCE</p>
                <p className="text-sm font-medium text-gray-700">🎯 {result.confidence}</p>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-semibold mb-1">AI RECOMMENDATION</p>
              <p className="text-sm font-semibold text-green-800">{result.recommendation}</p>
            </div>

            {/* Data source badge */}
            {result.source && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-400">Data source:</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(sourceInfo[result.source] || { color: "bg-gray-100 text-gray-600" }).color}`}>
                  {(sourceInfo[result.source] || { label: result.source }).label}
                </span>
                <span className="text-xs text-gray-400">• Confidence: {result.confidence}</span>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2 text-center">📌 {result.basedOn}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricePrediction;
