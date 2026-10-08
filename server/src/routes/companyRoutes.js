const express = require("express");
const Company = require("../models/Company");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// GET /api/companies - list all curated companies
router.get("/", async (req, res, next) => {
  try {
    const companies = await Company.find({ slug: { $exists: true } }).sort({ name: 1 });
    res.json({ companies });
  } catch (error) {
    next(error);
  }
});

// GET /api/companies/:companyId - get company by slug or ID
router.get("/:companyId", async (req, res, next) => {
  try {
    const { companyId } = req.params;
    let company = null;

    if (companyId.match(/^[0-9a-fA-F]{24}$/)) {
      company = await Company.findById(companyId);
    }

    if (!company) {
      company = await Company.findOne({
        slug: companyId.toLowerCase().trim(),
      });
    }

    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    res.json({ company });
  } catch (error) {
    next(error);
  }
});

module.exports = router;