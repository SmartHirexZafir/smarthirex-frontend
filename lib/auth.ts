// lib/auth.ts
// Centralized auth utilities for both client and server in the Next.js app router.
// - SSR-safe (no window/document access at module top-level)
// - Works with middleware.ts cookie check
// - Provides tiny authenticated fetch helper
// - Optional email/password + Google OAuth helpers

export type User = {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  image?: string;
  avatar?: string;
  [k: string]: unknown;
};

export type LoginResponse = {
  token: string;
  user?: User;
  [k: string]: unknown;
};

export type SignupResponse = {
  token: string;
  user?: User;
  [k: string]: unknown;
};

export type MeResponse = {
  user?: User;
  [k: string]: unknown;
};

// ---------------------------------------------------------
// Config & shared constants
// ---------------------------------------------------------
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

export const AUTH_COOKIE_CANDIDATES = [
  "AUTH_TOKEN",
  "token",
  "authToken",
  "access_token",
] as const;

export const PRIMARY_AUTH_COOKIE = "AUTH_TOKEN";

// ---------------------------------------------------------
// Lightweight env checks (no top-level window/document usage)
// ---------------------------------------------------------
const isBrowser = typeof window !== "undefined";

// ---------------------------------------------------------
// Cookie helpers (client-side only). For server-side see getServerToken().
// ---------------------------------------------------------
function getCookie(name: string): string | null {
  if (!isBrowser) return null;
  const str = document.cookie || "";
  if (!str) return null;
  const parts = str.split("; ");
  for (const part of parts) {
    const eq = part.indexOf("=");
    const key = eq >= 0 ? part.slice(0, eq) : part;
    if (key === name) {
      const val = eq >= 0 ? part.slice(eq + 1) : "";
      try {
        return decodeURIComponent(val);
      } catch {
        return val;
      }
    }
  }
  return null;
}

function setCookie(name: string, value: string, days = 7) {
  if (!isBrowser) return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (!isBrowser) return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

// ---------------------------------------------------------
// Token storage (cookie + localStorage for compatibility)
// ---------------------------------------------------------
/** Read token from cookies or localStorage (client only). Cookie wins. */
export function getClientToken(): string | null {
  if (!isBrowser) return null;
  // Prefer any known cookie
  for (const key of AUTH_COOKIE_CANDIDATES) {
    const v = getCookie(key);
    if (v) return v;
  }
  // Fallback to localStorage legacy keys
  try {
    return (
      localStorage.getItem("AUTH_TOKEN") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("access_token")
    );
  } catch {
    return null;
  }
}

/** Persist token to cookie and (optionally) localStorage for legacy code paths. */
export function setAuthToken(token: string, opts?: { days?: number; alsoLocalStorage?: boolean }) {
  const { days = 7, alsoLocalStorage = true } = opts || {};
  setCookie(PRIMARY_AUTH_COOKIE, token, days);
  if (alsoLocalStorage && isBrowser) {
    try {
      localStorage.setItem("AUTH_TOKEN", token);
      // For backward compatibility with older code that might read these:
      localStorage.setItem("token", token);
      localStorage.setItem("authToken", token);
      localStorage.setItem("access_token", token);
    } catch {}
  }
}

/** Remove token from both cookie and localStorage. */
export function clearAuthToken() {
  for (const key of AUTH_COOKIE_CANDIDATES) deleteCookie(key);
  if (isBrowser) {
    try {
      localStorage.removeItem("AUTH_TOKEN");
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("access_token");
    } catch {}
  }
}

/** Is the user considered authenticated on the client? */
export function isAuthenticatedClient(): boolean {
  return !!getClientToken();
}

/** Build Authorization headers if token is available (client). */
export function clientAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json", ...(extra || {}) };
  const t = getClientToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

// ---------------------------------------------------------
// Server-side helpers (SSR/server components/route handlers)
// Note: these are async because we import next/headers only when called.
// ---------------------------------------------------------
export async function getServerToken(): Promise<string | null> {
  // Dynamically import to avoid bundling into client
  const mod = await import("next/headers");
  // In some Next.js versions/types, cookies() is typed async; await handles both.
  const c = await mod.cookies();
  for (const key of AUTH_COOKIE_CANDIDATES) {
    const v = c.get(key)?.value;
    if (v) return v;
  }
  return null;
}

export async function serverAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const h: Record<string, string> = { "Content-Type": "application/json", ...(extra || {}) };
  const t = await getServerToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

/**
 * If unauthenticated on the server, returns a redirect Response to /login?next=...
 * Usage in server components/route handlers:
 *   const redirect = await requireServerAuth();
 *   if (redirect) return redirect;
 */
export async function requireServerAuth(opts?: { next?: string }): Promise<Response | null> {
  const modServer = await import("next/server");
  const { NextResponse } = modServer;
  const token = await getServerToken();
  if (token) return null;

  // Build a safe default "next"
  let nextPath = "/";
  if (opts?.next) {
    nextPath = opts.next;
  } else {
    // Try to infer current path from headers
    const headersMod = await import("next/headers");
    const h = await headersMod.headers();
    const url = h.get("x-url") || h.get("x-original-url") || h.get("referer");
    if (url) {
      try {
        const u = new URL(url);
        nextPath = u.pathname + u.search;
      } catch {}
    }
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const loginUrl = new URL("/login", site);
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

// ---------------------------------------------------------
// Authenticated fetch wrapper (client/server safe)
// ---------------------------------------------------------
export type AuthFetchInit = RequestInit & { json?: unknown };

/**
 * A minimal fetch that injects Authorization from client cookie/localStorage
 * or from server cookies (when called within server context).
 *
 * If you already call fetch directly in components, this is optional—but
 * using it avoids repeating header code.
 */
export async function authFetch(input: string | URL | Request, init: AuthFetchInit = {}) {
  let headers: Record<string, string> = {};
  // Merge provided headers with our auth header
  const given = init.headers as Record<string, string> | undefined;

  if (typeof window === "undefined") {
    // server
    headers = { ...(await serverAuthHeaders()), ...(given || {}) };
  } else {
    // client
    headers = { ...clientAuthHeaders(), ...(given || {}) };
  }

  const body =
    init.json !== undefined
      ? JSON.stringify(init.json)
      : (init.body as BodyInit | null | undefined);

  return fetch(input, {
    ...init,
    headers,
    body,
  });
}

// ---------------------------------------------------------
// High-level API helpers (optional)
// These are thin convenience wrappers; keep using your existing pages.
// ---------------------------------------------------------
export async function loginWithEmailPassword(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include", // in case backend sets HttpOnly cookie
  });

  const txt = await res.text();
  let data: any = {};
  try { data = txt ? JSON.parse(txt) : {}; } catch { data = { message: txt }; }

  if (!res.ok) {
    throw new Error(data?.detail || data?.error || data?.message || `Login failed (${res.status})`);
  }

  // If backend returns a token in JSON, persist it for middleware + client fetches
  if (data?.token) setAuthToken(String(data.token));
  return data as LoginResponse;
}

export async function signupWithEmailPassword(payload: { name?: string; email: string; password: string }): Promise<SignupResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const txt = await res.text();
  let data: any = {};
  try { data = txt ? JSON.parse(txt) : {}; } catch { data = { message: txt }; }

  if (!res.ok) {
    throw new Error(data?.detail || data?.error || data?.message || `Signup failed (${res.status})`);
  }

  if (data?.token) setAuthToken(String(data.token));
  return data as SignupResponse;
}

/** Optional: Fetch current user if backend supports /auth/me (token in cookie/header). */
export async function fetchMe(): Promise<MeResponse> {
  const res = await authFetch(`${API_BASE}/auth/me`, { method: "GET" });
  const txt = await res.text();
  try { return (txt ? JSON.parse(txt) : {}) as MeResponse; } catch { return {}; }
}

/** Google OAuth: start URL and optional callback parser. */
export function getGoogleAuthUrl(returnTo = "/upload"): string {
  const rt = encodeURIComponent(returnTo);
  // Adjust the path to match your backend route if different
  return `${API_BASE}/auth/google/start?returnTo=${rt}`;
}

/** If your OAuth callback returns ?token=..., call this once to persist it. */
export function tryPersistTokenFromUrl(search: string): string | null {
  const usp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const t = usp.get("token");
  if (t) setAuthToken(t);
  return t;
}

// ---------------------------------------------------------
// Client hook (optional) to keep UI in sync with auth state
// ---------------------------------------------------------
import type { Dispatch, SetStateAction } from "react";

export type UseAuthState = {
  token: string | null;
  isAuthenticated: boolean;
  setToken: Dispatch<SetStateAction<string | null>>;
  clear: () => void;
};

/**
 * Small client-only hook to observe token state (cookie/localStorage changes across tabs).
 * Use inside client components (login/signup/profile dropdowns).
 */
export function useAuthState(): UseAuthState {
  if (!isBrowser) {
    // Non-reactive placeholder for server; avoids bundling "use client"
    return {
      token: null,
      isAuthenticated: false,
      setToken: () => {},
      clear: () => {},
    };
  }

  // Delay importing React to avoid marking the whole file as client
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require("react") as typeof import("react");
  const { useEffect, useState } = React;

  const [token, setToken] = useState<string | null>(() => getClientToken());
  const isAuthenticated = !!token;

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (
        AUTH_COOKIE_CANDIDATES.includes(e.key as any) ||
        ["AUTH_TOKEN", "token", "authToken", "access_token"].includes(e.key)
      ) {
        setToken(getClientToken());
      }
      // Generic sync on any storage change
      if (e.key === null) setToken(getClientToken());
    };

    const onVisibility = () => setToken(getClientToken());

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const clear = () => {
    clearAuthToken();
    setToken(getClientToken());
  };

  return { token, isAuthenticated, setToken, clear };
}
