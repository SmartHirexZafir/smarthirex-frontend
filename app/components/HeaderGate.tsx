"use client";

import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Gates for headers based on route.
 *
 * - MarketingHeaderGate => shows children ONLY on marketing/public routes
 * - AppHeaderGate       => shows children ONLY on app (post-login) routes
 *
 * Update patterns below if you add new routes.
 *
 * Changes (Req. 1):
 * - Hide restricted nav (children) when not authenticated.
 * - Optional: client-side guard to replace to /login if user is unauth on app routes.
 */

// App/product routes (post-login)
const APP_ROUTES: RegExp[] = [
  /^\/candidate\/[^/]+(\/.*)?$/,
  /^\/upload(\/.*)?$/,
  /^\/history(\/.*)?$/,
  /^\/test(\/.*)?$/,
  /^\/meetings(\/.*)?$/,
  /^\/client(\/.*)?$/,
  /^\/dashboard(\/.*)?$/,
  /^\/jobs(\/.*)?$/,
  /^\/settings(\/.*)?$/,
  /^\/profile(\/.*)?$/,
];

// Marketing/public routes (pre-login)
const MARKETING_ROUTES: RegExp[] = [
  /^\/$/,                         // landing
  /^\/marketing(\/.*)?$/,         // marketing pages
  /^\/landing(\/.*)?$/,           // alt landing pages
  /^\/login(\/.*)?$/,             // auth pages
  /^\/signup(\/.*)?$/,
];

// simple client-side check for presence of the backend auth cookie
const AUTH_COOKIE = "token";
function hasAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  // fast path: exact cookie name match
  return document.cookie.split("; ").some((c) => c.startsWith(`${AUTH_COOKIE}=`));
}

function useFlags() {
  const pathname = usePathname() || "/";
  const isApp = useMemo(() => APP_ROUTES.some((r) => r.test(pathname)), [pathname]);
  const isMarketing = useMemo(() => MARKETING_ROUTES.some((r) => r.test(pathname)), [pathname]);
  return { isApp, isMarketing, pathname };
}

/** Shows children only on app routes and only when authenticated */
export function AppHeaderGate({ children }: PropsWithChildren) {
  const { isApp, pathname } = useFlags();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean>(false);

  // initialize and refresh auth state on visibility changes (cookie may change after login/logout)
  useEffect(() => {
    setAuthed(hasAuthCookie());
    const onVis = () => setAuthed(hasAuthCookie());
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Optional guard: if user is on an app route but not authenticated, route to /login
  useEffect(() => {
    if (isApp && !authed) {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const next = `${pathname}${search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [isApp, authed, pathname, router]);

  if (!isApp) return null;
  if (!authed) return null; // hide restricted nav links when not authenticated

  return <>{children}</>;
}

/** Shows children only on marketing/public routes */
export function MarketingHeaderGate({ children }: PropsWithChildren) {
  const { isApp } = useFlags();
  if (isApp) return null;
  return <>{children}</>;
}

export default AppHeaderGate;
