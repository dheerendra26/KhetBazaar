const userModel = require("../models/userModel");

const MIN_TOPUP = 1;
const MAX_TOPUP = 100000;

const getWalletBalance = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await userModel.findOne({ email }).select("walletBalance");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ walletBalance: user.walletBalance ?? 0 });
  } catch (err) {
    console.error("getWalletBalance error:", err);
    res.status(500).json({ message: "Failed to fetch wallet balance" });
  }
};

const topUpWallet = async (req, res) => {
  try {
    const { email, amount } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || isNaN(parsedAmount)) {
      return res.status(400).json({ message: "Amount must be a valid number" });
    }
    if (parsedAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be greater than zero" });
    }
    if (parsedAmount < MIN_TOPUP) {
      return res
        .status(400)
        .json({ message: `Minimum top-up amount is ₹${MIN_TOPUP}` });
    }
    if (parsedAmount > MAX_TOPUP) {
      return res
        .status(400)
        .json({
          message: `Maximum top-up per transaction is ₹${MAX_TOPUP.toLocaleString("en-IN")}`,
        });
    }
    if (!Number.isInteger(parsedAmount * 100)) {
      return res
        .status(400)
        .json({ message: "Amount can have at most 2 decimal places" });
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      { $inc: { walletBalance: parsedAmount } },
      { new: true, select: "walletBalance" },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await userModel.updateOne(
      { email },
      {
        $push: {
          notifications: {
            message: `💰 ₹${parsedAmount.toLocaleString("en-IN")} added to your wallet. New balance: ₹${updatedUser.walletBalance.toLocaleString("en-IN")}`,
            type: "general",
            read: false,
            createdAt: new Date(),
          },
        },
      },
    );

    res.status(200).json({
      message: "Wallet topped up successfully",
      walletBalance: updatedUser.walletBalance,
      added: parsedAmount,
    });
  } catch (err) {
    console.error("topUpWallet error:", err);
    res.status(500).json({ message: "Failed to top up wallet" });
  }
};

const deductWallet = async (req, res) => {
  try {
    const { email, amount } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Invalid deduction amount" });
    }

    const updatedUser = await userModel.findOneAndUpdate(
      { email, walletBalance: { $gte: parsedAmount } },
      { $inc: { walletBalance: -parsedAmount } },
      { new: true, select: "walletBalance" },
    );

    if (!updatedUser) {
      const user = await userModel.findOne({ email }).select("walletBalance");
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(400).json({
        message: "Insufficient wallet balance",
        walletBalance: user.walletBalance ?? 0,
      });
    }

    res.status(200).json({
      message: "Wallet deducted successfully",
      walletBalance: updatedUser.walletBalance,
      deducted: parsedAmount,
    });
  } catch (err) {
    console.error("deductWallet error:", err);
    res.status(500).json({ message: "Failed to deduct wallet balance" });
  }
};

module.exports = {
  deductWallet,
  topUpWallet,
  getWalletBalance,
};
