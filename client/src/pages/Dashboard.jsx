import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/client";

export default function Dashboard() {
  const { companyId, role } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await API.get(
          `/prep/${companyId}/${encodeURIComponent(role)}/dashboard`
        );
        setData(res.data);
      } catch (err) {
        setError("Could not load preparation dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [companyId, role]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="text-xs font-medium text-neutral-500">Loading preparation metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="text-red-600 font-semibold">{error || "Data not found."}</p>
        <Link
          to="/companies"
          className="mt-4 inline-block text-xs font-semibold text-emerald-700 underline"
        >
          Back to Companies
        </Link>
      </div>
    );
  }

  const { company, stats } = data;
  const { total, solved, percent, categories, weakestArea } = stats;

  // Sort categories descending by percent (mastered at top, weakest at bottom)
  const sortedCategories = [...(categories || [])].sort((a, b) => b.percent - a.percent);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-500">
        <Link to="/companies" className="hover:text-emerald-700">Companies</Link>
        <span>/</span>
        <Link to={`/companies/${company.slug || companyId}`} className="hover:text-emerald-700">
          {company.name}
        </Link>
        <span>/</span>
        <span className="font-semibold text-neutral-800">{role}</span>
      </nav>

      {/* Unified Preparation Board Card */}
      <div className="rounded-2xl border border-neutral-300/80 bg-white shadow-sm overflow-hidden divide-y divide-neutral-200">
        
        {/* Section 1: Target & Overall Progress */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              {company.name} <span className="text-neutral-400 font-normal">—</span> {role}
            </h1>
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
              Target Track
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Preparation Progress
              </span>
              <span className="text-base font-extrabold text-neutral-900">
                {percent}%
              </span>
            </div>

            {/* Overall Progress Meter */}
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-neutral-100 p-0.5 border border-neutral-200/80">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500 shadow-xs"
                style={{ width: `${percent}%` }}
              ></div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500 font-medium">
              <span>{solved} / {total} Questions Solved</span>
              <span>{total - solved} Remaining</span>
            </div>
          </div>
        </div>

        {/* Section 2: Your Topics Breakdown */}
        <div className="p-6 sm:p-8 bg-neutral-50/40">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
              Your Topics
            </h2>
            <span className="text-xs text-neutral-400 font-medium">
              Mastery by Category
            </span>
          </div>

          <div className="space-y-3.5">
            {sortedCategories.map((cat) => {
              const isWeakest = cat.name === weakestArea;

              return (
                <div key={cat.name} className="flex items-center gap-3 sm:gap-4 text-xs">
                  {/* Category Name */}
                  <div className="w-28 sm:w-36 shrink-0 truncate flex items-center gap-1.5">
                    <span className="font-semibold text-neutral-800 truncate" title={cat.name}>
                      {cat.name}
                    </span>
                    {isWeakest && (
                      <span className="text-amber-700 text-[10px] font-semibold" title="Priority Focus Area">
                        Priority
                      </span>
                    )}
                  </div>

                  {/* Topic Progress Bar */}
                  <div className="flex-1 h-2.5 rounded-full bg-neutral-200/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        cat.percent === 100
                          ? "bg-emerald-600"
                          : isWeakest
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${cat.percent}%` }}
                    ></div>
                  </div>

                  {/* Percentage & Solved Count */}
                  <div className="w-16 sm:w-20 text-right shrink-0 flex items-center justify-end gap-1.5">
                    <span className="text-neutral-400 text-[11px] hidden sm:inline">
                      {cat.solved}/{cat.total}
                    </span>
                    <span className={`font-bold w-10 text-right ${
                      isWeakest ? "text-amber-700" : "text-neutral-900"
                    }`}>
                      {cat.percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Weakest Area Callout & Primary Action Buttons */}
        <div className="p-6 sm:p-8 bg-white">
          {weakestArea && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <p className="font-medium leading-normal">
                  <span className="font-bold">Weakest Area:</span> {weakestArea}
                  <span className="text-amber-700 block sm:inline sm:ml-1">
                    — Targeted testing will diagnose your exact misconceptions.
                  </span>
                </p>
              </div>

              <Link
                to={`/prep/${company.slug || companyId}/${encodeURIComponent(role)}/test?topic=${encodeURIComponent(weakestArea)}`}
                className="shrink-0 rounded-lg bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-800 transition-colors shadow-xs text-center"
              >
                Test Weak Area (100 Marks)
              </Link>
            </div>
          )}

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to={`/prep/${company.slug || companyId}/${encodeURIComponent(role)}/sheet`}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 transition-all active:scale-[0.99] text-center"
            >
              <span>Continue Practice</span>
            </Link>

            <Link
              to={`/prep/${company.slug || companyId}/${encodeURIComponent(role)}/plan`}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-700/30 bg-emerald-50/80 px-5 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-all active:scale-[0.99] text-center"
            >
              <span>Generate AI Plan</span>
            </Link>

            <Link
              to={`/prep/${company.slug || companyId}/${encodeURIComponent(role)}/test`}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3 text-sm font-bold text-white hover:bg-neutral-800 transition-all active:scale-[0.99] text-center shadow-xs"
            >
              <span>100-Mark Diagnostic Test</span>
            </Link>

            <Link
              to={`/prep/${company.slug || companyId}/${encodeURIComponent(role)}/interview`}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900 transition-all active:scale-[0.99] text-center shadow-xs"
            >
              <span>AI Mock Interview (Typed Answers)</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
