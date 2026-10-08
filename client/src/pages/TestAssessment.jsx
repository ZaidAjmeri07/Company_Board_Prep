import React, { useEffect, useState, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import API from "../api/client";
import MarkdownContent from "../components/MarkdownContent";
import removeEmoji from "../utils/removeEmoji";

export default function TestAssessment() {
  const { companyId, role } = useParams();
  const [searchParams] = useSearchParams();

  const [company, setCompany] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [weakestArea, setWeakestArea] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(searchParams.get("topic") || "");
  const [difficulty, setDifficulty] = useState("Medium");

  // Test flow states: 'setup' | 'loading' | 'testing' | 'evaluating' | 'result'
  const [stage, setStage] = useState("setup");
  const [testData, setTestData] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState("");

  // Proctoring States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationsCount, setViolationsCount] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [autoSubmittedReason, setAutoSubmittedReason] = useState("");

  const timerRef = useRef(null);

  // Fetch initial dashboard and categories
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await API.get(`/prep/${companyId}/${encodeURIComponent(role)}/dashboard`);
        setCompany(res.data.company);
        const categories = res.data.stats?.categories?.map((c) => c.name) || [];
        setAvailableCategories(categories);
        const weak = res.data.stats?.weakestArea || categories[0] || "Dynamic Programming";
        setWeakestArea(weak);
        if (!selectedTopic) {
          setSelectedTopic(searchParams.get("topic") || weak);
        }
      } catch (err) {
        setError("Could not load candidate preparation data.");
      }
    }
    loadMeta();
  }, [companyId, role, searchParams]);

  // Countdown timer during active test
  useEffect(() => {
    if (stage === "testing" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [stage, timeLeft]);

  // Broadcast exam mode to hide Navbar links & Floating AI Bot
  useEffect(() => {
    const isExamActive = stage === "testing";
    window.dispatchEvent(new CustomEvent("exam-mode", { detail: { active: isExamActive } }));
    return () => {
      window.dispatchEvent(new CustomEvent("exam-mode", { detail: { active: false } }));
    };
  }, [stage]);

  // Fullscreen monitor
  useEffect(() => {
    if (stage !== "testing") return;

    function handleFullscreenChange() {
      const inFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(inFullscreen);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [stage]);

  // Tab switch & visibility monitoring (3-Strike Rule)
  useEffect(() => {
    if (stage !== "testing") return;

    function handleVisibilityChange() {
      if (document.hidden) {
        setViolationsCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount >= 3) {
            setAutoSubmittedReason("Test automatically submitted: Maximum allowed tab-switching violations (3 of 3) reached.");
            setTimeout(() => handleSubmitTest(), 100);
          } else {
            setShowViolationModal(true);
          }
          return nextCount;
        });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stage]);

  // Prevent accidental reload or tab closure
  useEffect(() => {
    if (stage !== "testing") return;

    function handleBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave? Your proctored test progress will be lost!";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [stage]);

  async function requestFullscreenMode() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.warn("Fullscreen permission error:", err);
      // Fallback: continue if browser blocks programmatic fullscreen
      setIsFullscreen(true);
    }
  }

  function exitFullscreenMode() {
    try {
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (err) {}
    setIsFullscreen(false);
  }

  async function handleStartTest() {
    setStage("loading");
    setError("");

    try {
      const res = await API.post(`/prep/${companyId}/${encodeURIComponent(role)}/test/generate`, {
        topic: selectedTopic || weakestArea || "Dynamic Programming",
        difficulty,
      });

      const test = res.data.test;
      setTestData(test);
      setUserAnswers({});
      setCurrentQIndex(0);
      setViolationsCount(0);
      setShowViolationModal(false);
      setAutoSubmittedReason("");
      setTimeLeft((test.durationMinutes || 15) * 60);

      // Trigger mandatory fullscreen mode
      await requestFullscreenMode();
      setStage("testing");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate AI assessment. Please try again.");
      setStage("setup");
    }
  }

  function handleSelectOption(qId, optionIndex) {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionIndex,
    }));
  }

  async function handleSubmitTest() {
    clearInterval(timerRef.current);
    exitFullscreenMode();
    setStage("evaluating");

    if (!testData || !testData.questions) return;

    let score = 0;
    const results = testData.questions.map((q) => {
      const selected = userAnswers[q.id];
      const isCorrect = selected === q.correctOptionIndex;
      const marksEarned = isCorrect ? q.marks : 0;
      score += marksEarned;

      return {
        id: q.id,
        question: q.question,
        subtopic: q.subtopic,
        marks: q.marks,
        selectedOption: selected !== undefined ? q.options[selected] : "Not Answered",
        selectedIndex: selected,
        correctOption: q.options[q.correctOptionIndex],
        correctIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    try {
      const evalRes = await API.post(`/prep/${companyId}/${encodeURIComponent(role)}/test/evaluate`, {
        topic: testData.topic,
        difficulty: testData.difficulty,
        score,
        totalMarks: testData.totalMarks || 100,
        results,
      });

      setEvaluation({
        ...evalRes.data.diagnostic,
        results,
      });
      setStage("result");
    } catch (err) {
      const totalMarks = testData.totalMarks || 100;
      const percent = Math.round((score / totalMarks) * 100);
      let readinessLevel =
        percent >= 80
          ? "Interview Ready / Proficient"
          : percent >= 60
          ? "Competent / Needs Polish"
          : "Needs Immediate Focus";

      setEvaluation({
        score,
        totalMarks,
        percent,
        readinessLevel,
        results,
        aiFeedback: `### Diagnostic Feedback\n• Score: ${score} / ${totalMarks} (${percent}%) — ${readinessLevel}.\n• Keep practicing ${testData.topic} questions to solidify your interview readiness for ${company?.name}.`,
      });
      setStage("result");
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Breadcrumb (Hidden during active proctored testing) */}
      {stage !== "testing" && (
        <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-500">
          <Link to="/companies" className="hover:text-emerald-700">Companies</Link>
          <span>/</span>
          <Link to={`/companies/${companyId}`} className="hover:text-emerald-700">{company?.name || companyId}</Link>
          <span>/</span>
          <Link to={`/prep/${companyId}/${encodeURIComponent(role)}`} className="hover:text-emerald-700">{role}</Link>
          <span>/</span>
          <span className="font-semibold text-neutral-800">100-Mark Diagnostic Assessment</span>
        </nav>
      )}

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* ========================================================= */}
      {/* PROCTORING OVERLAY 1: MANDATORY FULLSCREEN GATEKEEPER     */}
      {/* ========================================================= */}
      {stage === "testing" && !isFullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg animate-in fade-in duration-200">
          <div className="max-w-md rounded-2xl border border-red-500/50 bg-neutral-900 p-6 sm:p-8 text-center text-white shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 text-2xl mb-4 font-bold">
              !
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Fullscreen Mode Required
            </h2>
            <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
              You have exited fullscreen view. Official placement assessments strictly require fullscreen mode to ensure testing integrity. You cannot view questions or continue the test until fullscreen is restored.
            </p>

            <button
              onClick={requestFullscreenMode}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-[0.99]"
            >
              Resume Fullscreen Mode
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PROCTORING OVERLAY 2: TAB SWITCH VIOLATION WARNING        */}
      {/* ========================================================= */}
      {stage === "testing" && showViolationModal && violationsCount < 3 && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-md rounded-2xl border-2 border-red-600 bg-white p-6 sm:p-8 text-center text-neutral-900 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700 text-xl font-black mb-3">
              !
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 uppercase tracking-wider inline-block mb-2">
              Proctoring Violation {violationsCount} of 3
            </span>
            <h3 className="text-lg font-extrabold text-neutral-900">
              Tab Switch / Minimization Detected!
            </h3>
            <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
              Switching tabs, minimizing the browser window, or opening other applications is strictly prohibited. If you switch tabs <span className="font-bold text-red-600">3 times</span>, your assessment will be immediately terminated and submitted.
            </p>

            <button
              onClick={() => setShowViolationModal(false)}
              className="mt-6 w-full rounded-xl bg-neutral-900 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
            >
              I Understand — Return to Assessment
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 1: SETUP & CONFIGURATION                            */}
      {/* ========================================================= */}
      {stage === "setup" && (
        <div className="rounded-2xl border border-neutral-300/80 bg-white shadow-sm overflow-hidden divide-y divide-neutral-200">
          {/* Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-3">
              <span>Adaptive Diagnostic Assessment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              100-Mark Placement Assessment
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-emerald-100 max-w-2xl">
              Targeted for {company?.name} ({role}). Gemini AI will dynamically generate customized screening questions to test your proficiency and identify misconceptions.
            </p>
          </div>

          {/* Configuration Form */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Topic Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Select Focus Topic
                </label>
                {weakestArea && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Detected Weakest Area: {weakestArea}
                  </span>
                )}
              </div>

              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-medium focus:border-emerald-600 focus:outline-none"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} {cat === weakestArea ? "(Recommended: Weakest Area)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 3 Difficulty Tiers (Marks out of 100) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
                Choose Difficulty Tier (Total: 100 Marks)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Easy Tier */}
                <div
                  onClick={() => setDifficulty("Easy")}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    difficulty === "Easy"
                      ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600 shadow-xs"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Level 1: Easy
                    </span>
                    <span className="text-xs font-extrabold text-neutral-900">100 Marks</span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900">Core Foundations</h4>
                  <p className="mt-1 text-xs text-neutral-600">
                    10 Questions · 10 Marks each · 15 Mins. Tests core definitions, patterns, and base complexity.
                  </p>
                </div>

                {/* Medium Tier */}
                <div
                  onClick={() => setDifficulty("Medium")}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    difficulty === "Medium"
                      ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600 shadow-xs"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Level 2: Medium
                    </span>
                    <span className="text-xs font-extrabold text-neutral-900">100 Marks</span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900">Interview Standard</h4>
                  <p className="mt-1 text-xs text-neutral-600">
                    10 Questions · 10 Marks each · 15 Mins. Standard interview questions, code tracing, and edge cases.
                  </p>
                </div>

                {/* Hard Tier */}
                <div
                  onClick={() => setDifficulty("Hard")}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    difficulty === "Hard"
                      ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600 shadow-xs"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                      Level 3: Hard
                    </span>
                    <span className="text-xs font-extrabold text-neutral-900">100 Marks</span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-900">Bar-Raiser Challenges</h4>
                  <p className="mt-1 text-xs text-neutral-600">
                    5 Questions · 20 Marks each · 25 Mins. Deep optimization, multi-concept problems, and tradeoffs.
                  </p>
                </div>
              </div>
            </div>

            {/* Proctoring Rules Notice */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-700">
              <span className="font-bold text-neutral-900 block mb-1">
                Proctoring & Assessment Integrity Rules:
              </span>
              <ul className="list-disc pl-4 space-y-1 text-neutral-600">
                <li><span className="font-semibold text-neutral-800">Mandatory Fullscreen:</span> The test launches in full-screen mode. Exiting fullscreen will lock the assessment.</li>
                <li><span className="font-semibold text-neutral-800">No Tab Switching:</span> Switching tabs or minimizing the window will trigger warnings. 3 strikes will result in automatic submission.</li>
                <li><span className="font-semibold text-neutral-800">No AI Assistant:</span> The floating PrepAI assistant and navigation links are disabled during the exam.</li>
                <li><span className="font-semibold text-neutral-800">Anti-Copy:</span> Question text copying and context menus are disabled.</li>
              </ul>
            </div>

            {/* Launch Button */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-neutral-500">
                Generated dynamically with Gemini 3.1 Flash for {company?.name}.
              </div>

              <button
                onClick={handleStartTest}
                className="rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition-all active:scale-[0.99]"
              >
                Enter Fullscreen & Start Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 2: LOADING SKELETON                                 */}
      {/* ========================================================= */}
      {stage === "loading" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 mb-4 animate-bounce">
            AI
          </div>
          <h2 className="text-xl font-bold text-neutral-900">
            Formulating Your {difficulty} Assessment...
          </h2>
          <p className="mt-2 text-xs text-neutral-600 max-w-md mx-auto">
            Gemini is creating a targeted 100-mark test on <span className="font-semibold text-neutral-900">{selectedTopic}</span> modeled after {company?.name}'s screening rounds.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent"></div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 3: ACTIVE PROCTORED TEST RUNNER                     */}
      {/* ========================================================= */}
      {stage === "testing" && testData && (
        <div
          onCopy={(e) => {
            e.preventDefault();
            alert("Copying questions is strictly prohibited during the proctored assessment.");
          }}
          onContextMenu={(e) => e.preventDefault()}
          className="rounded-2xl border border-neutral-300 bg-white shadow-sm overflow-hidden select-none"
        >
          {/* Header Bar with Live Countdown Timer & Violation Tracker */}
          <div className="border-b border-neutral-200 bg-neutral-900 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  {removeEmoji(testData.title)}
                </span>
                <span className="text-xs text-neutral-300">
                  Question {currentQIndex + 1} of {testData.questions.length}
                </span>
              </div>

              {violationsCount > 0 && (
                <span className="rounded-full bg-rose-900/80 border border-rose-700 px-2.5 py-0.5 text-[10px] font-bold text-rose-300">
                  Strikes: {violationsCount}/3
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl px-3.5 py-1.5 font-mono text-sm font-bold border ${
                  timeLeft < 180
                    ? "bg-rose-950 text-rose-300 border-rose-700 animate-pulse"
                    : "bg-neutral-800 text-emerald-400 border-neutral-700"
                }`}
              >
                Time: {formatTime(timeLeft)}
              </div>

              <button
                onClick={handleSubmitTest}
                className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 transition-colors"
              >
                Submit Test
              </button>
            </div>
          </div>

          {/* Active Question Box */}
          {(() => {
            const q = testData.questions[currentQIndex];
            const selectedOption = userAnswers[q.id];

            return (
              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-1 text-xs font-bold">
                    Question {currentQIndex + 1} · {removeEmoji(q.subtopic || testData.topic)}
                  </span>
                  <span className="text-xs font-extrabold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-md">
                    +{q.marks} Marks
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                  {removeEmoji(q.question)}
                </h3>

                {/* Code Snippet Box */}
                {q.codeSnippet && q.codeSnippet.trim() !== "" && (
                  <pre className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-emerald-300 overflow-x-auto select-none">
                    <code>{q.codeSnippet}</code>
                  </pre>
                )}

                {/* 4 Radio Options */}
                <div className="space-y-3 pt-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedOption === oIdx;

                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(q.id, oIdx)}
                        className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-neutral-300 text-neutral-400"
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-neutral-800 leading-normal">
                          {removeEmoji(opt)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Navigation */}
                <div className="pt-6 border-t border-neutral-200 flex items-center justify-between">
                  <button
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex((prev) => prev - 1)}
                    className="rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {/* Question Stepper Grid */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {testData.questions.map((item, idx) => {
                      const answered = userAnswers[item.id] !== undefined;
                      const active = idx === currentQIndex;

                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrentQIndex(idx)}
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                            active
                              ? "bg-neutral-900 text-white"
                              : answered
                              ? "bg-emerald-600 text-white"
                              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {currentQIndex < testData.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQIndex((prev) => prev + 1)}
                      className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitTest}
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                    >
                      Finish & Score
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 4: EVALUATING                                       */}
      {/* ========================================================= */}
      {stage === "evaluating" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 mb-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900">
            Grading Your Assessment & Analyzing Misconceptions...
          </h2>
          <p className="mt-2 text-xs text-neutral-500">
            Computing total score out of 100 marks and formulating your improvement suggestions.
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 5: DIAGNOSTIC RESULTS & SCORECARD                   */}
      {/* ========================================================= */}
      {stage === "result" && evaluation && (
        <div className="space-y-6">
          {autoSubmittedReason && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-bold text-rose-800">
              {autoSubmittedReason}
            </div>
          )}

          {/* Main Scorecard Header */}
          <div className="rounded-2xl border border-neutral-300 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-neutral-200 pb-6">
              <div>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/60 mb-2 inline-block">
                  Diagnostic Results · {selectedTopic}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                  {company?.name} Assessment Scorecard
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-neutral-600">
                  Difficulty: <span className="font-semibold">{difficulty}</span> · Role: <span className="font-semibold">{role}</span>
                </p>
              </div>

              {/* Big Marks Dial */}
              <div className="flex items-center gap-4 rounded-2xl bg-neutral-50 p-5 border border-neutral-200/80 shrink-0">
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Total Marks
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-neutral-900">
                    <span
                      className={
                        evaluation.score >= 80
                          ? "text-emerald-700"
                          : evaluation.score >= 60
                          ? "text-amber-600"
                          : "text-rose-600"
                      }
                    >
                      {evaluation.score}
                    </span>
                    <span className="text-base text-neutral-400 font-normal"> / {evaluation.totalMarks}</span>
                  </div>
                </div>

                <div className="h-10 w-px bg-neutral-200"></div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Readiness
                  </span>
                  <span
                    className={`text-xs font-bold block mt-1 ${
                      evaluation.percent >= 80
                        ? "text-emerald-700"
                        : evaluation.percent >= 60
                        ? "text-amber-700"
                        : "text-rose-700"
                    }`}
                  >
                    {removeEmoji(evaluation.readinessLevel)}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Diagnostic Analysis */}
            <div className="mt-6 pt-2">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-bold text-neutral-900">
                  AI Evaluation & Improvement Roadmap
                </h3>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 text-xs text-neutral-700">
                <MarkdownContent text={evaluation.aiFeedback} />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  to={`/prep/${companyId}/${encodeURIComponent(role)}/sheet?category=${encodeURIComponent(selectedTopic)}`}
                  className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  Practice {selectedTopic} Curated Sheet
                </Link>

                <button
                  onClick={() => setStage("setup")}
                  className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Retake or Try Another Tier
                </button>

                <Link
                  to={`/prep/${companyId}/${encodeURIComponent(role)}`}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 underline ml-auto"
                >
                  Back to Preparation Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Question-by-Question Detailed Review */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="text-base font-bold text-neutral-900 mb-4">
              Detailed Question Analysis ({evaluation.results.filter((r) => r.isCorrect).length} Correct / {evaluation.results.length} Total)
            </h2>

            <div className="space-y-4">
              {evaluation.results.map((r, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 text-xs transition-all ${
                    r.isCorrect
                      ? "border-emerald-200 bg-emerald-50/20"
                      : "border-rose-200 bg-rose-50/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-neutral-800">
                      {idx + 1}. {removeEmoji(r.subtopic || selectedTopic)}
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        r.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {r.isCorrect ? `+${r.marks} Marks` : "0 Marks"}
                    </span>
                  </div>

                  <p className="font-semibold text-neutral-900 mb-3">{removeEmoji(r.question)}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        r.isCorrect
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : "bg-rose-50 border-rose-300 text-rose-900"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-neutral-500">
                        Your Answer
                      </span>
                      <span className="font-medium">{removeEmoji(r.selectedOption)}</span>
                    </div>

                    {!r.isCorrect && (
                      <div className="p-2.5 rounded-lg border bg-emerald-50 border-emerald-300 text-emerald-900">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-700">
                          Correct Answer
                        </span>
                        <span className="font-medium">{removeEmoji(r.correctOption)}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-white border border-neutral-200/80 p-3 text-neutral-600">
                    <span className="font-bold text-neutral-800 block mb-0.5">Solution Explanation:</span>
                    <MarkdownContent text={r.explanation} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
