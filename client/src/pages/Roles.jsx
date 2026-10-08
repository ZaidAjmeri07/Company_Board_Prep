import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/client";

const roleDetails = {
  "Software Engineer": {
    badge: "Coding & System Design",
    description: "Data structures, algorithms, object-oriented design, databases, and core CS fundamentals.",
    categories: ["Arrays", "Strings", "Trees", "Graphs", "DP", "SQL", "HR"],
    color: "from-blue-500/10 to-indigo-500/10 border-blue-200",
  },
  "Data Analyst": {
    badge: "Analytics & Insights",
    description: "Advanced SQL window functions, business intelligence, Python data pipelines, and case analysis.",
    categories: ["SQL", "Excel", "Statistics", "Python", "Case Study"],
    color: "from-emerald-500/10 to-teal-500/10 border-emerald-200",
  },
  "Management / Business": {
    badge: "Strategy & Problem Solving",
    description: "Quantitative aptitude, market sizing guesstimates, business case frameworks, and behavioral rounds.",
    categories: ["Aptitude", "Case Study", "Guesstimate", "GD", "HR"],
    color: "from-amber-500/10 to-orange-500/10 border-amber-200",
  },
};

export default function Roles() {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCompany() {
      try {
        const res = await API.get(`/companies/${companyId}`);
        setCompany(res.data.company);
      } catch (err) {
        setError("Could not load company details.");
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-red-600 font-semibold">{error || "Company not found."}</p>
        <Link to="/companies" className="mt-4 inline-block text-sm text-emerald-700 underline">
          Back to all companies
        </Link>
      </div>
    );
  }

  const roles = company.roles && company.roles.length > 0
    ? company.roles
    : ["Software Engineer", "Data Analyst", "Management / Business"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-500">
        <Link to="/companies" className="hover:text-emerald-700">Companies</Link>
        <span>/</span>
        <span className="font-semibold text-neutral-900">{company.name}</span>
      </nav>

      {/* Company Header */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-white font-extrabold text-2xl shadow-sm">
            {company.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
              {company.name} Preparation Tracks
            </h1>
            <p className="mt-1 text-sm text-neutral-600 max-w-3xl">
              {company.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900">Select Your Target Role</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Each role contains a curated sheet tailored for {company.name}'s interview format.
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((roleName) => {
          const info = roleDetails[roleName] || {
            badge: "Career Track",
            description: "Targeted problem set and topic coverage.",
            categories: ["Core Topics", "Practice", "HR"],
            color: "from-neutral-500/10 to-neutral-500/10 border-neutral-200",
          };

          return (
            <Link
              key={roleName}
              to={`/prep/${company.slug || company._id}/${encodeURIComponent(roleName)}`}
              className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs hover:border-emerald-500 hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200/50">
                    {info.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                  {roleName}
                </h3>
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  {info.description}
                </p>

                <div className="mt-4">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
                    Key Categories:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {info.categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                <span>Open Preparation Dashboard</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
