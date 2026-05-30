const express = require("express");

const { authenticateUser } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");

const {
  getProducts,
  deactivateProduct,
  reactivateProduct,
  getUsers,
  deactivateUser,
  reactivateUser,
} = require("../controllers/adminController");

const router = express.Router();

router.get(
  "/products",
  authenticateUser,
  requireAdmin,
  getProducts
);

router.put(
  "/products/:id/deactivate",
  authenticateUser,
  requireAdmin,
  deactivateProduct
);

router.put(
  "/products/:id/reactivate",
  authenticateUser,
  requireAdmin,
  reactivateProduct
);

router.get(
  "/users",
  authenticateUser,
  requireAdmin,
  getUsers
);

router.put(
  "/users/:id/deactivate",
  authenticateUser,
  requireAdmin,
  deactivateUser
);

router.put(
  "/users/:id/reactivate",
  authenticateUser,
  requireAdmin,
  reactivateUser
);

module.exports = router;