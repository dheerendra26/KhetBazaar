import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";

const API = import.meta.env.VITE_BACKEND_URL;

const STATUS_STEPS = ["placed", "packed", "out_for_delivery", "delivered"];

const STATUS_LABELS = {
  placed: { label: "Order Placed", icon: "📦", color: "bg-gray-400" },
  packed: { label: "Packed", icon: "🗃️", color: "bg-yellow-400" },
  out_for_delivery: { label: "Out for Delivery", icon: "🚚", color: "bg-blue-400" },
  delivered: { label: "Delivered", icon: "✅", color: "bg-green-500" },
};

// ✅ FIXED INVOICE FUNCTION
const generateInvoiceHTML = (order, userEmail, t) => {
  const paymentLabel =
    order.paymentMethod === "cod"
      ? t("cashOnDeliveryShort")
      : order.paymentMethod === "wallet"
      ? t("walletShort")
      : t("onlineShort");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Invoice</title>
<style>
body{font-family:Arial;padding:40px;max-width:600px;margin:auto}
.header{text-align:center;border-bottom:2px solid green;padding-bottom:10px;margin-bottom:20px}
.info{margin:10px 0}
.total{font-weight:bold;margin-top:10px}
</style>
</head>
<body>

<div class="header">
  <h2>KhetBazaar Invoice</h2>
</div>

<div class="info"><strong>Customer:</strong> ${userEmail}</div>
<div class="info"><strong>Product:</strong> ${order.productName}</div>
<div class="info"><strong>Quantity:</strong> ${order.quantity}</div>
<div class="info"><strong>Price:</strong> ₹${order.productPrice}</div>
<div class="info"><strong>Payment:</strong> ${paymentLabel}</div>

<div class="total">
  Total: ₹${order.totalPrice}
</div>

</body>
</html>
`;
};

const OrderHistory = () => {
  const { userEmail } = useAuth();
  const { t } = useLang();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const email = userEmail || localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API}/store/user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        setOrders((data.orders || []).reverse());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (email) fetchOrders();
  }, [email]);

  const downloadInvoice = (order) => {
    const html = generateInvoiceHTML(order, email, t);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${order.productName}.html`;
    a.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t("loading") || "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🧾 Order History</h1>

        {orders.length === 0 ? (
          <p>No orders found</p>
        ) : (
          orders.map((order, i) => {
            const isExpanded = expandedOrder === i;

            return (
              <div key={i} className="bg-white p-4 mb-4 rounded shadow">
                
                {/* HEADER */}
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedOrder(isExpanded ? null : i)
                  }
                >
                  <p className="font-bold">{order.productName}</p>

                  <p className="text-sm text-gray-500">
                    ₹{order.totalPrice} •{" "}
                    {new Date(order.orderDate).toLocaleDateString("en-IN")}
                  </p>

                  {/* ✅ FIXED PAYMENT LINE */}
                  <p className="text-sm text-gray-400">
                    Payment: {order.paymentMethod === "cod"
                      ? t("cashOnDeliveryShort")
                      : order.paymentMethod === "wallet"
                      ? t("walletShort")
                      : t("onlineShort")}
                  </p>
                </div>

                {/* EXPANDED */}
                {isExpanded && (
                  <div className="mt-3 border-t pt-3">
                    <p>Qty: {order.quantity}</p>
                    <p>Price: ₹{order.productPrice}</p>

                    <button
                      onClick={() => downloadInvoice(order)}
                      className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
                    >
                      Download Invoice
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrderHistory;