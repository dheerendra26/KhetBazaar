import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

const API = import.meta.env.VITE_BACKEND_URL;

const Upload = () => {
  const { userEmail } = useAuth();
  const { t } = useLang();
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
  });

  // Keep email in sync if auth loads after mount
  useEffect(() => {
    if (loggedInEmail) {
      setFormData(prev => ({ ...prev, email: loggedInEmail }));
    }
  }, [loggedInEmail]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" || name === "marketPrice"
        ? Number(value)
        : value,
    }));
  };

  const handleImageChange = (index, value) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = value;

    setFormData((prev) => ({
      ...prev,
      images: updatedImages,
    }));
  };

  const addImageField = () => {
    if (formData.images.length >= 4) return;

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  // ✅ GET USER LOCATION
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        reject
      );
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    let coords = { lat: null, lng: null };

    try {
      coords = await getLocation(); // try getting location
    } catch {
      console.log("Location failed, using null");
    }

    const updatedData = {
      ...formData,
      lat: coords.lat,
      lng: coords.lng,
    };

    await axios.post(`${API}/products/post`, {
      ...updatedData,
      isOrganic: formData.isOrganic || false,
      marketPrice: formData.marketPrice ? Number(formData.marketPrice) : undefined,
    });

    alert("✅ Product uploaded successfully!");

    setFormData({
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
      category: "vegetable",
      stock: 10,
    });

  } catch (error) {
    console.error(error);
    alert("❌ Upload failed");
  }
};

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-100 via-blue-50 to-yellow-50 px-4">
      
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

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg"
      >
        <h2 className="text-3xl font-bold text-center text-green-600 mb-6">
          Upload Product 🌾
        </h2>

        <div className="space-y-4">

          {/* NAME */}
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("productName")}
            required
            className="w-full border p-3 rounded-lg"
          />

          {/* DESC */}
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t("description")}
            required
            className="w-full border p-3 rounded-lg"
          />

          {/* PRICE */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Your Farmer Price (₹) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Price you want to sell at (₹)"
              required
              className="w-full border p-3 rounded-lg"
            />
          </div>

          {/* MARKET PRICE */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Market / Mandi Price (₹) — optional</label>
            <input
              type="number"
              name="marketPrice"
              value={formData.marketPrice || ""}
              onChange={handleChange}
              placeholder="Typical market price (shows savings to buyer)"
              className="w-full border p-3 rounded-lg"
            />
            {formData.marketPrice && formData.price && formData.marketPrice > formData.price && (
              <p className="text-xs text-green-600 mt-1 font-medium">✅ Buyers save ₹{formData.marketPrice - formData.price} per {formData.unit || "kg"} — this will be shown on your product!</p>
            )}
          </div>

          {/* STOCK */}
          <input
            type="number"
            name="stock"
            min="0"
            value={formData.stock}
            onChange={handleChange}
            placeholder="Stock (e.g. 20)"
            required
            className="w-full border p-3 rounded-lg"
          />

          {/* EMAIL - Auto-filled from logged-in account */}
          <div className="w-full border p-3 rounded-lg bg-green-50 border-green-200 flex items-center gap-2">
            <span className="text-green-600 text-sm">📧</span>
            <span className="text-gray-700 text-sm flex-1">{formData.email}</span>
            <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">Auto-filled</span>
          </div>

          {/* LOCATION */}
          {/* <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="City / Area"
            required
            className="w-full border p-3 rounded-lg"
          /> */}
          {/* ✅ ADD THIS HERE */}
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="vegetable">🥬 Vegetables</option>
            <option value="fruit">🍎 Fruits</option>
            <option value="dairy">🥛 Dairy</option>
            <option value="seeds">🌱 Seeds</option>
          </select>

          {/* UNIT */}
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg"
          >
            <option value="kg">Per Kg</option>
            <option value="g">Per Gram</option>
            <option value="piece">Per Piece</option>
            <option value="litre">Per Litre</option>
          </select>

          {/* ORGANIC & VERIFIED BADGES */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isOrganic" checked={formData.isOrganic || false} onChange={(e) => setFormData(p => ({...p, isOrganic: e.target.checked}))} className="accent-green-600 w-4 h-4" />
              <span className="text-sm font-medium">🌿 Organic Product</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">

            </label>
          </div>

          {/* IMAGES */}
          <div>
            {formData.images.map((img, index) => (
              <input
                key={index}
                type="text"
                value={img}
                onChange={(e) =>
                  handleImageChange(index, e.target.value)
                }
                placeholder={`Image URL ${index + 1}`}
                className="w-full border p-3 rounded-lg mb-2"
              />
            ))}

            {formData.images.length < 4 && (
              <button
                type="button"
                onClick={addImageField}
                className="text-green-600 font-medium"
              >
                + Add Another Image
              </button>
            )}
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
        >
          Submit Product 🚀
        </button>

      </form>
    </div>
  );
};

export default Upload;