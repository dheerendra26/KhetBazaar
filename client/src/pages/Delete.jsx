import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_BACKEND_URL;

const DeleteProduct = () => {
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [message, setMessage]         = useState("");
  const [error, setError]             = useState("");
  const [deleting, setDeleting]       = useState(null);
  // Smart confirm modal state — null or { _id, name, soldCount, hasSales }
  const [confirmProduct, setConfirmProduct] = useState(null);

  const navigate = useNavigate();
  const { userEmail, userRole } = useAuth();
  const email = userEmail || localStorage.getItem("userEmail");
  const role  = Number(userRole || localStorage.getItem("role"));

  useEffect(() => {
    if (role !== 2 && role !== 3) navigate("/shop");
  }, [role, navigate]);

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

  useEffect(() => { fetchMyProducts(); }, [email]);

  // Step 1 — user clicks the button: fetch sales info then show smart modal
  const handleDeleteClick = async (product) => {
    setError("");
    setMessage("");
    try {
      const res = await axios.get(`${API}/products/sales-check/${product._id}`);
      setConfirmProduct({
        ...product,
        soldCount: res.data.soldCount,
        hasSales:  res.data.hasSales,
      });
    } catch {
      // Fallback: use what we already know
      setConfirmProduct({
        ...product,
        soldCount: product.soldCount || 0,
        hasSales:  (product.soldCount || 0) > 0,
      });
    }
  };

  // Step 2 — user confirms in modal: call soft-delete API
  const handleConfirmDelete = async () => {
    if (!confirmProduct) return;
    const { _id, name } = confirmProduct;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated. Please log in.");
      navigate("/login");
      return;
    }

    setDeleting(_id);
    setConfirmProduct(null);
    setError("");
    setMessage("");

    try {
      const res = await axios.delete(`${API}/products/delete/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { adminEmail: email },
      });
      const { hasSales, soldCount } = res.data;
      setMessage(
        hasSales
          ? `✅ "${name}" deactivated. It had ${soldCount} unit(s) sold — hidden from listings but preserved in all order histories.`
          : `✅ "${name}" has been removed from all listings.`
      );
      setProducts(prev => prev.filter(p => p._id !== _id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to deactivate product.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading your products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold text-green-700 mb-1">🌾 My Products</h1>
        <p className="text-gray-500 mb-3 text-sm">Manage, edit, or deactivate your listed products</p>

        {/* Feature 3 info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex gap-3 items-start">
          <span className="text-blue-500 text-lg mt-0.5 flex-shrink-0">ℹ️</span>
          <div>
            <p className="text-blue-700 text-sm font-semibold">Smart Product Lifecycle</p>
            <p className="text-blue-600 text-xs mt-0.5">
              Products with existing sales are <strong>deactivated</strong> (not permanently deleted) to preserve
              order history and analytics integrity. They disappear from shop listings but stay accessible
              in buyer order records and your dashboard.
            </p>
          </div>
        </div>

        {message && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">{message}</div>
        )}
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <p className="text-5xl mb-4">🌱</p>
            <p className="text-gray-600 text-lg mb-4">You have no active products listed.</p>
            <Link
              to="/upload"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              + Upload Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {products.map((product) => {
              const isOut    = product.stock === 0;
              const isLow    = product.stock > 0 && product.stock <= 3;
              const hasSales = (product.soldCount || 0) > 0;

              return (
                <div
                  key={product._id}
                  className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden border border-gray-100"
                >
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={product.images?.[0] || "https://via.placeholder.com/100"}
                        onError={e => (e.target.src = "https://via.placeholder.com/100")}
                        className="w-full h-full object-cover"
                        alt={product.name}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                      <p className="text-green-600 font-bold text-sm mt-1">
                        ₹{product.price} / {product.unit || "kg"}
                      </p>

                      {isOut ? (
                        <span className="inline-block mt-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          ❌ Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          ⚠️ Only {product.stock} left
                        </span>
                      ) : (
                        <span className="inline-block mt-1 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                          ✅ In Stock ({product.stock})
                        </span>
                      )}

                      <div className="flex gap-1 mt-1 flex-wrap">
                        {product.isOrganic && (
                          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">
                            🌿 Organic
                          </span>
                        )}
                        {product.discountPercent > 0 && (
                          <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
                            {product.discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      <p className="text-gray-400 text-xs mt-1">
                        🛒 Sold: {product.soldCount || 0}
                        {hasSales && (
                          <span className="ml-2 text-blue-500 font-medium">· Has order history</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-gray-100">
                    <Link
                      to={`/edit-product/${product._id}`}
                      className="flex-1 py-2.5 text-center text-sm font-semibold text-green-700 hover:bg-green-50 transition"
                    >
                      ✏️ Edit
                    </Link>
                    <div className="w-px bg-gray-100" />
                    <button
                      onClick={() => handleDeleteClick(product)}
                      disabled={deleting === product._id}
                      className="flex-1 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {deleting === product._id
                        ? "Deactivating…"
                        : hasSales
                        ? "🔒 Deactivate"
                        : "🗑️ Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/upload"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium"
          >
            + Upload New Product
          </Link>
        </div>
      </div>

      {/* ── Smart Confirmation Modal ── */}
      {confirmProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">

            {confirmProduct.hasSales ? (
              /* Products with sales — explain soft-delete */
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">🔒</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Deactivate Product</h2>
                    <p className="text-sm text-gray-500">This product has existing sales</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
                  <p className="text-amber-800 text-sm font-semibold mb-1">⚠️ Why can't this be permanently deleted?</p>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    <strong>"{confirmProduct.name}"</strong> has{" "}
                    <strong>{confirmProduct.soldCount} unit(s) sold</strong>. Permanently deleting it
                    would break buyer order history, transaction records, and analytics.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                  <p className="text-blue-800 text-sm font-semibold mb-2">✅ What deactivating does:</p>
                  <ul className="text-blue-700 text-xs space-y-1 list-disc list-inside">
                    <li>Immediately <strong>hidden from all shop listings</strong></li>
                    <li>Buyers <strong>cannot purchase</strong> it anymore</li>
                    <li>Existing buyer orders <strong>stay valid</strong> in their history</li>
                    <li>Your sales analytics <strong>remain accurate</strong></li>
                    <li>You can <strong>upload a new product</strong> for the next batch</li>
                  </ul>
                </div>
              </>
            ) : (
              /* No sales — simple confirmation */
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">🗑️</span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Delete Product</h2>
                    <p className="text-sm text-gray-500">No purchase history found</p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                  <p className="text-gray-700 text-sm">
                    Are you sure you want to remove{" "}
                    <strong>"{confirmProduct.name}"</strong>? It has no sales history so it will be
                    safely removed from all listings.
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmProduct(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm"
              >
                {confirmProduct.hasSales ? "Yes, Deactivate" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteProduct;
