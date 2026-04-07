import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

const API = import.meta.env.VITE_BACKEND_URL;

const EditProduct = () => {
  const { t } = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const { userEmail, userRole } = useAuth();

  const [formData, setFormData] = useState({ name: "", description: "", price: "", stock: "", images: [""], discountPercent: 0, isOrganic: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const role = Number(userRole || localStorage.getItem("role"));
    if (role !== 2 && role !== 3) navigate("/shop");
  }, [userRole, navigate]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API}/store/products/${id}`);
        const p = res.data;
        const email = userEmail || localStorage.getItem("userEmail");
        if (p.email !== email) { setError("❌ You are not authorized to edit this product."); setLoading(false); return; }
        setFormData({ name: p.name || "", description: p.description || "", price: p.originalPrice || p.price || "", marketPrice: p.marketPrice || "", stock: p.stock ?? 10, images: p.images?.length ? p.images : [""], discountPercent: p.discountPercent || 0, isOrganic: p.isOrganic || false });
      } catch { setError("Failed to load product."); }
      finally { setLoading(false); }
    };
    if (id) fetchProduct();
  }, [id, userEmail]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageChange = (index, value) => {
    const updated = [...formData.images]; updated[index] = value;
    setFormData(prev => ({ ...prev, images: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    const email = userEmail || localStorage.getItem("userEmail");
    try {
      await axios.put(`${API}/products/edit/${id}`, {
        ...formData, price: Number(formData.price), stock: Number(formData.stock),
        discountPercent: Number(formData.discountPercent),
        marketPrice: formData.marketPrice ? Number(formData.marketPrice) : undefined,
        images: formData.images.filter(img => img.trim() !== ""), email,
      });
      setSuccess("✅ Product updated successfully!");
      setTimeout(() => navigate("/delete"), 1500);
    } catch (err) { setError(err.response?.data?.message || "Failed to update product."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const discountedPrice = formData.discountPercent > 0 ? Math.round(Number(formData.price) * (1 - Number(formData.discountPercent) / 100)) : null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-yellow-50 px-4 py-10">
      <div className="bg-white/90 shadow-2xl rounded-2xl p-8 w-full max-w-lg border border-green-100">
        <h2 className="text-3xl font-bold text-center text-green-700 mb-2">✏️ Edit Product</h2>
        <p className="text-center text-gray-500 mb-6 text-sm">Update your listing details</p>

        {error && <div className="bg-red-100 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 text-sm p-3 rounded-lg mb-4">{success}</div>}

        {!error.includes("not authorized") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-sm font-medium text-gray-600 block mb-1">Product Name</label>
              <input name="name" value={formData.name} onChange={handleChange} required className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-400 outline-none" /></div>
            <div><label className="text-sm font-medium text-gray-600 block mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-400 outline-none" /></div>
            <div><label className="text-sm font-medium text-gray-600 block mb-1">Base Price (₹) — Farmer Price</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required min={0} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-400 outline-none" /></div>

            {/* Market Price */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Market / Mandi Price (₹) — optional</label>
              <input type="number" name="marketPrice" value={formData.marketPrice || ""} onChange={handleChange} min={0} placeholder="Typical market price (shows savings to buyer)" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-400 outline-none" />
              {formData.marketPrice && formData.price && Number(formData.marketPrice) > Number(formData.price) && (
                <p className="text-green-600 text-xs mt-1 font-medium">✅ Buyers save ₹{Number(formData.marketPrice) - Number(formData.price)} — shown on product page</p>
              )}
            </div>

            {/* Discount */}
            <div><label className="text-sm font-medium text-gray-600 block mb-1">🏷️ Discount (%)</label>
              <input type="number" name="discountPercent" value={formData.discountPercent} onChange={handleChange} min={0} max={90} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-400 outline-none" />
              {discountedPrice && Number(formData.discountPercent) > 0 && (
                <p className="text-green-600 text-sm mt-1">Selling price after discount: <strong>₹{discountedPrice}</strong></p>
              )}
            </div>

            <div><label className="text-sm font-medium text-gray-600 block mb-1">Stock Quantity</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} required min={0} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-400 outline-none" />
              {Number(formData.stock) <= 3 && Number(formData.stock) > 0 && <p className="text-orange-500 text-xs mt-1">⚠️ Low stock warning will show</p>}
              {Number(formData.stock) === 0 && <p className="text-red-500 text-xs mt-1">❌ Product will show as Out of Stock</p>}
            </div>

            {/* Badges */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isOrganic" checked={formData.isOrganic} onChange={handleChange} className="accent-green-600 w-4 h-4" />
                <span className="text-sm font-medium">🌿 Mark as Organic</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">

              </label>
            </div>

            {/* Images */}
            <div><label className="text-sm font-medium text-gray-600 block mb-1">Product Images (URLs)</label>
              {formData.images.map((img, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input type="text" value={img} onChange={e => handleImageChange(index, e.target.value)} placeholder={`Image URL ${index+1}`} className="flex-1 border p-2 rounded-lg text-sm focus:ring-2 focus:ring-green-400 outline-none" />
                  {formData.images.length > 1 && <button type="button" onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== index) }))} className="text-red-500 px-2 hover:text-red-700">×</button>}
                </div>
              ))}
              {formData.images.length < 4 && <button type="button" onClick={() => setFormData(p => ({ ...p, images: [...p.images, ""] }))} className="text-green-600 text-sm hover:underline">+ Add Image</button>}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate("/delete")} className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={saving} className={`flex-1 py-3 rounded-lg font-semibold shadow transition ${saving ? "bg-green-400 opacity-60 cursor-not-allowed text-white" : "bg-green-600 text-white hover:bg-green-700 active:scale-95"}`}>
                {saving ? "Saving…" : "💾 Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditProduct;
