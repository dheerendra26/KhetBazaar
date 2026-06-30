const express = require("express");
const router = express.Router();

const {
  resolveProductCategory,
  getCategorySynonyms,
  createProduct,
  deactivateProduct,
  getProductSalesStatus,
  updateProduct,
  getSellerProducts,
  predictCropPrice,
  getCropRecommendations,
  purchaseProduct,
} = require("../controllers/productController");

router.get("/resolve-category", resolveProductCategory);

router.get("/category-synonyms", getCategorySynonyms);

router.post("/post", createProduct);

router.delete("/delete/:id", deactivateProduct);

router.get("/sales-check/:id", getProductSalesStatus);

router.put("/edit/:id", updateProduct);

router.get("/my-products/:email", getSellerProducts);

router.get("/predict-price", predictCropPrice);

router.get("/crop-recommendation", getCropRecommendations);

router.put("/buy/:id", purchaseProduct);

module.exports = router;
