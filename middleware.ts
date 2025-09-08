// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Protect private app routes using a cookie set by the backend.
 * If the auth cookie is missing, redirect to /login?next=<original-url>.
 *
 * Private prefixes:
 *   /upload, /history, /test, /meetings, /candidate, /dashboard
 *
 * Public pages (pass through):
 *   /, /features, /pricing, /docs, /login, /signup, /verify/*
 *
 * NOTE: This middleware relies on a cookie named "token" being set by the backend.
 */
const AUTH_COOKIE = 'token';

export function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    // preserve full original path + query
    const nextPath = req.nextUrl.pathname + req.nextUrl.search;
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Only run middleware on private prefixes
export const config = {
  matcher: [
    '/upload/:path*',
    '/history/:path*',
    '/test/:path*',
    '/meetings/:path*',
    '/candidate/:path*',
    '/dashboard/:path*',
  ],
};
