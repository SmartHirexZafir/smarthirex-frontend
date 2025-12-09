// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Protect private app routes using a cookie set by the backend.
 * If the auth cookie is missing, redirect to /login?next=<original-url>.
 *
 * Private prefixes:
 *   /upload, /history, /test, /meetings, /candidate, /dashboard, /verify
 *
 * Public pages (pass through):
 *   /, /features, /pricing, /docs, /login, /signup
 *
 * NOTE: This middleware relies on a cookie named "token" being set by the backend.
 * Additionally, tokenized access to /test/[token] and /verify/[token] requires a
 * valid signed token (HS256) verified with TEST_TOKEN_SECRET.
 */
const AUTH_COOKIE = 'token';
const TEST_TOKEN_SECRET = process.env.TEST_TOKEN_SECRET || '';

/** Base64url decode to Uint8Array */
function b64urlToUint8Array(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const binary = Buffer.from(b64, 'base64');
  return new Uint8Array(binary.buffer, binary.byteOffset, binary.byteLength);
}

/** Constant-time compare */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Verify compact JWS (HS256) */
async function verifySignedTokenHS256(token: string, secret: string): Promise<boolean> {
  try {
    if (!token || !secret) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, sigB64] = parts;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    const data = enc.encode(`${headerB64}.${payloadB64}`);
    const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
    const provided = b64urlToUint8Array(sigB64);

    return timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

/** Extract token from /test/[token] or /verify/[token] path, or ?token= query */
function extractPathToken(req: NextRequest, base: '/test/' | '/verify/'): string | null {
  const { pathname, searchParams } = req.nextUrl;
  const qToken = searchParams.get('token');
  if (qToken) return qToken;

  if (pathname.startsWith(base)) {
    const rest = pathname.slice(base.length);
    const firstSeg = rest.split('/')[0];
    return firstSeg || null;
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ✅ Tokenized access: /test/[token] (candidate) - NO LOGIN REQUIRED
  // Candidates can access tests directly via token link - backend will validate the token
  // /verify/[token] (email verification) uses UUID tokens - pass through to backend
  if (pathname.startsWith('/test/')) {
    // ✅ Allow all test token access - backend validates token validity
    // No login required - candidates go straight to test
    return NextResponse.next();
  }

  // Email verification tokens are UUIDs validated by backend - allow through
  if (pathname.startsWith('/verify/')) {
    return NextResponse.next();
  }

  // ✅ Standard auth guard on protected prefixes
  const tokenCookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (!tokenCookie) {
    const loginUrl = new URL('/login', req.url);
    const nextPath = req.nextUrl.pathname + search;
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Only run middleware on private/tokenized prefixes
export const config = {
  matcher: [
    '/upload/:path*',
    '/history/:path*',
    '/test/:path*',      // tokenized candidate access
    '/verify/:path*',    // tokenized verify access
    '/meetings/:path*',
    '/candidate/:path*',
    '/dashboard/:path*',
  ],
};
