"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ThemeToggle from "./ui/ThemeToogle"; // same path/style as before
import Logo from "@/components/ui/Logo";

type User = {
  name: string;
  role: string;
  avatarUrl?: string | null;
};

// ---- helpers ----
function initialsFrom(name?: string) {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "U";
}

// decode JWT (for email fallback only)
function parseJwt(token?: string): { email?: string; id?: string } | null {
  if (!token) return null;
  try {
    const base = token.split(".")[1];
    if (!base) return null;
    const b64 = base.replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof window !== "undefined"
        ? atob(b64)
        : Buffer.from(b64, "base64").toString();
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// read user object saved at login by frontend after /login
function readUserFromStorage(): User | undefined {
  if (typeof window === "undefined") return undefined;

  const possibleUserKeys = ["user", "auth_user", "login_user", "profile"];
  for (const key of possibleUserKeys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const u = JSON.parse(raw);
        const first = u.firstName || u.first_name || "";
        const last = u.lastName || u.last_name || "";
        const job = u.jobTitle || u.role || u.userRole || "User";
        const name =
          `${first} ${last}`.trim() || u.name || u.username || u.email || "User";
        const avatarUrl = u.avatarUrl || u.avatar || u.photoUrl || null;
        return { name, role: job, avatarUrl };
      } catch {
        // ignore parse error and continue
      }
    }
  }

  // Else, minimal user from JWT (email only)
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("token") || "";
  const payload = parseJwt(token) || null;
  if (payload?.email) {
    const email = payload.email as string;
    const name =
      email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase()) || email;
    return { name, role: "User", avatarUrl: null };
  }

  return undefined;
}

// sync across tabs (when login happens in another tab)
function useStorageSync(callback: () => void) {
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (
        ["user", "auth_user", "login_user", "profile", "token", "access_token"].includes(
          e.key
        )
      ) {
        callback();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [callback]);
}

// ---- hook: resolve current user without hitting backend ----
function useCurrentUser(propUser?: User) {
  const [resolved, setResolved] = useState<User | undefined>(propUser);
  const [loading, setLoading] = useState<boolean>(!propUser);

  useEffect(() => {
    if (propUser) return;
    setLoading(true);
    const u = readUserFromStorage();
    setResolved(u);
    setLoading(false);
  }, [propUser]);

  useStorageSync(() => {
    if (propUser) return;
    const u = readUserFromStorage();
    setResolved(u);
  });

  return useMemo(() => ({ user: resolved, loading }), [resolved, loading]);
}

export default function AppHeader({ user }: { user?: User }) {
  const [open, setOpen] = useState(false); // mobile nav
  const [menuOpen, setMenuOpen] = useState(false); // user dropdown
  const menuRef = useRef<HTMLDivElement>(null);

  // resolve current user (prop or storage)
  const { user: currentUser, loading } = useCurrentUser(user);

  // Close menus on ESC
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  // Click outside to close user menu
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Fallback skeleton while loading or no user yet
  const displayName = currentUser?.name || (loading ? "Loading…" : "User");
  const displayRole = currentUser?.role || (loading ? "Please wait" : "User");

  return (
    <header className="nav full-bleed">
      <div className="container max-w-[1600px] py-4 md:py-5">
        <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" aria-label="Smart HireX" className="flex items-center gap-3">
              <Logo />
            </Link>
          </div>

          {/* Center nav (app sections) */}
          <nav aria-label="Primary" className="hidden md:flex items-center justify-center gap-6">
            <Link className="nav-item" href="/upload">Upload</Link>
            <Link className="nav-item" href="/history">History</Link>
            <Link className="nav-item" href="/test">Test</Link>
            <Link className="nav-item" href="/meetings">Meetings</Link>
            <Link className="nav-item" href="/dashboard">Dashboard</Link>
          </nav>

          {/* Actions (right) */}
          <div className="flex items-center justify-end gap-2 pr-3 md:pr-6">
            {/* 🔆 Dark/Light toggle */}
            <ThemeToggle />

            {/* 👤 User menu — prominent pill */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl px-2.5 py-1.5 border border-border/70 bg-muted/20 backdrop-blur-sm hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                {/* Avatar (initials fallback) */}
                {currentUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-xl ring-2 ring-border object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl grid place-items-center ring-2 ring-border bg-muted/40">
                    <span className="text-sm font-semibold">
                      {initialsFrom(currentUser?.name)}
                    </span>
                  </div>
                )}

                {/* Name + role (hide on very small screens) */}
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold leading-4">
                    {displayName}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-4">
                    {displayRole}
                  </div>
                </div>

                {/* Caret */}
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="hidden sm:block opacity-80">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-2xl ring-1 ring-border bg-card p-2 shadow-lg animate-rise-in z-50"
                >
                  <div className="px-3 py-2 mb-1 rounded-xl bg-muted/30">
                    <div className="text-sm font-semibold">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {displayRole}
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    role="menuitem"
                    className="nav-item block px-3 py-2 rounded-xl hover:bg-muted/40"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    role="menuitem"
                    className="nav-item block px-3 py-2 rounded-xl hover:bg-muted/40"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden icon-btn ml-1"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" role="img" aria-hidden="true">
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
              <Link className="nav-item px-4 py-3 rounded-xl hover:bg-muted/40" href="/upload" onClick={() => setOpen(false)}>Upload</Link>
              <Link className="nav-item px-4 py-3 rounded-xl hover:bg-muted/40" href="/history" onClick={() => setOpen(false)}>History</Link>
              <Link className="nav-item px-4 py-3 rounded-xl hover:bg-muted/40" href="/test" onClick={() => setOpen(false)}>Assign Test</Link>
              <Link className="nav-item px-4 py-3 rounded-xl hover:bg-muted/40" href="/meetings" onClick={() => setOpen(false)}>Meetings</Link>
              <Link className="nav-item px-4 py-3 rounded-xl hover:bg-muted/40" href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>

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
