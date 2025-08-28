import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    res.json({ ok: true, message: "User registered", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    res.json({ ok: true, token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
