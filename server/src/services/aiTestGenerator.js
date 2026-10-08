const { GoogleGenAI } = require("@google/genai");

function cleanJSONString(str) {
  if (!str) return "{}";
  let cleaned = str.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "");
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1).trim();
  }
  return cleaned.trim();
}

/**
 * Fallback test question generator if Gemini has temporary network/rate limit.
 */
function getFallbackTest({ company, role, topic, difficulty }) {
  const diff = (difficulty || "Medium").toLowerCase();
  const numQuestions = diff === "hard" ? 5 : 10;
  const marksPerQuestion = diff === "hard" ? 20 : 10;

  const fallbackBanks = {
    "Dynamic Programming": [
      {
        question: "What is the primary difference between Memoization and Tabulation in Dynamic Programming?",
        codeSnippet: "// Memoization (Top-down) vs Tabulation (Bottom-up)",
        options: [
          "Memoization is top-down using recursion and caching; Tabulation is bottom-up using iterative table building.",
          "Memoization is always O(1) space while Tabulation is always O(N) space.",
          "Tabulation cannot solve the 0/1 Knapsack problem while Memoization can.",
          "Memoization is only applicable to Graph problems.",
        ],
        correctOptionIndex: 0,
        explanation: "Memoization starts from the target state and recursively solves subproblems while caching results. Tabulation starts from base cases and fills an iterative table.",
        subtopic: "DP Foundations",
      },
      {
        question: "What is the time complexity to find the N-th Fibonacci number using bottom-up DP tabulation with two variables?",
        codeSnippet: "function fib(n) {\n  let a = 0, b = 1;\n  for(let i = 2; i <= n; i++) {\n    let c = a + b;\n    a = b; b = c;\n  }\n  return b;\n}",
        options: ["O(2^N) time and O(N) space", "O(N) time and O(1) space", "O(N^2) time and O(N) space", "O(log N) time and O(N) space"],
        correctOptionIndex: 1,
        explanation: "The loop runs N-1 times with constant time arithmetic and only stores the last two variables, yielding O(N) time and O(1) space complexity.",
        subtopic: "Space Optimization",
      },
      {
        question: "In the 0/1 Knapsack problem, why does the inner loop run backwards when using a 1D array optimization?",
        codeSnippet: "for (int w = W; w >= weight[i]; w--) {\n  dp[w] = max(dp[w], value[i] + dp[w - weight[i]]);\n}",
        options: [
          "To avoid using values from the current item multiple times in the same step.",
          "To speed up cache locality on modern CPUs.",
          "Because 0/1 Knapsack requires descending order weights.",
          "It does not matter; forward loop gives the exact same result.",
        ],
        correctOptionIndex: 0,
        explanation: "Iterating backwards ensures that dp[w - weight[i]] comes from the previous item iteration rather than being overwritten by the current item.",
        subtopic: "Knapsack Optimization",
      },
      {
        question: "Which of the following problems can be modeled using the Longest Common Subsequence (LCS) pattern?",
        options: [
          "Edit Distance (Levenshtein Distance)",
          "Binary Search Tree validation",
          "Dijkstra's shortest path",
          "Topological sorting",
        ],
        correctOptionIndex: 0,
        explanation: "Edit distance, Minimum Deletions to make Strings Equal, and Shortest Common Supersequence are all direct extensions of the LCS Dynamic Programming pattern.",
        subtopic: "String DP",
      },
      {
        question: "What is the optimal time complexity of finding the Longest Increasing Subsequence (LIS) using DP with Patience Sorting / Binary Search?",
        options: ["O(N^2)", "O(N log N)", "O(N)", "O(2^N)"],
        correctOptionIndex: 1,
        explanation: "While simple DP takes O(N^2), combining Dynamic Programming with binary search (Patience Sorting) optimizes LIS to O(N log N).",
        subtopic: "LIS Pattern",
      },
      {
        question: "In Matrix Chain Multiplication, what is the recurrence relation for multiplying matrices from index i to j?",
        options: [
          "dp[i][j] = min(dp[i][k] + dp[k+1][j] + cost(i,k,j)) for all i <= k < j",
          "dp[i][j] = dp[i-1][j] + dp[i][j-1]",
          "dp[i][j] = max(dp[i-1][j-1], dp[i][j])",
          "dp[i][j] = dp[i][k] * dp[k][j]",
        ],
        correctOptionIndex: 0,
        explanation: "Matrix Chain Multiplication checks all split points k between i and j and takes the minimum sum of both subproblems plus the scalar multiplications.",
        subtopic: "Interval DP",
      },
      {
        question: "When should you use Bitmask Dynamic Programming?",
        options: [
          "When N is small (typically N <= 18-20) and state can be represented as a subset of elements.",
          "When all numbers are powers of 2.",
          "Only for floating-point arithmetic problems.",
          "When the problem involves bipartite graph matching exclusively.",
        ],
        correctOptionIndex: 0,
        explanation: "Bitmask DP is used for NP-hard subset problems like Traveling Salesperson Problem where N <= 20 and an integer bitmask represents visited vertices.",
        subtopic: "Bitmask DP",
      },
      {
        question: "What is the space complexity of Coin Change 2 (number of combinations) with 1D DP array of size amount + 1?",
        options: ["O(Amount)", "O(Amount * Coins)", "O(Coins)", "O(1)"],
        correctOptionIndex: 0,
        explanation: "A single 1D array of size amount + 1 stores combinations, resulting in O(Amount) auxiliary space.",
        subtopic: "Coin Change",
      },
      {
        question: "Which property must a problem possess to be solvable using Dynamic Programming?",
        options: [
          "Overlapping Subproblems and Optimal Substructure",
          "Greedy Choice Property and Linearity",
          "Divide and Conquer without overlaps",
          "Associativity and Commutativity",
        ],
        correctOptionIndex: 0,
        explanation: "Dynamic Programming applies strictly when a problem exhibits both Overlapping Subproblems (subproblems are recalculated) and Optimal Substructure (optimal global solution comes from optimal sub-solutions).",
        subtopic: "Core Theory",
      },
      {
        question: "In DP on Trees (e.g. Maximum Path Sum), how are subproblem solutions usually propagated?",
        options: [
          "From leaf nodes up to the root via post-order traversal (DFS).",
          "From root down to leaves via breadth-first search (BFS).",
          "By random edge contractions.",
          "By sorting node values in ascending order.",
        ],
        correctOptionIndex: 0,
        explanation: "Tree DP computes bottom-up values: children compute their optimal returns and pass them to parent nodes via post-order DFS.",
        subtopic: "Tree DP",
      },
    ],
  };

  const defaultQuestions = fallbackBanks[topic] || fallbackBanks["Dynamic Programming"];
  const selected = defaultQuestions.slice(0, numQuestions).map((q, idx) => ({
    id: idx + 1,
    question: q.question,
    codeSnippet: q.codeSnippet || "",
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
    marks: marksPerQuestion,
    explanation: q.explanation,
    subtopic: q.subtopic || topic,
  }));

  return {
    title: `${company} · ${topic} Diagnostic Assessment`,
    company,
    role,
    topic,
    difficulty: difficulty || "Medium",
    totalMarks: 100,
    durationMinutes: diff === "hard" ? 25 : 15,
    questions: selected,
  };
}

/**
 * Generate a 100-mark adaptive assessment tailored to the user's weak area.
 */
async function generateAITest({ company, role, topic, difficulty }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const diff = difficulty || "Medium";
  const numQuestions = diff.toLowerCase() === "hard" ? 5 : 10;
  const marksPerQuestion = diff.toLowerCase() === "hard" ? 20 : 10;
  const duration = diff.toLowerCase() === "hard" ? 25 : 15;

  const prompt = `You are a technical interview evaluator for top tech firms (${company}).
Generate a ${diff} placement test on the topic "${topic}" for a "${role}" role.

TEST SPECIFICATIONS:
• Total Marks: Exactly 100 Marks.
• Number of Questions: Exactly ${numQuestions} Questions.
• Marks per Question: Exactly ${marksPerQuestion} Marks.
• Target Company: ${company} (reflect typical ${company} interview screening patterns).
• Topic: ${topic}.
• Difficulty Level: ${diff}.

QUESTION REQUIREMENTS:
1. Each question must be Multiple Choice with exactly 4 options.
2. Include realistic code snippets, algorithm tracing, edge cases, time/space complexity analysis, or debugging questions where appropriate.
3. Distribute questions across key sub-concepts of "${topic}".
4. Exactly one option must be the correct answer (0, 1, 2, or 3).
5. Provide a clear, educational explanation for the solution.

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure with NO markdown formatting, commentary, or emoji:
{
  "title": "${company} ${topic} Technical Assessment",
  "company": "${company}",
  "role": "${role}",
  "topic": "${topic}",
  "difficulty": "${diff}",
  "totalMarks": 100,
  "durationMinutes": ${duration},
  "questions": [
    {
      "id": 1,
      "question": "Clear problem description...",
      "codeSnippet": "optional code snippet here or empty string",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correctOptionIndex": 0,
      "marks": ${marksPerQuestion},
      "explanation": "Why this is correct...",
      "subtopic": "Specific subconcept"
    }
  ]
}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const cleaned = cleanJSONString(response.text);
    const parsed = JSON.parse(cleaned);

    if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      return {
        ...parsed,
        totalMarks: 100,
        difficulty: diff,
      };
    }

    return getFallbackTest({ company, role, topic, difficulty });
  } catch (error) {
    console.warn("Gemini test generation failed, using structured question bank:", error.message);
    return getFallbackTest({ company, role, topic, difficulty });
  }
}

/**
 * Generate comprehensive diagnostic evaluation & targeted suggestion based on test results.
 */
async function generateTestDiagnostic({ company, role, topic, score, totalMarks, results }) {
  const percent = Math.round((score / totalMarks) * 100);
  const missed = results.filter((r) => !r.isCorrect);

  let readinessLevel = "Needs Immediate Focus";
  if (percent >= 80) readinessLevel = "Interview Ready / Proficient";
  else if (percent >= 60) readinessLevel = "Competent / Needs Targeted Polish";

  const apiKey = process.env.GEMINI_API_KEY;
  const missedSummary = missed
    .map((m) => `• Question: "${m.question}" (Subtopic: ${m.subtopic || topic})`)
    .join("\n");

  const prompt = `A student just finished a 100-mark test on "${topic}" for ${company} (${role}).
Score: ${score} / ${totalMarks} (${percent}%).
Readiness Grade: ${readinessLevel}.

Missed Questions / Concepts:
${missedSummary || "None! All questions answered correctly."}

Provide a concise diagnostic assessment:
1. Performance Summary (2 sentences acknowledging their performance).
2. Key Strengths Demonstrated.
3. Core Weaknesses / Misconceptions identified from the missed questions.
4. Immediate 3-Step Action Plan to master this topic before their ${company} interview.

Keep it encouraging, specific to ${topic} and ${company}, and formatted with clean bullet points. Do not use emoji or decorative symbols.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.6,
      },
    });

    return {
      score,
      totalMarks,
      percent,
      readinessLevel,
      aiFeedback: response.text,
    };
  } catch (err) {
    return {
      score,
      totalMarks,
      percent,
      readinessLevel,
      aiFeedback: `### Diagnostic Feedback
• **Score**: ${score} / ${totalMarks} (${percent}%) — ${readinessLevel}
• **Assessment**: You have good foundational grasp of standard ${topic} concepts, but lost marks on edge-case analysis and time complexity trade-offs.
• **Action Plan**:
  1. Revise the detailed explanations for each missed question below.
  2. Solve 3-4 Medium-level problems on this topic directly on the curated ${company} practice sheet.
  3. Re-take this diagnostic test at the next difficulty tier to verify mastery.`,
    };
  }
}

module.exports = {
  generateAITest,
  generateTestDiagnostic,
};
