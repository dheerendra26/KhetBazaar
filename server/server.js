if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();

const cors = require("cors");
const cookieParser = require("cookie-parser");
const DB = require("./config/mongooseConnection");
const indexRouter = require("./routes/indexRouter");
const storeRouter = require("./routes/storeRouter");
const order = require("./routes/handleProductsRoute");
const productRouter = require("./routes/postProductRoute");
const razorPayRouter = require("./routes/razorPayRoute");
const mandiRouter    = require("./routes/mandiRouter");
const walletRouter   = require("./routes/walletRouter");
const adminRouter    = require("./routes/adminRouter");
const { startMandiScheduler } = require("./utils/mandiScheduler");
const translateRouter         = require("./routes/translateRouter");

const PORT = process.env.PORT || 3000;
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
    "https://khetbazaar.netlify.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/", indexRouter);
app.use("/store", storeRouter);
app.use("/products", productRouter);
app.use("/orders", order);
app.use("/payments/razorpay", razorPayRouter);
app.use("/mandi", mandiRouter);
app.use("/wallet", walletRouter);
app.use("/admin", adminRouter);
app.use("/api", translateRouter);

app.get("/api/wake-up", (req, res) => {
  res.status(200).send("Backend awake and running!");
});

app.listen(PORT, () => {
  console.log(`server is running on port: ${PORT}`);
  startMandiScheduler();
});
