import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/client";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await API.get("/companies");
        setCompanies(res.data.companies || []);
      } catch (err) {
        setError("Failed to load companies. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Target Companies
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Select a company to view curated preparation sheets and custom roles.
          </p>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>

      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Link
              key={company.slug || company._id}
              to={`/companies/${company.slug || company._id}`}
              className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs hover:border-emerald-400 hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 font-bold text-lg border border-emerald-200/60">
                    {company.name.charAt(0)}
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 group-hover:bg-emerald-100 group-hover:text-emerald-800 transition-colors">
                    {company.roles?.length || 3} Roles Available
                  </span>
                </div>

                <h3 className="text-xl font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                  {company.name}
                </h3>
                <p className="mt-2 text-sm text-neutral-600 line-clamp-3 leading-relaxed">
                  {company.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                <span>Choose Role & Start Prep</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filteredCompanies.length === 0 && (
        <div className="mt-12 text-center py-12 rounded-2xl border border-dashed border-neutral-300">
          <p className="text-neutral-500">No companies found matching "{search}".</p>
        </div>
      )}
    </div>
  );
}
