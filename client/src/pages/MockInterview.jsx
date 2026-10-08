import React, { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/client";
import MarkdownContent from "../components/MarkdownContent";
import removeEmoji from "../utils/removeEmoji";

export default function MockInterview() {
  const { companyId, role } = useParams();

  const [company, setCompany] = useState(null);
  const [weakestArea, setWeakestArea] = useState("");
  const [stage, setStage] = useState("setup"); // 'setup' | 'loading' | 'interview' | 'evaluating' | 'result'
  const [interviewData, setInterviewData] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState("");

  const timerRef = useRef(null);

  // Proctoring States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationsCount, setViolationsCount] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);

  // Load Company & Candidate Meta
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await API.get(`/prep/${companyId}/${encodeURIComponent(role)}/dashboard`);
        setCompany(res.data.company);
        setWeakestArea(res.data.stats?.weakestArea || "System Architecture & Algorithms");
      } catch (err) {
        setError("Could not load candidate preparation data.");
      }
    }
    loadMeta();
  }, [companyId, role]);

  // Broadcast exam mode to hide Navbar links & Floating AI Bot
  useEffect(() => {
    const isExamActive = stage === "interview";
    window.dispatchEvent(new CustomEvent("exam-mode", { detail: { active: isExamActive } }));
    return () => {
      window.dispatchEvent(new CustomEvent("exam-mode", { detail: { active: false } }));
    };
  }, [stage]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Fullscreen monitor
  useEffect(() => {
    if (stage !== "interview") return;

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
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [stage]);

  // Tab switch monitoring
  useEffect(() => {
    if (stage !== "interview") return;

    function handleVisibilityChange() {
      if (document.hidden) {
        setViolationsCount((prev) => {
          const nextCount = prev + 1;
          if (nextCount >= 3) {
            handleFinishInterview();
          } else {
            setShowViolationModal(true);
          }
          return nextCount;
        });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [stage]);

  // Per-Question Countdown Timer
  useEffect(() => {
    if (stage === "interview" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [stage, timeLeft, currentQIndex]);

  // Text-To-Speech: Speak Question Aloud
  function speakQuestion(text) {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(removeEmoji(text));
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeakingQuestion(true);
    utterance.onend = () => setIsSpeakingQuestion(false);
    utterance.onerror = () => setIsSpeakingQuestion(false);

    window.speechSynthesis.speak(utterance);
  }

  async function requestFullscreenMode() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      setIsFullscreen(true);
    }
  }

  function exitFullscreenMode() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (err) {}
    setIsFullscreen(false);
  }

  async function handleStartInterview() {
    setStage("loading");
    setError("");

    try {
      const res = await API.post(`/prep/${companyId}/${encodeURIComponent(role)}/interview/start`, {
        weakestArea,
      });

      const interview = res.data.interview;
      setInterviewData(interview);
      setCurrentQIndex(0);
      setAnswers({});
      setCurrentAnswer("");
      setViolationsCount(0);
      setTimeLeft(interview.questions[0]?.timeLimitSeconds || 120);

      await requestFullscreenMode();
      setStage("interview");

      // Auto-speak Question 1
      setTimeout(() => {
        speakQuestion(interview.questions[0]?.question);
      }, 500);
    } catch (err) {
      setError("Failed to initialize AI interview. Please try again.");
      setStage("setup");
    }
  }

  function handleNextQuestion() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    // Save candidate's response for current question
    const q = interviewData.questions[currentQIndex];
    setAnswers((prev) => ({
      ...prev,
      [q.id]: currentAnswer.trim(),
    }));

    if (currentQIndex < interviewData.questions.length - 1) {
      const nextIndex = currentQIndex + 1;
      const nextQ = interviewData.questions[nextIndex];
      setCurrentQIndex(nextIndex);
      setCurrentAnswer("");
      setTimeLeft(nextQ.timeLimitSeconds || 120);

      setTimeout(() => {
        speakQuestion(nextQ.question);
      }, 400);
    } else {
      // Finished all 5 questions
      handleFinishInterview();
    }
  }

  async function handleFinishInterview() {
    clearInterval(timerRef.current);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    exitFullscreenMode();
    setStage("evaluating");

    // Gather final answers including current typed answer
    const currentQ = interviewData?.questions[currentQIndex];
    const finalAnswers = {
      ...answers,
      ...(currentQ ? { [currentQ.id]: currentAnswer.trim() } : {}),
    };

    try {
      const res = await API.post(`/prep/${companyId}/${encodeURIComponent(role)}/interview/evaluate`, {
        questions: interviewData.questions,
        answers: finalAnswers,
      });

      setEvaluation(res.data.evaluation);
      setStage("result");
    } catch (err) {
      setError("Evaluation failed. Displaying simulated assessment report.");
      setStage("result");
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* ========================================================= */}
      {/* PROCTORING OVERLAY: FULLSCREEN GATEKEEPER                 */}
      {/* ========================================================= */}
      {stage === "interview" && !isFullscreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg animate-in fade-in duration-200">
          <div className="max-w-md rounded-2xl border border-red-500/50 bg-neutral-900 p-6 sm:p-8 text-center text-white shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 text-2xl mb-4 font-bold">
              !
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Fullscreen Interview Mode Required
            </h2>
            <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
              Real corporate interviews require complete presence. You have exited fullscreen mode. Please restore fullscreen to continue your interview.
            </p>

            <button
              onClick={requestFullscreenMode}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-[0.99]"
            >
              Resume Fullscreen Interview
            </button>
          </div>
        </div>
      )}

      {/* PROCTORING OVERLAY: TAB SWITCH WARNING */}
      {stage === "interview" && showViolationModal && violationsCount < 3 && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-md rounded-2xl border-2 border-red-600 bg-white p-6 sm:p-8 text-center text-neutral-900 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700 text-xl font-black mb-3">
              !
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 uppercase tracking-wider inline-block mb-2">
              Proctoring Strike {violationsCount} of 3
            </span>
            <h3 className="text-lg font-extrabold text-neutral-900">
              Tab Switch / Minimization Detected!
            </h3>
            <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
              Switching tabs during an active technical interview is prohibited. Reaching 3 strikes will conclude and submit your interview automatically.
            </p>

            <button
              onClick={() => setShowViolationModal(false)}
              className="mt-6 w-full rounded-xl bg-neutral-900 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
            >
              I Understand — Return to Interview
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 1: BRIEFING                                         */}
      {/* ========================================================= */}
      {stage === "setup" && (
        <div className="rounded-2xl border border-neutral-300 bg-white shadow-sm overflow-hidden divide-y divide-neutral-200">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-900 via-neutral-900 to-teal-950 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-3">
              <span>Real AI Mock Interview Simulator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {company?.name} Technical Interview
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-emerald-100 max-w-2xl">
              Role: <span className="font-semibold text-white">{role}</span> · Evaluated by Gemini AI based on actual {company?.name} hiring rubrics.
            </p>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Instructions */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                1. How It Works
              </h3>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5 space-y-3 text-xs text-neutral-700">
                <p>
                  The AI interviewer will present <strong>5 questions</strong>, one at a time, and read each question aloud.
                </p>
                <p>
                  <strong>Type your answer</strong> into the response box for each question. Your answer is sent to Gemini AI for scoring once the interview is submitted.
                </p>
                <p>
                  You will receive an overall interview score plus a question-by-question breakdown, including an ideal model answer for study.
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-800">
                <span className="font-bold">Note:</span>
                <span>
                  This interview runs in fullscreen. Switching tabs or exiting fullscreen is treated as a proctoring strike and may end your interview early.
                </span>
              </div>
            </div>

            {/* Interview Format Details */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  2. Interview Structure & Rules
                </h3>

                <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 text-xs text-neutral-700">
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-emerald-700">Q1.</span>
                    <span><strong>Elevator Pitch:</strong> Resume walkthrough and why {company?.name}.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-emerald-700">Q2.</span>
                    <span><strong>Core Technical Competency:</strong> Architecture and coding principles.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-emerald-700">Q3.</span>
                    <span><strong>Deep Dive & Edge Cases:</strong> Scalability and trade-offs.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-emerald-700">Q4.</span>
                    <span><strong>Behavioral Question:</strong> Evaluated using the STAR method.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-emerald-700">Q5.</span>
                    <span><strong>Company Culture Alignment:</strong> {company?.name} leadership values.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartInterview}
                className="w-full rounded-xl bg-emerald-700 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Enter Fullscreen & Join Interview Room</span>
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 mb-4 text-sm font-bold">
            AI
          </div>
          <h2 className="text-xl font-bold text-neutral-900">
            Connecting to Your AI Interview Room...
          </h2>
          <p className="mt-2 text-xs text-neutral-600 max-w-md mx-auto">
            Gemini is preparing your 5-stage customized interview for <span className="font-semibold text-neutral-900">{company?.name}</span> ({role}).
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent"></div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 3: LIVE PROCTORED INTERVIEW STUDIO                  */}
      {/* ========================================================= */}
      {stage === "interview" && interviewData && (
        <div className="space-y-4">
          {/* Top Bar: Progress and Urgency Countdown Timer */}
          <div className="rounded-2xl bg-neutral-900 px-6 py-4 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-red-500 animate-ping"></span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                  {removeEmoji(interviewData.interviewerTitle)}
                </span>
                <span className="text-xs text-neutral-300">
                  Question {currentQIndex + 1} of {interviewData.questions.length} · {removeEmoji(interviewData.questions[currentQIndex]?.type)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`rounded-xl px-4 py-1.5 font-mono text-sm font-bold border ${
                timeLeft < 30
                  ? "bg-rose-950 text-rose-300 border-rose-700 animate-pulse"
                  : "bg-neutral-800 text-emerald-400 border-neutral-700"
              }`}>
                Time: {formatTime(timeLeft)}
              </div>

              <button
                onClick={handleFinishInterview}
                className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700"
              >
                End Early
              </button>
            </div>
          </div>

          {/* Split-Screen Studio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: AI Interviewer Persona & Question Card */}
            <div className="rounded-2xl border border-neutral-300 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                {/* Interviewer Avatar */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-lg">
                      AI
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">
                        {removeEmoji(interviewData.interviewerTitle)}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <span className={`h-1.5 w-1.5 rounded-full ${isSpeakingQuestion ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`}></span>
                        <span>{isSpeakingQuestion ? "Reading Question Aloud..." : "Waiting for Your Answer..."}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => speakQuestion(interviewData.questions[currentQIndex]?.question)}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 flex items-center gap-1"
                    title="Replay Audio"
                  >
                    <span>Replay audio</span>
                  </button>
                </div>

                {/* Question Statement */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-5 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                    Question {currentQIndex + 1}
                  </span>
                  <p className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                    {removeEmoji(interviewData.questions[currentQIndex]?.question)}
                  </p>
                </div>

                <div className="text-xs text-neutral-500">
                  <span className="font-semibold text-neutral-700">Evaluation Focus:</span>{" "}
                  {removeEmoji(interviewData.questions[currentQIndex]?.focusArea)}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-neutral-200 flex items-center justify-end mt-6">
                <button
                  onClick={handleNextQuestion}
                  className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  {currentQIndex < interviewData.questions.length - 1
                    ? "Submit Answer — Next Question"
                    : "Finish Interview & Evaluate"}
                </button>
              </div>
            </div>

            {/* Right: Typed Answer Box */}
            <div className="flex flex-col">
              <div className="rounded-2xl border border-neutral-300 bg-white p-4 shadow-xs flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Your Typed Answer
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {currentAnswer.trim().length} characters
                  </span>
                </div>

                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer to the question here. Be clear and structured — the AI scores technical accuracy, structure (STAR), communication, and company alignment."
                  className="w-full flex-1 min-h-[260px] rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 text-sm text-neutral-800 focus:border-emerald-600 focus:outline-none resize-none leading-relaxed"
                  autoFocus
                />

                <p className="mt-2 text-[10px] text-neutral-400">
                  Tip: press "Submit Answer" to save this response and move on. Your answers are evaluated only after the final question.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 4: EVALUATING TRANSCRIPTS                           */}
      {/* ========================================================= */}
      {stage === "evaluating" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 mb-4">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900">
            Hiring Committee is Reviewing Your Interview...
          </h2>
          <p className="mt-2 text-xs text-neutral-500 max-w-md mx-auto">
            Gemini AI is analyzing your technical accuracy, STAR framework structure, communication clarity, and {company?.name} cultural alignment.
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 5: POST-INTERVIEW DIAGNOSTIC SCORECARD              */}
      {/* ========================================================= */}
      {stage === "result" && evaluation && (
        <div className="space-y-6">
          {/* Main Decision Header */}
          <div className="rounded-2xl border border-neutral-300 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-neutral-200 pb-6">
              <div>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/60 mb-2 inline-block">
                  {company?.name} Candidate Scorecard
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
                  {role} Interview Evaluation
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-neutral-600">
                  Evaluated across Technical Depth, STAR Framework, Communication, and {company?.name} Values.
                </p>
              </div>

              {/* Big Score Dial */}
              <div className="flex items-center gap-4 rounded-2xl bg-neutral-50 p-5 border border-neutral-200/80 shrink-0">
                <div className="text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Interview Score
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-neutral-900">
                    <span className={evaluation.overallScore >= 80 ? "text-emerald-700" : evaluation.overallScore >= 65 ? "text-amber-600" : "text-rose-600"}>
                      {evaluation.overallScore}
                    </span>
                    <span className="text-base text-neutral-400 font-normal"> / 100</span>
                  </div>
                </div>

                <div className="h-10 w-px bg-neutral-200"></div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Hiring Verdict
                  </span>
                  <span className={`text-xs font-bold block mt-1 ${
                    evaluation.overallScore >= 80 ? "text-emerald-700" : evaluation.overallScore >= 65 ? "text-amber-700" : "text-rose-700"
                  }`}>
                    {removeEmoji(evaluation.hiringVerdict)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Dimension Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-neutral-200">
              <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-200">
                <span className="text-[11px] font-semibold text-neutral-500 block">Technical Depth</span>
                <div className="text-lg font-black text-neutral-900 mt-1">
                  {evaluation.categoryScores?.technical} <span className="text-xs text-neutral-400 font-normal">/ {evaluation.categoryScores?.technicalMax}</span>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-200">
                <span className="text-[11px] font-semibold text-neutral-500 block">STAR Framework</span>
                <div className="text-lg font-black text-neutral-900 mt-1">
                  {evaluation.categoryScores?.structure} <span className="text-xs text-neutral-400 font-normal">/ {evaluation.categoryScores?.structureMax}</span>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-200">
                <span className="text-[11px] font-semibold text-neutral-500 block">Communication</span>
                <div className="text-lg font-black text-neutral-900 mt-1">
                  {evaluation.categoryScores?.communication} <span className="text-xs text-neutral-400 font-normal">/ {evaluation.categoryScores?.communicationMax}</span>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-200">
                <span className="text-[11px] font-semibold text-neutral-500 block">{company?.name} Culture</span>
                <div className="text-lg font-black text-neutral-900 mt-1">
                  {evaluation.categoryScores?.culture} <span className="text-xs text-neutral-400 font-normal">/ {evaluation.categoryScores?.cultureMax}</span>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="pt-6">
              <h3 className="text-sm font-bold text-neutral-900 mb-2">Executive Committee Summary</h3>
              <div className="text-xs text-neutral-700 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <MarkdownContent text={evaluation.executiveSummary} />
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <h4 className="text-xs font-bold text-emerald-900 mb-2">Key Strengths Demonstrated</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-emerald-800">
                    {evaluation.topStrengths?.map((str, sIdx) => (
                      <li key={sIdx}><MarkdownContent text={str} /></li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <h4 className="text-xs font-bold text-amber-900 mb-2">Areas Needing Polish</h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-amber-800">
                    {evaluation.criticalImprovements?.map((imp, iIdx) => (
                      <li key={iIdx}><MarkdownContent text={imp} /></li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setStage("setup")}
                  className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  Retake Mock Interview
                </button>

                <Link
                  to={`/prep/${companyId}/${encodeURIComponent(role)}/sheet`}
                  className="rounded-xl border border-neutral-300 bg-white px-5 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Practice Question Sheet
                </Link>

                <Link
                  to={`/prep/${companyId}/${encodeURIComponent(role)}`}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 underline ml-auto"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Question-by-Question Deep Dive & 10/10 Model Answers */}
          <div className="rounded-2xl border border-neutral-300 bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="text-base font-bold text-neutral-900 mb-4">
              Question-by-Question Analysis & 10/10 Model Answers
            </h2>

            <div className="space-y-6">
              {interviewData?.questions.map((q, idx) => {
                const feedback = evaluation.questionFeedback?.find((f) => f.id === q.id) || {};
                const candidateAnswer = answers[q.id] || "No answer recorded.";

                return (
                  <div key={q.id} className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 space-y-3.5 text-xs">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                      <span className="font-bold text-neutral-900 text-sm">
                        Q{idx + 1}: {removeEmoji(q.type)}
                      </span>
                      <span className="font-bold text-neutral-700 bg-white border border-neutral-200 px-2 py-0.5 rounded-md">
                        Score: {feedback.score || 15} / {feedback.maxScore || 20}
                      </span>
                    </div>

                    <p className="font-semibold text-neutral-900">{removeEmoji(q.question)}</p>

                    {/* Typed Response */}
                    <div className="rounded-lg bg-white border border-neutral-200 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                        Your Answer:
                      </span>
                      <p className="text-neutral-700 italic">"{candidateAnswer}"</p>
                    </div>

                    {/* Feedback */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <span className="font-bold text-emerald-900 block mb-1">What Went Well:</span>
                        <MarkdownContent text={feedback.whatWentWell} className="text-emerald-800" />
                      </div>

                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <span className="font-bold text-amber-900 block mb-1">Missing Elements / Polish:</span>
                        <MarkdownContent text={feedback.whatWasMissing} className="text-amber-800" />
                      </div>
                    </div>

                    {/* 10/10 Ideal Model Answer */}
                    <div className="rounded-xl border border-emerald-200 bg-white p-4">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <span>Ideal 10/10 Model Answer (For Study):</span>
                      </span>
                      <MarkdownContent text={feedback.idealModelAnswer} className="text-neutral-800 font-serif" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
