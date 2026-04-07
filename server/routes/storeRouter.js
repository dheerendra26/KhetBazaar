const express = require("express");
const productsModel = require("../models/productModel");
const { authenticateUser } = require("../middleware/authMiddleware");
const userModel = require("../models/userModel");
const router = express.Router();

/* ── GET ALL PRODUCTS ── */
router.get("/products", authenticateUser, async (req, res) => {
  try {
    const products = await productsModel.find({});
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

    const products = await productsModel.find({ stock: { $gt: 0 } });

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
    const product = await productsModel.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
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
    const validStatuses = ["placed", "packed", "out_for_delivery", "delivered"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const user = await userModel.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    const order = user.orders.id(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    order.statusHistory.push({ status, updatedAt: new Date() });

    // Add notification
    const statusLabels = { placed: "Order Placed", packed: "Order Packed", out_for_delivery: "Out for Delivery", delivered: "Delivered" };
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
    const products = await productsModel.find({ email });

    const totalRevenue = products.reduce((sum, p) => sum + (p.soldCount * p.price), 0);
    const totalSold = products.reduce((sum, p) => sum + p.soldCount, 0);
    const mostSold = products.sort((a, b) => b.soldCount - a.soldCount)[0] || null;
    const lowStock = products.filter(p => p.stock <= 3 && p.stock > 0);
    const outOfStock = products.filter(p => p.stock === 0);

    const categoryBreakdown = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + p.soldCount;
      return acc;
    }, {});

    const chartData = products.map(p => ({
      name: p.name.length > 12 ? p.name.substring(0, 12) + "…" : p.name,
      sold: p.soldCount,
      revenue: p.soldCount * p.price,
      stock: p.stock,
    }));

    res.json({
      totalRevenue,
      totalSold,
      totalProducts: products.length,
      mostSold: mostSold ? { name: mostSold.name, soldCount: mostSold.soldCount } : null,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      categoryBreakdown,
      chartData,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
