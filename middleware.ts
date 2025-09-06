// middleware.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Public routes that never require auth.
 * Everything else is considered protected (upload, history, candidate, meetings, dashboard, etc.).
 */
const PUBLIC_ROUTES = new Set<string>([
  "/",
  "/login",
  "/signup",
  "/features",
  "/pricing",
  "/docs",
]);

/** Path prefixes that are protected (must be authenticated). */
const PROTECTED_PREFIXES = [
  "/upload",
  "/history",
  "/candidate",
  "/test",
  "/meetings",
  "/dashboard",
  "/profile",
];

/** All the cookie names we consider as an auth token (kept in sync with client code). */
const AUTH_COOKIE_CANDIDATES = ["AUTH_TOKEN", "token", "authToken", "access_token"];

/** Global theme name for Neon Eclipse (data-theme). */
const THEME_NAME = "neon-eclipse";

/** Returns true if URL path is public. */
function isPublicPath(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  // Allow /docs/xyz, /features/xyz, etc. by prefix
  if (pathname.startsWith("/docs/")) return true;
  if (pathname.startsWith("/features/")) return true;
  if (pathname.startsWith("/pricing/")) return true;
  return false;
}

/** Returns true if URL path matches a protected prefix. */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Check if the request has any recognized auth cookie set. */
function hasAuthCookie(req: NextRequest): boolean {
  const cookies = req.cookies;
  return AUTH_COOKIE_CANDIDATES.some((name) => {
    const v = cookies.get(name)?.value;
    return typeof v === "string" && v.length > 0;
  });
}

export function middleware(req: NextRequest) {
  const { nextUrl: url } = req;
  const { pathname, search } = url;

  // Skip all Next.js internal & assets (handled by config.matcher but keep a defensive guard)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/api") || // Next API routes (if any in this project) should not be gated here
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Normalize origin for redirects
  const origin = `${url.protocol}//${url.host}`;

  const authed = hasAuthCookie(req);
  const publicPath = isPublicPath(pathname);
  const protectedPath = isProtectedPath(pathname);

  // 1) If user is authenticated and tries to visit login/signup/landing,
  //    redirect them to the app entry (upload by default) so the flow is consistent.
  if (authed && (pathname === "/login" || pathname === "/signup" || pathname === "/")) {
    const target = "/upload";
    const to = new URL(target, origin);
    return NextResponse.redirect(to);
  }

  // 2) If unauthenticated and trying to hit a protected route, redirect into auth.
  if (!authed && protectedPath) {
    // Special case per requirements: Upload must funnel to Sign Up (Get Started).
    const wantsUpload = pathname === "/upload" || pathname.startsWith("/upload/");
    const authTarget = wantsUpload ? "/signup" : "/login";

    const to = new URL(authTarget, origin);
    // Preserve intended destination so we can send them there after auth.
    to.searchParams.set("next", pathname + search);
    return NextResponse.redirect(to);
  }

  // 3) Public routes: allow through
  if (publicPath || !protectedPath) {
    // Also, set site-wide theme cookies/headers for Neon Eclipse (non-invasive).
    const res = NextResponse.next();

    // Set a lightweight cookie indicating the global theme family (readable by any runtime if needed)
    if (!req.cookies.get("theme_name")) {
      res.cookies.set("theme_name", THEME_NAME, {
        path: "/",
        sameSite: "lax",
      });
    }
    // If there's no theme mode cookie, default to system-agnostic "dark" for a crisp Neon Eclipse look.
    if (!req.cookies.get("theme")) {
      res.cookies.set("theme", "dark", { path: "/", sameSite: "lax" });
    }

    // Small header your app/layout can optionally read (no requirement to use it).
    res.headers.set("x-ui-theme", THEME_NAME);

    return res;
  }

  // Default allow (shouldn't be reached due to guards above)
  return NextResponse.next();
}

/**
 * Match all routes except:
 *  - Next internals (_next/static, _next/image)
 *  - Common static assets and metadata files
 *  - API routes (we don't want to intercept those at the edge here)
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets|public|api).*)",
  ],
};
