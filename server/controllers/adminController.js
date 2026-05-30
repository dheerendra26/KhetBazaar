const productsModel = require("../models/productModel");
const userModel = require("../models/userModel");

const getProducts = async (req, res) => {
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
      .sort({
        isActive: -1,
        createdAt: -1,
      });

    return res.json(products);
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const deactivateProduct = async (req, res) => {
  try {
    const product = await productsModel.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        message: "Product is already deactivated",
      });
    }

    product.isActive = false;
    product.deactivatedAt = new Date();
    product.deactivatedBy = req.user.email;

    await product.save();

    return res.json({
      message: `Product "${product.name}" deactivated`,
      product,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const reactivateProduct = async (req, res) => {
  try {
    const product = await productsModel.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (product.isActive) {
      return res.status(400).json({
        message: "Product is already active",
      });
    }

    product.isActive = true;
    product.deactivatedAt = null;
    product.deactivatedBy = null;

    await product.save();

    return res.json({
      message: `Product "${product.name}" reactivated`,
      product,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getUsers = async (req, res) => {
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
      .sort({
        isActive: -1,
        name: 1,
      });

    return res.json(users);
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const deactivateUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        message: "User is already deactivated",
      });
    }

    if (user.role === 4) {
      return res.status(403).json({
        message: "Cannot deactivate another admin",
      });
    }

    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivatedBy = req.user.email;

    await user.save();

    await productsModel.updateMany(
      {
        email: user.email,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedBy: req.user.email,
        },
      }
    );

    return res.json({
      message: `User "${user.email}" deactivated`,
      user,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const reactivateUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        message: "User is already active",
      });
    }

    user.isActive = true;
    user.deactivatedAt = null;
    user.deactivatedBy = null;

    await user.save();

    return res.json({
      message: `User "${user.email}" reactivated`,
      user,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  getProducts,
  deactivateProduct,
  reactivateProduct,
  getUsers,
  deactivateUser,
  reactivateUser,
};