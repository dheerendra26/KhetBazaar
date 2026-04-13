import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { translateBatch } from "../utils/useTranslate";

const API = import.meta.env.VITE_BACKEND_URL;

const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`text-sm ${s <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}`}
        >
          ★
        </span>
      ))}
      <span className="text-xs text-gray-500 ml-1">
        {rating > 0 ? rating.toFixed(1) : ""}
      </span>
    </div>
  );
};

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showTrending, setShowTrending] = useState(false);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [translatedNames, setTranslatedNames] = useState({}); // { [originalName]: hindiName }
  const [filter, setFilter] = useState({
    price: "",
    minPrice: "",
    location: "",
    search: "",
    category: "",
    rating: "",
    isOrganic: false,
    nearbyKm: "50",
  });

  const { isAuthenticated } = useAuth();
  const { t, lang } = useLang();
  const navigate = useNavigate();

  // Get GPS location on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => console.log("Location denied"),
    );
  }, []);

  // Batch-translate product names when lang switches to Hindi
  useEffect(() => {
    if (lang !== "hi" || products.length === 0) {
      setTranslatedNames({});
      return;
    }
    const names = [...new Set(products.map(p => p.name).filter(Boolean))];
    translateBatch(names, "hi").then(results => {
      const map = {};
      names.forEach((n, i) => { if (results[i] && results[i] !== n) map[n] = results[i]; });
      setTranslatedNames(map);
    }).catch(() => {});
  }, [products, lang]);

  const tn = (name) => translatedNames[name] || name;

  // Fetch products
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get(`${API}/store/products`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProducts(res.data);
        setFilteredProducts(res.data);
      })
      .catch(() => setError("Failed to fetch products"));
  }, [navigate]);

  const fetchNearby = async () => {
    if (!userLocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setLocationLoading(false);
          const res = await axios.get(
            `${API}/store/products/nearby/${loc.lat}/${loc.lng}?radius=${filter.nearbyKm}`,
          );
          setFilteredProducts(res.data);
          setNearbyMode(true);
        },
        () => {
          setLocationLoading(false);
          alert("Location permission required");
        },
      );
      return;
    }
    const res = await axios.get(
      `${API}/store/products/nearby/${userLocation.lat}/${userLocation.lng}?radius=${filter.nearbyKm}`,
    );
    setFilteredProducts(res.data);
    setNearbyMode(true);
  };

  const clearNearby = () => {
    setNearbyMode(false);
    applyFilters(products);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilter((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const applyFilters = (source) => {
    let filtered = source.filter((p) => {
      const matchesPrice = !filter.price || p.price <= parseFloat(filter.price);
      const matchesMinPrice =
        !filter.minPrice || p.price >= parseFloat(filter.minPrice);
      const matchesLocation =
        !filter.location ||
        p.location?.toLowerCase().includes(filter.location.toLowerCase());
      const matchesSearch =
        !filter.search ||
        p.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        p.description?.toLowerCase().includes(filter.search.toLowerCase());
      const matchesCategory =
        !filter.category || p.category === filter.category;
      const matchesRating =
        !filter.rating || (p.averageRating || 0) >= parseFloat(filter.rating);
      const matchesOrganic = !filter.isOrganic || p.isOrganic;
      return (
        matchesPrice &&
        matchesMinPrice &&
        matchesLocation &&
        matchesSearch &&
        matchesCategory &&
        matchesRating &&
        matchesOrganic
      );
    });
    if (showTrending)
      filtered.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    return filtered;
  };

  useEffect(() => {
    if (!nearbyMode) setFilteredProducts(applyFilters(products));
  }, [filter, products, showTrending, nearbyMode]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-yellow-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-green-700">
              🌾 {t("whatWeOffer")}
            </h1>
            <p className="text-gray-500 text-sm">
              {filteredProducts.length} products{" "}
              {nearbyMode ? `within ${filter.nearbyKm}km` : "found"}
            </p>
          </div>
          {/* Nearby toggle */}
          {/* <div className="flex items-center gap-2">
            <select name="nearbyKm" value={filter.nearbyKm} onChange={handleFilterChange} className="text-sm border rounded-lg p-2">
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
              <option value="100">100 km</option>
            </select>
            <button
              onClick={nearbyMode ? clearNearby : fetchNearby}
              disabled={locationLoading}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg font-semibold text-sm transition ${nearbyMode ? "bg-blue-600 text-white" : "border border-blue-600 text-blue-600 hover:bg-blue-50"}`}
            >
              📍 {locationLoading ? "Locating…" : nearbyMode ? t("nearbyProducts") : t("nearbyProducts")}
            </button>
          </div> */}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {["all", "vegetable", "fruit", "dairy", "seeds"].map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setFilter((prev) => ({
                  ...prev,
                  category: cat === "all" ? "" : cat,
                }))
              }
              className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition ${filter.category === cat || (cat === "all" && !filter.category) ? "bg-green-600 text-white" : "bg-white border hover:border-green-400"}`}
            >
              {cat === "all"
                ? "🌿 " + t("allCategories")
                : cat === "vegetable"
                  ? "🥬 " + t("vegetables")
                  : cat === "fruit"
                    ? "🍎 " + t("fruits")
                    : cat === "dairy"
                      ? "🥛 " + t("dairy")
                      : "🌱 " + t("seeds")}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-32">
              <label className="text-xs text-gray-500 font-medium block mb-1">
                Search
              </label>
              <input
                name="search"
                placeholder={t("searchPlaceholder")}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-400 outline-none"
              />
            </div>
            <div className="min-w-28">
              <label className="text-xs text-gray-500 font-medium block mb-1">
                Min ₹
              </label>
              <input
                name="minPrice"
                type="number"
                placeholder="0"
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-400 outline-none"
              />
            </div>
            <div className="min-w-28">
              <label className="text-xs text-gray-500 font-medium block mb-1">
                Max ₹
              </label>
              <input
                name="price"
                type="number"
                placeholder="Any"
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-400 outline-none"
              />
            </div>
            <div className="min-w-32">
              <label className="text-xs text-gray-500 font-medium block mb-1">
                Location
              </label>
              <input
                name="location"
                placeholder="City/Area"
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-400 outline-none"
              />
            </div>
            <div className="min-w-28">
              <label className="text-xs text-gray-500 font-medium block mb-1">
                Min Rating
              </label>
              <select
                name="rating"
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-400 outline-none"
              >
                <option value="">Any</option>
                <option value="3">3★+</option>
                <option value="4">4★+</option>
                <option value="4.5">4.5★+</option>
              </select>
            </div>
            <div className="flex gap-4 items-center pb-1">
              <label className="flex items-center gap-1 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  name="isOrganic"
                  onChange={handleFilterChange}
                  className="accent-green-600"
                />
                <span>🌿 Organic</span>
              </label>
              <button
                onClick={() => setShowTrending(!showTrending)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${showTrending ? "bg-orange-500 text-white" : "border border-orange-500 text-orange-500"}`}
              >
                🔥 {showTrending ? t("trendingNow") : t("trendingNow")}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="text-red-500 text-center py-4">{error}</div>}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <p className="text-5xl mb-3">🌾</p>
            <p className="text-gray-500">
              No products found matching your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const distance =
                userLocation &&
                getDistance(
                  userLocation.lat,
                  userLocation.lng,
                  product.lat,
                  product.lng,
                );
              const isOut = product.stock === 0;
              const isLow = product.stock > 0 && product.stock <= 3;
              const hasDiscount = product.discountPercent > 0;

              return (
                <Link
                  to={`/product/${product._id}`}
                  key={product._id}
                  className={`bg-white rounded-xl shadow hover:shadow-lg transition-all relative flex flex-col overflow-hidden ${isOut ? "opacity-70" : ""}`}
                >
                  {/* Badges row */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {isOut && (
                      <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                        ❌ Out of Stock
                      </span>
                    )}
                    {isLow && !isOut && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                        ⚠️ Only {product.stock} left
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {product.discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                    {product.isOrganic && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-300">
                        🌿 Organic
                      </span>
                    )}
                  </div>

                  {/* Image */}
                  <div className="h-44 bg-gray-100">
                    <img
                      src={
                        product.images?.[0] || "https://via.placeholder.com/300"
                      }
                      onError={(e) =>
                        (e.target.src = "https://via.placeholder.com/300")
                      }
                      className="w-full h-full object-cover"
                      alt={tn(product.name)}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-3 flex flex-col flex-1">
                    <h2 className="font-semibold text-gray-800 text-sm leading-tight">
                      {tn(product.name)}
                    </h2>

                    {/* Direct from Farmer tag */}
                    <div className="mt-1.5">
                      <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        🌾 Direct from Farmer
                      </span>
                    </div>

                    {/* Star rating */}
                    {product.totalRatings > 0 && (
                      <div className="mt-1">
                        <StarRating rating={product.averageRating} />
                        <span className="text-xs text-gray-400">
                          ({product.totalRatings})
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-blue-500 mt-1">
                      📍{" "}
                      {product.distance != null
                        ? `${product.distance} km`
                        : distance
                          ? `${distance.toFixed(1)} km`
                          : product.location || "Nearby"}
                    </p>

                    {/* Farmer Price vs Market Price */}
                    <div className="mt-2 bg-green-50 border border-green-100 rounded-lg p-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-green-700 font-bold text-sm">
                          ₹{product.price}
                        </span>
                        <span className="text-gray-400 text-xs">
                          /{product.unit || "kg"}
                        </span>
                        <span className="text-xs text-green-600 font-medium ml-1">
                          Farmer Price
                        </span>
                      </div>
                      {product.marketPrice &&
                      product.marketPrice > product.price ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-gray-400 text-xs line-through">
                            Market ₹{product.marketPrice}
                          </span>
                          <span className="text-xs text-orange-600 font-semibold">
                            Save ₹{product.marketPrice - product.price}
                          </span>
                        </div>
                      ) : hasDiscount && product.originalPrice ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-gray-400 text-xs line-through">
                            Market ₹{product.originalPrice}
                          </span>
                          <span className="text-xs text-orange-600 font-semibold">
                            Save ₹{product.originalPrice - product.price}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <p className="text-xs text-gray-400 mt-1.5">
                      🛒 {product.soldCount || 0} sold
                    </p>

                    {isOut ? (
                      <button
                        disabled
                        className="mt-2 w-full bg-gray-300 text-gray-500 py-1.5 rounded-lg text-sm cursor-not-allowed"
                      >
                        ❌ Out of Stock
                      </button>
                    ) : (
                      <button className="mt-2 w-full bg-green-600 text-white py-1.5 rounded-lg text-sm hover:bg-green-700 transition">
                        View Product
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
