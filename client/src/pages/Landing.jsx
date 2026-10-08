import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-neutral-50/30 px-4 py-16 sm:py-24 sm:px-6 lg:px-8 border-b border-neutral-200/60">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Role-Based Placement Preparation System
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight">
            Target Your Dream Company. <br className="hidden sm:inline" />
            <span className="text-emerald-700">Master Your Specific Role.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Select your target company and role to access curated question sheets from LeetCode, GFG, and IndiaBix. Track category-by-category progress and generate a personalized 7-day preparation plan powered by Gemini AI.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={user ? "/companies" : "/register"}
              className="rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-800 transition-all hover:shadow-lg active:scale-95"
            >
              Explore Companies & Roles
            </Link>

            {user ? (
              <Link
                to="/me"
                className="rounded-xl border border-neutral-300 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors"
              >
                View My Progress
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-xl border border-neutral-300 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            How Company Board Prep Works
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            From targeted practice to AI-guided study planning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xl mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Curated Company Sheets</h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              Targeted sheets for top recruiters (Amazon, Google, Microsoft, TCS, Infosys, Deloitte) across Software Engineering, Data Analytics, and Management.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xl mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Category Progress & Weak Areas</h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              Track question-by-question progress. The system computes granular category percentages (Trees, DP, SQL, Aptitude) and instantly highlights your weakest area.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xl mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Gemini AI 7-Day Plan</h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              Generate an intelligent, actionable 7-day preparation schedule prioritized around your specific weaknesses and the target company's interview style.
            </p>
          </div>
        </div>

        {/* Company Quick Preview */}
        <div className="mt-16 rounded-2xl border border-neutral-200 bg-white p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-neutral-900">Featured Recruiters</h3>
              <p className="text-xs text-neutral-500">Pick any company to begin preparation</p>
            </div>
            <Link
              to="/companies"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
            >
              Browse all 6 companies
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: "Amazon", slug: "amazon", tag: "Tech & Cloud" },
              { name: "Google", slug: "google", tag: "AI & Algorithms" },
              { name: "Microsoft", slug: "microsoft", tag: "Enterprise" },
              { name: "TCS", slug: "tcs", tag: "TCS NQT / Digital" },
              { name: "Infosys", slug: "infosys", tag: "HackWithInfy" },
              { name: "Deloitte", slug: "deloitte", tag: "Consulting & Tech" },
            ].map((c) => (
              <Link
                key={c.slug}
                to={`/companies/${c.slug}`}
                className="group flex flex-col items-center justify-center rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 text-center hover:bg-emerald-50/50 hover:border-emerald-300 transition-all"
              >
                <span className="font-bold text-neutral-900 group-hover:text-emerald-800 text-sm">
                  {c.name}
                </span>
                <span className="text-[11px] text-neutral-500 mt-1">{c.tag}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
