import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

const NotificationBell = () => {
  const { userEmail, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const email = userEmail || localStorage.getItem("userEmail");

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    if (!email) return;
    try {
      const res = await axios.post(`${API}/store/notifications`, { email });
      setNotifications(res.data.notifications || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated, email]);

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/store/notifications/read`, { email });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  if (!isAuthenticated) return null;

  const TYPE_ICONS = { order: "🛒", price_drop: "🏷️", new_product: "🌱", general: "🔔" };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead(); }}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-green-50">
              <h3 className="font-bold text-gray-800">🔔 Notifications</h3>
              {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-green-600 hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <p className="text-3xl mb-2">🔕</p>
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div key={i} className={`flex gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50 transition ${!n.read ? "bg-green-50/50" : ""}`}>
                    <span className="text-xl flex-shrink-0">{TYPE_ICONS[n.type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-gray-700 ${!n.read ? "font-semibold" : ""}`}>{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5"></div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
