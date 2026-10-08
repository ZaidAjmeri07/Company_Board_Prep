const Question = require("../models/Question");
const Progress = require("../models/Progress");
const Company = require("../models/Company");

/**
 * Calculates preparation progress for a specific user, company, and role.
 */
async function calculateProgress(userId, companySlug, roleName) {
  const normCompany = (companySlug || "").toLowerCase().trim();
  const normRole = (roleName || "").trim();

  // Find all questions for this company and role
  const questions = await Question.find({
    role: { $regex: new RegExp(`^${normRole}$`, "i") },
    companies: normCompany,
  }).lean();

  const totalQuestions = questions.length;
  if (totalQuestions === 0) {
    return {
      total: 0,
      solved: 0,
      percent: 0,
      categories: [],
      weakestArea: null,
    };
  }

  const questionIds = questions.map((q) => q._id);

  // Find user's solved progress
  const userProgress = await Progress.find({
    user: userId,
    question: { $in: questionIds },
    solved: true,
  }).lean();

  const solvedQuestionIdSet = new Set(
    userProgress.map((p) => p.question.toString())
  );
  const solvedCount = solvedQuestionIdSet.size;
  const overallPercent = Math.round((solvedCount / totalQuestions) * 100);

  // Group by category
  const categoryMap = {};
  for (const q of questions) {
    const cat = q.category || "General";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { name: cat, total: 0, solved: 0 };
    }
    categoryMap[cat].total += 1;
    if (solvedQuestionIdSet.has(q._id.toString())) {
      categoryMap[cat].solved += 1;
    }
  }

  const categories = Object.values(categoryMap).map((c) => ({
    name: c.name,
    total: c.total,
    solved: c.solved,
    percent: Math.round((c.solved / c.total) * 100),
  }));

  // Sort categories by lowest percent first
  // Weakest area = lowest %, ignoring categories with fewer than 3 questions
  const eligibleCategories = categories.filter((c) => c.total >= 3);
  let weakestArea = null;

  if (eligibleCategories.length > 0) {
    eligibleCategories.sort((a, b) => a.percent - b.percent);
    weakestArea = eligibleCategories[0].name;
  } else if (categories.length > 0) {
    const sorted = [...categories].sort((a, b) => a.percent - b.percent);
    weakestArea = sorted[0].name;
  }

  return {
    total: totalQuestions,
    solved: solvedCount,
    percent: overallPercent,
    categories,
    weakestArea,
  };
}

/**
 * Calculates global progress summary across all companies for a user (for /me page).
 */
async function calculateGlobalSummary(userId) {
  const companies = await Company.find({ slug: { $exists: true } }).sort({ name: 1 }).lean();
  const summary = [];

  for (const company of companies) {
    const companyRolesProgress = [];
    const rolesList = Array.isArray(company.roles) ? company.roles : [];
    for (const role of rolesList) {
      const stats = await calculateProgress(userId, company.slug, role);
      companyRolesProgress.push({
        role,
        ...stats,
      });
    }

    const totalQuestions = companyRolesProgress.reduce((sum, r) => sum + r.total, 0);
    const solvedQuestions = companyRolesProgress.reduce((sum, r) => sum + r.solved, 0);
    const percent = totalQuestions > 0 ? Math.round((solvedQuestions / totalQuestions) * 100) : 0;

    summary.push({
      company: {
        _id: company._id,
        slug: company.slug,
        name: company.name,
        description: company.description,
      },
      roles: companyRolesProgress,
      totalQuestions,
      solvedQuestions,
      percent,
    });
  }

  const grandTotalQuestions = summary.reduce((sum, c) => sum + c.totalQuestions, 0);
  const grandSolvedQuestions = summary.reduce((sum, c) => sum + c.solvedQuestions, 0);
  const grandPercent =
    grandTotalQuestions > 0
      ? Math.round((grandSolvedQuestions / grandTotalQuestions) * 100)
      : 0;

  return {
    overall: {
      totalQuestions: grandTotalQuestions,
      solvedQuestions: grandSolvedQuestions,
      percent: grandPercent,
    },
    companies: summary,
  };
}

module.exports = {
  calculateProgress,
  calculateGlobalSummary,
};
