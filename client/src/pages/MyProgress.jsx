import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function MyProgress() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        const res = await API.get("/progress/summary");
        setData(res.data);
      } catch (err) {
        setError("Could not load your progress summary.");
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-red-600 font-semibold">{error || "No progress data available."}</p>
        <Link to="/companies" className="mt-4 inline-block text-sm text-emerald-700 underline">
          Explore Companies to Start Preparing
        </Link>
      </div>
    );
  }

  const { overall, companies } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/60 mb-2 inline-block">
              Candidate Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              {user?.name}'s Placement Preparation
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Consolidated preparation status across all targeted recruiters.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-neutral-50 p-4 border border-neutral-200 min-w-[220px]">
            <div>
              <div className="text-xs font-medium text-neutral-500">Overall Solved</div>
              <div className="text-2xl font-black text-emerald-700">
                {overall.solvedQuestions} <span className="text-xs text-neutral-400 font-normal">/ {overall.totalQuestions}</span>
              </div>
            </div>
            <div className="h-10 w-px bg-neutral-200"></div>
            <div>
              <div className="text-xs font-medium text-neutral-500">Readiness</div>
              <div className="text-2xl font-black text-neutral-900">{overall.percent}%</div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6">
          <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${overall.percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Companies Breakdown */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900">Company-by-Company Progress</h2>
        <p className="text-xs text-neutral-500 mt-0.5">Select any role to jump directly into practice</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companies.map((c) => (
          <div
            key={c.company.slug || c.company._id}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-base">
                    {c.company.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-base">{c.company.name}</h3>
                    <span className="text-xs text-neutral-500">
                      {c.solvedQuestions} of {c.totalQuestions} questions completed
                    </span>
                  </div>
                </div>

                <span className="text-sm font-black text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-lg">
                  {c.percent}%
                </span>
              </div>

              {/* Roles Under Company */}
              <div className="space-y-3 mt-4 border-t border-neutral-100 pt-4">
                {c.roles.map((r) => (
                  <div
                    key={r.role}
                    className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-neutral-50/80 border border-neutral-100 hover:bg-emerald-50/40 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-neutral-800 block">{r.role}</span>
                      <span className="text-[11px] text-neutral-500">
                        {r.solved} / {r.total} solved
                        {r.weakestArea ? ` · Weakest: ${r.weakestArea}` : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-700">{r.percent}%</span>
                      <Link
                        to={`/prep/${c.company.slug || c.company._id}/${encodeURIComponent(r.role)}`}
                        className="rounded-lg bg-white border border-neutral-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-700 hover:text-white transition-colors"
                      >
                        Prep
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
              <Link
                to={`/companies/${c.company.slug || c.company._id}`}
                className="font-semibold text-emerald-700 hover:underline"
              >
                View all {c.company.name} tracks
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
