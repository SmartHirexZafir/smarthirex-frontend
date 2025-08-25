"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

/**
 * Gates for headers based on route.
 *
 * - MarketingHeaderGate => shows children ONLY on marketing/public routes
 * - AppHeaderGate       => shows children ONLY on app (post-login) routes
 *
 * Update patterns below if you add new routes.
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

function useFlags() {
  const pathname = usePathname() || "/";
  const isApp = APP_ROUTES.some((r) => r.test(pathname));
  const isMarketing = MARKETING_ROUTES.some((r) => r.test(pathname));
  return { isApp, isMarketing };
}

/** Shows children only on app routes */
export function AppHeaderGate({ children }: PropsWithChildren) {
  const { isApp } = useFlags();
  if (!isApp) return null;
  return <>{children}</>;
}

/** Shows children only on marketing/public routes */
export function MarketingHeaderGate({ children }: PropsWithChildren) {
  const { isApp } = useFlags();
  if (isApp) return null;
  return <>{children}</>;
}

export default AppHeaderGate;
