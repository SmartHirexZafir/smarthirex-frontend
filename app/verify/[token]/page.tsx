// app/verify/[token]/page.tsx
'use client';

import React, { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Clean, single-call verification:
 * - Extract token from param
 * - Make ONE request:  GET /auth/verify?token=...
 * - Backend may 307-redirect → we push to /login?verified=1
 * - StrictMode double-render guard prevents duplicate requests
 */

type VerifyResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function apiBase() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');
}

async function safeJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { __raw: text }; }
}

export default function VerifyPage({ params }: { params: Promise<{ token: string }> | { token: string } }) {
  const router = useRouter();

  // ✅ Next.js 15: unwrap params (which can be a Promise) with React.use()
  const resolvedParams = typeof (params as any)?.then === 'function' ? use(params as Promise<{ token: string }>) : (params as { token: string });
  const token = resolvedParams?.token ?? '';

  const [status, setStatus] = useState<'idle' | 'verifying' | 'done'>('idle');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [countdown, setCountdown] = useState(4);
  const called = useRef(false); // ✅ prevents double requests in React Strict Mode

  useEffect(() => {
    if (!token || called.current) return;
    called.current = true;

    let cancelled = false;

    (async () => {
      setStatus('verifying');
      const BASE = apiBase();
      const url = `${BASE}/auth/verify?token=${encodeURIComponent(token)}`;

      try {
        const res = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          credentials: 'include',
          cache: 'no-store',
          headers: { Accept: 'application/json' }, // helps backend return JSON instead of 307
        });

        // If backend issues 3xx to FE login, navigate locally
        if (res.redirected || (res.status >= 300 && res.status < 400)) {
          if (!cancelled) router.replace('/login?verified=1');
          return;
        }

        if (!res.ok) {
          const data = await safeJson(res);
          const msg =
            (data as any)?.detail ||
            (data as any)?.message ||
            'Verification failed';
          throw new Error(msg);
        }

        // 200 OK case (backend returned JSON)
        try {
          const data = await res.json();
          const msg = data?.message || 'Email verified successfully';
          if (!cancelled) {
            setResult({ ok: true, message: msg });
            setStatus('done');
          }
        } catch {
          // even if body is empty, consider it success
          if (!cancelled) {
            setResult({ ok: true, message: 'Email verified successfully' });
            setStatus('done');
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setResult({ ok: false, message: err?.message || 'Verification failed' });
          setStatus('done');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [token, router]);

  // Auto-redirect on success
  useEffect(() => {
    if (status !== 'done' || !result?.ok) return;

    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          router.replace('/login?verified=1');
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [status, result?.ok, router]);

  const isVerifying = status === 'verifying' || status === 'idle';
  const success = result?.ok;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
            <i className="ri-shield-check-line text-white text-2xl" />
          </div>
        </div>

        {isVerifying && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email…</h1>
            <p className="text-gray-600 mb-6">
              Please wait while we confirm your verification link.
            </p>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </>
        )}

        {!isVerifying && success && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified ✅</h1>
            <p className="text-gray-600 mb-4">
              {(result?.message as string) || 'Your email has been verified successfully.'}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to sign in in <span className="font-semibold">{countdown}</span>s…
            </p>
            <div className="mt-6">
              <Link
                href="/login?verified=1"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Go to Login
              </Link>
            </div>
          </>
        )}

        {!isVerifying && !success && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-red-600 mb-4">
              {result?.message || 'The verification link is invalid or expired.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition"
              >
                Back to Signup
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Go to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
