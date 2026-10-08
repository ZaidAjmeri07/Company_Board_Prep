const mongoose = require("mongoose");

const studyPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    plan: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

studyPlanSchema.index({ user: 1, company: 1, role: 1 });

module.exports = mongoose.model("StudyPlan", studyPlanSchema);
