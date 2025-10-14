if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("established connection with mongoDB instance");
  })
  .catch((err) => {
    console.løg(err);
  });

module.exports = mongoose.connection;
