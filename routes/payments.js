const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/emailService");
const { pendingCodes } = require("../utils/sharedStore");
const db = require("../database/db");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Mock store for pending codes (shared with auth.js potentially, but we'll use a clean export or just handle it here)
// Actually, let's use the same Map from auth.js if we can, or just re-import it.
// For simplicity in this specialized setup, we'll implement a verified-payment-to-code flow.

router.post("/create-order", async (req, res) => {
  const { amount, currency, email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required for order." });
  }

  // Check if user already exists
  db.get("SELECT id FROM users WHERE email = ?", [email], async (err, row) => {
    if (err) {
      console.error("Payment check error:", err);
      return res.status(500).json({ error: "Server check error." });
    }
    if (row) {
      return res.status(409).json({ error: "User already exists. Please login." });
    }

    try {
      const options = {
        amount: amount * 100, // paise
        currency: currency || "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Razorpay Order Error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });
});

router.post("/verify", async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    email,
    role
  } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Payment verified!
    console.log(`[PAYMENT] Verified payment ${razorpay_payment_id} for ${email}`);

    // Trigger code generation and email (Internal call logic)
    // We'll mimic the logic from generate-code here
    const rolePrefix = "USR";
    const numbers = Math.floor(100 + Math.random() * 900);
    const letters =
      String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
      String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
      String.fromCharCode(65 + Math.floor(Math.random() * 26));
    
    const code = `${rolePrefix}${numbers}-${letters}`;
    
    pendingCodes.set(email, {
      code,
      role: "user",
      expires: Date.now() + 10 * 60 * 1000
    });

    try {
      await sendVerificationEmail(email, code, "user");
      res.json({ 
        success: true, 
        message: "Payment verified and code sent to inbox!" 
      });
    } catch (error) {
      console.error("Payment verified but email failed:", error);
      res.json({ 
        success: true, 
        message: "Payment verified but code delivery failed. Please contact support.",
        code: code // Fallback for testing
      });
    }
  } else {
    console.error("[PAYMENT] Signature mismatch!");
    res.status(400).json({ error: "Invalid payment signature" });
  }
});

module.exports = router;
