import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { ShoppingCart } from "lucide-react";

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }


    const cartData = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(cartData);
  }, [isAuthenticated, navigate]);

  const updateCartItemQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item =>
      item._id === productId ? { ...item, quantity: newQuantity } : item
    );
    
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item._id !== productId);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.setItem("cart", JSON.stringify([]));
  };

  const handleBuy = async () => {
    const buyerEmail = localStorage.getItem('userEmail');

    if (!buyerEmail) {
      setError('User email not found. Please try logging in again.');
      return;
    }

    // Check if we have all the required data
    const invalidItems = cart.filter(item => !item.sellerEmail);
    if (invalidItems.length > 0) {
      setError('Some products are missing seller information. Please try refreshing or contact support.');
      console.error('Items missing seller email:', invalidItems);
      return;
    }

    try {
      const orderData = {
        buyerEmail,
        items: cart.map(item => ({
          productName: item.name,
          productPrice: item.price,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity,
          sellerEmail: item.sellerEmail 
        }))
      };

      console.log('Sending order data:', orderData);


      const response = await axios.post('https://farmers-mart.onrender.com/orders', orderData);
      console.log('Order response:', response.data);
      
      clearCart();
      navigate('/checkout', { state: { orderData } });
    } catch (error) {
      console.error('Error processing order:', error);
      if (error.response) {
        console.error('Server error details:', error.response.data);
        setError(`Failed to process order: ${error.response.data.message || 'Unknown error'}`);
      } else {
        setError('Failed to process order. Please try again.');
      }
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <ShoppingCart className="mr-2" />
        Your Cart
        <span className="ml-2 text-xl font-normal text-gray-600">
          ({totalItems} {totalItems === 1 ? "item" : "items"})
        </span>
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {cart.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-600 mb-4">Your cart is empty</h2>
          <Link
            to="/shop"
            className="inline-block bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Cart Items */}
          <div className="divide-y">
            {cart.map((item) => (
              <div key={item._id} className="p-4 flex items-center">
                <div className="w-20 h-20 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="ml-4 flex-grow">
                  <Link to={`/product/${item._id}`} className="font-medium hover:text-green-600">
                    {item.name}
                  </Link>
                  <p className="text-green-600">₹{item.price}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateCartItemQuantity(item._id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
                  >
                    -
                  </button>
                  <span className="mx-2">{item.quantity}</span>
                  <button
                    onClick={() => updateCartItemQuantity(item._id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"
                  >
                    +
                  </button>
                </div>
                <div className="ml-6 text-right">
                  <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-gray-50 p-6">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-4 mt-4">
              <span>Total</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>

            <div className="mt-6 flex space-x-4">
              <button
                onClick={clearCart}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Clear Cart
              </button>
              <button
                onClick={handleBuy}
                className="flex-grow bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;