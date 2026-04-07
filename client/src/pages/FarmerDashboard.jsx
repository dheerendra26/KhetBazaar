import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const CROP_LIST = [
  "Tomato","Potato","Onion","Wheat","Rice","Maize","Brinjal","Cauliflower",
  "Cabbage","Carrot","Spinach","Garlic","Ginger","Banana","Mango","Apple",
  "Grapes","Orange","Groundnut","Soybean","Mustard","Cotton","Sugarcane",
];
const today = new Date().toISOString().split("T")[0];

const BAR_COLORS_SOLD = ["#16a34a","#22c55e","#4ade80","#15803d","#166534","#4ade80","#86efac"];
const BAR_COLORS_REV  = ["#0369a1","#0ea5e9","#38bdf8","#0284c7","#075985","#7dd3fc","#bae6fd"];

// Fixed bar chart: bars grow UPWARD from bottom
const UprightBar = ({ value, max, color, label, prefix = "" }) => {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 4;
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      {/* value label on top */}
      <span className="text-xs font-semibold text-gray-700 truncate w-full text-center">
        {prefix}{typeof value === "number" && value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
      </span>
      {/* bar container: fixed height, bar fills from BOTTOM */}
      <div className="w-full flex flex-col justify-end rounded-t-md overflow-hidden bg-gray-100" style={{ height: "100px" }}>
        <div
          className="w-full rounded-t-md transition-all duration-700"
          style={{ height: `${pct}%`, backgroundColor: color, minHeight: "6px" }}
        />
      </div>
      {/* product name label */}
      <span className="text-xs text-gray-500 truncate w-full text-center leading-tight" title={label}>{label}</span>
    </div>
  );
};

const StockBar = ({ stock, soldCount }) => {
  const total = Math.max(stock + (soldCount || 0), 10);
  const pct = Math.min(100, Math.round((stock / total) * 100));
  const color = stock === 0 ? "#ef4444" : stock <= 3 ? "#f97316" : "#16a34a";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold w-12 text-right" style={{ color }}>{stock} units</span>
    </div>
  );
};

const FarmerDashboard = () => {
  const { userRole, userEmail } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [myProducts, setMyProducts] = useState([]);
  const [restockInput, setRestockInput] = useState({});
  const [restockLoading, setRestockLoading] = useState({});
  const [restockMsg, setRestockMsg] = useState({});

  // ── Mandi Insights state ──────────────────────────────────────────────────
  const [mandiCrop, setMandiCrop]         = useState("");
  const [mandiDate, setMandiDate]         = useState(today);
  const [mandiQty, setMandiQty]           = useState(100);
  const [cropSugg, setCropSugg]           = useState([]);
  const [predResult, setPredResult]       = useState(null);
  const [predLoading, setPredLoading]     = useState(false);
  const [predError, setPredError]         = useState("");
  const [profResult, setProfResult]       = useState(null);
  const [profLoading, setProfLoading]     = useState(false);
  const [profError, setProfError]         = useState("");

  // ── Product-level profit comparison (auto-loaded) ─────────────────────────
  const [productProfit, setProductProfit]       = useState(null);
  const [productProfitLoading, setProductProfitLoading] = useState(false);

  const email = userEmail || localStorage.getItem("userEmail");
  const role = Number(userRole || localStorage.getItem("role"));

  useEffect(() => {
    if (role !== 2 && role !== 3) { navigate("/shop"); return; }
  }, [role, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, profileRes] = await Promise.all([
          axios.get(`${API}/store/farmer/analytics/${encodeURIComponent(email)}`),
          fetch(`${API}/store/user`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).then(r => r.json()),
        ]);
        setAnalytics(analyticsRes.data);
        const myOrders = (profileRes.orders || []).filter(o => o.sellerEmail === email);
        setOrders(myOrders.reverse());
        const prodRes = await axios.get(`${API}/products/my-products/${encodeURIComponent(email)}`);
        setMyProducts(prodRes.data || []);

        // Auto-load product profit comparison
        try {
          setProductProfitLoading(true);
          const ppRes = await axios.get(`${API}/mandi/product-profit`, { params: { email } });
          setProductProfit(ppRes.data);
        } catch { /* non-critical — flask/mandi may not be running */ } finally {
          setProductProfitLoading(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (email) fetchData();
  }, [email]);

  const updateOrderStatus = async (buyerEmail, orderId, newStatus) => {
    try {
      await axios.put(`${API}/store/orders/${encodeURIComponent(buyerEmail)}/${orderId}/status`, { status: newStatus });
      alert("Status updated and customer notified!");
    } catch { alert("Failed to update status"); }
  };

  const handleRestock = async (productId) => {
    const newQty = parseInt(restockInput[productId]);
    // Prevent negative or zero stock
    if (!newQty || newQty < 1) {
      setRestockMsg(prev => ({ ...prev, [productId]: { type: "error", text: "❌ Enter a valid quantity (min 1)" } }));
      return;
    }
    setRestockLoading(prev => ({ ...prev, [productId]: true }));
    try {
      await axios.put(`${API}/products/edit/${productId}`, { email, stock: newQty });
      setMyProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: newQty } : p));
      setRestockInput(prev => ({ ...prev, [productId]: "" }));
      setRestockMsg(prev => ({ ...prev, [productId]: { type: "success", text: `✅ Stock updated to ${newQty} units` } }));
      const analyticsRes = await axios.get(`${API}/store/farmer/analytics/${encodeURIComponent(email)}`);
      setAnalytics(analyticsRes.data);
      setTimeout(() => setRestockMsg(prev => ({ ...prev, [productId]: null })), 3000);
    } catch {
      setRestockMsg(prev => ({ ...prev, [productId]: { type: "error", text: "❌ Failed to update stock" } }));
    } finally {
      setRestockLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  // ── Mandi handlers ───────────────────────────────────────────────────────
  const handleCropChange = (v) => {
    setMandiCrop(v);
    const f = CROP_LIST.filter(c => c.toLowerCase().startsWith(v.toLowerCase()) && v.length > 0);
    setCropSugg(f.slice(0, 5));
  };
  const pickCrop = (c) => { setMandiCrop(c); setCropSugg([]); };

  const handlePredict = async () => {
    if (!mandiCrop) return;
    setPredError(""); setPredResult(null); setPredLoading(true); setCropSugg([]);
    try {
      const { data } = await axios.post(`${API}/mandi/predict-price`, { crop: mandiCrop, date: mandiDate });
      setPredResult(data);
    } catch (err) {
      setPredError(err.response?.data?.message || err.response?.data?.error || "Prediction failed. Make sure Flask ML service is running.");
    } finally { setPredLoading(false); }
  };

  const handleProfit = async () => {
    if (!mandiCrop) return;
    setProfError(""); setProfResult(null); setProfLoading(true);
    try {
      const { data } = await axios.post(`${API}/mandi/profit-comparison`, { crop: mandiCrop, date: mandiDate, quantity_kg: mandiQty });
      setProfResult(data);
    } catch (err) {
      setProfError(err.response?.data?.message || "Comparison failed.");
    } finally { setProfLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-600">Loading your dashboard…</p>
      </div>
    </div>
  );

  const chartData = analytics?.chartData || [];
  const maxSold = chartData.length ? Math.max(...chartData.map(d => d.sold), 1) : 1;
  const maxRevenue = chartData.length ? Math.max(...chartData.map(d => d.revenue), 1) : 1;

  const STATUS_STEPS = ["placed","packed","out_for_delivery","delivered"];
  const STATUS_LABELS = { placed: "📦 Placed", packed: "🗃️ Packed", out_for_delivery: "🚚 Out for Delivery", delivered: "✅ Delivered" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-green-700">📊 Farmer Dashboard</h1>
            <p className="text-gray-500 text-sm">{email}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/upload" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition font-medium">+ New Product</Link>
            
            <Link to="/mandi-insights" className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm hover:bg-blue-200 transition font-medium">🏪 Mandi Insights</Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {["overview","charts","orders","stock","mandi"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold capitalize transition border-b-2 -mb-px whitespace-nowrap ${activeTab === tab ? "border-green-600 text-green-700 bg-green-50 rounded-t-lg" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {tab === "overview" ? "📈 Overview" : tab === "charts" ? "📊 Charts" : tab === "orders" ? "🛒 Orders" : tab === "stock" ? "📦 Stock" : "🏪 Mandi"}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && analytics && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: t("totalRevenue"), value: `₹${(analytics.totalRevenue || 0).toLocaleString("en-IN")}`, icon: "💰", color: "from-green-400 to-green-600" },
                { label: "Units Sold", value: analytics.totalSold || 0, icon: "🛒", color: "from-blue-400 to-blue-600" },
                { label: "Products Listed", value: analytics.totalProducts || 0, icon: "📦", color: "from-purple-400 to-purple-600" },
                { label: "Best Seller", value: analytics.mostSold?.name || "—", icon: "🏆", color: "from-orange-400 to-orange-600" },
              ].map((card, i) => (
                <div key={i} className={`bg-gradient-to-br ${card.color} text-white rounded-xl p-4 shadow`}>
                  <p className="text-2xl mb-1">{card.icon}</p>
                  <p className="text-xs opacity-80 font-medium uppercase tracking-wide">{card.label}</p>
                  <p className="text-xl font-bold mt-1 truncate">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Stock alerts */}
            {(analytics.lowStock > 0 || analytics.outOfStock > 0) && (
              <div className="flex gap-3 mb-6 flex-wrap">
                {analytics.lowStock > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex-1 min-w-48">
                    <p className="text-orange-700 font-semibold">⚠️ {analytics.lowStock} product(s) running low on stock</p>
                    <button onClick={() => setActiveTab("stock")} className="text-orange-600 text-sm underline mt-1">Manage Stock →</button>
                  </div>
                )}
                {analytics.outOfStock > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex-1 min-w-48">
                    <p className="text-red-700 font-semibold">❌ {analytics.outOfStock} product(s) out of stock</p>
                    <button onClick={() => setActiveTab("stock")} className="text-red-600 text-sm underline mt-1">Restock Now →</button>
                  </div>
                )}
              </div>
            )}

            {/* Category breakdown */}
            {analytics.categoryBreakdown && Object.keys(analytics.categoryBreakdown).length > 0 && (
              <div className="bg-white rounded-xl shadow p-5 mb-6">
                <h3 className="font-bold text-gray-700 mb-1">Sales by Category</h3>
                <p className="text-xs text-gray-400 mb-3">Total units sold per category</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(analytics.categoryBreakdown).map(([cat, sold]) => (
                    <div key={cat} className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
                      <p className="text-2xl">{cat === "vegetable" ? "🥬" : cat === "fruit" ? "🍎" : cat === "dairy" ? "🥛" : "🌱"}</p>
                      <p className="text-sm font-medium capitalize text-gray-700 mt-1">{cat}</p>
                      <p className="text-green-600 font-bold text-lg">{sold}</p>
                      <p className="text-xs text-gray-400">units sold</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── CHARTS TAB ── */}
        {activeTab === "charts" && (
          <div className="space-y-6">
            {chartData.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
                <p className="text-4xl mb-3">📊</p>
                <p>No sales data available yet. Start selling to see charts!</p>
              </div>
            ) : (
              <>
                {/* Units Sold Chart */}
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-800 text-lg">📦 Units Sold per Product</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Number of units sold — higher bar = more sales</p>
                  </div>
                  {/* Y-axis label + chart */}
                  <div className="flex gap-3">
                    <div className="flex flex-col justify-between text-xs text-gray-400 text-right pb-6 pt-0" style={{ height: "140px", minWidth: "32px" }}>
                      <span>{maxSold}</span>
                      <span>{Math.round(maxSold * 0.5)}</span>
                      <span>0</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-end gap-2" style={{ height: "100px" }}>
                        {chartData.slice(0,7).map((d, i) => (
                          <UprightBar key={i} value={d.sold} max={maxSold} color={BAR_COLORS_SOLD[i % BAR_COLORS_SOLD.length]} label={d.name} />
                        ))}
                      </div>
                      <div className="border-t border-gray-200 mt-1" />
                      <p className="text-center text-xs text-gray-500 mt-2 font-medium">Products</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-right mt-1">↑ Units Sold</p>
                </div>

                {/* Revenue Chart */}
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-800 text-lg">💰 Total Revenue (₹) per Product</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Revenue earned per product — higher bar = more earnings</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col justify-between text-xs text-gray-400 text-right pb-6 pt-0" style={{ height: "140px", minWidth: "40px" }}>
                      <span>₹{maxRevenue >= 1000 ? `${(maxRevenue/1000).toFixed(1)}k` : maxRevenue}</span>
                      <span>₹{maxRevenue >= 1000 ? `${(maxRevenue/2000).toFixed(1)}k` : Math.round(maxRevenue*0.5)}</span>
                      <span>₹0</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-end gap-2" style={{ height: "100px" }}>
                        {chartData.slice(0,7).map((d, i) => (
                          <UprightBar key={i} value={d.revenue} max={maxRevenue} color={BAR_COLORS_REV[i % BAR_COLORS_REV.length]} label={d.name} prefix="₹" />
                        ))}
                      </div>
                      <div className="border-t border-gray-200 mt-1" />
                      <p className="text-center text-xs text-gray-500 mt-2 font-medium">Products</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-right mt-1">↑ Total Revenue (₹)</p>
                </div>

                {/* Stock Levels */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="font-bold text-gray-800 text-lg mb-1">📊 Current Stock Levels</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>Good &nbsp;
                    <span className="inline-block w-3 h-3 rounded-full bg-orange-400 mr-1"></span>Low (≤3) &nbsp;
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>Out of Stock
                  </p>
                  <div className="space-y-3">
                    {chartData.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-36 truncate font-medium">{d.name}</span>
                        <StockBar stock={d.stock} soldCount={d.sold} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab("stock")} className="mt-4 text-sm text-green-600 font-semibold underline">Manage Stock →</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="font-bold text-gray-700 mb-4 text-lg">🛒 Recent Orders for Your Products</h3>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.slice(0,10).map((order, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">{order.productName}</p>
                        <p className="text-sm text-gray-500">Qty: {order.quantity} • ₹{order.totalPrice}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(order.orderDate).toLocaleDateString("en-IN")}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        order.status === "delivered" ? "bg-green-100 text-green-700" :
                        order.status === "out_for_delivery" ? "bg-blue-100 text-blue-700" :
                        order.status === "packed" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
                      }`}>{STATUS_LABELS[order.status] || "📦 Placed"}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      {STATUS_STEPS.map((s, idx) => (
                        <div key={s} className="flex items-center flex-1">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${STATUS_STEPS.indexOf(order.status || "placed") >= idx ? "bg-green-500" : "bg-gray-300"}`}></div>
                          {idx < STATUS_STEPS.length - 1 && <div className={`flex-1 h-0.5 ${STATUS_STEPS.indexOf(order.status || "placed") > idx ? "bg-green-500" : "bg-gray-200"}`}></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STOCK TAB ── */}
        {activeTab === "stock" && (
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">📦 Stock Management</h3>
                <p className="text-xs text-gray-400 mt-0.5">Update quantities • Restock out-of-stock products</p>
              </div>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{myProducts.length} product{myProducts.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mb-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> In Stock</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span> Low (≤3)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Out of Stock</span>
            </div>

            {myProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-medium">No products listed yet.</p>
                <Link to="/upload" className="mt-4 inline-block bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition">+ Add Product</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myProducts.map(product => {
                  const isOut = product.stock === 0;
                  const isLow = product.stock > 0 && product.stock <= 3;
                  return (
                    <div key={product._id} className={`border-2 rounded-2xl p-4 transition ${isOut ? "border-red-200 bg-red-50" : isLow ? "border-orange-200 bg-orange-50" : "border-gray-100 bg-white"}`}>
                      <div className="flex items-start gap-4 flex-wrap">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border">
                          <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" onError={e => e.target.src = "https://via.placeholder.com/64"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-gray-800">{product.name}</h4>
                            {isOut && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold">❌ Out of Stock</span>}
                            {isLow && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-semibold">⚠️ Only {product.stock} left</span>}
                            {!isOut && !isLow && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">✅ In Stock</span>}
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                            <span>💰 ₹{product.price}/{product.unit || "kg"}</span>
                            <span>📦 Stock: <strong className={isOut ? "text-red-600" : isLow ? "text-orange-600" : "text-green-700"}>{product.stock}</strong></span>
                            <span>🛒 Sold: {product.soldCount || 0}</span>
                          </div>
                          <StockBar stock={product.stock} soldCount={product.soldCount} />
                        </div>
                        {/* Restock controls */}
                        <div className="w-full sm:w-auto flex items-center gap-2 flex-wrap">
                          <input
                            type="number"
                            min="1"
                            placeholder="New qty"
                            value={restockInput[product._id] || ""}
                            onChange={e => {
                              // prevent negative input
                              const val = Math.max(1, parseInt(e.target.value) || 0);
                              setRestockInput(prev => ({ ...prev, [product._id]: val || "" }));
                            }}
                            className="w-28 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 transition"
                          />
                          <button
                            onClick={() => handleRestock(product._id)}
                            disabled={restockLoading[product._id] || !restockInput[product._id]}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition flex items-center gap-1 ${
                              restockLoading[product._id] || !restockInput[product._id]
                                ? "bg-gray-300 cursor-not-allowed"
                                : isOut ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {restockLoading[product._id] ? "Updating…" : isOut ? "🔁 Restock" : "✏️ Update Stock"}
                          </button>
                        </div>
                      </div>
                      {restockMsg[product._id] && (
                        <div className={`mt-3 text-sm px-3 py-2 rounded-xl font-medium ${restockMsg[product._id].type === "success" ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
                          {restockMsg[product._id].text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MANDI INSIGHTS TAB ── */}
        {activeTab === "mandi" && (
          <div className="space-y-6">

            {/* ── Section 1: Your Products vs Mandi (auto-loaded) ── */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between flex-wrap gap-2 mb-5">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">📦 Your Products vs Mandi Price</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Compares <strong>your listed price on KhetBazaar</strong> against what you'd earn via a mandi middleman for each product you've added
                  </p>
                </div>
                {productProfit && (
                  <div className="bg-green-600 text-white rounded-xl px-4 py-2 text-center">
                    <p className="text-xs opacity-80">Total extra earned</p>
                    <p className="text-xl font-bold">₹{productProfit.total_extra_earned_vs_mandi?.toLocaleString("en-IN")}</p>
                  </div>
                )}
              </div>

              {productProfitLoading && (
                <div className="flex items-center gap-3 text-gray-500 py-4">
                  <span className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/>
                  Loading your product comparisons…
                </div>
              )}

              {!productProfitLoading && !productProfit && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                  ⚠️ Could not load product comparison — make sure you have products listed and the server is running.
                </div>
              )}

              {productProfit && productProfit.products?.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p>No products listed yet. <Link to="/upload" className="text-green-600 underline">Add a product</Link> to see comparison.</p>
                </div>
              )}

              {productProfit?.products?.length > 0 && (
                <>
                  {/* Summary banner */}
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 text-white mb-5">
                    <p className="font-bold">🌟 {productProfit.message}</p>
                    <p className="text-green-100 text-xs mt-1">
                      Based on your {productProfit.total_products} listed product(s) vs current mandi modal prices
                    </p>
                  </div>

                  {/* Per-product cards */}
                  <div className="space-y-4">
                    {productProfit.products.map((p, i) => {
                      const barPct = Math.round((p.per_unit.via_mandi / p.per_unit.on_khetbazaar) * 100);
                      return (
                        <div key={i} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
                          <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-gray-800">{p.product_name}</h4>
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{p.category}</span>
                                {p.mandi_estimated && (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">~estimated mandi</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Stock: {p.stock} {p.unit} · Sold: {p.sold_count} {p.unit}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Extra per {p.unit}</p>
                              <p className="text-lg font-bold text-green-600">+₹{p.per_unit.gain} ({p.per_unit.gain_pct}%)</p>
                            </div>
                          </div>

                          {/* Price comparison bars */}
                          <div className="space-y-2 mb-3">
                            {/* Via mandi */}
                            <div>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-gray-500">🏪 Via mandi (after deductions)</span>
                                <span className="font-semibold text-red-600">₹{p.per_unit.via_mandi}/{p.unit}</span>
                              </div>
                              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-4 rounded-full bg-red-400 transition-all duration-700" style={{ width: `${barPct}%` }}/>
                              </div>
                            </div>
                            {/* On KhetBazaar */}
                            <div>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-gray-500">🤝 Your KhetBazaar price (direct)</span>
                                <span className="font-semibold text-green-600">₹{p.per_unit.on_khetbazaar}/{p.unit}</span>
                              </div>
                              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-4 rounded-full bg-green-500" style={{ width: "100%" }}/>
                              </div>
                            </div>
                          </div>

                          {/* Projected earnings */}
                          <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-xs text-gray-400">Via mandi</p>
                              <p className="font-bold text-red-600 text-sm">₹{p.projected.via_mandi.toLocaleString("en-IN")}</p>
                              <p className="text-xs text-gray-400">for {p.projected.quantity} {p.unit}</p>
                            </div>
                            <div className="border-x border-gray-200">
                              <p className="text-xs text-gray-400">On KhetBazaar</p>
                              <p className="font-bold text-green-600 text-sm">₹{p.projected.on_khetbazaar.toLocaleString("en-IN")}</p>
                              <p className="text-xs text-gray-400">for {p.projected.quantity} {p.unit}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">You save</p>
                              <p className="font-bold text-blue-600 text-sm">+₹{p.projected.extra_earned.toLocaleString("en-IN")}</p>
                              <p className="text-xs text-gray-400">extra earned</p>
                            </div>
                          </div>

                          {p.mandi_estimated && (
                            <p className="text-xs text-amber-600 mt-2"> {p.note}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* ── Section 2: Mandi Price Prediction (crop + date) ── */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-bold text-gray-800 text-lg mb-1">🔮 Mandi Price Prediction</h3>
              <p className="text-xs text-gray-400 mb-5">Predict future mandi modal price for any crop using the ML model</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="relative">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Crop Name *</label>
                  <input value={mandiCrop} onChange={e => handleCropChange(e.target.value)} placeholder="e.g. Tomato"
                    autoComplete="off" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                  {cropSugg.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {cropSugg.map(s => <div key={s} onClick={() => pickCrop(s)} className="px-4 py-2 text-sm hover:bg-green-50 cursor-pointer text-gray-700">🌱 {s}</div>)}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Date</label>
                  <input type="date" value={mandiDate} onChange={e => setMandiDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Quantity (kg)</label>
                  <input type="number" min={1} value={mandiQty} onChange={e => setMandiQty(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button onClick={handlePredict} disabled={!mandiCrop || predLoading}
                  className="flex-1 min-w-[160px] bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                  {predLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "🔮"}
                  {predLoading ? "Predicting…" : "Predict Mandi Price"}
                </button>
                <button onClick={handleProfit} disabled={!mandiCrop || profLoading}
                  className="flex-1 min-w-[160px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
                  {profLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "💰"}
                  {profLoading ? "Calculating…" : "Compare Any Crop"}
                </button>
              </div>

              {/* Prediction result */}
              {(predResult || predError) && (
                <div className="mt-5">
                  {predError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">⚠️ {predError}</div>}
                  {predResult && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {[
                          { label: "Predicted Price", value: `₹${predResult.predicted_price?.toLocaleString("en-IN")}`, sub: predResult.unit, color: "from-green-400 to-green-600" },
                          { label: "Date", value: `${predResult.date}`, sub: "Arrival date", color: "from-blue-400 to-blue-600" },
                          { label: "Per KG", value: `₹${(predResult.predicted_price / 100).toFixed(0)}`, sub: "Approx", color: "from-purple-400 to-purple-600" },
                          { label: "Crop", value: <span className="capitalize">{predResult.crop}</span>, sub: "Commodity", color: "from-orange-400 to-orange-600" },
                        ].map((card, i) => (
                          <div key={i} className={`bg-gradient-to-br ${card.color} text-white rounded-xl p-4 shadow`}>
                            <p className="text-xs opacity-80 uppercase tracking-wide mb-1">{card.label}</p>
                            <p className="text-xl font-bold truncate">{card.value}</p>
                            {card.sub && <p className="text-xs opacity-70 mt-0.5">{card.sub}</p>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Profit comparison result */}
              {(profResult || profError) && (
                <div className="mt-5">
                  {profError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">⚠️ {profError}</div>}
                  {profResult && (
                    <>
                      <h4 className="font-bold text-gray-700 mb-3">💰 Earnings — <span className="capitalize">{profResult.crop}</span> · {profResult.quantity_kg} kg</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {[
                          { label: "Via Mandi", value: `₹${profResult.with_middleman.total_earnings.toLocaleString("en-IN")}`, sub: `₹${profResult.with_middleman.price_per_kg}/kg`, color: "from-red-400 to-red-600" },
                          { label: "Direct Sale", value: `₹${profResult.without_middleman.total_earnings.toLocaleString("en-IN")}`, sub: `₹${profResult.without_middleman.price_per_kg}/kg`, color: "from-green-500 to-green-700" },
                          { label: "Extra Earned", value: `₹${profResult.profit_gain.toLocaleString("en-IN")}`, sub: "profit gain", color: "from-blue-500 to-blue-700" },
                          { label: "Gain %", value: `+${profResult.profit_gain_pct}%`, sub: "more earnings", color: "from-purple-500 to-purple-700" },
                        ].map((card, i) => (
                          <div key={i} className={`bg-gradient-to-br ${card.color} text-white rounded-xl p-4 shadow`}>
                            <p className="text-xs opacity-80 uppercase tracking-wide mb-1">{card.label}</p>
                            <p className="text-xl font-bold">{card.value}</p>
                            <p className="text-xs opacity-70 mt-0.5">{card.sub}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">🔗 Via Mandi</span><span className="text-red-600 font-semibold">₹{profResult.with_middleman.total_earnings.toLocaleString("en-IN")}</span></div>
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-4 rounded-full bg-red-500" style={{ width: `${Math.round((profResult.with_middleman.total_earnings / profResult.without_middleman.total_earnings) * 100)}%` }}/>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{profResult.with_middleman.note}</p>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">🤝 Direct on KhetBazaar</span><span className="text-green-600 font-semibold">₹{profResult.without_middleman.total_earnings.toLocaleString("en-IN")}</span></div>
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-4 rounded-full bg-green-500" style={{ width: "100%" }}/></div>
                          <p className="text-xs text-gray-400 mt-0.5">{profResult.without_middleman.note}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Info strip */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h4 className="font-bold text-amber-800 mb-2">ℹ️ How this comparison works</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-amber-700">
                <div><p className="font-semibold">Your KhetBazaar price</p><p className="text-xs mt-0.5 text-amber-600">The price you listed — this is what you actually earn per kg, no deductions.</p></div>
                <div><p className="font-semibold">Mandi middleman price</p><p className="text-xs mt-0.5 text-amber-600">~70% of modal price — after commission agent (6%), mandi tax (1%), transport &amp; loading (3%).</p></div>
                <div><p className="font-semibold">Mandi data source</p><p className="text-xs mt-0.5 text-amber-600">Government data.gov.in daily mandi records. Run seed-mandi.js for accurate data.</p></div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default FarmerDashboard;
