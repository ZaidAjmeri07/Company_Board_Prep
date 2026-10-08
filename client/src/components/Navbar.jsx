import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isExamMode, setIsExamMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function handleExamMode(e) {
      setIsExamMode(!!e.detail?.active);
    }
    window.addEventListener("exam-mode", handleExamMode);
    return () => window.removeEventListener("exam-mode", handleExamMode);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (isExamMode) {
    return (
      <header className="sticky top-0 z-50 border-b border-red-900/20 bg-neutral-900 px-6 py-3.5 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-100">
              Proctored Examination Mode Active
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
            <span>Fullscreen Locked</span>
            <span>·</span>
            <span>Tab Switching Monitored</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold shadow-sm transition-transform group-hover:scale-105">
            CB
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-neutral-900 tracking-tight leading-tight">
              Company Board Prep
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-700">
              Role-Based Placement
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          {user ? (
            <>
              <NavLink
                to="/companies"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? "text-emerald-800 font-semibold" : "text-neutral-600 hover:text-emerald-700"
                  }`
                }
              >
                Companies
              </NavLink>

              <NavLink
                to="/me"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive ? "text-emerald-800 font-semibold" : "text-neutral-600 hover:text-emerald-700"
                  }`
                }
              >
                My Progress
              </NavLink>

              <div className="h-4 w-px bg-neutral-200"></div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium text-neutral-700 max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                >
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-neutral-700 hover:text-emerald-700 transition-colors px-2 py-1"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 transition-colors"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
