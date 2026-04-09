const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const db = require("../database/db");
const { sendVerificationEmail } = require("../utils/emailService");
const { pendingCodes } = require("../utils/sharedStore");

router.post("/generate-code", async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ error: "Email and role are required" });
  }

  // Admins do not use this endpoint as they have a fixed code
  if (role === "admin") {
    return res.status(403).json({ error: "Admin registration does not require a dynamic code." });
  }

  const rolePrefix = "USR";
  const numbers = Math.floor(100 + Math.random() * 900);
  const letters =
    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
    String.fromCharCode(65 + Math.floor(Math.random() * 26));
  
  const code = `${rolePrefix}${numbers}-${letters}`;
  
  // Store the code with a timestamp (expires in 10 minutes)
  pendingCodes.set(email, {
    code,
    role: "user",
    expires: Date.now() + 10 * 60 * 1000
  });

  try {
    // Attempt to send real email
    await sendVerificationEmail(email, code, "user");
    console.log(`[SECURITY] Verification email sent to ${email}`);
    res.json({ message: "Verification code sent successfully to your inbox!" });
  } catch (error) {
    // If SMTP is not configured, fallback to console log for ease of development
    console.error(`[CRITICAL] SMTP Failure:`, error.message);
    if (error.message.includes("not configured") || error.message.includes("535")) {
      console.log(`[DEVELOPER FALLBACK] Verification code for ${email}: ${code}`);
      return res.status(200).json({ 
        message: "SMTP not configured. Code logged to server console for testing.",
        dev_not_configured: true 
      });
    }
    res.status(500).json({ error: "Failed to send email. Please check server logs." });
  }
});

router.post("/register", async (req, res) => {
  const { name, email, password, confirmPassword, verificationCode, role } = req.body;

  if (!name || !email || !password || !confirmPassword || !verificationCode || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // 1. Validate based on Role
  if (role === "admin") {
    const adminSecret = process.env.ADMIN_VERIFICATION_CODE || "ADM-MASTER-777";
    if (verificationCode !== adminSecret) {
      return res.status(401).json({ error: "Invalid Admin Verification Code." });
    }
  } else if (role === "user") {
    const storedData = pendingCodes.get(email);
    if (!storedData) {
      return res.status(400).json({ error: "No verification code requested for this email" });
    }
    if (Date.now() > storedData.expires) {
      pendingCodes.delete(email);
      return res.status(400).json({ error: "Verification code has expired" });
    }
    if (storedData.code !== verificationCode) {
      return res.status(401).json({ error: "Invalid verification code" });
    }
  } else {
    return res.status(400).json({ error: "Invalid role selected." });
  }

  // 2. Common Validations
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long" });
  }

  try {
    db.get(
      "SELECT id FROM users WHERE email = ?",
      [email],
      async (err, row) => {
        if (err) {
          console.error("Error checking user:", err);
          return res.status(500).json({ error: "Failed to register user" });
        }
        if (row) {
          return res.status(409).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users (name, email, password_hash, verification_code, role, status)
                     VALUES (?, ?, ?, ?, ?, 'active')`;
        const params = [name, email, hashedPassword, verificationCode, role];

        db.run(query, params, function (err) {
          if (err) {
            console.error("Error creating user:", err);
            return res.status(500).json({ error: "Failed to create user" });
          }
          if (role === "user") pendingCodes.delete(email);

          db.run("INSERT INTO activities (description) VALUES (?)", [
            `New ${role} registered: ${name} (${email})`,
          ]);

          res.status(201).json({
            id: this.lastID,
            message: "User registered successfully",
            role: role,
          });
        });
      }
    );
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password, verificationCode } = req.body;

  if (!email || !password || !verificationCode) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    db.get(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, user) => {
        if (err) {
          console.error("Error fetching user:", err);
          return res.status(500).json({ error: "Failed to login" });
        }

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password_hash
        );
        if (!isPasswordValid) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Logic for Verification Code (Allow Master Code for Admins)
        const adminSecret = process.env.ADMIN_VERIFICATION_CODE || "ADM777-SEC";
        const isMasterCode = user.role === "admin" && verificationCode === adminSecret;
        const isSpecificCode = user.verification_code === verificationCode;

        if (!isMasterCode && !isSpecificCode) {
          return res.status(401).json({ error: "Invalid verification code" });
        }

        req.session.userId = user.id;
        req.session.userRole = user.role;

        const { password_hash, ...userInfo } = user;
        res.json({
          message: "Login successful",
          user: userInfo,
          redirectTo:
            user.role === "admin" ? "/dashboard.html" : "/user-dashboard.html",
        });
      }
    );
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

router.post("/check-user", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({ error: "Failed to check user" });
    }

    res.json({ exists: !!row });
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.userRole !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

router.post("/verify-admin-password", requireAdmin, async (req, res) => {
  const { password, verificationCode } = req.body;

  if (!password || !verificationCode) {
    return res.status(400).json({ error: "Password and verification code are required" });
  }

  try {
    db.get(
      "SELECT password_hash, verification_code FROM users WHERE id = ?",
      [req.session.userId],
      async (err, user) => {
        if (err) {
          console.error("Error fetching user:", err);
          return res.status(500).json({ error: "Failed to verify password" });
        }

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password_hash
        );
        if (!isPasswordValid || user.verification_code !== verificationCode) {
          return res.status(401).json({ error: "Incorrect password or verification code" });
        }

        res.json({ message: "Password verified successfully" });
      }
    );
  } catch (error) {
    console.error("Error verifying password:", error);
    res.status(500).json({ error: "Failed to verify password" });
  }
});

module.exports = { router, requireAdmin };

