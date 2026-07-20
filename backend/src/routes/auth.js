const express = require("express");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { requireAuth, signToken } = require("../middleware/auth");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

module.exports = router;