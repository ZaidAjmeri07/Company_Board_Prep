import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import API from "../api/client";

export default function QuestionSheet() {
  const { companyId, role } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [company, setCompany] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categoryFilter = searchParams.get("category") || "All";
  const difficultyFilter = searchParams.get("difficulty") || "All";
  const platformFilter = searchParams.get("platform") || "All";
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (categoryFilter !== "All") queryParams.append("category", categoryFilter);
        if (difficultyFilter !== "All") queryParams.append("difficulty", difficultyFilter);
        if (platformFilter !== "All") queryParams.append("platform", platformFilter);

        const res = await API.get(
          `/prep/${companyId}/${encodeURIComponent(role)}/sheet?${queryParams.toString()}`
        );
        setCompany(res.data.company);
        setQuestions(res.data.questions || []);
        if (res.data.availableCategories) setAvailableCategories(res.data.availableCategories);
        if (res.data.availablePlatforms) setAvailablePlatforms(res.data.availablePlatforms);
      } catch (err) {
        setError("Failed to load question sheet.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [companyId, role, categoryFilter, difficultyFilter, platformFilter]);

  async function handleToggleSolved(questionId) {
    // Optimistic UI update
    setQuestions((prev) =>
      prev.map((q) =>
        q._id === questionId ? { ...q, isSolved: !q.isSolved } : q
      )
    );

    try {
      await API.post("/progress/toggle", { questionId });
    } catch (err) {
      console.error("Failed to toggle status", err);
      // Revert on error
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === questionId ? { ...q, isSolved: !q.isSolved } : q
        )
      );
    }
  }

  function handleFilterChange(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === "All") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  }

  function clearAllFilters() {
    setSearchParams({});
    setSearch("");
  }

  const filteredQuestions = questions.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  const solvedCount = questions.filter((q) => q.isSolved).length;
  const totalCount = questions.length;
  const percent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  const difficultyColors = {
    Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Hard: "bg-rose-50 text-rose-700 border-rose-200",
  };

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
        <span className="font-semibold text-neutral-900">Question Sheet</span>
      </nav>

      {/* Header Banner */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                Curated Practice Sheet
              </span>
              <span className="text-xs text-neutral-500">Frequently Asked Problems</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              {company?.name || companyId} · {role}
            </h1>
          </div>

          {/* Quick Progress Bar */}
          <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-200 min-w-[240px]">
            <div className="flex justify-between text-xs font-semibold text-neutral-700 mb-1.5">
              <span>Solved: {solvedCount} / {totalCount}</span>
              <span className="text-emerald-700 font-bold">{percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
              Search Problem
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Two Sum, ACID..."
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
            >
              <option value="All">All Categories ({availableCategories.length})</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
              Difficulty
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) => handleFilterChange("difficulty", e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-neutral-500 mb-1">
              Platform
            </label>
            <select
              value={platformFilter}
              onChange={(e) => handleFilterChange("platform", e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
            >
              <option value="All">All Platforms</option>
              {availablePlatforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {(categoryFilter !== "All" || difficultyFilter !== "All" || platformFilter !== "All" || search) && (
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              Showing {filteredQuestions.length} of {questions.length} questions
            </span>
            <button
              onClick={clearAllFilters}
              className="font-semibold text-emerald-700 hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Questions List */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q._id}
              className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-all ${
                q.isSolved
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Solved Checkbox */}
                <input
                  type="checkbox"
                  checked={q.isSolved}
                  onChange={() => handleToggleSolved(q._id)}
                  className="h-5 w-5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  title="Mark as solved"
                />

                <span className="text-xs font-semibold text-neutral-400 w-5">
                  {idx + 1}.
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <a
                      href={q.url || "#"}
                      target={q.url ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className={`text-sm font-semibold truncate hover:text-emerald-700 hover:underline ${
                        q.isSolved ? "text-neutral-600 line-through decoration-neutral-400" : "text-neutral-900"
                      }`}
                    >
                      {q.title}
                    </a>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                      {q.category}
                    </span>

                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                        difficultyColors[q.difficulty] || "bg-neutral-50 text-neutral-600 border-neutral-200"
                      }`}
                    >
                      {q.difficulty}
                    </span>

                    <span className="rounded-md bg-neutral-50 border border-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                      {q.platform}
                    </span>

                    <span className="text-[10px] uppercase font-semibold text-neutral-400">
                      {q.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Action Badge */}
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => handleToggleSolved(q._id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    q.isSolved
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {q.isSolved ? "Solved" : "Mark Solved"}
                </button>
              </div>
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-neutral-300 bg-white">
              <p className="text-neutral-500 text-sm">
                No questions match the current filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-3 text-xs font-semibold text-emerald-700 underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
