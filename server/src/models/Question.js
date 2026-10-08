const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      default: "",
      trim: true,
    },
    platform: {
      type: String,
      enum: ["LeetCode", "GFG", "Codeforces", "IndiaBix", "HackerRank", "Other"],
      default: "LeetCode",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    type: {
      type: String,
      enum: ["coding", "aptitude", "case", "hr", "gd", "sql", "knowledge"],
      default: "coding",
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    companies: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

questionSchema.index({ role: 1, companies: 1 });
questionSchema.index({ category: 1 });

module.exports = mongoose.model("Question", questionSchema);
