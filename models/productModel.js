const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    email: String,
    location: String,
    image: String,
    comments: [
        {
            userName: String,
            content: String,
            createdAt: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model("product", productSchema);
