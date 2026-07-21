const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { requireAuth, signToken } = require("../middleware/auth");
const { sendResetCodeEmail } = require("../services/emailService");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function publicUser(user) {
  return { id: user._id, email: user.email, name: user.name, appData: user.appData };
}

// ---------- Email + password signup ----------
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password, and name are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: email.toLowerCase(), passwordHash, name, appData: null });

    const token = signToken(user._id.toString());
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("[auth] signup failed:", err.message);
    res.status(500).json({ error: "Signup failed" });
  }
});

// ---------- Email + password login ----------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user._id.toString());
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("[auth] login failed:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

// ---------- Google sign-in ----------
// Client sends the Google ID token obtained via expo-auth-session; we verify it
// server-side before trusting any identity claims from it.
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: "idToken is required" });

    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(401).json({ error: "Could not verify Google account" });

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }] });
    if (!user) {
      user = await User.create({
        email: payload.email.toLowerCase(),
        googleId: payload.sub,
        name: payload.name || payload.email.split("@")[0],
        appData: null,
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub; // link Google to an existing email/password account
      await user.save();
    }

    const token = signToken(user._id.toString());
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("[auth] google sign-in failed:", err.message);
    res.status(401).json({ error: "Google sign-in failed" });
  }
});

// ---------- Current user ----------
router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

// ---------- Delete account ----------
// Permanently removes the user's account and all synced data. Irreversible.
router.delete("/me", requireAuth, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.userId);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("[auth] account deletion failed:", err.message);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// ---------- Forgot password: request a reset code ----------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond the same way whether or not the account exists — otherwise this
    // endpoint could be used to check which emails are registered.
    if (user && user.passwordHash) {
      const code = String(crypto.randomInt(100000, 999999)); // 6-digit code
      user.resetCodeHash = await bcrypt.hash(code, 10);
      user.resetCodeExpires = new Date(Date.now() + RESET_CODE_TTL_MS);
      await user.save();
      await sendResetCodeEmail(user.email, code).catch((err) => {
        console.error("[auth] failed to send reset email:", err.message);
      });
    }

    res.json({ success: true, message: "If that email has an account, a reset code has been sent." });
  } catch (err) {
    console.error("[auth] forgot-password failed:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ---------- Reset password using the emailed code ----------
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "email, code, and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.resetCodeHash || !user.resetCodeExpires) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }
    if (user.resetCodeExpires.getTime() < Date.now()) {
      return res.status(400).json({ error: "This code has expired. Request a new one." });
    }

    const validCode = await bcrypt.compare(code, user.resetCodeHash);
    if (!validCode) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetCodeHash = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    const token = signToken(user._id.toString());
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("[auth] reset-password failed:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ---------- Change password (while logged in) ----------
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.userId);
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: "This account doesn't use a password (signed up with Google)" });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error("[auth] change-password failed:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;