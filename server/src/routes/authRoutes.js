const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

function createToken(userId) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET must be configured.");
    }

    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
    };
}

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== "string" ||
        password.length < 8
    ) {
        return res.status(400).json({
            message: "Enter a name, valid email, and password of at least 8 characters.",
        });
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET must be configured.");
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name: name.trim(), email, passwordHash });
        const token = createToken(user.id);

        return res.status(201).json({ token, user: publicUser(user) });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        throw error;
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "Enter your email and password." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
        return res.status(401).json({ message: "Email or password is incorrect." });
    }

    return res.json({ token: createToken(user.id), user: publicUser(user) });
});

router.get("/me", authMiddleware, (req, res) => {
    res.json({ user: publicUser(req.user) });
});

module.exports = router;
