const express = require("express");
const nodemailer = require("nodemailer");
const userModel = require("../models/userModel");
const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

router.post("/", async (req, res) => {
  const { buyerEmail, items } = req.body;

  try {
    const totalPrice = items.reduce((sum, item) => sum + item.productPrice, 0);

    const buyerEmailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .order-item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Order Confirmation</h2>
          </div>
          <div class="content">
            <p>Dear Customer,</p>
            <p>Thank you for your purchase from Farmers Mart! Below are your order details:</p>
            
            <h3>Order Summary:</h3>
            ${items
              .map(
                (item) => `
              <div class="order-item">
                <p><strong>Product:</strong> ${item.productName}</p>
                <p><strong>Price:</strong> ${formatCurrency(
                  item.productPrice
                )}</p>
                <p><strong>Seller Email:</strong> ${item.sellerEmail}</p>
              </div>
            `
              )
              .join("")}
            
            <div class="total">
              <p>Total Amount: ${formatCurrency(totalPrice)}</p>
            </div>
            
            <p>The sellers have been notified and will contact you soon regarding delivery.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Farmers Mart. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Farmers Mart" <${process.env.EMAIL_USER}>`,
      to: buyerEmail,
      subject: "Order Confirmation - Farmers Mart",
      html: buyerEmailContent,
    });

    // Add items to user's order history
    const user = await userModel.findOne({ email: buyerEmail });

    if (user) {
      // Create order items that match the orderItemSchema structure
      const orderItemsWithDate = items.map((item) => ({
        productName: item.productName,
        productPrice: item.productPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        sellerEmail: item.sellerEmail,
        orderDate: new Date(),
      }));

      // Add the items to the user's orders array
      user.orders.push(...orderItemsWithDate);
      await user.save();
    } else {
      console.log(`User with email ${buyerEmail} not found in database`);
    }


    const sellerItems = items.reduce((acc, item) => {
      if (!acc[item.sellerEmail]) {
        acc[item.sellerEmail] = [];
      }
      acc[item.sellerEmail].push(item);
      return acc;
    }, {});

    for (const [sellerEmail, sellerProducts] of Object.entries(sellerItems)) {
      const sellerTotal = sellerProducts.reduce(
        (sum, item) => sum + item.productPrice,
        0
      );

      const sellerEmailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
            .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
            .buyer-info { background-color: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Order Received</h2>
            </div>
            <div class="content">
              <p>Dear Seller,</p>
              <p>You have received a new order from Farmers Mart!</p>
              
              <div class="buyer-info">
                <h3>Buyer Information:</h3>
                <p><strong>Email:</strong> ${buyerEmail}</p>
              </div>

              <h3>Order Details:</h3>
              ${sellerProducts
                .map(
                  (item) => `
                <div class="order-item">
                  <p><strong>Product:</strong> ${item.productName}</p>
                  <p><strong>Price:</strong> ${formatCurrency(
                    item.productPrice
                  )}</p>
                </div>
              `
                )
                .join("")}
              
              <div class="total">
                <p>Total Amount: ${formatCurrency(sellerTotal)}</p>
              </div>
              
              <p>Please contact the buyer at ${buyerEmail} to arrange delivery.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from Farmers Mart. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: `"Farmers Mart" <${process.env.EMAIL_USER}>`,
        to: sellerEmail,
        subject: "New Order Received - Farmers Mart",
        html: sellerEmailContent,
      });
    }

    res.status(200).json({
      message: "Order notifications sent successfully",
      details: {
        buyerEmail: buyerEmail,
        sellerEmails: Object.keys(sellerItems),
        totalAmount: totalPrice,
      },
    });
  } catch (error) {
    console.error("Error sending order notifications:", error);
    res.status(500).json({
      message: "Failed to send order notifications",
      error: error.message,
    });
  }
});

module.exports = router;
