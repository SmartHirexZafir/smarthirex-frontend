// app/profile/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* =========================
 *  Config & helpers
 * ========================= */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

const getAuthToken = (): string | null =>
  (typeof window !== "undefined" &&
    (localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("AUTH_TOKEN"))) ||
  null;

const authHeaders = (): Record<string, string> => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const t = getAuthToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

function readLocalUser(): Record<string, any> | null {
  if (typeof window === "undefined") return null;
  const keys = ["user", "profile", "smx_user", "USER"];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }
  return null;
}

function setPresenceCookie() {
  // Keep presence cookie fresh; middleware uses it to guard routes
  document.cookie = `smx_auth=1; Path=/; Max-Age=${14 * 24 * 60 * 60}; SameSite=Lax`;
}

function clearPresenceCookie() {
  document.cookie = "smx_auth=; Path=/; Max-Age=0; SameSite=Lax";
}

function mergeProfile(server: any, local: any) {
  // Server takes precedence; keep local for fallback-only keys
  return { ...(local || {}), ...(server || {}) };
}

function prettyLabel(k: string) {
  return k
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b(id)\b/i, "ID")
    .replace(/\s+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

/* =========================
 *  Types (flexible by design)
 * ========================= */
type ProfileDoc = {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  picture?: string;
  avatar?: string;
  image?: string;
  photoURL?: string;
  provider?: string; // "google" | "password" | ...
  role?: string;
  company?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  [key: string]: any; // accept extra fields from backend
};

/* =========================
 *  Page
 * ========================= */
export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ProfileDoc | null>(null);

  // Derived: display image & name
  const imageSrc = useMemo(
    () =>
      data?.picture ||
      data?.avatar ||
      data?.image ||
      data?.photoURL ||
      undefined,
    [data]
  );

  const displayName = useMemo(
    () => data?.name || data?.fullName || data?.email || "User",
    [data]
  );

  // Fields to highlight first (if present)
  const primaryFields: Array<[keyof ProfileDoc, string | ((v: any) => string)]> =
    [
      ["email", String],
      ["role", String],
      ["company", String],
      ["provider", (v) => (v ? String(v).toUpperCase() : "—")],
      ["created_at", (v) => (v ? new Date(v).toLocaleString() : "—")],
      ["last_login", (v) => (v ? new Date(v).toLocaleString() : "—")],
    ];

  useEffect(() => {
    // If no token, go to login (middleware also protects, this is a UX fast-path)
    const token = getAuthToken();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent("/profile")}`);
      return;
    }

    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      try {
        // Keep the presence cookie fresh so middleware stays in sync with client auth
        setPresenceCookie();

        // Try known endpoints in sequence
        const endpoints = ["/auth/me", "/users/me", "/profile/me", "/me"];
        let server: any = null;
        for (const ep of endpoints) {
          try {
            const res = await fetch(`${API_BASE}${ep}`, {
              headers: authHeaders(),
            });
            if (res.ok) {
              server = await res.json().catch(() => ({}));
              break;
            }
          } catch {
            // try next endpoint
          }
        }

        const local = readLocalUser();
        const merged = mergeProfile(server, local);

        if (!cancelled) {
          if (!merged || Object.keys(merged).length === 0) {
            setErr(
              "Could not load your profile. Please try reloading or sign in again."
            );
          }
          setData(merged);
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(
            typeof e?.message === "string"
              ? e.message
              : "Failed to load profile."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function localLogout() {
    try {
      clearPresenceCookie();
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("access_token");
      localStorage.removeItem("AUTH_TOKEN");
      localStorage.removeItem("user");
      localStorage.removeItem("profile");
      localStorage.removeItem("smx_user");
      localStorage.removeItem("USER");
    } catch {}
    router.replace("/login");
  }

  function refresh() {
    // Simple reload to refetch from backend
    router.refresh?.();
    // Fallback to hard reload if needed
    if (typeof window !== "undefined") window.location.reload();
  }

  // Compute “other fields” for key/value panel (exclude primary/shown ones)
  const shownKeys = new Set<string>([
    "name",
    "fullName",
    "email",
    "picture",
    "avatar",
    "image",
    "photoURL",
    ...primaryFields.map(([k]) => String(k)),
  ]);

  const otherEntries = useMemo(() => {
    if (!data) return [];
    return Object.entries(data).filter(([k, v]) => {
      if (shownKeys.has(k)) return false;
      // Hide very nested/verbose objects by default; keep small primitives or shallow objects
      if (v && typeof v === "object") {
        try {
          // allow shallow objects with <= 6 keys
          if (Array.isArray(v)) return v.length <= 8;
          return Object.keys(v).length <= 6;
        } catch {
          return false;
        }
      }
      return true;
    });
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-[80vh] bg-background page-aurora">
      {/* Header */}
      <div className="bg-card/90 backdrop-blur-sm shadow-lg border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-5 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/upload"
                className="p-2 rounded-lg transition-colors text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Go back"
              >
                <i className="ri-arrow-left-line text-xl" />
              </a>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <i className="ri-user-3-line mr-3 text-foreground/80" />
                  Your Profile
                </h1>
                <p className="text-sm text-muted-foreground">
                  View your account information and sign out securely
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refresh}
                className="px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="ri-refresh-line mr-2" />
                Refresh
              </button>
              <button
                type="button"
                onClick={localLogout}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/60"
              >
                <i className="ri-logout-box-r-line mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
        {/* Loading / Error */}
        {loading && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border-2 border-foreground/40 border-t-transparent animate-spin" />
              <div className="text-sm text-muted-foreground">
                Loading your profile…
              </div>
            </div>
          </div>
        )}

        {err && !loading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {err}
          </div>
        )}

        {!loading && data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: identity card */}
            <div className="lg:col-span-1">
              <div className="bg-card text-foreground rounded-2xl shadow-xl border border-border p-6">
                <div className="flex items-center gap-4">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={displayName}
                      className="w-20 h-20 rounded-2xl object-cover border border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-background/60 border border-border flex items-center justify-center">
                      <i className="ri-user-line text-muted-foreground text-2xl" />
                    </div>
                  )}
                  <div>
                    <div className="text-lg font-semibold">{displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.email || "—"}
                    </div>
                    {data.provider && (
                      <div className="mt-2 inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        <i className="ri-key-2-line mr-1.5" />
                        {String(data.provider).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {/* Highlight quick facts if present */}
                  {"role" in data && data.role && (
                    <div className="rounded-xl border border-border bg-muted/50 p-3">
                      <div className="text-[11px] text-muted-foreground">Role</div>
                      <div className="text-sm font-medium">{data.role}</div>
                    </div>
                  )}
                  {"company" in data && data.company && (
                    <div className="rounded-xl border border-border bg-muted/50 p-3">
                      <div className="text-[11px] text-muted-foreground">Company</div>
                      <div className="text-sm font-medium">{data.company}</div>
                    </div>
                  )}
                  {"created_at" in data && data.created_at && (
                    <div className="rounded-xl border border-border bg-muted/50 p-3">
                      <div className="text-[11px] text-muted-foreground">Joined</div>
                      <div className="text-sm font-medium">
                        {new Date(data.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {"last_login" in data && data.last_login && (
                    <div className="rounded-xl border border-border bg-muted/50 p-3">
                      <div className="text-[11px] text-muted-foreground">Last login</div>
                      <div className="text-sm font-medium">
                        {new Date(data.last_login).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-2">
                  <a
                    href="/upload"
                    className="flex-1 text-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <i className="ri-upload-2-line mr-2" />
                    Upload CVs
                  </a>
                  <a
                    href="/history"
                    className="flex-1 text-center px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <i className="ri-time-line mr-2" />
                    History
                  </a>
                </div>
              </div>
            </div>

            {/* Right: details */}
            <div className="lg:col-span-2">
              <div className="bg-card text-foreground rounded-2xl shadow-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium">Account details</div>
                  <div className="text-xs text-muted-foreground">
                    Fields are read-only for now
                  </div>
                </div>

                {/* Primary fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {primaryFields.map(([k, fmt]) => {
                    const raw = (data as any)?.[k];
                    if (raw === undefined || raw === null || raw === "") return null;
                    const label = prettyLabel(String(k));
                    const value = typeof fmt === "function" ? fmt(raw) : String(raw);
                    return (
                      <div
                        key={String(k)}
                        className="rounded-xl border border-border bg-muted/40 p-4"
                      >
                        <div className="text-[11px] text-muted-foreground mb-1">
                          {label}
                        </div>
                        <div className="text-sm font-medium break-words">{value}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Other fields (auto-render small objects/arrays/primitives) */}
                {otherEntries.length > 0 && (
                  <>
                    <div className="mt-6 font-medium">Additional information</div>
                    <div className="mt-3 grid sm:grid-cols-2 gap-4">
                      {otherEntries.map(([k, v]) => (
                        <div
                          key={k}
                          className="rounded-xl border border-border bg-muted/30 p-4"
                        >
                          <div className="text-[11px] text-muted-foreground mb-1">
                            {prettyLabel(k)}
                          </div>
                          <div className="text-sm font-medium break-words">
                            {typeof v === "object"
                              ? (() => {
                                  try {
                                    return JSON.stringify(v, null, 2);
                                  } catch {
                                    return String(v);
                                  }
                                })()
                              : String(v)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Helper panel */}
              <div className="mt-6 bg-card text-foreground rounded-2xl shadow-xl border border-border p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
                  <div className="flex-1">
                    <div className="font-medium">Tip</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      Use the profile menu in the top-right on the Upload page to get here
                      quickly. Your Google avatar (if any) appears automatically after login.
                    </div>
                  </div>
                  <a
                    href="/docs"
                    className="icon-btn h-8 w-8 rounded-lg border border-input hover:bg-muted/60 transition-colors flex items-center justify-center"
                    title="Open docs"
                  >
                    <i className="ri-book-open-line" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page-level toast examples could be added here if you wire actions */}
    </div>
  );
}
