const express = require("express");
const Company = require("../models/Company");
const Question = require("../models/Question");
const Progress = require("../models/Progress");
const StudyPlan = require("../models/StudyPlan");
const authMiddleware = require("../middleware/authMiddleware");
const { calculateProgress } = require("../services/progress");
const { generateStudyPlan } = require("../services/gemini");
const { generateAITest, generateTestDiagnostic } = require("../services/aiTestGenerator");
const { generateInterviewQuestions, evaluateInterviewTranscript } = require("../services/aiInterviewService");

const router = express.Router();

router.use(authMiddleware);

// Helper to resolve company by ID or slug
async function resolveCompany(companyId) {
  let company = null;
  if (companyId.match(/^[0-9a-fA-F]{24}$/)) {
    company = await Company.findById(companyId);
  }
  if (!company) {
    company = await Company.findOne({ slug: companyId.toLowerCase().trim() });
  }
  return company;
}

// GET /api/prep/:companyId/:role/sheet?category=&difficulty=&platform=&search=
router.get("/:companyId/:role/sheet", async (req, res, next) => {
  try {
    const { companyId, role } = req.params;
    const { category, difficulty, platform, search } = req.query;

    const company = await resolveCompany(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const query = {
      role: { $regex: new RegExp(`^${role.trim()}$`, "i") },
      companies: company.slug,
    };

    if (category && category !== "All") {
      query.category = category;
    }
    if (difficulty && difficulty !== "All") {
      query.difficulty = difficulty;
    }
    if (platform && platform !== "All") {
      query.platform = platform;
    }
    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: "i" };
    }

    const questions = await Question.find(query).sort({ category: 1, difficulty: 1 }).lean();
    const questionIds = questions.map((q) => q._id);

    // Get user's progress for these questions
    const userProgress = await Progress.find({
      user: req.user._id,
      question: { $in: questionIds },
      solved: true,
    }).lean();

    const solvedMap = new Map();
    userProgress.forEach((p) => {
      solvedMap.set(p.question.toString(), p.solvedAt);
    });

    const enrichedQuestions = questions.map((q) => ({
      ...q,
      isSolved: solvedMap.has(q._id.toString()),
      solvedAt: solvedMap.get(q._id.toString()) || null,
    }));

    // Available filter options for the frontend
    const allQuestionsForRole = await Question.find({
      role: { $regex: new RegExp(`^${role.trim()}$`, "i") },
      companies: company.slug,
    }).select("category platform difficulty").lean();

    const categories = Array.from(new Set(allQuestionsForRole.map((q) => q.category))).sort();
    const platforms = Array.from(new Set(allQuestionsForRole.map((q) => q.platform))).sort();

    res.json({
      company,
      role,
      questions: enrichedQuestions,
      totalQuestions: questions.length,
      availableCategories: categories,
      availablePlatforms: platforms,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/prep/:companyId/:role/dashboard (progress + categories + weakest)
router.get("/:companyId/:role/dashboard", async (req, res, next) => {
  try {
    const { companyId, role } = req.params;
    const company = await resolveCompany(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const stats = await calculateProgress(req.user._id, company.slug, role);

    res.json({
      company,
      role,
      stats,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/prep/:companyId/:role/plan (calls Gemini)
router.post("/:companyId/:role/plan", async (req, res, next) => {
  try {
    const { companyId, role } = req.params;
    const company = await resolveCompany(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const stats = await calculateProgress(req.user._id, company.slug, role);

    const planText = await generateStudyPlan({
      company: company.name,
      role,
      categories: stats.categories,
    });

    // Save/update study plan for user
    const savedPlan = await StudyPlan.findOneAndUpdate(
      {
        user: req.user._id,
        company: company.slug,
        role: role.trim(),
      },
      {
        plan: planText,
      },
      { upsert: true, returnDocument: "after" }
    );

    res.json({
      company,
      role,
      plan: planText,
      savedAt: savedPlan.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/prep/:companyId/:role/plan (fetch saved plan if exists)
router.get("/:companyId/:role/plan", async (req, res, next) => {
  try {
    const { companyId, role } = req.params;
    const company = await resolveCompany(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const savedPlan = await StudyPlan.findOne({
      user: req.user._id,
      company: company.slug,
      role: role.trim(),
    });

    res.json({
      company,
      role,
      plan: savedPlan ? savedPlan.plan : null,
      savedAt: savedPlan ? savedPlan.updatedAt : null,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/prep/:companyId/:role/test/generate (Generates 100-mark test)
router.post("/:companyId/:role/test/generate", async (req, res, next) => {
  try {
    const { companyId, role } = req.params;
    const { topic, difficulty } = req.body;

    const company = await resolveCompany(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const test = await generateAITest({
      company: company.name,
      role,
      topic: topic || "Dynamic Programming",
      difficulty: difficulty || "Medium",
    });

    res.json({
      company,
      role,
      test,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/prep/:companyId/:role/test/evaluate (Scores & diagnoses results)
router.post("/:companyId/:role/test/evaluate", async (req, res, next) => {
  try {
    const { companyId, role } = req.params;
    const { topic, difficulty, score, totalMarks, results } = req.body;

    const company = await resolveCompany(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const diagnostic = await generateTestDiagnostic({
      company: company.name,
      role,
      topic: topic || "Core Topics",
      difficulty: difficulty || "Medium",
      score: Number(score) || 0,
      totalMarks: Number(totalMarks) || 100,
      results: Array.isArray(results) ? results : [],
    });

    res.json({
      company,
      role,
      diagnostic,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/prep/:companyId/:role/interview/start (Generates 5-question interview)
router.post("/:companyId/:role/interview/start", async (req, res, next) => {
  try {
    const { companyId, role } = req.params;
    const { weakestArea } = req.body;

    const company = await resolveCompany(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const interview = await generateInterviewQuestions({
      company: company.name,
      role,
      weakestArea,
    });

    res.json({
      company,
      role,
      interview,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/prep/:companyId/:role/interview/evaluate (Evaluates typed answers)
router.post("/:companyId/:role/interview/evaluate", async (req, res, next) => {
  try {
    const { companyId, role } = req.params;
    const { questions, answers } = req.body;

    const company = await resolveCompany(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    const evaluation = await evaluateInterviewTranscript({
      company: company.name,
      role,
      questions: Array.isArray(questions) ? questions : [],
      answers: typeof answers === "object" && answers !== null ? answers : {},
    });

    res.json({
      company,
      role,
      evaluation,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
