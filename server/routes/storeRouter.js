const express = require("express");
const { authenticateUser } = require("../middleware/authMiddleware");

const {
  getAllProducts,
  getUserProfile,
  getProductById,
  getNearbyProducts,
  addProductComment,
  getProductComments,
  addOrUpdateProductReview,
  getProductReviews,
  updateOrderStatus,
  getFarmerOrders,
  getUserNotifications,
  markNotificationsAsRead,
  getFarmerAnalytics,
} = require("../controllers/storeController");
const router = express.Router();

router.get("/products", authenticateUser, getAllProducts);

router.post("/user", getUserProfile);

router.get("/products/nearby/:lat/:lng", getNearbyProducts);

router.get("/products/:productId", getProductById);

router.post("/products/:productId/comments", addProductComment);

router.get("/products/:productId/comments", getProductComments);

router.post("/products/:productId/reviews", addOrUpdateProductReview);

router.get("/products/:productId/reviews", getProductReviews);

router.put("/orders/:userEmail/:orderId/status", updateOrderStatus);

router.get("/farmer/orders/:email", getFarmerOrders);

router.post("/notifications", getUserNotifications);

router.put("/notifications/read", markNotificationsAsRead);

router.get("/farmer/analytics/:email", getFarmerAnalytics);

module.exports = router;
