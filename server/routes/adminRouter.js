const express = require("express");
const productsModel = require("../models/productModel");
const userModel = require("../models/userModel");
const { authenticateUser } = require("../middleware/authMiddleware");
const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 4) {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
}

router.get("/products", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter =
      status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {};
    const products = await productsModel
      .find(filter)
      .sort({ isActive: -1, createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put(
  "/products/:id/deactivate",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const product = await productsModel.findById(req.params.id);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      if (!product.isActive)
        return res
          .status(400)
          .json({ message: "Product is already deactivated" });

      product.isActive = false;
      product.deactivatedAt = new Date();
      product.deactivatedBy = req.user.email;
      await product.save();

      res.json({ message: `Product "${product.name}" deactivated`, product });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

router.put(
  "/products/:id/reactivate",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const product = await productsModel.findById(req.params.id);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      if (product.isActive)
        return res.status(400).json({ message: "Product is already active" });

      product.isActive = true;
      product.deactivatedAt = null;
      product.deactivatedBy = null;
      await product.save();

      res.json({ message: `Product "${product.name}" reactivated`, product });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

router.get("/users", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter =
      status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {};
    const users = await userModel
      .find(filter)
      .select("-otp")
      .sort({ isActive: -1, name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put(
  "/users/:id/deactivate",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const user = await userModel.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (!user.isActive)
        return res.status(400).json({ message: "User is already deactivated" });
      if (user.role === 4)
        return res
          .status(403)
          .json({ message: "Cannot deactivate another admin" });

      user.isActive = false;
      user.deactivatedAt = new Date();
      user.deactivatedBy = req.user.email;
      await user.save();

      await productsModel.updateMany(
        { email: user.email, isActive: true },
        {
          $set: {
            isActive: false,
            deactivatedAt: new Date(),
            deactivatedBy: req.user.email,
          },
        },
      );

      res.json({ message: `User "${user.email}" deactivated`, user });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

router.put(
  "/users/:id/reactivate",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const user = await userModel.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.isActive)
        return res.status(400).json({ message: "User is already active" });

      user.isActive = true;
      user.deactivatedAt = null;
      user.deactivatedBy = null;
      await user.save();

      res.json({ message: `User "${user.email}" reactivated`, user });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

module.exports = router;
