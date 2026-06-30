if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();

const cors = require("cors");
const cookieParser = require("cookie-parser");
const DB = require("./config/dbConnection");
const authRouter = require("./routes/authRouter");
const storeRouter = require("./routes/storeRouter");
const order = require("./routes/orderRouter");
const productRouter = require("./routes/productRouter");
const razorPayRouter = require("./routes/razorPayRouter");
const mandiRouter    = require("./routes/mandiRouter");
const walletRouter   = require("./routes/walletRouter");
const adminRouter    = require("./routes/adminRouter");
const { startMandiScheduler } = require("./utils/mandiScheduler");
const translateRouter         = require("./routes/translateRouter");
const allowedOrigins = require("./config/allowedOrigins");

const PORT = process.env.PORT || 3000;
const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/", authRouter);
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
