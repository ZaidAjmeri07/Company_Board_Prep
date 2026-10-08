const cors = require("cors");
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");
const prepRoutes = require("./routes/prepRoutes");
const progressRoutes = require("./routes/progressRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/prep", prepRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/ai", aiRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "API endpoint not found." });
});

app.use((error, req, res, next) => {
    console.error(error);
    res.status(error.status === 400 ? 400 : 500).json({
        message: error.status === 400 ? "Invalid JSON request body." : "An unexpected server error occurred.",
    });
});

module.exports = app;
