import React, { useState, useEffect } from "react";
import { Package, MapPin, Phone, Mail, Calendar, IndianRupee, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../context/LanguageContext";

const API = import.meta.env.VITE_BACKEND_URL;

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const statusColors = {
  placed: "bg-gray-100 text-gray-700",
  packed: "bg-yellow-100 text-yellow-700",
  out_for_delivery: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
};

const statusLabels = {
  placed: "📦 Placed",
  packed: "🗃️ Packed",
  out_for_delivery: "🚚 Out for Delivery",
  delivered: "✅ Delivered",
};

function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { t } = useLang();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const email = localStorage.getItem("userEmail");
        if (!email) throw new Error("Email is required. Please log in.");

        const response = await fetch(`${API}/store/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `API failed: ${response.status}`);
        }

        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t("loading") || "Loading..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{error}</p>
      </div>
    );
  }

  if (!userData) return null;

  const roleLabel =
    userData.role === 2
      ? "🚜 Farmer"
      : userData.role === 3
      ? "🛒 Customer & Farmer"
      : "🛒 Customer";

  const recentOrders = (userData.orders || []).slice(-3).reverse();

  const totalSpent = (userData.orders || []).reduce(
    (sum, order) => sum + (order.totalPrice || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-xl">
          <h1 className="text-xl font-bold">
            {userData.name || "User"}
          </h1>
          <p>{roleLabel}</p>
          <p>{userData.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-bold">{userData.orders?.length || 0}</p>
            <p>Total Orders</p>
          </div>
          <div>
            <p className="font-bold">₹{totalSpent}</p>
            <p>Total Spent</p>
          </div>
          <div>
            <p className="font-bold">₹{userData.walletBalance || 0}</p>
            <p>Wallet</p>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white p-4 rounded-xl">
          <h2 className="font-bold mb-4">Recent Orders</h2>

          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <div key={order._id} className="border-b py-3">
                <p>{order.productName}</p>
                <p>
                  ₹{order.productPrice} × {order.quantity}
                </p>
                <p>{formatDate(order.orderDate)}</p>
                <p>{order.sellerEmail}</p>

                <span className={statusColors[order.status]}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
            ))
          ) : (
            <p>No orders yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;