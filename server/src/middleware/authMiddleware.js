const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length)
        : null;

    if (!token) {
        return res.status(401).json({ message: "Authentication is required." });
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET must be configured.");
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (typeof payload === "string" || typeof payload.userId !== "string") {
            return res.status(401).json({ message: "The authentication token is invalid." });
        }

        const user = await User.findById(payload.userId);

        if (!user) {
            return res.status(401).json({ message: "The account for this token no longer exists." });
        }

        req.user = user;
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "The authentication token is invalid or expired." });
        }

        return next(error);
    }
}

module.exports = authMiddleware;
