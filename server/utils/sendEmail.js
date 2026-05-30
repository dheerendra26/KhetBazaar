if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const nodemailer = require("nodemailer");
const axios = require("axios");

/* ─────────────────────────────────────────────────────────
   DEV: Gmail Transporter
───────────────────────────────────────────────────────── */
const gmailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  tls: { rejectUnauthorized: false },
});

/* ─────────────────────────────────────────────────────────
   PROD: Brevo API Sender
───────────────────────────────────────────────────────── */
const sendBrevoEmail = async ({ to, subject, html }) => {
  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

/* ─────────────────────────────────────────────────────────
   Unified Mail Sender
───────────────────────────────────────────────────────── */
const sendMail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV === "production") {
    console.log("Using Brevo API to send email...");
    return sendBrevoEmail({ to, subject, html });
  }
  return gmailTransporter.sendMail({
    from: `"KhetBazaar" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

/* ─────────────────────────────────────────────────────────
   Shared HTML Helpers
───────────────────────────────────────────────────────── */
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

const wrapHtml = (body) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f1f8e9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f8e9;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:12px;overflow:hidden;
               box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:600px;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2e7d32,#66bb6a);
                     padding:28px 36px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">
              🌾 KhetBazaar
            </h1>
            <p style="margin:5px 0 0;color:#c8e6c9;font-size:13px;">
              Farm Fresh — Direct to You
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:32px 36px;">${body}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fbe7;padding:20px 36px;text-align:center;
                     border-top:1px solid #e8f5e9;">
            <p style="margin:0;color:#558b2f;font-size:13px;font-weight:600;">
              KhetBazaar — Connecting Farmers &amp; Consumers
            </p>
            <p style="margin:5px 0 0;color:#9e9e9e;font-size:11px;">
              © ${new Date().getFullYear()} KhetBazaar. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const buildItemsTable = (items) => {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
        ${item.productName}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;
                 text-align:center;">
        ${item.quantity}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;
                 text-align:right;">
        ${formatCurrency(item.productPrice)}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;
                 text-align:right;font-weight:600;color:#2e7d32;">
        ${formatCurrency(item.productPrice * item.quantity)}
      </td>
    </tr>`).join("");

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#2e7d32;color:#fff;">
          <th style="padding:10px 12px;text-align:left;">Product</th>
          <th style="padding:10px 12px;text-align:center;">Qty</th>
          <th style="padding:10px 12px;text-align:right;">Unit Price</th>
          <th style="padding:10px 12px;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
};

/* ─────────────────────────────────────────────────────────
   1. OTP Email (existing — unchanged)
───────────────────────────────────────────────────────── */
const sendOTPEmail = async (email, otp) => {
  try {
    const result = await sendMail({
      to: email,
      subject: "One-Time Password — KhetBazaar",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
          <h2>OTP Verification</h2>
          <p>Your One-Time Password (OTP) for registration is:</p>
          <h3 style="background:#f0f0f0;padding:10px;text-align:center;
                     letter-spacing:4px;font-size:28px;">
            ${otp}
          </h3>
          <small>If you didn't request this, please ignore this email.</small>
        </div>`,
    });
    return { success: true, message: "OTP sent successfully", result };
  } catch (err) {
    console.error("Error sending OTP email:", err);
    return { success: false, message: "Failed to send OTP", error: err.message };
  }
};

/* ─────────────────────────────────────────────────────────
   2. Listing Confirmation Email (existing — unchanged)
───────────────────────────────────────────────────────── */
const sendListingConfirmationEmail = async (email, product) => {
  try {
    const result = await sendMail({
      to: email,
      subject: "Your Product Listing is Live! — KhetBazaar",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
          <h2>Congratulations! Your Product is Listed</h2>
          <p>Your product "<strong>${product.name}</strong>" has been successfully listed on KhetBazaar.</p>
          <ul>
            <li><strong>Product ID:</strong> ${product._id}</li>
            <li><strong>Name:</strong> ${product.name}</li>
            <li><strong>Description:</strong> ${product.description}</li>
            <li><strong>Price:</strong> ₹${product.price}</li>
            <li><strong>Location:</strong> ${product.location}</li>
          </ul>
          <p>Thank you for listing with us!</p>
        </div>`,
    });
    return { success: true, message: "Listing confirmation email sent", result };
  } catch (err) {
    console.error("Error sending listing confirmation email:", err);
    return { success: false, message: "Failed to send listing confirmation email", error: err.message };
  }
};

/* ─────────────────────────────────────────────────────────
   3. Listing Deletion Email (existing — unchanged)
───────────────────────────────────────────────────────── */
const sendListingDeletionEmail = async (email, product) => {
  try {
    const result = await sendMail({
      to: email,
      subject: "Your Product Listing Has Been Removed — KhetBazaar",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
          <h2>Listing Removed</h2>
          <p>Your product "<strong>${product.name}</strong>" has been removed from KhetBazaar.</p>
          <ul>
            <li><strong>Product ID:</strong> ${product._id}</li>
            <li><strong>Name:</strong> ${product.name}</li>
            <li><strong>Description:</strong> ${product.description}</li>
            <li><strong>Price:</strong> ₹${product.price}</li>
            <li><strong>Location:</strong> ${product.location}</li>
          </ul>
          <p>If this was a mistake, please contact support.</p>
        </div>`,
    });
    return { success: true, message: "Listing deletion email sent", result };
  } catch (err) {
    console.error("Error sending listing deletion email:", err);
    return { success: false, message: "Failed to send listing deletion email", error: err.message };
  }
};

/* ─────────────────────────────────────────────────────────
   4. ORDER CONFIRMATION → CUSTOMER  (NEW)
   Sent after successful payment (Razorpay verified / wallet / COD).
   Includes: order summary + farmer name & phone per item.
   NOTE: farmer contact is ONLY shared here, never in API responses.
───────────────────────────────────────────────────────── */
const sendOrderConfirmationToCustomer = async ({
  buyer,       // { name, email, contact, address }
  items,       // array of { productName, productPrice, quantity, farmerName, farmerContact }
  totalPrice,
  paymentMethod,
}) => {
  try {
    // Build per-item farmer rows (group by unique farmer)
    const farmerMap = {};
    items.forEach((item) => {
      const key = item.farmerName + "|" + (item.farmerContact || "");
      if (!farmerMap[key]) {
        farmerMap[key] = { name: item.farmerName, contact: item.farmerContact };
      }
    });

    const farmerRows = Object.values(farmerMap).map((f) => `
      <tr>
        <td style="padding:9px 12px;border-bottom:1px solid #e8f5e9;
                   color:#2e7d32;font-weight:600;">${f.name || "—"}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #e8f5e9;">
          ${f.contact || "—"}
        </td>
      </tr>`).join("");

    const payLabel =
      paymentMethod === "cod"    ? "Cash on Delivery" :
      paymentMethod === "wallet" ? "KhetBazaar Wallet" :
                                   "Online Payment (Razorpay)";

    const body = `
      <h2 style="margin:0 0 4px;color:#2e7d32;font-size:22px;">
        Order Confirmed! 🎉
      </h2>
      <p style="margin:0 0 22px;color:#757575;font-size:14px;">
        Thank you, <strong>${buyer.name || buyer.email}</strong>!
        Your order has been placed successfully.
      </p>

      <!-- Order Meta -->
      <div style="background:#f9fbe7;border-left:4px solid #66bb6a;
                  border-radius:4px;padding:13px 16px;margin-bottom:22px;">
        <p style="margin:0;font-size:13px;color:#555;">
          <strong>Payment Method:</strong> ${payLabel}
        </p>
        <p style="margin:5px 0 0;font-size:13px;color:#555;">
          <strong>Delivery Address:</strong>
          ${buyer.address || "Not provided"}
        </p>
      </div>

      <!-- Items Table -->
      <h3 style="margin:0 0 10px;color:#333;font-size:15px;">🛒 Your Order</h3>
      ${buildItemsTable(items)}

      <!-- Total -->
      <div style="text-align:right;margin-top:10px;padding:12px;
                  background:#e8f5e9;border-radius:6px;">
        <span style="font-size:16px;font-weight:700;color:#2e7d32;">
          Total: ${formatCurrency(totalPrice)}
        </span>
      </div>

      <!-- Farmer Contact -->
      <h3 style="margin:26px 0 10px;color:#333;font-size:15px;">
        🌾 Farmer Contact Details
      </h3>
      <p style="margin:0 0 10px;font-size:13px;color:#757575;">
        You can reach out to the farmer(s) for queries about your produce:
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#2e7d32;color:#fff;">
            <th style="padding:10px 12px;text-align:left;">Farmer Name</th>
            <th style="padding:10px 12px;text-align:left;">Phone / Contact</th>
          </tr>
        </thead>
        <tbody>${farmerRows}</tbody>
      </table>

      <p style="margin:20px 0 0;font-size:12px;color:#bdbdbd;">
        🔒 Farmer contact details are shared only after a successful purchase
        to protect their privacy.
      </p>`;

    await sendMail({
      to: buyer.email,
      subject: "✅ Order Confirmed — KhetBazaar",
      html: wrapHtml(body),
    });

    console.log(`✅ Order confirmation sent to customer: ${buyer.email}`);
    return { success: true };
  } catch (err) {
    console.error("Error sending order confirmation to customer:", err);
    return { success: false, error: err.message };
  }
};

/* ─────────────────────────────────────────────────────────
   5. NEW ORDER NOTIFICATION → FARMER  (NEW)
   Sent after successful payment.
   Includes: customer name, email, phone, address + items to fulfil.
   NOTE: customer contact is ONLY shared here, never in API responses.
───────────────────────────────────────────────────────── */
const sendOrderNotificationToFarmer = async ({
  farmer,      // { name, email }
  buyer,       // { name, email, contact, address }
  items,       // items for THIS farmer only
  totalPrice,
  paymentMethod,
}) => {
  try {
    const payLabel =
      paymentMethod === "cod"    ? "Cash on Delivery" :
      paymentMethod === "wallet" ? "KhetBazaar Wallet" :
                                   "Online Payment (Razorpay)";

    const body = `
      <h2 style="margin:0 0 4px;color:#2e7d32;font-size:22px;">
        New Order Received! 📦
      </h2>
      <p style="margin:0 0 22px;color:#757575;font-size:14px;">
        Hello <strong>${farmer.name || farmer.email}</strong>,
        you have a new order from a customer on KhetBazaar.
      </p>

      <!-- Payment Badge -->
      <div style="background:#f9fbe7;border-left:4px solid #66bb6a;
                  border-radius:4px;padding:13px 16px;margin-bottom:22px;">
        <p style="margin:0;font-size:13px;color:#555;">
          <strong>Payment Method:</strong> ${payLabel}
        </p>
        <p style="margin:5px 0 0;font-size:13px;color:#555;">
          <strong>Your Earnings:</strong> ${formatCurrency(totalPrice)}
        </p>
      </div>

      <!-- Customer Details -->
      <h3 style="margin:0 0 10px;color:#333;font-size:15px;">
        👤 Customer Details
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;
                    margin-bottom:22px;">
        <tbody>
          <tr style="border-bottom:1px solid #e8f5e9;">
            <td style="padding:9px 12px;font-weight:600;color:#2e7d32;width:38%;">
              Name
            </td>
            <td style="padding:9px 12px;">${buyer.name || "—"}</td>
          </tr>
          <tr style="border-bottom:1px solid #e8f5e9;background:#fafafa;">
            <td style="padding:9px 12px;font-weight:600;color:#2e7d32;">
              Email
            </td>
            <td style="padding:9px 12px;">${buyer.email}</td>
          </tr>
          <tr style="border-bottom:1px solid #e8f5e9;">
            <td style="padding:9px 12px;font-weight:600;color:#2e7d32;">
              Phone
            </td>
            <td style="padding:9px 12px;">${buyer.contact || "Not provided"}</td>
          </tr>
          <tr style="background:#fafafa;">
            <td style="padding:9px 12px;font-weight:600;color:#2e7d32;">
              Delivery Address
            </td>
            <td style="padding:9px 12px;">${buyer.address || "Not provided"}</td>
          </tr>
        </tbody>
      </table>

      <!-- Items to Fulfil -->
      <h3 style="margin:0 0 10px;color:#333;font-size:15px;">
        🌿 Items to Fulfil
      </h3>
      ${buildItemsTable(items)}

      <!-- Total -->
      <div style="text-align:right;margin-top:10px;padding:12px;
                  background:#e8f5e9;border-radius:6px;">
        <span style="font-size:16px;font-weight:700;color:#2e7d32;">
          Your Earnings: ${formatCurrency(totalPrice)}
        </span>
      </div>

      <p style="margin:20px 0 0;font-size:12px;color:#bdbdbd;">
        🔒 Customer contact details are shared only after payment confirmation.
        Please prepare the order for dispatch.
      </p>`;

    await sendMail({
      to: farmer.email,
      subject: "📦 New Order Received — KhetBazaar",
      html: wrapHtml(body),
    });

    console.log(`✅ Order notification sent to farmer: ${farmer.email}`);
    return { success: true };
  } catch (err) {
    console.error("Error sending order notification to farmer:", err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendMail,
  sendOTPEmail,
  sendListingConfirmationEmail,
  sendListingDeletionEmail,
  sendOrderConfirmationToCustomer,
  sendOrderNotificationToFarmer,
};
