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
  /^\/analytics(\/.*)?$/, // added to align with footer/app links
];

// Marketing/public routes (pre-login)
const MARKETING_ROUTES: RegExp[] = [
  /^\/$/,                         // landing
  /^\/marketing(\/.*)?$/,         // marketing pages
  /^\/landing(\/.*)?$/,           // alt landing pages

  // Auth flows (public)
  /^\/login(\/.*)?$/,
  /^\/signup(\/.*)?$/,

  // Common public/marketing sections used in header/footer
  /^\/features(\/.*)?$/,
  // "Components" nav item is removed per requirements, so we do NOT list it here.
  /^\/pricing(\/.*)?$/,
  /^\/docs(\/.*)?$/,

  /^\/about(\/.*)?$/,
  /^\/careers(\/.*)?$/,
  /^\/press(\/.*)?$/,

  /^\/guides(\/.*)?$/,
  /^\/support(\/.*)?$/,
  /^\/help(\/.*)?$/,
  /^\/contact(\/.*)?$/,
  /^\/documentation(\/.*)?$/,
  /^\/community(\/.*)?$/,

  /^\/privacy(\/.*)?$/,
  /^\/terms(\/.*)?$/,
  /^\/cookies(\/.*)?$/,
  /^\/security(\/.*)?$/,
  /^\/status(\/.*)?$/,

  /^\/blog(\/.*)?$/,
  /^\/news(\/.*)?$/,
  /^\/investors(\/.*)?$/,

  /^\/roadmap(\/.*)?$/,
  /^\/changelog(\/.*)?$/,
];

function useFlags() {
  const raw = usePathname() || "/";
  const pathname = raw.toLowerCase();

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
  const { isApp, isMarketing } = useFlags();
  // Show marketing header if explicitly a marketing route,
  // or when NOT in app routes (acts as a safe default for unknown public pages).
  if (isApp) return null;
  if (!isMarketing) {
    // Non-app & unknown route -> still show marketing header (public)
    return <>{children}</>;
  }
  return <>{children}</>;
}

export default AppHeaderGate;
