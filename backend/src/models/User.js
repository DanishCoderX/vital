const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String }, // absent for Google-only accounts
    googleId: { type: String },
    name: { type: String, required: true },

    // Password reset: a short-lived 6-digit code, hashed at rest (never store it raw).
    resetCodeHash: { type: String },
    resetCodeExpires: { type: Date },

    // The entire client-side AppData blob, synced as one document per user —
    // mirrors exactly what the app already stores locally in AsyncStorage,
    // so the sync layer is a simple "pull on login, push on change" model.
    appData: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
