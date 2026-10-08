import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/client";
import MarkdownContent from "../components/MarkdownContent";
import splitStudyPlan from "../utils/splitStudyPlan";

export default function StudyPlan() {
  const { companyId, role } = useParams();
  const [company, setCompany] = useState(null);
  const [plan, setPlan] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlan() {
      try {
        setLoading(true);
        // Try to fetch existing saved plan
        const res = await API.get(`/prep/${companyId}/${encodeURIComponent(role)}/plan`);
        setCompany(res.data.company);
        if (res.data.plan) {
          setPlan(res.data.plan);
          setSavedAt(res.data.savedAt);
        } else {
          // If no plan generated yet, generate one automatically
          await handleGeneratePlan();
        }
      } catch (err) {
        setError("Could not load study plan.");
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, [companyId, role]);

  async function handleGeneratePlan() {
    setGenerating(true);
    setError("");
    try {
      const res = await API.post(`/prep/${companyId}/${encodeURIComponent(role)}/plan`);
      setCompany(res.data.company);
      setPlan(res.data.plan);
      setSavedAt(res.data.savedAt || new Date().toISOString());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate AI plan with Gemini.");
    } finally {
      setGenerating(false);
    }
  }

  // Split only at the start of a day heading, so Markdown formatting and intro text survive.
  function renderPlanContent(text) {
    if (!text) return null;

    const { intro, days } = splitStudyPlan(text);

    if (days.length) {
      return (
        <div className="space-y-4">
          {intro && <MarkdownContent text={intro} className="text-sm text-neutral-700" />}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {days.map((day, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                    D{day.number}
                  </span>
                  <MarkdownContent text={day.heading} className="text-sm font-bold text-neutral-900" />
                </div>
                <MarkdownContent text={day.lines.join("\n").trim()} className="text-xs text-neutral-600" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
        <MarkdownContent text={text} className="text-sm text-neutral-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-500">
        <Link to="/companies" className="hover:text-emerald-700">Companies</Link>
        <span>/</span>
        <Link to={`/companies/${companyId}`} className="hover:text-emerald-700">{company?.name || companyId}</Link>
        <span>/</span>
        <Link to={`/prep/${companyId}/${encodeURIComponent(role)}`} className="hover:text-emerald-700">{role}</Link>
        <span>/</span>
        <span className="font-semibold text-neutral-900">Gemini AI Study Plan</span>
      </nav>

      {/* Header Banner */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 mb-3 border border-emerald-200/60">
              <span>Powered by Gemini AI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              Personalized 7-Day Study Plan
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Targeted for {company?.name || companyId} ({role}), prioritizing your weakest categories.
            </p>
            {savedAt && (
              <p className="mt-2 text-xs text-neutral-400">
                Last updated: {new Date(savedAt).toLocaleDateString()} at{" "}
                {new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Generating with Gemini...</span>
                </>
              ) : (
                <>
                  <span>Regenerate AI Plan</span>
                </>
              )}
            </button>

            <Link
              to={`/prep/${companyId}/${encodeURIComponent(role)}/sheet`}
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Go to Question Sheet
            </Link>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="mb-8 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {!loading && plan && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">Your 7-Day Sprint Roadmap</h2>
            <span className="text-xs text-neutral-500 font-medium">Daily Focus Topics & Practice Goals</span>
          </div>

          {renderPlanContent(plan)}
        </div>
      )}
    </div>
  );
}
