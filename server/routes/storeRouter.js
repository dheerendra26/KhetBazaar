const express = require("express");
const productsModel = require("../models/productModel");
const { authenticateUser } = require("../middleware/authMiddleware");
const userModel = require("../models/userModel");
const router = express.Router();

/* ── GET ALL PRODUCTS (active only) ── */
router.get("/products", authenticateUser, async (req, res) => {
  try {
    // isActive: { $ne: false } ensures products that pre-date the soft-delete
    // feature (where isActive is undefined/null) are also returned correctly.
    const products = await productsModel.find({ isActive: { $ne: false } });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ── GET USER PROFILE ── */
router.post("/user", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ email: user.email, name: user.name, contact: user.contact, address: user.address, orders: user.orders, role: user.role, walletBalance: user.walletBalance || 0 });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/* ── NEARBY PRODUCTS (GPS-based) ── */
router.get("/products/nearby/:lat/:lng", async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const radiusKm = parseFloat(req.query.radius) || 50;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    const products = await productsModel.find({ stock: { $gt: 0 }, isActive: { $ne: false } });

    const nearby = products
      .map(p => {
        if (!p.lat || !p.lng) return { ...p.toObject(), distance: null };
        const dLat = (p.lat - userLat) * (Math.PI / 180);
        const dLon = (p.lng - userLng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(userLat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { ...p.toObject(), distance: parseFloat(dist.toFixed(1)) };
      })
      .filter(p => p.distance === null || p.distance <= radiusKm)
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

    res.json(nearby);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ── GET SINGLE PRODUCT ── */
router.get("/products/:productId", async (req, res) => {
  try {
    const product = await productsModel.findOne({ _id: req.params.productId, isActive: { $ne: false } });
    if (!product) return res.status(404).json({ message: "Product not found or deactivated" });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ── GET COMMENTS ── */
router.get("/products/:productId/comments", async (req, res) => {
  try {
    const product = await productsModel.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product.comments || []);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ── POST COMMENT ── */
router.post("/products/:productId/comments", async (req, res) => {
  try {
    const { userName, content } = req.body;
    if (!content) return res.status(400).json({ message: "Comment content is required" });
    const product = await productsModel.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const newComment = { userName: userName || "Anonymous", content };
    product.comments.push(newComment);
    await product.save();
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ── SUBMIT REVIEW & RATING ── */
router.post("/products/:productId/reviews", async (req, res) => {
  try {
    const { userName, userEmail, rating, review } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5" });
    const product = await productsModel.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Prevent duplicate review from same email
    const existing = product.reviews.find(r => r.userEmail === userEmail);
    if (existing) {
      existing.rating = rating;
      existing.review = review || "";
    } else {
      product.reviews.push({ userName: userName || "Anonymous", userEmail, rating, review: review || "" });
    }

    // Recalculate average
    const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = Math.round((total / product.reviews.length) * 10) / 10;
    product.totalRatings = product.reviews.length;
    await product.save();
    res.status(201).json({ averageRating: product.averageRating, totalRatings: product.totalRatings });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ── GET REVIEWS ── */
router.get("/products/:productId/reviews", async (req, res) => {
  try {
    const product = await productsModel.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ reviews: product.reviews, averageRating: product.averageRating, totalRatings: product.totalRatings });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ── ORDER STATUS UPDATE (farmer/admin) ── */
router.put("/orders/:userEmail/:orderId/status", async (req, res) => {
  try {
    const { userEmail, orderId } = req.params;
    const { status } = req.body;
    const validStatuses = ["placed", "packed", "out_for_delivery", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const user = await userModel.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    const order = user.orders.id(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // If cancelling, restore product stock
    if (status === "cancelled" && order.status !== "cancelled") {
      try {
        const ProductModel = require("../models/productModel");
        await ProductModel.findByIdAndUpdate(order.productId, {
          $inc: { stock: order.quantity || 1, soldCount: -(order.quantity || 1) }
        });
      } catch (e) { /* non-critical */ }
    }

    order.status = status;
    order.statusHistory.push({ status, updatedAt: new Date() });

    // Add notification
    const statusLabels = { placed: "Order Placed", packed: "Order Packed", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled" };
    user.notifications.push({
      message: `Your order for "${order.productName}" is now: ${statusLabels[status]}`,
      type: "order",
    });

    await user.save();
    res.json({ message: "Status updated", order });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ── GET FARMER'S RECEIVED ORDERS (across all buyers) ── */
router.get("/farmer/orders/:email", async (req, res) => {
  try {
    const { email } = req.params;
    // Orders are stored in the buyer's user document, so we scan all users
    // and collect orders where sellerEmail matches the farmer
    const allUsers = await userModel.find({ "orders.sellerEmail": email });
    const farmerOrders = [];
    for (const user of allUsers) {
      for (const order of user.orders) {
        if (order.sellerEmail !== email) continue;
        const obj = order.toObject();
        // Ensure buyerEmail is always populated (for older orders that lack it)
        obj.buyerEmail = obj.buyerEmail || user.email;
        farmerOrders.push(obj);
      }
    }
    farmerOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    res.json({ orders: farmerOrders });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ── GET NOTIFICATIONS ── */
router.post("/notifications", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ notifications: user.notifications.slice(-20).reverse() });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ── MARK NOTIFICATIONS READ ── */
router.put("/notifications/read", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    user.notifications.forEach(n => (n.read = true));
    await user.save();
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ── FARMER ANALYTICS DASHBOARD ── */
router.get("/farmer/analytics/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { startDate, endDate } = req.query;

    // Parse optional date range
    const dateFrom = startDate ? new Date(startDate) : null;
    const dateTo = endDate ? new Date(endDate) : null;
    if (dateTo) dateTo.setHours(23, 59, 59, 999); // inclusive end of day

    const products = await productsModel.find({ email, isActive: { $ne: false } });

    // If date range provided, pull filtered orders from user documents
    let filteredOrderMap = null; // productId -> { sold, revenue }
    let actualIncomeTotal = 0;  // delivered orders only
    let cancelledCount = 0;
    let cancelledAmount = 0;
    let pendingIncome = 0;

    // Always scan user orders for income tracking
    const allUsers = await userModel.find({ "orders.sellerEmail": email });
    filteredOrderMap = {};

    // Daily revenue map: "YYYY-MM-DD" (IST) → { date, revenue, unitsSold, orders }
    const dailyRevenueMap = {};

    for (const user of allUsers) {
      for (const order of user.orders) {
        if (order.sellerEmail !== email) continue;
        const orderDate = new Date(order.orderDate);
        if (dateFrom && orderDate < dateFrom) continue;
        if (dateTo && orderDate > dateTo) continue;

        const pid = order.productId;
        const isCancelled = order.status === "cancelled";
        const isDelivered = order.status === "delivered";

        // Only count non-cancelled for sold/revenue
        if (!isCancelled) {
          if (!filteredOrderMap[pid]) filteredOrderMap[pid] = { sold: 0, revenue: 0 };
          filteredOrderMap[pid].sold    += order.quantity  || 1;
          filteredOrderMap[pid].revenue += order.totalPrice || 0;

          // Bucket into IST date (UTC+5:30)
          const istDate = new Date(orderDate.getTime() + 5.5 * 60 * 60 * 1000);
          const dateKey = istDate.toISOString().slice(0, 10); // "2025-04-11"
          if (!dailyRevenueMap[dateKey]) {
            dailyRevenueMap[dateKey] = { date: dateKey, revenue: 0, unitsSold: 0, orders: 0 };
          }
          dailyRevenueMap[dateKey].revenue   += order.totalPrice || 0;
          dailyRevenueMap[dateKey].unitsSold += order.quantity   || 1;
          dailyRevenueMap[dateKey].orders    += 1;
        }

        if (isDelivered) {
          actualIncomeTotal += order.totalPrice || 0;
        } else if (isCancelled) {
          cancelledCount  += 1;
          cancelledAmount += order.totalPrice || 0;
        } else {
          pendingIncome += order.totalPrice || 0;
        }
      }
    }

    // Sort daily revenue oldest → newest for chart consumption
    const dailyRevenue = Object.values(dailyRevenueMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Compute per-product stats (date-filtered or all-time)
    const productStats = products.map(p => {
      const pid = p._id.toString();
      const fm = filteredOrderMap[pid] || { sold: 0, revenue: 0 };
      // If no date filter and no orders in map, fall back to product.soldCount
      if (!dateFrom && !dateTo && fm.sold === 0 && p.soldCount > 0) {
        return { ...p.toObject(), _sold: p.soldCount, _revenue: p.soldCount * p.price };
      }
      return { ...p.toObject(), _sold: fm.sold, _revenue: fm.revenue };
    });

    const totalRevenue = productStats.reduce((sum, p) => sum + p._revenue, 0);
    const totalSold = productStats.reduce((sum, p) => sum + p._sold, 0);
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const mostSold = [...productStats].sort((a, b) => b._sold - a._sold)[0] || null;
    const lowStock = products.filter(p => p.stock <= 3 && p.stock > 0);
    const outOfStock = products.filter(p => p.stock === 0);

    const categoryBreakdown = productStats.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + p._sold;
      return acc;
    }, {});

    const chartData = productStats.map(p => ({
      name: p.name.length > 12 ? p.name.substring(0, 12) + "…" : p.name,
      sold: p._sold,
      allTimeSold: p.soldCount || 0,   // always the lifetime count regardless of date filter
      revenue: p._revenue,
      stock: p.stock,
      unit: p.unit || "kg",
    }));

    res.json({
      totalRevenue,
      actualIncome: actualIncomeTotal,
      cancelledCount,
      cancelledAmount,
      pendingIncome,
      totalSold,
      totalStock,
      totalProducts: products.length,
      mostSold: mostSold ? { name: mostSold.name, soldCount: mostSold._sold } : null,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      categoryBreakdown,
      chartData,
      dailyRevenue,   // [{date, revenue, unitsSold, orders}, …] sorted oldest→newest
      dateFiltered: !!(dateFrom || dateTo),
      dateRange: { startDate: startDate || null, endDate: endDate || null },
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
