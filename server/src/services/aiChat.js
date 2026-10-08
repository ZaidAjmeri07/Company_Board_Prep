const { GoogleGenAI } = require("@google/genai");
const Company = require("../models/Company");
const { calculateGlobalSummary } = require("./progress");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleAIChat({ message, userId, history = [] }) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Gather platform context
  let userContext = "User is exploring as a guest or has not marked questions as solved yet.";

  if (userId) {
    try {
      const summary = await calculateGlobalSummary(userId);
      const activeCompanies = (summary.companies || [])
        .filter((c) => c.solvedQuestions > 0)
        .map((c) => {
          const roleDetails = c.roles.map(
            (r) => `${r.role}: ${r.solved}/${r.total} (${r.percent}%), Weakest: ${r.weakestArea || "None"}`
          );
          return `${c.company.name} -> ${roleDetails.join(" | ")}`;
        });

      userContext = `Student Progress Summary:
• Overall Solved: ${summary.overall.solvedQuestions} / ${summary.overall.totalQuestions} (${summary.overall.percent}%)
• Track Activity:
${activeCompanies.length > 0 ? activeCompanies.join("\n") : "No questions marked solved yet."}`;
    } catch (e) {
      console.warn("Could not fetch user context for chat:", e.message);
    }
  }

  const systemInstruction = `You are "PrepAI", the official placement & interview preparation advisor on the "Company Board Prep" website.

PLATFORM SYLLABUS & TARGET RECRUITERS:
• 6 Target Companies: Amazon, Google, Microsoft, TCS, Infosys, Deloitte.
• 3 Career Roles:
  1. Software Engineer (Categories: Arrays, Strings, Linked List, Trees, Graphs, DP, CS Fundamentals, SQL, HR)
  2. Data Analyst (Categories: SQL, Excel, Statistics, Python, Data Interpretation, Case Study, HR)
  3. Management / Business (Categories: Aptitude, Case Study, Guesstimate, GD, Business Knowledge, HR)

PLATFORM INTERNAL URLS (Use these exact paths for direct navigation):
• Companies Directory: /companies
• Specific Company: /companies/<companySlug> (e.g. /companies/amazon, /companies/google, /companies/deloitte)
• Preparation Dashboard: /prep/<companySlug>/<roleEncoded> (e.g. /prep/google/Software%20Engineer, /prep/amazon/Software%20Engineer, /prep/deloitte/Management%20%2F%20Business)
• Question Practice Sheet: /prep/<companySlug>/<roleEncoded>/sheet (can add ?category=<CategoryName>)
• AI 7-Day Study Plan: /prep/<companySlug>/<roleEncoded>/plan
• Candidate Progress Overview: /me

STUDENT CONTEXT:
${userContext}

CRITICAL RULES:
1. STRICT BOUNDARY: If the user asks ANY question unrelated to placement preparation, job interviews, syllabus topics, technical/aptitude/HR questions, or this platform (e.g. cooking, general gossip, sports, weather, unrelated coding or trivia), you MUST decline:
"I am the Company Board Prep AI Assistant. Please ask only questions related to company placement interviews, syllabus topics, and practicing on this platform."
2. WHEN ASKED ABOUT A COMPANY OR INTERVIEW PREPARATION (e.g. Google, Amazon, TCS, Deloitte):
   • Provide "Areas of Goodness / Strengths" (high-probability, high-scoring topics where solid prep pays off quickly).
   • Provide "Areas of Weakness / Pitfalls" (challenging areas like DP, Graph traversals, or the user's current weakest area if present in context).
   • Suggest the immediate priority topics to focus on.
   • ALWAYS include 1 to 3 direct markdown action links so the student can click directly in the chat to jump to the right section on the website, e.g.:
     [Start Google Software Engineer Practice Sheet](/prep/google/Software%20Engineer/sheet)
     [Open Google Preparation Dashboard](/prep/google/Software%20Engineer)
3. Keep the tone professional, structured, motivating, and concise. Do not use emoji, pictograms, or decorative symbols.`;

  const contents = [];
  for (const h of history.slice(-6)) {
    if (h.sender === "user") {
      contents.push({ role: "user", parts: [{ text: h.text }] });
    } else if (h.sender === "ai") {
      contents.push({ role: "model", parts: [{ text: h.text }] });
    }
  }
  contents.push({ role: "user", parts: [{ text: message }] });

  // Try calling Gemini with retry on temporary 503
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (error) {
      console.warn(`Gemini attempt ${attempt} error:`, error.message);
      if (attempt === 1) {
        await sleep(1000);
      }
    }
  }

  // Graceful structured fallback if API temporarily unavailable
  return `### Placement Preparation Guidance
Here is targeted guidance based on our curated syllabus:

• **Areas of Goodness (High Yield)**: Core Data Structures (Arrays, Strings, Hash Maps) and SQL Fundamentals. Mastering these covers 60%+ of screening rounds.
• **Areas of Weakness (Common Pitfalls)**: Dynamic Programming, Graph Traversals, and System Design concepts.

You can start practicing directly now:
• [Explore All 6 Target Companies](/companies)
• [Open Your Candidate Overview](/me)`;
}

module.exports = {
  handleAIChat,
};
