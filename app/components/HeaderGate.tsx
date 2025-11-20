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

// Check for auth token in localStorage (backend sets httponly cookie, but we can't read it client-side)
// Middleware handles actual auth checks server-side
function hasAuthToken(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!localStorage.getItem("token");
  } catch {
    return false;
  }
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
  const [checking, setChecking] = useState<boolean>(true);

  // Initialize auth state from localStorage (middleware handles actual auth server-side)
  useEffect(() => {
    setAuthed(hasAuthToken());
    setChecking(false);
    
    // Listen for storage changes (e.g., after login/logout)
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        setAuthed(!!e.newValue);
      }
    };
    window.addEventListener("storage", onStorageChange);
    
    return () => {
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

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
