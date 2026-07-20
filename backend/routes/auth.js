const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const pool = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
require("dotenv").config();

// ============================
// POST /api/auth/register
// ============================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, company_name } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required." });
    }
    if (!["recruiter", "candidate"].includes(role)) {
      return res.status(400).json({ message: "Role must be either 'recruiter' or 'candidate'." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    // Check if email already exists
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, company_name) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, role === "recruiter" ? company_name || null : null]
    );

    const token = jwt.sign(
      { id: result.insertId, name, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: { id: result.insertId, name, email, role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ============================
// POST /api/auth/login
// ============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ============================
// GET /api/auth/me  (verify token + fetch fresh profile)
// ============================
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, company_name, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
