if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require("express");
const app = express();

const cors = require("cors");
const cookieParser = require("cookie-parser");
const DB = require("./config/mongooseConnection");
const indexRouter = require("./routes/indexRouter");
const storeRouter = require("./routes/storeRouter");
const order = require("./routes/handleProductsRoute");
const ProductRouter = require("./routes/postProductRoute");

const PORT = process.env.PORT || 3000;
const corsOptions = {
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000', 
        'https://farmers-mart-one.vercel.app',
        'https://farmers-mart-16zdqb8z5-coffees-projects-132cf7e6.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/", indexRouter);
app.use("/store", storeRouter);
app.use("/products", ProductRouter);
app.use("/orders", order);

app.listen(PORT, () => {
    console.log(`server is running on port: ${PORT}`);
})
