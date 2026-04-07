const userModel = require("../models/userModel");

const MIN_TOPUP = 1;
const MAX_TOPUP = 100000; // ₹1,00,000 per transaction

/**
 * GET /wallet/:email
 * Returns the current wallet balance for the authenticated user.
 */
module.exports.getWalletBalance = async (req, res) => {
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

/**
 * POST /wallet/topup
 * Body: { email, amount }
 * Uses MongoDB $inc for atomic update to prevent race conditions.
 */
module.exports.topUpWallet = async (req, res) => {
  try {
    const { email, amount } = req.body;

    // ── Validation ──────────────────────────────────────────────────
    if (!email) return res.status(400).json({ message: "Email is required" });

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || isNaN(parsedAmount)) {
      return res.status(400).json({ message: "Amount must be a valid number" });
    }
    if (parsedAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero" });
    }
    if (parsedAmount < MIN_TOPUP) {
      return res.status(400).json({ message: `Minimum top-up amount is ₹${MIN_TOPUP}` });
    }
    if (parsedAmount > MAX_TOPUP) {
      return res.status(400).json({ message: `Maximum top-up per transaction is ₹${MAX_TOPUP.toLocaleString("en-IN")}` });
    }
    if (!Number.isInteger(parsedAmount * 100)) {
      // Reject more than 2 decimal places (paise precision)
      return res.status(400).json({ message: "Amount can have at most 2 decimal places" });
    }

    // ── Atomic update via $inc (prevents race conditions) ────────────
    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      { $inc: { walletBalance: parsedAmount } },
      { new: true, select: "walletBalance" }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add a wallet notification
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
      }
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

/**
 * POST /wallet/deduct
 * Body: { email, amount }
 * Atomically deducts from wallet; rejects if balance would go negative.
 * Used internally by the orders route (not exposed directly to client).
 */
module.exports.deductWallet = async (req, res) => {
  try {
    const { email, amount } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Invalid deduction amount" });
    }

    // Atomic conditional update: only deduct if balance is sufficient
    const updatedUser = await userModel.findOneAndUpdate(
      { email, walletBalance: { $gte: parsedAmount } },
      { $inc: { walletBalance: -parsedAmount } },
      { new: true, select: "walletBalance" }
    );

    if (!updatedUser) {
      // Either user not found or insufficient balance
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
