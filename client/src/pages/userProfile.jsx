import React, { useState, useEffect } from "react";
import { Package, User, MapPin, Phone, Mail, Calendar, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Get email from localStorage
        const email = localStorage.getItem("userEmail");

        if (!email) {
          throw new Error("Email is required. Please log in.");
        }

        // Use the correct API URL
        const apiUrl = `https://farmers-mart.onrender.com/store/user`;

        // Make POST request with JSON body
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        setUserData(data);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-gray-600">No user data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-green-50 rounded-xl p-8 mb-8 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <User className="text-green-600" />
                {userData.name}
              </h1>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-500" />
                  {userData.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-500" />
                  {userData.contact}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  {userData.address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Package className="text-green-600" />
            Order History
          </h2>

          <div className="space-y-4">
            {userData.orders && userData.orders.length > 0 ? (
              userData.orders.map((order) => (
                <div key={order._id.toString()} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{order.productName}</h3>
                      <div className="space-y-2 text-gray-600">
                        <p className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-orange-500" />
                          Price: ₹{order.productPrice} × {order.quantity}
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          Ordered on: {formatDate(order.orderDate)}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-orange-500" />
                          Seller: {order.sellerEmail}
                        </p>
                      </div>
                    </div>
                    <div className="bg-green-50 px-4 py-2 rounded-lg">
                      <p className="text-green-800 font-semibold">Total: ₹{order.totalPrice}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No orders found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
