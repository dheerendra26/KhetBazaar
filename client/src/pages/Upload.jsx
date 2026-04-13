import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { resolveCategory, CATEGORY_LABELS } from "../utils/categoryMapper";
import { translateOne } from "../utils/useTranslate";

const API = import.meta.env.VITE_BACKEND_URL;

const Upload = () => {
  const { userEmail } = useAuth();
  const { t, lang } = useLang();
  const loggedInEmail = userEmail || localStorage.getItem("userEmail") || "";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    marketPrice: "",
    email: loggedInEmail,
    location: "",
    images: [""],
    lat: null,
    lng: null,
    unit: "kg",
    stock: 10,
    category: "vegetable",
    isOrganic: false,
  });

  // ── State ─────────────────────────────────────────────────────────────────
  const [mandiData, setMandiData]           = useState(null);
  const [mandiLoading, setMandiLoading]     = useState(false);
  const [mandiError, setMandiError]         = useState("");
  const [nameError, setNameError]           = useState("");
  // Category resolution from the client-side mapper
  const [categoryHint, setCategoryHint]     = useState(null); // { canonical, category, confidence }
  const debounceRef                         = useRef(null);
  const mandiDebounceRef                    = useRef(null);
  const translateDebounceRef                = useRef(null);
  const [hindiName, setHindiName]           = useState(""); // live Hindi translation of product name
  const [hindiCategory, setHindiCategory]   = useState(""); // translated category label
  const [translateLoading, setTranslateLoading] = useState(false);

  // Keep email in sync if auth loads after mount
  useEffect(() => {
    if (loggedInEmail) {
      setFormData(prev => ({ ...prev, email: loggedInEmail }));
    }
  }, [loggedInEmail]);

  // ── Live mandi price fetch ────────────────────────────────────────────────
  // Always resolves the user's input to a canonical English name BEFORE
  // calling the API, so "aloo" → "Potato", "mirchi" → "Green Chilli", etc.
  // This prevents the API falling back to the default ₹35 baseline for
  // perfectly valid Hindi / regional product names.
  const fetchMandiPrice = (productName) => {
    clearTimeout(mandiDebounceRef.current);
    if (!productName || productName.trim().length < 3) {
      setMandiData(null);
      setMandiError("");
      return;
    }
    mandiDebounceRef.current = setTimeout(async () => {
      setMandiLoading(true);
      setMandiError("");
      try {
        // Resolve synonym on the client before sending to the API so the
        // backend receives a canonical English name it can look up in DB/ML.
        const resolved   = resolveCategory(productName.trim());
        // Use canonical if we got a confident match, otherwise send raw input.
        const queryName  =
          resolved.confidence !== "default"
            ? resolved.canonical   // e.g. "Potato", "Green Chilli", "Milk"
            : productName.trim();  // unknown crop — let backend try its own resolution

        const res = await axios.get(`${API}/products/predict-price`, {
          params: { cropName: queryName },
        });
        setMandiData(res.data);
        if (res.data?.predictedRange?.avg) {
          setFormData(prev => ({ ...prev, marketPrice: res.data.predictedRange.avg }));
        }
      } catch {
        setMandiData(null);
        setMandiError("Could not fetch mandi price. You can enter it manually.");
      } finally {
        setMandiLoading(false);
      }
    }, 800);
  };

  // ── Live Hindi translation fetch ────────────────────────────────────────────
  // Translates the entered product name (and auto-detected category) to Hindi
  // using the backend /api/translate endpoint (Google Translate → MyMemory fallback).
  // Only fires when the app language is Hindi; no-ops in English mode.
  const fetchHindiTranslation = (productName, category) => {
    clearTimeout(translateDebounceRef.current);
    if (!productName || productName.trim().length < 2) {
      setHindiName("");
      setHindiCategory("");
      return;
    }
    translateDebounceRef.current = setTimeout(async () => {
      setTranslateLoading(true);
      try {
        // Always translate to Hindi regardless of UI language so the
        // Sell page always shows the Hindi name as a helper label.
        const [nameHi, catHi] = await Promise.all([
          translateOne(productName.trim(), "hi"),
          category ? translateOne(category, "hi") : Promise.resolve(""),
        ]);
        setHindiName(nameHi !== productName.trim() ? nameHi : "");
        setHindiCategory(catHi || "");
      } catch {
        setHindiName("");
        setHindiCategory("");
      } finally {
        setTranslateLoading(false);
      }
    }, 700);
  };

    // ── Main change handler ───────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      // 1. Required validation
      setNameError(value.trim() ? "" : "Product name is required.");

      // 2. Instant client-side category resolution (zero latency)
      if (value.trim().length >= 2) {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          const resolved = resolveCategory(value.trim());
          setCategoryHint(resolved);
          // Auto-update the category dropdown if we have a confident match
          if (resolved.confidence !== "default") {
            setFormData(prev => ({ ...prev, category: resolved.category }));
          }
        }, 300); // very short debounce — just avoids per-keystroke churn
      } else {
        setCategoryHint(null);
      }

      // 3. Mandi price fetch (slower, needs network)
      fetchMandiPrice(value);

      // 4. Hindi translation (always-on helper, regardless of UI language)
      const resolvedCatLabel = resolveCategory(value.trim()).confidence !== "default"
        ? resolveCategory(value.trim()).canonical
        : value.trim();
      fetchHindiTranslation(value, resolvedCatLabel);
    }

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "stock" || name === "marketPrice"
          ? Number(value)
          : value,
    }));
  };

  const handleImageChange = (index, value) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = value;
    setFormData((prev) => ({ ...prev, images: updatedImages }));
  };

  const addImageField = () => {
    if (formData.images.length >= 4) return;
    setFormData((prev) => ({ ...prev, images: [...prev.images, ""] }));
  };

  const getLocation = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        reject
      );
    });

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setNameError("Product name is required.");
      return;
    }

    try {
      let coords = { lat: null, lng: null };
      try { coords = await getLocation(); } catch { /* GPS optional */ }

      await axios.post(`${API}/products/post`, {
        ...formData,
        lat: coords.lat,
        lng: coords.lng,
        isOrganic: formData.isOrganic || false,
        marketPrice: formData.marketPrice ? Number(formData.marketPrice) : undefined,
      });

      alert("✅ Product uploaded successfully!");

      setFormData({
        name: "", description: "", price: "", marketPrice: "",
        email: loggedInEmail, location: "", images: [""],
        lat: null, lng: null, unit: "kg", category: "vegetable",
        stock: 10, isOrganic: false,
      });
      setMandiData(null);
      setMandiError("");
      setCategoryHint(null);
      setHindiName("");
      setHindiCategory("");
    } catch (error) {
      console.error(error);
      alert("❌ Upload failed. Please try again.");
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const trendColour = (trend = "") =>
    trend.includes("Rising") ? "text-red-600"
    : trend.includes("Falling") ? "text-blue-600"
    : "text-gray-600";

  const catInfo = CATEGORY_LABELS[formData.category] || CATEGORY_LABELS.vegetable;
  const hintInfo = categoryHint ? CATEGORY_LABELS[categoryHint.category] : null;

  // Show the category hint banner when the resolved category differs from what
  // is currently selected (so the farmer knows it was auto-changed)
  const showCategoryChanged =
    categoryHint &&
    categoryHint.confidence !== "default" &&
    categoryHint.category !== "vegetable";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-green-100 via-blue-50 to-yellow-50 px-4 py-10">

      {/* Predict Price Banner */}
      <div className="w-full max-w-lg mb-4">
        <Link
          to="/mandi-insights"
          className="flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-xl shadow hover:from-green-700 hover:to-emerald-600 transition"
        >
          <div>
            <p className="font-bold text-sm">🔮 Not sure about pricing?</p>
            <p className="text-xs text-green-100">Use AI Crop Price Predictor before listing</p>
          </div>
          <span className="text-xl">→</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center text-green-600 mb-6">
          Upload Product 🌾
        </h2>

        <div className="space-y-4">

          {/* ── PRODUCT NAME ── */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">
              Product Name <span className="text-red-500">*</span>
              <span className="ml-1 text-gray-400 font-normal">
                (Hindi / English / Regional names all work)
              </span>
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Aloo, Tamatar, Doodh, Gehun…"
              required
              className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 transition ${
                nameError
                  ? "border-red-400 focus:ring-red-300"
                  : "border-gray-300 focus:ring-green-400"
              }`}
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}

            {/* ── CATEGORY AUTO-RESOLVE BADGE ── */}
            {categoryHint && categoryHint.confidence !== "default" && hintInfo && (
              <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${hintInfo.color}`}>
                <span className="text-base">{hintInfo.emoji}</span>
                <div className="flex-1">
                  <span className="font-semibold">
                    Recognised as "{categoryHint.canonical}"
                  </span>
                  {showCategoryChanged && (
                    <span className="ml-1 text-xs">
                      → Category auto-set to <strong>{hintInfo.label}</strong>
                    </span>
                  )}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${
                  categoryHint.confidence === "exact"   ? "bg-green-200 border-green-400 text-green-800"
                  : categoryHint.confidence === "synonym" ? "bg-blue-200 border-blue-400 text-blue-800"
                  : "bg-yellow-200 border-yellow-400 text-yellow-800"
                }`}>
                  {categoryHint.confidence}
                </span>
              </div>
            )}


            {/* ── HINDI TRANSLATION BADGE ── */}
            {(hindiName || translateLoading) && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-200 bg-orange-50 text-sm text-orange-800">
                <span className="text-base">🇮🇳</span>
                <div className="flex-1">
                  {translateLoading ? (
                    <span className="animate-pulse text-xs text-gray-500">हिंदी अनुवाद हो रहा है…</span>
                  ) : (
                    <>
                      <span className="text-xs text-gray-500 mr-1">हिंदी में:</span>
                      <span className="font-semibold">{hindiName}</span>
                      {hindiCategory && hindiCategory !== hindiName && (
                        <span className="ml-2 text-xs text-orange-600">({hindiCategory})</span>
                      )}
                    </>
                  )}
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded-full border bg-orange-100 border-orange-300 text-orange-700 font-medium">
                  Google Translate
                </span>
              </div>
            )}

            {/* ── MANDI PRICE LIVE CARD ── */}
            {mandiLoading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 animate-pulse">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
                Fetching today's mandi price
                {categoryHint && categoryHint.confidence !== "default"
                  ? ` for "${categoryHint.canonical}"…`
                  : ` for "${formData.name}"…`}
              </div>
            )}

            {!mandiLoading && mandiData && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                <p className="font-semibold text-amber-800 mb-1">
                  📊 Today's Mandi Price — {mandiData.cropName}
                </p>
                <div className="flex flex-wrap gap-3 items-baseline">
                  <span className="text-lg font-bold text-green-700">
                    ₹{mandiData.predictedRange.avg}
                    <span className="text-xs font-normal text-gray-500">/kg avg</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    Range: ₹{mandiData.predictedRange.min}–₹{mandiData.predictedRange.max}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1 text-xs">
                  <span className={`font-medium ${trendColour(mandiData.trend)}`}>
                    {mandiData.trend}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{mandiData.season}</span>
                  <span className="text-gray-400">•</span>
                  <span className={`font-medium ${
                    mandiData.confidence === "High" ? "text-green-600"
                    : mandiData.confidence?.startsWith("Medium") ? "text-yellow-600"
                    : "text-red-500"
                  }`}>
                    {mandiData.confidence} confidence
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 italic">Source: {mandiData.basedOn}</p>
                <p className="text-xs text-blue-600 mt-1.5 font-medium">
                  ✅ Market price auto-filled below — adjust if needed.
                </p>
              </div>
            )}

            {!mandiLoading && mandiError && (
              <p className="mt-1 text-xs text-orange-500">{mandiError}</p>
            )}
          </div>

          {/* ── DESCRIPTION ── */}
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t("description") || "Describe your product…"}
            required
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {/* ── FARMER PRICE ── */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">
              Your Farmer Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Price you want to sell at (₹)"
              required
              min="1"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {mandiData && formData.price && Number(formData.price) < mandiData.predictedRange.avg && (
              <p className="text-xs text-green-700 mt-1 font-medium">
                💡 Your price is ₹{Math.round(mandiData.predictedRange.avg - formData.price)} below today's mandi average — great deal for buyers!
              </p>
            )}
          </div>

          {/* ── MARKET / MANDI PRICE (auto-filled) ── */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">
              Market / Mandi Price (₹)
              {mandiData && (
                <span className="ml-1 text-amber-600 font-semibold">
                  — auto-filled from live mandi data
                </span>
              )}
            </label>
            <input
              type="number"
              name="marketPrice"
              value={formData.marketPrice || ""}
              onChange={handleChange}
              placeholder="Typical market price (shows savings to buyer)"
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {formData.marketPrice && formData.price && formData.marketPrice > formData.price && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                ✅ Buyers save ₹{formData.marketPrice - formData.price} per {formData.unit || "kg"} — this will be shown on your product!
              </p>
            )}
          </div>

          {/* ── STOCK ── */}
          <input
            type="number"
            name="stock"
            min="0"
            value={formData.stock}
            onChange={handleChange}
            placeholder="Stock (e.g. 20)"
            required
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          {/* ── EMAIL (auto-filled) ── */}
          <div className="w-full border p-3 rounded-lg bg-green-50 border-green-200 flex items-center gap-2">
            <span className="text-green-600 text-sm">📧</span>
            <span className="text-gray-700 text-sm flex-1">{formData.email}</span>
            <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">Auto-filled</span>
          </div>

          {/* ── CATEGORY (auto-set, still overrideable) ── */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1 flex items-center gap-1">
              Category
              {showCategoryChanged && (
                <span className="text-xs text-blue-600 font-semibold ml-1">
                  (auto-detected from product name — you can change it)
                </span>
              )}
            </label>
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 pr-8 ${catInfo.color} border-current`}
              >
                <option value="vegetable">🥬 Vegetables</option>
                <option value="fruit">🍎 Fruits</option>
                <option value="dairy">🥛 Dairy</option>
                <option value="seeds">🌾 Seeds / Grains</option>
              </select>
            </div>
          </div>

          {/* ── UNIT ── */}
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="kg">Per Kg</option>
            <option value="g">Per Gram</option>
            <option value="piece">Per Piece</option>
            <option value="litre">Per Litre</option>
          </select>

          {/* ── ORGANIC ── */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isOrganic"
                checked={formData.isOrganic || false}
                onChange={(e) => setFormData(p => ({ ...p, isOrganic: e.target.checked }))}
                className="accent-green-600 w-4 h-4"
              />
              <span className="text-sm font-medium">🌿 Organic Product</span>
            </label>
          </div>

          {/* ── IMAGES ── */}
          <div>
            {formData.images.map((img, index) => (
              <input
                key={index}
                type="text"
                value={img}
                onChange={(e) => handleImageChange(index, e.target.value)}
                placeholder={`Image URL ${index + 1}`}
                className="w-full border border-gray-300 p-3 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            ))}
            {formData.images.length < 4 && (
              <button type="button" onClick={addImageField} className="text-green-600 font-medium text-sm">
                + Add Another Image
              </button>
            )}
          </div>
        </div>

        {/* ── SUBMIT ── */}
        <button
          type="submit"
          className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
        >
          Submit Product 🚀
        </button>
      </form>
    </div>
  );
};

export default Upload;
