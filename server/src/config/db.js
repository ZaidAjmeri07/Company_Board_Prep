const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("DB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.log("Retrying MongoDB connection in 3 seconds...");
    setTimeout(connectDB, 3000);
  }
};

module.exports = connectDB;