const express = require("express");
const Progress = require("../models/Progress");
const Question = require("../models/Question");
const authMiddleware = require("../middleware/authMiddleware");
const { calculateGlobalSummary } = require("../services/progress");

const router = express.Router();

router.use(authMiddleware);

// POST /api/progress/toggle - body: { questionId }
router.post("/toggle", async (req, res, next) => {
  try {
    const { questionId } = req.body;
    if (!questionId) {
      return res.status(400).json({ message: "questionId is required." });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    const existing = await Progress.findOne({
      user: req.user._id,
      question: questionId,
    });

    let isSolved = true;
    if (existing) {
      isSolved = !existing.solved;
      existing.solved = isSolved;
      existing.solvedAt = isSolved ? new Date() : null;
      await existing.save();
    } else {
      await Progress.create({
        user: req.user._id,
        question: questionId,
        solved: true,
        solvedAt: new Date(),
      });
    }

    res.json({
      questionId,
      solved: isSolved,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/progress/summary - all companies, for /me
router.get("/summary", async (req, res, next) => {
  try {
    const summary = await calculateGlobalSummary(req.user._id);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
