// app/profile/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

type RawUser = Record<string, any>;

type Profile = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  avatarUrl?: string | null;
  // tolerate alternate avatar keys from various backends
  avatar?: string | null;
  photoUrl?: string | null;
};

function initialsFrom(name?: string | null) {
  if (!name) return "U";
  const init =
    name
      .trim()
      .split(/\s+/)
      .map((n) => n[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "U";
  return init;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function normalize(raw?: RawUser | null): Profile | undefined {
  if (!raw) return undefined;
  const first = raw.firstName || raw.first_name || "";
  const last = raw.lastName || raw.last_name || "";
  const name =
    `${first} ${last}`.trim() ||
    raw.name ||
    raw.username ||
    raw.fullName ||
    null;

  return {
    name,
    email: raw.email || raw.userEmail || null,
    role: raw.role || raw.userRole || null,
    jobTitle: raw.jobTitle || raw.title || raw.position || null,
    company: raw.company || raw.org || raw.organization || null,
    createdAt: raw.createdAt || raw.created_at || raw.created || null,
    updatedAt: raw.updatedAt || raw.updated_at || raw.updated || null,
    avatarUrl: raw.avatarUrl || raw.avatarURL || raw.photoURL || raw.photoUrl || raw.avatar || null,
    avatar: raw.avatar || null,
    photoUrl: raw.photoUrl || raw.photoURL || null,
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    // Hydrate immediately from localStorage for fast render
    const keys = ["user", "auth_user", "login_user", "profile"];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const norm = normalize(parsed);
          if (norm) return norm;
        } catch {
          // ignore parse error
        }
      }
    }
    return undefined;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refresh/complete from backend on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!API_BASE) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) {
          setErrorMsg(null); // treat as anonymous without loud error
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        const fresh = normalize(data);
        if (fresh) {
          setProfile((prev) => {
            // prefer API values but keep local fallback if API empty
            const merged: Profile = {
              name: fresh.name ?? prev?.name ?? null,
              email: fresh.email ?? prev?.email ?? null,
              role: fresh.role ?? prev?.role ?? null,
              jobTitle: fresh.jobTitle ?? prev?.jobTitle ?? null,
              company: fresh.company ?? prev?.company ?? null,
              createdAt: fresh.createdAt ?? prev?.createdAt ?? null,
              updatedAt: fresh.updatedAt ?? prev?.updatedAt ?? null,
              avatarUrl:
                fresh.avatarUrl ??
                fresh.avatar ??
                fresh.photoUrl ??
                prev?.avatarUrl ??
                (prev?.avatar as string | null) ??
                (prev?.photoUrl as string | null) ??
                null,
              avatar: fresh.avatar ?? (prev?.avatar as string | null) ?? null,
              photoUrl: fresh.photoUrl ?? (prev?.photoUrl as string | null) ?? null,
            };
            // cache normalized user for future fast hydration
            try {
              localStorage.setItem("user", JSON.stringify(merged));
            } catch {
              /* ignore quota */
            }
            return merged;
          });
        }
      } catch {
        setErrorMsg("Failed to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const avatarSrc = useMemo(() => {
    return (
      profile?.avatarUrl ||
      (profile?.avatar as string | undefined) ||
      (profile?.photoUrl as string | undefined) ||
      null
    );
  }, [profile]);

  return (
    <div className="app-container py-6 md:py-10">
      <div className="mb-6">
        <h1 className="gradient-text" style={{ fontSize: "var(--step-4)" }}>
          Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Read-only view of your account details.
        </p>
      </div>

      {/* Card */}
      <div className="card p-5 md:p-6">
        {/* Header row */}
        <div className="flex items-center gap-4 md:gap-5">
          {/* Avatar / skeleton */}
          {loading ? (
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl skeleton" />
          ) : avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt=""
              className="h-16 w-16 md:h-20 md:w-20 rounded-2xl ring-2 ring-border object-cover"
            />
          ) : (
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl grid place-items-center ring-2 ring-border bg-muted/40">
              <span className="text-lg md:text-xl font-semibold">
                {initialsFrom(profile?.name)}
              </span>
            </div>
          )}

          {/* Name + Email */}
          <div className="min-w-0">
            <div className="text-xl md:text-2xl font-semibold leading-tight">
              {loading ? (
                <span className="inline-block h-6 w-40 skeleton rounded-md" />
              ) : (
                profile?.name || "—"
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1 truncate">
              {loading ? (
                <span className="inline-block h-4 w-56 skeleton rounded-md" />
              ) : (
                profile?.email || "—"
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-5 border-t border-border/80" />

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Role / Job Title */}
          <div className="panel p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Role
            </div>
            <div className="mt-1 text-sm">
              {loading ? (
                <span className="inline-block h-4 w-24 skeleton rounded-md" />
              ) : (
                profile?.role || "—"
              )}
            </div>
            <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Job Title
            </div>
            <div className="mt-1 text-sm">
              {loading ? (
                <span className="inline-block h-4 w-28 skeleton rounded-md" />
              ) : (
                profile?.jobTitle || "—"
              )}
            </div>
          </div>

          {/* Company */}
          <div className="panel p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Company
            </div>
            <div className="mt-1 text-sm">
              {loading ? (
                <span className="inline-block h-4 w-40 skeleton rounded-md" />
              ) : (
                profile?.company || "—"
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="panel p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Created
            </div>
            <div className="mt-1 text-sm">
              {loading ? (
                <span className="inline-block h-4 w-36 skeleton rounded-md" />
              ) : (
                formatDate(profile?.createdAt)
              )}
            </div>
            <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Updated
            </div>
            <div className="mt-1 text-sm">
              {loading ? (
                <span className="inline-block h-4 w-36 skeleton rounded-md" />
              ) : (
                formatDate(profile?.updatedAt)
              )}
            </div>
          </div>
        </div>

        {/* Error / Empty note */}
        {!loading && !profile?.email && (
          <div className="mt-5 panel p-4">
            <div className="text-sm text-muted-foreground">
              We couldn’t find complete profile details. Make sure you’re signed in.
            </div>
          </div>
        )}
        {errorMsg && (
          <div className="mt-5 panel p-4">
            <div className="text-sm text-[hsl(var(--warning))]">
              {errorMsg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
