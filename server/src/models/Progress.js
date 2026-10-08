const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    solved: {
      type: Boolean,
      default: false,
    },
    solvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
