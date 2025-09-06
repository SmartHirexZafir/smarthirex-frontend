"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import ThemeToggle from "../ui/ThemeToogle";

export default function AppHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <header className="nav full-bleed" role="banner">
      <div className="container max-w-[1600px] py-4 md:py-5">
        <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-4">
          {/* Brand (same logo everywhere; removed extra dot/span) */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group" aria-label="Smart HireX Home">
              <Image
                src="/web-logo.png"
                alt="Smart HireX logo"
                width={28}
                height={28}
                className="rounded-lg ring-1 ring-border"
                priority
              />
              <span className="text-[22px] md:text-[24px] font-extrabold gradient-text leading-none">
                Smart HireX
              </span>
            </Link>
          </div>

          {/* Center nav (removed “Components”) */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center justify-center gap-8"
          >
            <Link className="nav-item" href="/features">
              Features
            </Link>
            <Link className="nav-item" href="/pricing">
              Pricing
            </Link>
            <Link className="nav-item" href="/docs">
              Docs
            </Link>
          </nav>

          {/* Actions (global-only UI classes; theme toggle stays) */}
          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />
            <Link className="btn btn-outline hidden sm:inline-flex" href="/login">
              Log in
            </Link>
            <Link className="btn btn-primary" href="/signup">
              <span>Get Started</span>
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

        {/* Mobile menu (removed “Components”) */}
        {open && (
          <div
            id="mobile-menu"
            className="mt-3 md:hidden overflow-hidden rounded-2xl ring-1 ring-border bg-card p-2 animate-rise-in"
          >
            <div className="flex flex-col">
              <Link
                className="px-4 py-3 rounded-xl hover:bg-muted/40"
                href="/features"
                onClick={() => setOpen(false)}
              >
                Features
              </Link>
              <Link
                className="px-4 py-3 rounded-xl hover:bg-muted/40"
                href="/pricing"
                onClick={() => setOpen(false)}
              >
                Pricing
              </Link>
              <Link
                className="px-4 py-3 rounded-xl hover:bg-muted/40"
                href="/docs"
                onClick={() => setOpen(false)}
              >
                Docs
              </Link>
              <div className="h-px my-1 bg-border" />
              <Link
                className="px-4 py-3 rounded-xl hover:bg-muted/40"
                href="/login"
                onClick={() => setOpen(false)}
              >
                Log in
              </Link>
              <Link
                className="px-4 py-3 rounded-xl hover:bg-muted/40"
                href="/signup"
                onClick={() => setOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
