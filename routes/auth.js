const express = require("express");
const router = express.Router();
const db = require("../database/db");
const admin = require("../config/firebase-admin");
const { generateCopyUUID } = require("../utils/qrService");
const { sendWelcomeEmail } = require("../utils/emailService");

// ─── Helper: Sync Firebase identity to SQLite ─────────────────────────────
// Called after every successful Firebase sign-in.
// Handles: find existing user, create new user, enforce admin gate, log security events.
async function syncUserToDatabase(decoded, role, adminCode, displayName, intent, req) {
  return new Promise((resolve, reject) => {
    const { uid, email, name, email_verified, firebase: fbData } = decoded;
    const provider = fbData?.sign_in_provider || "password";
    const userName = displayName || name || (email ? email.split("@")[0] : "User");

    db.get(
      "SELECT * FROM users WHERE firebase_uid = ? OR email = ?",
      [uid, email],
      async (err, user) => {
        if (err) return reject(new Error("Database error"));

        // ── Existing user ──────────────────────────────────────────────────
        if (user) {
          if (intent === "register") {
            return reject({
              statusCode: 409,
              message:
                "An account with this email already exists. Please log in instead.",
            });
          }

          // Link firebase_uid if this is the first social login for a manual account
          if (!user.firebase_uid) {
            db.run("UPDATE users SET firebase_uid = ?, auth_provider = ? WHERE id = ?", [
              uid,
              provider,
              user.id,
            ]);
          }

          req.session.userId = user.id;
          req.session.userRole = user.role;
          const { password_hash, ...safeUser } = user;
          return resolve({
            isNew: false,
            user: safeUser,
            redirectTo:
              user.role === "admin" ? "/dashboard.html" : "/user-dashboard.html",
          });
        }

        // ── No account found ───────────────────────────────────────────────
        if (intent === "login") {
          return reject({
            statusCode: 404,
            message: "No account found with this email. Please register first.",
          });
        }

        // ── New registration ───────────────────────────────────────────────
        const userRole = role || "user";
        const clientIp = req.ip || req.socket?.remoteAddress || "unknown";

        if (userRole === "admin") {
          const expectedCode =
            process.env.ADMIN_GATEKEEPER_KEY ||
            process.env.ADMIN_VERIFICATION_CODE;
          if (!adminCode || adminCode.trim() !== expectedCode) {
            // Log every failed admin attempt
            db.run(
              "INSERT INTO activities (description) VALUES (?)",
              [
                `[SECURITY] Failed admin gate attempt — IP: ${clientIp} | Email: ${email} | Time: ${new Date().toISOString()}`,
              ]
            );
            return reject({
              statusCode: 403,
              message:
                "Invalid Admin Secret Code. This attempt has been logged.",
            });
          }
        }

        const userQRCode = generateCopyUUID();

        db.run(
          `INSERT INTO users (name, email, password_hash, user_qr_code, verification_code, role, status, firebase_uid, auth_provider, is_verified)
           VALUES (?, ?, 'FIREBASE_USER', ?, ?, ?, 'active', ?, ?, ?)`,
          [
            userName,
            email,
            userQRCode,
            userQRCode, // verification_code — legacy NOT NULL column, reuse QR code value
            userRole,
            uid,
            provider,
            email_verified ? 1 : 0,
          ],
          function (regErr) {
            if (regErr) {
              if (regErr.message.includes("UNIQUE constraint failed")) {
                return reject({
                  statusCode: 409,
                  message:
                    "An account with this email already exists. Please log in.",
                });
              }
              return reject(regErr);
            }

            const newId = this.lastID;
            db.run(
              "INSERT INTO activities (description, user_id) VALUES (?, ?)",
              [
                `New ${userRole} registered via ${provider}: ${userName} (${email})`,
                newId,
              ]
            );

            // Send welcome email (fire-and-forget)
            sendWelcomeEmail(email, userName, userQRCode, userRole).catch(
              console.error
            );

            req.session.userId = newId;
            req.session.userRole = userRole;

            resolve({
              isNew: true,
              user: { id: newId, name: userName, email, role: userRole },
              redirectTo:
                userRole === "admin"
                  ? "/dashboard.html"
                  : "/user-dashboard.html",
            });
          }
        );
      }
    );
  });
}

// ─── POST /api/auth/session ───────────────────────────────────────────────
// Unified entry point for ALL authentication methods (Google, Microsoft, Email Link, Manual).
// Frontend always POSTs here after Firebase sign-in with the idToken.
router.post("/session", async (req, res) => {
  const { idToken, role, adminCode, displayName, intent } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Firebase ID token is required" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const result = await syncUserToDatabase(
      decoded,
      role,
      adminCode,
      displayName,
      intent || "register",
      req
    );

    res.status(result.isNew ? 201 : 200).json({
      message: result.isNew ? "Account created! Welcome to LibroHub 🎉" : "Login successful",
      user: result.user,
      redirectTo: result.redirectTo,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    if (err.code?.startsWith("auth/")) {
      return res
        .status(401)
        .json({ error: "Invalid or expired session. Please sign in again." });
    }
    console.error("Session endpoint error:", err);
    res.status(500).json({ error: err.message || "Authentication failed" });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
router.get("/me", (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not authenticated" });
  db.get(
    "SELECT id, name, email, role FROM users WHERE id = ?",
    [req.session.userId],
    (err, user) => {
      if (err || !user) return res.status(401).json({ error: "Not authenticated" });
      res.json(user);
    }
  );
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Failed to logout" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// ─── POST /api/auth/check-user ────────────────────────────────────────────
router.post("/check-user", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  db.get(
    "SELECT id, role, auth_provider FROM users WHERE email = ?",
    [email],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Server error" });
      res.json({ exists: !!row, role: row?.role, provider: row?.auth_provider });
    }
  );
});

// ─── POST /api/auth/validate-admin-code ──────────────────────────────────
// Frontend pre-validates admin code before launching OAuth popup.
// The code is also re-validated on the backend in /session for security.
router.post("/validate-admin-code", (req, res) => {
  const { code } = req.body;
  const expected =
    process.env.ADMIN_GATEKEEPER_KEY || process.env.ADMIN_VERIFICATION_CODE;

  if (!code || code.trim() !== expected) {
    const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
    db.run("INSERT INTO activities (description) VALUES (?)", [
      `[SECURITY] Failed admin pre-check — IP: ${clientIp} | Time: ${new Date().toISOString()}`,
    ]);
    return res.status(403).json({ valid: false, error: "Invalid admin secret code" });
  }

  req.session.admin_code_validated = true;
  res.json({ valid: true });
});

// ─── Admin middleware ──────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.userRole !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ─── POST /api/auth/verify-admin-password ─────────────────────────────────
// Used by admin settings — re-verifies identity via fresh Firebase ID token
router.post("/verify-admin-password", requireAdmin, async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "ID token is required" });
  try {
    await admin.auth().verifyIdToken(idToken);
    res.json({ message: "Identity verified successfully" });
  } catch {
    res.status(401).json({ error: "Verification failed. Please sign in again." });
  }
});

module.exports = { router, requireAdmin };
