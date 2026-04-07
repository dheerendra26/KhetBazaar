import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

const API = import.meta.env.VITE_BACKEND_URL;

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onChange(s)}
        className={`text-2xl transition ${s <= value ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
      >
        ★
      </button>
    ))}
  </div>
);

const StarDisplay = ({ rating, count }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        className={`text-lg ${s <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"}`}
      >
        ★
      </span>
    ))}
    <span className="text-sm text-gray-600 ml-1">
      {rating > 0 ? rating.toFixed(1) : "No ratings"}
    </span>
    {count > 0 && (
      <span className="text-xs text-gray-400">
        ({count} review{count !== 1 ? "s" : ""})
      </span>
    )}
  </div>
);

const STATUS_LABELS = {
  placed: { label: "Order Placed", icon: "📦", color: "text-gray-600" },
  packed: { label: "Packed", icon: "🗃️", color: "text-yellow-600" },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: "🚚",
    color: "text-blue-600",
  },
  delivered: { label: "Delivered", icon: "✅", color: "text-green-600" },
};

const ProductDetail = () => {
  const { t } = useLang();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [distance, setDistance] = useState(null);
  const [activeTab, setActiveTab] = useState("reviews");
  const [cartAdded, setCartAdded] = useState(false);
  // Track how many units are already in cart for this product
  const [cartQty, setCartQty] = useState(0);

  const { isAuthenticated, userEmail } = useAuth();
  const email = userEmail || localStorage.getItem("userEmail");

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [productRes, commentRes, reviewRes] = await Promise.all([
          axios.get(`${API}/store/products/${id}`),
          axios.get(`${API}/store/products/${id}/comments`),
          axios.get(`${API}/store/products/${id}/reviews`),
        ]);
        setProduct(productRes.data);
        setComments(commentRes.data);
        setReviews(reviewRes.data.reviews || []);
        setAvgRating(reviewRes.data.averageRating || 0);
        setTotalRatings(reviewRes.data.totalRatings || 0);
      } catch {
        setError("Failed to load product.");
      }
    };
    fetchData();
  }, [id]);

  // Sync cartQty from localStorage whenever product loads or cart changes
  useEffect(() => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => item._id === product._id);
    const qty = existing ? Math.max(0, existing.quantity) : 0;
    setCartQty(qty);
  }, [product]);

  useEffect(() => {
    if (!product?.images?.length) return;
    const interval = setInterval(
      () =>
        setCurrentIndex((prev) =>
          prev === product.images.length - 1 ? 0 : prev + 1,
        ),
      3000,
    );
    return () => clearInterval(interval);
  }, [product]);

  useEffect(() => {
    if (!product?.lat || !product?.lng) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const R = 6371;
      const dLat = ((product.lat - pos.coords.latitude) * Math.PI) / 180;
      const dLng = ((product.lng - pos.coords.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((pos.coords.latitude * Math.PI) / 180) *
          Math.cos((product.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;
      setDistance(
        (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1),
      );
    });
  }, [product]);

  // FIX: Use stock > 0 as the minimum cap guard — never allow qty if stock is 0
  const handleQuantityChange = (newQty) => {
    if (!product || product.stock <= 0) return;
    // Remaining units available = stock - already-in-cart qty
    const maxAllowed = Math.max(0, product.stock - cartQty);
    setQuantity(Math.min(maxAllowed, Math.max(1, newQty)));
  };

  // FIX: Guard out-of-stock, cap total cart qty to stock, never allow negative
  const addToCart = () => {
    if (!product || product.stock <= 0) return;

    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const index = cart.findIndex((item) => item._id === product._id);

    if (index !== -1) {
      // Product already in cart — increase qty but cap at stock
      const newQty = Math.min(product.stock, cart[index].quantity + quantity);
      cart[index].quantity = Math.max(1, newQty); // never go below 1
    } else {
      // New cart entry — qty capped to stock
      const clampedQty = Math.min(product.stock, Math.max(1, quantity));
      cart.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0],
        quantity: clampedQty,
        unit: product.unit || "kg",
        sellerEmail: product.email,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    // Update local cartQty state
    const updated = cart.find((item) => item._id === product._id);
    setCartQty(updated ? updated.quantity : 0);

    // Reset the selector quantity back to 1
    setQuantity(1);
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`${API}/store/products/${id}/comments`, {
        content: newComment,
        userName: email,
      });
      setComments([...comments, res.data]);
      setNewComment("");
    } catch {
      setError("Failed to post comment");
    }
  };

  const submitReview = async () => {
    if (newRating === 0) return alert("Please select a star rating");
    try {
      const res = await axios.post(`${API}/store/products/${id}/reviews`, {
        userName: email,
        userEmail: email,
        rating: newRating,
        review: newReview,
      });
      setAvgRating(res.data.averageRating);
      setTotalRatings(res.data.totalRatings);
      const reviewRes = await axios.get(`${API}/store/products/${id}/reviews`);
      setReviews(reviewRes.data.reviews || []);
      setNewRating(0);
      setNewReview("");
    } catch {
      setError("Failed to submit review");
    }
  };

  if (error) return <div className="p-6 text-red-500 text-center">{error}</div>;
  if (!product)
    return (
      <div className="p-6 text-center">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );

  const images = product.images?.length
    ? product.images
    : ["https://via.placeholder.com/400"];
  const hasDiscount = product.discountPercent > 0;
  const isOutOfStock = product.stock <= 0;
  // Remaining stock available to add to cart
  const remainingStock = Math.max(0, product.stock - cartQty);
  const isAtMaxStock = cartQty >= product.stock;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Image slider */}
            <div className="md:w-1/2">
              <div className="relative h-80 md:h-full min-h-64 bg-gray-100">
                <img
                  src={images[currentIndex]}
                  alt={product.name}
                  onError={(e) =>
                    (e.target.src = "https://via.placeholder.com/400")
                  }
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentIndex((p) =>
                          p === 0 ? images.length - 1 : p - 1,
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() =>
                        setCurrentIndex((p) =>
                          p === images.length - 1 ? 0 : p + 1,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/60"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.isOrganic && (
                    <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      🌿 Organic
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                      {product.discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>
              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-14 h-14 object-cover rounded-lg cursor-pointer border-2 ${i === currentIndex ? "border-green-500" : "border-transparent"}`}
                      alt=""
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {product.name}
                </h1>
                <StarDisplay rating={avgRating} count={totalRatings} />

                <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                  {product.description}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  📦 Unit: {product.unit || "kg"}
                </p>
                {distance && (
                  <p className="text-blue-500 text-sm mt-1">
                    📍 {distance} km away
                  </p>
                )}

                <div className="bg-gray-50 rounded-xl p-4 mt-4 space-y-1">
                  {/* <p className="text-sm"><span className="text-gray-500">Location:</span> <span className="font-medium">{product.location}</span></p> */}
                  <p className="text-sm">
                    <span className="text-gray-500">Seller:</span>{" "}
                    <span className="font-medium">{product.email}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Category:</span>{" "}
                    <span className="capitalize font-medium">
                      {product.category}
                    </span>
                  </p>
                </div>

                {/* Price */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-green-600 text-white text-sm px-3 py-1 rounded-full font-semibold shadow-sm">
                      🌾 Direct from Farmer
                    </span>
                    <span className="text-xs text-gray-500 italic">
                      No middleman — fresher & cheaper
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-end gap-3 flex-wrap">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">
                          Farmer Price
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-green-600">
                            ₹{product.price}
                          </span>
                          <span className="text-gray-500 text-sm">
                            /{product.unit || "kg"}
                          </span>
                        </div>
                      </div>
                      {(product.marketPrice &&
                        product.marketPrice > product.price) ||
                      (hasDiscount && product.originalPrice) ? (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-gray-500 font-medium">
                            Market Price
                          </p>
                          <span className="text-xl text-gray-400 line-through font-semibold">
                            ₹{product.marketPrice || product.originalPrice}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    {(product.marketPrice &&
                      product.marketPrice > product.price) ||
                    (hasDiscount && product.originalPrice) ? (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-700 font-bold text-sm px-3 py-1 rounded-full">
                          💚 You save ₹
                          {(product.marketPrice || product.originalPrice) -
                            product.price}{" "}
                          per {product.unit || "kg"}
                        </span>
                        {hasDiscount && product.discountPercent > 0 && (
                          <span className="text-xs text-orange-600 font-semibold">
                            ({product.discountPercent}% off)
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-green-700 font-medium">
                        ✅ Best price — straight from the farm
                      </p>
                    )}
                  </div>
                </div>

                {/* Stock */}
                <div className="mt-3">
                  {isOutOfStock ? (
                    <span className="bg-red-100 text-red-600 text-sm font-semibold px-3 py-1.5 rounded-full">
                      ❌ Out of Stock
                    </span>
                  ) : product.stock <= 3 ? (
                    <span className="bg-orange-100 text-orange-600 text-sm font-semibold px-3 py-1.5 rounded-full">
                      ⚠️ Only {product.stock} left in stock — Order soon!
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-600 text-sm font-semibold px-3 py-1.5 rounded-full">
                      ✅ In Stock ({product.stock} available)
                    </span>
                  )}
                </div>

                {/* FIX: Show how many are already in cart */}
                {cartQty > 0 && (
                  <p className="mt-2 text-sm text-blue-600 font-medium">
                    🛒 {cartQty} {cartQty === 1 ? "unit" : "units"} already in
                    your cart
                    {isAtMaxStock && (
                      <span className="text-orange-600 ml-1">
                        (max stock reached)
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Qty + Cart */}
              <div className="mt-6">
                <div className="flex items-center gap-4">
                  {/* FIX: Disable +/- controls when out of stock or max stock reached */}
                  <div
                    className={`flex items-center bg-gray-100 rounded-xl px-3 py-1 ${isOutOfStock || isAtMaxStock ? "opacity-50" : ""}`}
                  >
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={isOutOfStock || quantity <= 1}
                      className="text-xl px-2 text-gray-600 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="px-4 font-bold">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={
                        isOutOfStock ||
                        isAtMaxStock ||
                        quantity >= remainingStock
                      }
                      className="text-xl px-2 text-gray-600 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={addToCart}
                    disabled={isOutOfStock || isAtMaxStock}
                    className={`flex-1 py-3 rounded-xl font-semibold transition ${
                      isOutOfStock
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : isAtMaxStock
                          ? "bg-orange-200 text-orange-700 cursor-not-allowed"
                          : cartAdded
                            ? "bg-green-700 text-white"
                            : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
                    }`}
                  >
                    {isOutOfStock
                      ? "Out of Stock"
                      : isAtMaxStock
                        ? "Max Stock in Cart"
                        : cartAdded
                          ? "✓ Added to Cart!"
                          : `Add to Cart — ₹${product.price * quantity}`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Reviews & Comments */}
          <div className="border-t border-gray-100">
            <div className="flex border-b border-gray-100">
              {["reviews", "comments"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-semibold capitalize transition border-b-2 -mb-px ${activeTab === tab ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {tab === "reviews"
                    ? `⭐ Reviews (${totalRatings})`
                    : `💬 Comments (${comments.length})`}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "reviews" && (
                <div>
                  <div className="flex items-center gap-6 mb-6 bg-green-50 rounded-xl p-4">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-green-600">
                        {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                      </p>
                      <StarDisplay rating={avgRating} count={0} />
                      <p className="text-xs text-gray-400 mt-1">
                        {totalRatings} review{totalRatings !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter(
                          (r) => Math.round(r.rating) === star,
                        ).length;
                        const pct =
                          totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                        return (
                          <div
                            key={star}
                            className="flex items-center gap-2 mb-1"
                          >
                            <span className="text-xs text-gray-500 w-4">
                              {star}★
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 w-4">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {isAuthenticated && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-700">
                          Write a Review
                        </h4>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                          📧 {email}
                        </span>
                      </div>
                      <StarPicker value={newRating} onChange={setNewRating} />
                      <textarea
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                        placeholder="Share your experience with this product…"
                        rows={3}
                        className="w-full mt-3 p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <button
                        onClick={submitReview}
                        disabled={!newRating}
                        className={`mt-2 px-6 py-2 rounded-lg font-semibold text-sm transition ${newRating ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                      >
                        Submit Review ⭐
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <p className="text-gray-400 text-center py-6">
                        No reviews yet. Be the first to review!
                      </p>
                    ) : (
                      reviews.map((r, i) => (
                        <div
                          key={i}
                          className="border border-gray-100 rounded-xl p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-700 text-sm">
                                {r.userName}
                              </p>
                              <div className="flex gap-0.5 mt-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <span
                                    key={s}
                                    className={`text-sm ${s <= r.rating ? "text-yellow-400" : "text-gray-200"}`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(r.createdAt).toLocaleDateString(
                                "en-IN",
                              )}
                            </span>
                          </div>
                          {r.review && (
                            <p className="text-gray-600 text-sm mt-2">
                              {r.review}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "comments" && (
                <div>
                  {isAuthenticated && (
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          📧 Posting as: {email}
                        </span>
                      </div>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ask about this product…"
                        rows={2}
                        className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <button
                        onClick={submitComment}
                        className="mt-2 bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                      >
                        Post Comment 💬
                      </button>
                    </div>
                  )}
                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-gray-400 text-center py-6">
                        No comments yet.
                      </p>
                    ) : (
                      comments.map((c, i) => (
                        <div
                          key={i}
                          className="border border-gray-100 rounded-xl p-4"
                        >
                          <p className="text-sm font-semibold text-gray-700">
                            {c.userName || "User"}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {c.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(c.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
