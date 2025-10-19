const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const { generateOTP } = require("../utils/generateOTP");
const { sendOTPEmail } = require("../utils/sendEmail");

module.exports.registerUser = async (req, res) => {
  try {
    let { name, email, contact, address } = req.body;
    let otp = generateOTP();

    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    let user = await userModel.findOne({ email });

    if (user) {
      user.otp = hashedOTP;
      await user.save();
    } else {
      user = await userModel.create({
        name: name,
        email: email,
        contact: contact,
        address: address,
        otp: hashedOTP,
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

module.exports.loginUser = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp) {
      return res.status(401).json({ message: "OTP expired or not found" });
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

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};
