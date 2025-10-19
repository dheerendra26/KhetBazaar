const express = require("express");
const productsModel = require("../models/productModel")
const router = express.Router();
const { sendListingConfirmationEmail } = require("../utils/sendEmail");
const { sendListingDeletionEmail } = require("../utils/sendEmail")

router.post("/post", async (req, res) => {
    let { name, description, price, email, location, image } = req.body;
    let product = await productsModel.create({
        name: name,
        description: description,
        price: price,
        email: email,
        location: location,
        image: image
    });
    await sendListingConfirmationEmail(email, product);
    res.status(200).json(product);
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productsModel.findByIdAndDelete(id);
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        await sendListingDeletionEmail(product.email, product);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
module.exports = router;
