const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const { generateOTP } = require("../utils/generateOTP");
const { sendOTPEmail } = require("../utils/sendEmail");

module.exports.registerUser = async (req, res) => {
  try {
    // `contact` is the farmer's phone number — required when registering as farmer.
    // It is NEVER returned in any public API response; shared only via email
    // to customers after a confirmed purchase.
    let { name, email, contact, address, roles } = req.body;

    // Check if user already exists — prevent role change
    let existingUser = await userModel.findOne({ email });
    if (existingUser && existingUser.role) {
      return res.status(409).json({
        message: "Account already exists. Role cannot be changed after registration. Please login instead.",
        isExisting: true,
      });
    }

    let role = 1;
    if (roles.includes("customer") && roles.includes("farmer")) role = 3;
    else if (roles.includes("farmer")) role = 2;
    else role = 1;

    // Validate phone when registering as farmer
    const isFarmer = role === 2 || role === 3;
    if (isFarmer && (!contact || contact.trim().length < 10)) {
      return res.status(400).json({
        message: "Phone number is required for farmer accounts (minimum 10 digits).",
      });
    }

    let otp = generateOTP();

    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    let user;
    if (existingUser) {
      existingUser.otp  = hashedOTP;
      existingUser.role = role;
      // Update contact if provided (allows farmer to fix their number on re-register)
      if (contact && contact.trim()) existingUser.contact = contact.trim();
      await existingUser.save();
      user = existingUser;
    } else {
      user = await userModel.create({
        name,
        email,
        contact: contact ? contact.trim() : undefined,
        address,
        otp: hashedOTP,
        role,
      });
    }

    const emailResult = await sendOTPEmail(email, otp);

    if (emailResult.success) {
      return res.status(200).json({
        message: "OTP sent to email. Please check your inbox.",
        userId: user._id,
      });
    } else {
      return res.status(500).json({ message: "Failed to send OTP email" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Registration failed",
      error: err.message,
    });
  }
};

// Send OTP for login (existing users)
module.exports.sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "No account found with this email. Please register first.",
        isNewUser: true,
      });
    }

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    user.otp = hashedOTP;
    await user.save();

    const emailResult = await sendOTPEmail(email, otp);

    if (emailResult.success) {
      return res.status(200).json({
        message: "OTP sent to your email. Please check your inbox.",
        isExisting: true,
      });
    } else {
      return res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

module.exports.loginUser = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account has been deactivated. Please contact admin." });
    }

    if (!user.otp) {
      return res.status(401).json({ message: "OTP expired or not found. Please request a new OTP." });
    }

    const isOtpValid = await bcrypt.compare(otp, user.otp);

    if (!isOtpValid) {
      return res.status(401).json({ message: "Incorrect OTP" });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000,
    });

    await userModel.updateOne({ email }, { $unset: { otp: "" } });

    res.json({ message: "Login successful", token, email, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};
