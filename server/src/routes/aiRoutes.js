const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { handleAIChat } = require("../services/aiChat");

const router = express.Router();

// Optional auth helper: extracts user if token exists, but doesn't block guests
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Ignore invalid token and treat as guest
  }
  next();
}

router.post("/chat", optionalAuth, async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "A query message is required." });
    }

    const reply = await handleAIChat({
      message: message.trim(),
      userId: req.user ? req.user._id : null,
      history: Array.isArray(history) ? history : [],
    });

    res.json({ reply });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
