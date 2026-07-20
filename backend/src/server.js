require("dotenv").config();
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); // avoids the Windows IPv6 timeout issue seen on other projects
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const dataRoutes = require("./routes/data");

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "vital-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/data", dataRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set — see .env.example");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`Vital backend running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
