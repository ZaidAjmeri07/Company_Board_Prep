const { GoogleGenAI } = require("@google/genai");

/**
 * Fallback generator in case the API key is not provided, expired, or rate-limited.
 */
function generateFallbackPlan({ company, role, categories }) {
  const sorted = [...(categories || [])].sort((a, b) => (a.percent || 0) - (b.percent || 0));
  const weak1 = sorted[0]?.name || "Core Fundamentals";
  const weak2 = sorted[1]?.name || "Problem Solving";
  const weak3 = sorted[2]?.name || "System Design / Aptitude";

  return `Day 1: ${weak1} - Foundations & Pattern Identification
• Focus Topic: Core concepts and fundamental patterns in ${weak1} commonly tested at ${company}.
• What to Revise: Review key theory, standard templates, and edge cases.
• Target: Solve 4-5 curated problems targeting beginner-to-intermediate level.

Day 2: ${weak1} - Advanced Problem Solving
• Focus Topic: Complex questions and interview variations in ${weak1}.
• What to Revise: Time and space complexity trade-offs, optimization techniques.
• Target: Solve 3 Medium/Hard problems under timed conditions.

Day 3: ${weak2} - High-Yield Question Types
• Focus Topic: Common question variations and interview archetypes in ${weak2}.
• What to Revise: Standard algorithms, best practices, and frequently asked interview traps.
• Target: Solve 4 questions from the curated ${company} sheet.

Day 4: ${weak3} & Mixed Practice
• Focus Topic: Practical drills in ${weak3} plus mixed revision of ${weak1}.
• What to Revise: Quick formulation of approaches, clear verbalization of thought process.
• Target: Solve 4 questions across ${weak2} and ${weak3}.

Day 5: Company-Specific Problem Drill (${company} Focused)
• Focus Topic: Most frequently repeated questions for ${company} (${role}).
• What to Revise: Company past interview trends, standard behavioral questions, and core technical questions.
• Target: Solve 5 targeted questions directly from the ${company} sheet.

Day 6: Mock Interview & Timed Assessment
• Focus Topic: Simulation of real interview rounds for ${role}.
• What to Revise: Communication clarity, structuring answers using STAR method, writing clean bug-free code.
• Target: Complete a 60-90 minute timed problem set (2-3 questions) followed by thorough review.

Day 7: Final Revision & Strategy
• Focus Topic: Comprehensive review of all solved questions, mistake notes, and HR questions.
• What to Revise: Revisit questions marked difficult, review core cheat-sheets and company cultural values.
• Target: Light practice (1-2 warmup questions) + mental rest before interviews.`;
}

async function generateStudyPlan({ company, role, categories }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const isPlaceholderKey =
    !apiKey ||
    apiKey.trim() === "" ||
    apiKey === "your_gemini_api_key" ||
    apiKey.includes("your_");

  const progressSummary = (categories || [])
    .map((c) => `${c.name}: ${c.solved}/${c.total} (${c.percent}%)`)
    .join("\n");

  const prompt = `Company: ${company}
Role: ${role}

Student progress by category:
${progressSummary || "No attempts recorded yet."}

Create a 7-day preparation plan. Prioritize the weakest categories.
For each day give: focus topic, what to revise, and how many questions to solve.
Keep it concise and practical. Use plain text with "Day 1", "Day 2", etc. Do not use emoji or decorative symbols.`;

  if (isPlaceholderKey) {
    console.log("No valid GEMINI_API_KEY found. Using generated fallback study plan.");
    return generateFallbackPlan({ company, role, categories });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    if (res && res.text) {
      return res.text;
    }
    return generateFallbackPlan({ company, role, categories });
  } catch (error) {
    console.warn("Gemini API call failed, using high-quality study plan template:", error.message);
    return generateFallbackPlan({ company, role, categories });
  }
}

module.exports = {
  generateStudyPlan,
};
