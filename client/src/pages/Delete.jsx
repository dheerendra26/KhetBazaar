import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

const API = import.meta.env.VITE_BACKEND_URL;

const DeleteProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();
  const { userEmail, userRole } = useAuth();

  const email = userEmail || localStorage.getItem("userEmail");
  const role = Number(userRole || localStorage.getItem("role"));

  // Only farmers (role 2 or 3) can access
  useEffect(() => {
    if (role !== 2 && role !== 3) {
      navigate("/shop");
    }
  }, [role, navigate]);

  // Fetch farmer's own products
  const fetchMyProducts = async () => {
    if (!email) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API}/products/my-products/${encodeURIComponent(email)}`);
      setProducts(res.data);
    } catch {
      setError("Failed to load your products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyProducts();
  }, [email]);

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You are not authenticated. Please log in.");
      navigate("/login");
      return;
    }

    setDeleting(productId);
    setError("");
    setMessage("");

    try {
      await axios.delete(`${API}/products/delete/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(`✅ "${productName}" deleted successfully.`);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">Loading your products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-700 mb-2">🌾 My Products</h1>
        <p className="text-gray-500 mb-6 text-sm">Manage, edit, or delete your listed products</p>

        {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">{message}</div>}
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <p className="text-5xl mb-4">🌱</p>
            <p className="text-gray-600 text-lg mb-4">You haven't listed any products yet.</p>
            <Link to="/upload" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
              + Upload Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {products.map((product) => {
              const isOut = product.stock === 0;
              const isLow = product.stock > 0 && product.stock <= 3;

              return (
                <div key={product._id} className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden border border-gray-100">
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={product.images?.[0] || "https://via.placeholder.com/100"}
                        onError={(e) => (e.target.src = "https://via.placeholder.com/100")}
                        className="w-full h-full object-cover"
                        alt={product.name}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                      <p className="text-green-600 font-bold text-sm mt-1">₹{product.price} / {product.unit || "kg"}</p>

                      {/* Stock Status */}
                      {isOut ? (
                        <span className="inline-block mt-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">❌ Out of Stock</span>
                      ) : isLow ? (
                        <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">⚠️ Only {product.stock} left</span>
                      ) : (
                        <span className="inline-block mt-1 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">✅ In Stock ({product.stock})</span>
                      )}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {product.isOrganic && <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">🌿 Organic</span>}
                        {product.discountPercent > 0 && <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">{product.discountPercent}% OFF</span>}
                      </div>

                      <p className="text-gray-400 text-xs mt-1">🛒 Sold: {product.soldCount || 0}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex border-t border-gray-100">
                    <Link
                      to={`/edit-product/${product._id}`}
                      className="flex-1 py-2.5 text-center text-sm font-semibold text-green-700 hover:bg-green-50 transition"
                    >
                      ✏️ Edit
                    </Link>
                    <div className="w-px bg-gray-100"></div>
                    <button
                      onClick={() => handleDelete(product._id, product.name)}
                      disabled={deleting === product._id}
                      className="flex-1 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {deleting === product._id ? "Deleting..." : "🗑️ Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/upload" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium">
            + Upload New Product
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DeleteProduct;
