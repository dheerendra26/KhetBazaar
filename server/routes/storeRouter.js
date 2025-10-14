const express = require("express");
const productsModel = require("../models/productModel");
const { authenticateUser } = require("../middleware/authMiddleware");
const userModel = require("../models/userModel");
const router = express.Router();

router.get("/products", authenticateUser, async (req, res) => {
    try {
        const products = await productsModel.find({});
        res.status(200).json(products);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/user", async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ message: 'Email is required' });
        }
        
        let user = await userModel.findOne({ email });
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
      }
})

// Get a single product by ID
router.get("/products/:productId", async (req, res) => {
  try {
      const product = await productsModel.findById(req.params.productId);
      if (!product) {
          return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json(product);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
  }
});


// Get comments for a product
router.get("/products/:productId/comments", async (req, res) => {
  try {
      const product = await productsModel.findById(req.params.productId);
      if (!product) {
          return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json(product.comments || []);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
  }
});


// Post a new comment
router.post("/products/:productId/comments", async (req, res) => {
  try {
      const { userName, content } = req.body;
      if (!content) {
          return res.status(400).json({ message: "Comment content is required" });
      }

      const product = await productsModel.findById(req.params.productId);
      if (!product) {
          return res.status(404).json({ message: "Product not found" });
      }

      // Add new comment
      const newComment = { userName: userName || "Anonymous", content };
      product.comments.push(newComment);
      await product.save();

      res.status(201).json(newComment);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
  }
});


module.exports = router;
