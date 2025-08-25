"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ThemeToggle from "./ui/ThemeToogle"; // same path/style as marketing header

export default function AppHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <header className="nav full-bleed">
      <div className="container max-w-[1600px] py-4 md:py-5">
        <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-[26px] md:text-[28px] font-extrabold gradient-text leading-none"
            >
              Smart HireX
            </Link>
            <span
              aria-hidden
              className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/.25)]"
            >
              App
            </span>
          </div>

          {/* Center nav (app sections) */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center justify-center gap-6"
          >
            <Link className="nav-item" href="/upload">Upload</Link>
            <Link className="nav-item" href="/history">History</Link>
            <Link className="nav-item" href="/test">Tests</Link>
            <Link className="nav-item" href="/meetings">Meetings</Link>
            <Link className="nav-item" href="/dashboard">Dashboard</Link>
          </nav>

          {/* Actions (right) */}
          <div className="flex items-center justify-end gap-2">
            {/* 🔆 Dark/Light toggle */}
            <ThemeToggle />

            {/* Quick links */}
            <Link className="btn btn-outline hidden sm:inline-flex" href="/settings">
              Settings
            </Link>
            <Link className="btn btn-primary" href="/profile">
              <span>Profile</span>
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden icon-btn ml-1"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                role="img"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div
            id="mobile-menu"
            className="mt-3 md:hidden overflow-hidden rounded-2xl ring-1 ring-border bg-card p-2 animate-rise-in"
          >
            <div className="flex flex-col">
              <Link
                className="px-4 py-3 rounded-xl hover:bg-muted/40"
                href="/upload"
                onClick={() => setOpen(false)}
              >
                Upload
              </Link>
              <Link
                className="px-4 py-3 rounded-xl hover:bg-muted/40"
                href="/history"
                onClick={() => setOpen(false)}
              >
                History
              </Link>
              <Link
                className="px-4 py-3 rounded-xl hover:bg-muted/40"
                href="/test"
                onClick={() => setOpen(false)}
              >
                Tests
              </Link>
              <Link
                className="px-4 py-3 rounded-xl hover:bg-muted/40"
                href="/meetings"
                onClick={() => setOpen(false)}
              >
                Meetings
              </Link>
              <Link
                className="px-4 py-3 rounded-xl hover:bg-muted/40"
                href="/dashboard"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>

              <div className="px-2 pt-2 pb-1">
                {/* Theme toggle in mobile too */}
                <div className="flex items-center justify-between rounded-xl bg-muted/30 p-2">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
