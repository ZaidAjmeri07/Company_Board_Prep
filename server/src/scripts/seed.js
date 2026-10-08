require("dotenv").config();
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Company = require("../models/Company");
const Question = require("../models/Question");

const companiesData = [
  {
    slug: "amazon",
    name: "Amazon",
    description: "Global e-commerce and cloud computing giant renowned for high-bar technical interviews and 16 Leadership Principles.",
    roles: ["Software Engineer", "Data Analyst", "Management / Business"],
  },
  {
    slug: "google",
    name: "Google",
    description: "Multinational technology leader specializing in search algorithms, distributed systems, deep learning, and cloud computing.",
    roles: ["Software Engineer", "Data Analyst", "Management / Business"],
  },
  {
    slug: "microsoft",
    name: "Microsoft",
    description: "World leader in enterprise software, Azure cloud solutions, developer platforms, and foundational computer science problem solving.",
    roles: ["Software Engineer", "Data Analyst", "Management / Business"],
  },
  {
    slug: "tcs",
    name: "TCS",
    description: "Premier global IT services and consulting firm with national qualifier tests (TCS NQT) and digital profile tracks.",
    roles: ["Software Engineer", "Data Analyst", "Management / Business"],
  },
  {
    slug: "infosys",
    name: "Infosys",
    description: "Global consulting and technology leader with structured recruitment stages focusing on core aptitude and programming excellence.",
    roles: ["Software Engineer", "Data Analyst", "Management / Business"],
  },
  {
    slug: "deloitte",
    name: "Deloitte",
    description: "Top-tier professional services organization offering market-leading advisory, analytics, technology, and management consulting.",
    roles: ["Software Engineer", "Data Analyst", "Management / Business"],
  },
];

const sweQuestions = [
  // Arrays
  {
    title: "Two Sum",
    url: "https://leetcode.com/problems/two-sum/",
    platform: "LeetCode",
    category: "Arrays",
    difficulty: "Easy",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft", "tcs", "infosys", "deloitte"],
  },
  {
    title: "Best Time to Buy and Sell Stock",
    url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    platform: "LeetCode",
    category: "Arrays",
    difficulty: "Easy",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "google", "deloitte"],
  },
  {
    title: "Product of Array Except Self",
    url: "https://leetcode.com/problems/product-of-array-except-self/",
    platform: "LeetCode",
    category: "Arrays",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "google"],
  },
  {
    title: "Maximum Subarray (Kadane's Algorithm)",
    url: "https://leetcode.com/problems/maximum-subarray/",
    platform: "LeetCode",
    category: "Arrays",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "google", "tcs", "infosys"],
  },
  {
    title: "Trapping Rain Water",
    url: "https://leetcode.com/problems/trapping-rain-water/",
    platform: "LeetCode",
    category: "Arrays",
    difficulty: "Hard",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft"],
  },

  // Strings
  {
    title: "Valid Anagram",
    url: "https://leetcode.com/problems/valid-anagram/",
    platform: "LeetCode",
    category: "Strings",
    difficulty: "Easy",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft", "tcs", "infosys"],
  },
  {
    title: "Longest Substring Without Repeating Characters",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    platform: "LeetCode",
    category: "Strings",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "google"],
  },
  {
    title: "Group Anagrams",
    url: "https://leetcode.com/problems/group-anagrams/",
    platform: "LeetCode",
    category: "Strings",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft"],
  },
  {
    title: "Valid Parentheses",
    url: "https://leetcode.com/problems/valid-parentheses/",
    platform: "LeetCode",
    category: "Strings",
    difficulty: "Easy",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft", "tcs", "infosys", "deloitte"],
  },

  // Linked List
  {
    title: "Reverse a Linked List",
    url: "https://leetcode.com/problems/reverse-linked-list/",
    platform: "LeetCode",
    category: "Linked List",
    difficulty: "Easy",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft", "tcs", "infosys"],
  },
  {
    title: "Merge Two Sorted Lists",
    url: "https://leetcode.com/problems/merge-two-sorted-lists/",
    platform: "LeetCode",
    category: "Linked List",
    difficulty: "Easy",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "tcs", "infosys", "deloitte"],
  },
  {
    title: "Linked List Cycle Detection",
    url: "https://leetcode.com/problems/linked-list-cycle/",
    platform: "LeetCode",
    category: "Linked List",
    difficulty: "Easy",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "google"],
  },
  {
    title: "LRU Cache Implementation",
    url: "https://leetcode.com/problems/lru-cache/",
    platform: "LeetCode",
    category: "Linked List",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "google"],
  },

  // Trees
  {
    title: "Maximum Depth of Binary Tree",
    url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    platform: "LeetCode",
    category: "Trees",
    difficulty: "Easy",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "google", "tcs", "infosys"],
  },
  {
    title: "Invert Binary Tree",
    url: "https://leetcode.com/problems/invert-binary-tree/",
    platform: "LeetCode",
    category: "Trees",
    difficulty: "Easy",
    type: "coding",
    role: "Software Engineer",
    companies: ["google", "amazon", "microsoft"],
  },
  {
    title: "Binary Tree Level Order Traversal",
    url: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    platform: "LeetCode",
    category: "Trees",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "google"],
  },
  {
    title: "Lowest Common Ancestor of a Binary Tree",
    url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
    platform: "LeetCode",
    category: "Trees",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "google"],
  },

  // Graphs
  {
    title: "Number of Islands (BFS / DFS)",
    url: "https://leetcode.com/problems/number-of-islands/",
    platform: "LeetCode",
    category: "Graphs",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft"],
  },
  {
    title: "Course Schedule (Topological Sort)",
    url: "https://leetcode.com/problems/course-schedule/",
    platform: "LeetCode",
    category: "Graphs",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft"],
  },
  {
    title: "Clone Graph",
    url: "https://leetcode.com/problems/clone-graph/",
    platform: "LeetCode",
    category: "Graphs",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["google", "microsoft"],
  },

  // Dynamic Programming (DP)
  {
    title: "Climbing Stairs",
    url: "https://leetcode.com/problems/climbing-stairs/",
    platform: "LeetCode",
    category: "DP",
    difficulty: "Easy",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft", "tcs", "infosys"],
  },
  {
    title: "Coin Change",
    url: "https://leetcode.com/problems/coin-change/",
    platform: "LeetCode",
    category: "DP",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft"],
  },
  {
    title: "Longest Increasing Subsequence",
    url: "https://leetcode.com/problems/longest-increasing-subsequence/",
    platform: "LeetCode",
    category: "DP",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["google", "microsoft", "amazon"],
  },
  {
    title: "0/1 Knapsack Problem",
    url: "https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/",
    platform: "GFG",
    category: "DP",
    difficulty: "Medium",
    type: "coding",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "tcs", "infosys", "deloitte"],
  },

  // CS Fundamentals
  {
    title: "Process vs Thread and Concurrency Basics",
    url: "https://www.geeksforgeeks.org/difference-between-process-and-thread/",
    platform: "GFG",
    category: "CS Fundamentals",
    difficulty: "Easy",
    type: "knowledge",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft", "tcs", "infosys", "deloitte"],
  },
  {
    title: "ACID Properties & Database Indexing Internals (B-Trees)",
    url: "https://www.geeksforgeeks.org/acid-properties-in-dbms/",
    platform: "GFG",
    category: "CS Fundamentals",
    difficulty: "Medium",
    type: "knowledge",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "tcs", "infosys", "deloitte"],
  },
  {
    title: "TCP 3-Way Handshake vs UDP",
    url: "https://www.geeksforgeeks.org/tcp-3-way-handshake-process/",
    platform: "GFG",
    category: "CS Fundamentals",
    difficulty: "Easy",
    type: "knowledge",
    role: "Software Engineer",
    companies: ["google", "microsoft", "tcs", "infosys", "deloitte"],
  },
  {
    title: "Virtual Memory, Paging, and Page Faults",
    url: "https://www.geeksforgeeks.org/virtual-memory-in-operating-system/",
    platform: "GFG",
    category: "CS Fundamentals",
    difficulty: "Medium",
    type: "knowledge",
    role: "Software Engineer",
    companies: ["microsoft", "google", "amazon"],
  },

  // SQL
  {
    title: "Second Highest Salary",
    url: "https://leetcode.com/problems/second-highest-salary/",
    platform: "LeetCode",
    category: "SQL",
    difficulty: "Medium",
    type: "sql",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "tcs", "infosys", "deloitte"],
  },
  {
    title: "Combine Two Tables (SQL Joins)",
    url: "https://leetcode.com/problems/combine-two-tables/",
    platform: "LeetCode",
    category: "SQL",
    difficulty: "Easy",
    type: "sql",
    role: "Software Engineer",
    companies: ["amazon", "microsoft", "tcs", "infosys", "deloitte"],
  },
  {
    title: "Department Highest Salary",
    url: "https://leetcode.com/problems/department-highest-salary/",
    platform: "LeetCode",
    category: "SQL",
    difficulty: "Medium",
    type: "sql",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft", "deloitte"],
  },

  // HR
  {
    title: "Tell Me About Yourself & Walk Through Your Resume",
    url: "https://www.geeksforgeeks.org/tell-me-about-yourself-interview-question/",
    platform: "Other",
    category: "HR",
    difficulty: "Easy",
    type: "hr",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft", "tcs", "infosys", "deloitte"],
  },
  {
    title: "STAR Method: Tell me about a time you faced a difficult technical challenge",
    url: "https://www.geeksforgeeks.org/star-method-for-interview-questions/",
    platform: "Other",
    category: "HR",
    difficulty: "Medium",
    type: "hr",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft", "deloitte"],
  },
  {
    title: "Why do you want to join our company?",
    url: "https://www.geeksforgeeks.org/why-do-you-want-to-join-this-company/",
    platform: "Other",
    category: "HR",
    difficulty: "Easy",
    type: "hr",
    role: "Software Engineer",
    companies: ["amazon", "google", "microsoft", "tcs", "infosys", "deloitte"],
  },
];

const dataAnalystQuestions = [
  // SQL
  {
    title: "Consecutive Numbers in SQL",
    url: "https://leetcode.com/problems/consecutive-numbers/",
    platform: "LeetCode",
    category: "SQL",
    difficulty: "Medium",
    type: "sql",
    role: "Data Analyst",
    companies: ["amazon", "google", "microsoft", "deloitte"],
  },
  {
    title: "Rank Scores & Dense Rank Window Functions",
    url: "https://leetcode.com/problems/rank-scores/",
    platform: "LeetCode",
    category: "SQL",
    difficulty: "Medium",
    type: "sql",
    role: "Data Analyst",
    companies: ["amazon", "google", "microsoft", "deloitte", "tcs", "infosys"],
  },
  {
    title: "Trips and Users (Complex Aggregations)",
    url: "https://leetcode.com/problems/trips-and-users/",
    platform: "LeetCode",
    category: "SQL",
    difficulty: "Hard",
    type: "sql",
    role: "Data Analyst",
    companies: ["amazon", "google", "microsoft"],
  },
  {
    title: "Duplicate Emails Filtering",
    url: "https://leetcode.com/problems/duplicate-emails/",
    platform: "LeetCode",
    category: "SQL",
    difficulty: "Easy",
    type: "sql",
    role: "Data Analyst",
    companies: ["tcs", "infosys", "deloitte", "amazon"],
  },

  // Excel
  {
    title: "Advanced Excel: VLOOKUP, INDEX MATCH, and XLOOKUP",
    url: "https://www.geeksforgeeks.org/vlookup-in-excel/",
    platform: "GFG",
    category: "Excel",
    difficulty: "Easy",
    type: "knowledge",
    role: "Data Analyst",
    companies: ["deloitte", "tcs", "infosys", "amazon"],
  },
  {
    title: "Pivot Tables, Slicers, and Dynamic Summary Dashboards",
    url: "https://www.geeksforgeeks.org/excel-pivot-tables/",
    platform: "GFG",
    category: "Excel",
    difficulty: "Medium",
    type: "knowledge",
    role: "Data Analyst",
    companies: ["deloitte", "amazon", "microsoft", "tcs", "infosys"],
  },
  {
    title: "Conditional Formatting, Nested IFs, and Data Validation",
    url: "https://www.geeksforgeeks.org/excel-formulas/",
    platform: "GFG",
    category: "Excel",
    difficulty: "Easy",
    type: "knowledge",
    role: "Data Analyst",
    companies: ["deloitte", "tcs", "infosys"],
  },

  // Statistics
  {
    title: "Central Tendency, Standard Deviation, and Outlier Detection",
    url: "https://www.geeksforgeeks.org/statistics-for-data-science/",
    platform: "GFG",
    category: "Statistics",
    difficulty: "Easy",
    type: "knowledge",
    role: "Data Analyst",
    companies: ["google", "amazon", "microsoft", "deloitte"],
  },
  {
    title: "Hypothesis Testing: p-value, Null Hypothesis & Type I/II Errors",
    url: "https://www.geeksforgeeks.org/hypothesis-testing/",
    platform: "GFG",
    category: "Statistics",
    difficulty: "Medium",
    type: "knowledge",
    role: "Data Analyst",
    companies: ["google", "amazon", "microsoft", "deloitte"],
  },
  {
    title: "A/B Testing Framework and Sample Size Calculation",
    url: "https://www.geeksforgeeks.org/ab-testing-in-data-science/",
    platform: "GFG",
    category: "Statistics",
    difficulty: "Medium",
    type: "knowledge",
    role: "Data Analyst",
    companies: ["google", "amazon", "microsoft"],
  },

  // Python
  {
    title: "Data Manipulation with Pandas (Groupby, Merge, Melt)",
    url: "https://www.geeksforgeeks.org/pandas-tutorial/",
    platform: "GFG",
    category: "Python",
    difficulty: "Medium",
    type: "coding",
    role: "Data Analyst",
    companies: ["amazon", "google", "microsoft", "deloitte", "tcs", "infosys"],
  },
  {
    title: "Handling Missing Values and Data Cleaning Pipelines",
    url: "https://www.geeksforgeeks.org/working-with-missing-data-in-pandas/",
    platform: "GFG",
    category: "Python",
    difficulty: "Easy",
    type: "coding",
    role: "Data Analyst",
    companies: ["amazon", "google", "microsoft", "deloitte"],
  },
  {
    title: "Data Visualization using Matplotlib & Seaborn",
    url: "https://www.geeksforgeeks.org/data-visualization-different-charts-python/",
    platform: "GFG",
    category: "Python",
    difficulty: "Easy",
    type: "coding",
    role: "Data Analyst",
    companies: ["deloitte", "tcs", "infosys", "amazon"],
  },

  // Data Interpretation
  {
    title: "Bar Charts and Line Graphs Interpretation",
    url: "https://www.indiabix.com/data-interpretation/bar-charts/",
    platform: "IndiaBix",
    category: "Data Interpretation",
    difficulty: "Easy",
    type: "aptitude",
    role: "Data Analyst",
    companies: ["tcs", "infosys", "deloitte", "amazon"],
  },
  {
    title: "Pie Chart & Multi-variate Tables Analysis",
    url: "https://www.indiabix.com/data-interpretation/pie-charts/",
    platform: "IndiaBix",
    category: "Data Interpretation",
    difficulty: "Medium",
    type: "aptitude",
    role: "Data Analyst",
    companies: ["tcs", "infosys", "deloitte", "microsoft"],
  },

  // Case Study
  {
    title: "Diagnosing a 15% Drop in Weekly Active Users (WAU)",
    url: "https://www.geeksforgeeks.org/product-metrics-case-study/",
    platform: "Other",
    category: "Case Study",
    difficulty: "Medium",
    type: "case",
    role: "Data Analyst",
    companies: ["google", "amazon", "microsoft", "deloitte"],
  },
  {
    title: "E-Commerce Customer Churn Analysis & Retention Strategy",
    url: "https://www.geeksforgeeks.org/customer-churn-prediction/",
    platform: "Other",
    category: "Case Study",
    difficulty: "Medium",
    type: "case",
    role: "Data Analyst",
    companies: ["amazon", "deloitte", "tcs"],
  },

  // HR
  {
    title: "Explain a complex technical analysis to a non-technical stakeholder",
    url: "https://www.geeksforgeeks.org/data-analyst-interview-questions/",
    platform: "Other",
    category: "HR",
    difficulty: "Easy",
    type: "hr",
    role: "Data Analyst",
    companies: ["amazon", "google", "microsoft", "deloitte", "tcs", "infosys"],
  },
  {
    title: "How do you handle conflicting data or ambiguous metrics?",
    url: "https://www.geeksforgeeks.org/behavioral-interview-questions/",
    platform: "Other",
    category: "HR",
    difficulty: "Medium",
    type: "hr",
    role: "Data Analyst",
    companies: ["amazon", "deloitte", "google", "microsoft"],
  },
];

const managementQuestions = [
  // Aptitude
  {
    title: "Profit and Loss & Percentage Calculations",
    url: "https://www.indiabix.com/aptitude/profit-and-loss/",
    platform: "IndiaBix",
    category: "Aptitude",
    difficulty: "Easy",
    type: "aptitude",
    role: "Management / Business",
    companies: ["deloitte", "tcs", "infosys", "amazon"],
  },
  {
    title: "Time, Speed and Distance & Relative Speed",
    url: "https://www.indiabix.com/aptitude/time-and-distance/",
    platform: "IndiaBix",
    category: "Aptitude",
    difficulty: "Medium",
    type: "aptitude",
    role: "Management / Business",
    companies: ["deloitte", "tcs", "infosys", "amazon"],
  },
  {
    title: "Permutations, Combinations & Probability",
    url: "https://www.indiabix.com/aptitude/probability/",
    platform: "IndiaBix",
    category: "Aptitude",
    difficulty: "Medium",
    type: "aptitude",
    role: "Management / Business",
    companies: ["deloitte", "google", "microsoft"],
  },

  // Case Study
  {
    title: "Profitability Framework: Addressing Declining Margins in Retail",
    url: "https://www.geeksforgeeks.org/consulting-case-study-frameworks/",
    platform: "Other",
    category: "Case Study",
    difficulty: "Medium",
    type: "case",
    role: "Management / Business",
    companies: ["deloitte", "amazon", "microsoft"],
  },
  {
    title: "Market Entry: Expanding an EV Charging Network to Tier 2 Cities",
    url: "https://www.geeksforgeeks.org/market-entry-case-study/",
    platform: "Other",
    category: "Case Study",
    difficulty: "Hard",
    type: "case",
    role: "Management / Business",
    companies: ["deloitte", "google", "amazon"],
  },

  // Guesstimate
  {
    title: "Estimate the Daily Volume of Coffee Cups Sold in Mumbai",
    url: "https://www.geeksforgeeks.org/guesstimate-questions-for-interviews/",
    platform: "Other",
    category: "Guesstimate",
    difficulty: "Medium",
    type: "case",
    role: "Management / Business",
    companies: ["deloitte", "amazon", "google"],
  },
  {
    title: "Estimate Annual Smartphone Sales in India",
    url: "https://www.geeksforgeeks.org/market-sizing-guesstimates/",
    platform: "Other",
    category: "Guesstimate",
    difficulty: "Medium",
    type: "case",
    role: "Management / Business",
    companies: ["deloitte", "microsoft", "google", "amazon"],
  },

  // GD
  {
    title: "Artificial Intelligence: Threat to Jobs or Engine of Economic Growth?",
    url: "https://www.geeksforgeeks.org/group-discussion-topics-for-interviews/",
    platform: "Other",
    category: "GD",
    difficulty: "Easy",
    type: "gd",
    role: "Management / Business",
    companies: ["deloitte", "tcs", "infosys", "amazon"],
  },
  {
    title: "Remote Work vs Return to Office: Productivity and Culture Trade-offs",
    url: "https://www.geeksforgeeks.org/gd-topics-remote-work/",
    platform: "Other",
    category: "GD",
    difficulty: "Easy",
    type: "gd",
    role: "Management / Business",
    companies: ["deloitte", "tcs", "infosys", "microsoft"],
  },

  // Business Knowledge
  {
    title: "Porter's 5 Forces & SWOT Analysis Frameworks",
    url: "https://www.geeksforgeeks.org/porters-five-forces-analysis/",
    platform: "Other",
    category: "Business Knowledge",
    difficulty: "Easy",
    type: "knowledge",
    role: "Management / Business",
    companies: ["deloitte", "amazon", "microsoft"],
  },
  {
    title: "Understanding Unit Economics: CAC, LTV, and Payback Period",
    url: "https://www.geeksforgeeks.org/unit-economics-cac-ltv/",
    platform: "Other",
    category: "Business Knowledge",
    difficulty: "Medium",
    type: "knowledge",
    role: "Management / Business",
    companies: ["deloitte", "amazon", "google"],
  },

  // HR
  {
    title: "Describe a leadership role where you handled team conflict",
    url: "https://www.geeksforgeeks.org/leadership-interview-questions/",
    platform: "Other",
    category: "HR",
    difficulty: "Medium",
    type: "hr",
    role: "Management / Business",
    companies: ["deloitte", "amazon", "google", "microsoft", "tcs", "infosys"],
  },
  {
    title: "Where do you see yourself in 3-5 years in business leadership?",
    url: "https://www.geeksforgeeks.org/where-do-you-see-yourself-in-5-years/",
    platform: "Other",
    category: "HR",
    difficulty: "Easy",
    type: "hr",
    role: "Management / Business",
    companies: ["deloitte", "amazon", "tcs", "infosys"],
  },
];

async function seed() {
  try {
    await connectDB();
    console.log("Connected to MongoDB for seeding...");

    // Upsert Companies
    console.log("Seeding Companies...");
    for (const comp of companiesData) {
      await Company.findOneAndUpdate(
        { slug: comp.slug },
        comp,
        { upsert: true, new: true }
      );
    }
    console.log(`Seeded ${companiesData.length} companies.`);

    // Seed Questions
    console.log("Seeding Questions...");
    // Clear existing questions to avoid duplicates on re-seed
    await Question.deleteMany({});

    const allQuestions = [...sweQuestions, ...dataAnalystQuestions, ...managementQuestions];
    await Question.insertMany(allQuestions);
    console.log(`Successfully seeded ${allQuestions.length} curated questions!`);

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
