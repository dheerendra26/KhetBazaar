import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const DEMAND_COLOR = { "Very High": "text-green-600 bg-green-50", "High": "text-blue-600 bg-blue-50", "Medium": "text-yellow-600 bg-yellow-50", "Low": "text-red-600 bg-red-50" };

const CropRecommendation = () => {
  const [form, setForm] = useState({ soilType: "loamy", season: "rabi", state: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await axios.get(`${API}/products/crop-recommendation`, { params: form });
      setResult(res.data);
    } catch (err) {
      setError("Recommendation failed. Please try again.");
    } finally { setLoading(false); }
  };

  const soilDescriptions = {
    clay: "Heavy, water-retaining soil. Good for paddy.",
    loamy: "Best all-round soil. Rich in nutrients.",
    sandy: "Light, well-draining soil. Warm quickly.",
    black: "Rich in minerals, ideal for cotton.",
    red: "Iron-rich, well-draining, good for pulses.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-emerald-50 p-6">
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-700">🧠 Smart Crop Recommendation</h1>
          <p className="text-gray-500 mt-2 text-sm">AI-powered crop suggestions based on soil type, season & market demand</p>
        </div>

        <div className="bg-white/90 rounded-2xl shadow-lg p-8 border border-green-100 mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Soil Type */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">🌍 Soil Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {["clay","loamy","sandy","black","red"].map(soil => (
                  <label key={soil} className={`cursor-pointer p-3 rounded-xl border-2 transition ${form.soilType === soil ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"}`}>
                    <input type="radio" name="soilType" value={soil} checked={form.soilType === soil} onChange={e => setForm(p => ({...p, soilType: e.target.value}))} className="hidden" />
                    <p className="font-semibold capitalize text-gray-800">{soil}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{soilDescriptions[soil]}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Season */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">🌤️ Growing Season</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "kharif", label: "☔ Kharif", sub: "June–October" },
                  { value: "rabi", label: "❄️ Rabi", sub: "November–April" },
                  { value: "summer", label: "☀️ Summer", sub: "April–June" },
                ].map(s => (
                  <label key={s.value} className={`cursor-pointer p-3 rounded-xl border-2 text-center transition ${form.season === s.value ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"}`}>
                    <input type="radio" name="season" value={s.value} checked={form.season === s.value} onChange={e => setForm(p => ({...p, season: e.target.value}))} className="hidden" />
                    <p className="font-semibold text-gray-800">{s.label}</p>
                    <p className="text-xs text-gray-500">{s.sub}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* State */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">📍 State (Optional)</label>
              <input
                name="state" value={form.state}
                onChange={e => setForm(p => ({...p, state: e.target.value}))}
                placeholder="e.g. Punjab, Maharashtra, UP…"
                className="w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {error && <div className="bg-red-100 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

            <button type="submit" disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold shadow-md transition ${loading ? "bg-green-400 text-white opacity-60 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700 active:scale-95"}`}
            >
              {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Analyzing…</span> : "🧠 Get Recommendations"}
            </button>
          </form>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="bg-white/90 rounded-2xl shadow p-6 border border-green-100">
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                Recommended Crops for <span className="text-green-600 capitalize">{result.soilType}</span> soil in <span className="text-green-600 capitalize">{result.season}</span> season
              </h2>
              {result.state && <p className="text-gray-400 text-sm mb-4">📍 {result.state}</p>}

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-gray-800 text-lg">🌾 {rec.crop}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{rec.reason}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${DEMAND_COLOR[rec.demand] || "text-gray-600 bg-gray-50"}`}>
                        {rec.demand} Demand
                      </span>
                    </div>
                    <div className="mt-3 bg-green-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Est. Return</p>
                      <p className="text-green-700 font-bold">{rec.estimatedReturn}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-sm text-gray-600">
              <strong>💡 Pro Tip:</strong> Use the Price Predictor to check current market rates for these crops before planting. <a href="/predict-price" className="text-green-600 underline ml-1">Check Prices →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropRecommendation;
