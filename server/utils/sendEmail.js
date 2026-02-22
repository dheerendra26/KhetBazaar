if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const nodemailer = require("nodemailer");
const axios = require("axios");

/* ---------------- DEV: Gmail Transporter ---------------- */

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
  tls: {
    rejectUnauthorized: false
  }
});

/* ---------------- PROD: Brevo API Sender ---------------- */

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

/* ---------------- Unified Mail Sender ---------------- */

const sendMail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV === "production") {
    return sendBrevoEmail({ to, subject, html });
  }

  return gmailTransporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

/* ---------------- Our Utility Functions ---------------- */

const sendOTPEmail = async (email, otp) => {
    try {
        const mailOptions = {
            to: email,
            subject: "one-time-pass for Echos Vault",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2>OTP Verification</h2>
                    <p>Your One-Time Password (OTP) for registration is:</p>
                    <h3 style="background-color: #f0f0f0; padding: 10px; text-align: center; letter-spacing: 2px;">
                        ${otp}
                    </h3>
                    <small>If you didn't request this, please ignore this email.</small>
                </div>
            `
        };

        const result = await sendMail(mailOptions);
        return {
            success: true,
            message: 'OTP sent successfully',
            result
        };

    } catch (err) {
        console.error('Error sending OTP email:', err);
        return {
            success: false,
            message: 'Failed to send OTP',
            error: err.message
        };
    }
};

const sendListingConfirmationEmail = async (email, product) => {
    try {
        const mailOptions = {
            to: email,
            subject: "Your Product Listing is Live!",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2>Congratulations! Your Product is Listed</h2>
                    <p>Your product "<strong>${product.name}</strong>" has been successfully listed on Echos Vault.</p>
                    <p><strong>Details:</strong></p>
                    <ul>
                        <li><strong>Product ID:</strong> ${product._id}</li>
                        <li><strong>Name:</strong> ${product.name}</li>
                        <li><strong>Description:</strong> ${product.description}</li>
                        <li><strong>Price:</strong> $${product.price}</li>
                        <li><strong>Location:</strong> ${product.location}</li>
                    </ul>
                    <p>Thank you for listing with us!</p>
                </div>
            `
        };

        const result = await sendMail(mailOptions);
        return {
            success: true,
            message: "Listing confirmation email sent successfully",
            result
        };
    } catch (err) {
        console.error("Error sending listing confirmation email:", err);
        return {
            success: false,
            message: "Failed to send listing confirmation email",
            error: err.message
        };
    }
};

const sendListingDeletionEmail = async (email, product) => {
    try {
        const mailOptions = {
            to: email,
            subject: "Your Product Listing Has Been Removed",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2>Listing Removed</h2>
                    <p>We wanted to inform you that your product "<strong>${product.name}</strong>" has been removed from Echos Vault.</p>
                    <p><strong>Details:</strong></p>
                    <ul>
                        <li><strong>Product ID:</strong> ${product._id}</li>
                        <li><strong>Name:</strong> ${product.name}</li>
                        <li><strong>Description:</strong> ${product.description}</li>
                        <li><strong>Price:</strong> $${product.price}</li>
                        <li><strong>Location:</strong> ${product.location}</li>
                    </ul>
                    <p>If this was a mistake, please contact our support team.</p>
                </div>
            `
        };

        const result = await sendMail(mailOptions);
        return { success: true, message: "Listing deletion email sent successfully", result };
    } catch (err) {
        console.error("Error sending listing deletion email:", err);
        return { success: false, message: "Failed to send listing deletion email", error: err.message };
    }
};


module.exports = {
    sendMail,
    sendOTPEmail,
    sendListingConfirmationEmail,
    sendListingDeletionEmail
};