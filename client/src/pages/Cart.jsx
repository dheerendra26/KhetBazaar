import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { ShoppingCart } from "lucide-react";

const Cart = () => {
  const [cart, setCart] = useState([]);
  const { isAuthenticated } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
    const rawCart = JSON.parse(localStorage.getItem("cart") || "[]");
    // FIX: Sanitize cart on load — remove items with invalid qty, clamp negatives to 1
    const sanitized = rawCart
      .map(item => ({ ...item, quantity: Math.max(1, Math.abs(item.quantity || 1)) }))
      .filter(item => item._id && item.quantity > 0);
    setCart(sanitized);
    localStorage.setItem("cart", JSON.stringify(sanitized));
  }, [isAuthenticated, navigate]);

  // FIX: updateQty only runs for items that are actually in the cart.
  // Minimum qty is 1; pressing − at qty=1 prompts removal instead of going negative.
  const updateQty = (productId, newQty) => {
    // FIX: Ensure the item is actually in cart before updating
    const itemInCart = cart.find(item => item._id === productId);
    if (!itemInCart) return;

    if (newQty < 1) {
      // Instead of going to 0 or negative, remove the item
      removeFromCart(productId);
      return;
    }

    const updated = cart.map(item =>
      item._id === productId
        ? { ...item, quantity: Math.max(1, newQty) } // never store below 1
        : item
    );
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const removeFromCart = (productId) => {
    const updated = cart.filter(item => item._id !== productId);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.setItem("cart", JSON.stringify([]));
  };

  // FIX: Use Math.max(0, ...) to ensure totals never go negative
  const totalItems = cart.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * Math.max(0, item.quantity), 0);

  if (cart.length === 0) return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ShoppingCart className="w-8 h-8" /> Your Cart
      </h1>
      <div className="text-center py-16 bg-gray-50 rounded-xl">
        <ShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
        <p className="text-xl text-gray-500 mb-4">{t("cartEmpty")}</p>
        <Link to="/shop" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
          Continue Shopping
        </Link>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <ShoppingCart className="w-8 h-8" />
        Your Cart
        <span className="text-xl font-normal text-gray-500">({totalItems} {totalItems === 1 ? "item" : "items"})</span>
      </h1>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="divide-y">
          {cart.map(item => (
            <div key={item._id} className="p-4 flex items-center gap-4">
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover"
                  onError={e => e.target.src = "https://via.placeholder.com/80"} />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item._id}`} className="font-semibold text-gray-800 hover:text-green-600 block truncate">
                  {item.name}
                </Link>
                <p className="text-green-600 font-medium">₹{item.price} / {item.unit || "kg"}</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                {/* FIX: − button at qty=1 removes the item; never goes to 0 or negative */}
                <button
                  onClick={() => updateQty(item._id, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center text-lg font-bold text-gray-600 hover:text-red-500"
                  title={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                >
                  {item.quantity === 1 ? "🗑" : "−"}
                </button>
                <span className="w-6 text-center font-semibold">{Math.max(1, item.quantity)}</span>
                <button
                  onClick={() => updateQty(item._id, item.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-lg font-bold text-gray-600 hover:text-green-600"
                >+</button>
              </div>
              <div className="text-right min-w-20">
                <p className="font-bold text-gray-800">₹{(item.price * Math.max(1, item.quantity)).toFixed(2)}</p>
                <button onClick={() => removeFromCart(item._id)} className="text-red-500 text-xs hover:underline mt-1">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-6">
          <div className="flex justify-between mb-2 text-gray-600"><span>{t("subtotal")}</span><span>₹{totalPrice.toFixed(2)}</span></div>
          <div className="flex justify-between mb-2 text-gray-600"><span>{t("shipping")}</span><span className="text-green-600 font-medium">{t("shippingFree")}</span></div>
          <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-4 mt-2">
            <span>{t("total")}</span><span className="text-green-600">₹{totalPrice.toFixed(2)}</span>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={clearCart} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-gray-600">
              Clear Cart
            </button>
            <button
              onClick={() => navigate("/checkout")}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-semibold text-lg"
            >
              Proceed to Checkout →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
