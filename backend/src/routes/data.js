const express = require("express");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Pull the user's synced data (null if they haven't pushed anything yet — a brand new account).
router.get("/", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ appData: user.appData });
});

// Push (overwrite) the user's synced data. Whole-document sync, last-write-wins —
// fine for a single-user personal tracker without concurrent multi-device editing.
router.put("/", requireAuth, async (req, res) => {
  const { appData } = req.body || {};
  if (!appData) return res.status(400).json({ error: "appData is required" });

  const user = await User.findByIdAndUpdate(req.userId, { appData }, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ appData: user.appData });
});

module.exports = router;
