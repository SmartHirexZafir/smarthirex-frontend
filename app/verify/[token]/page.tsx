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

export default function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }> | { token: string };
}) {
  const router = useRouter();

  // ✅ Next.js 15: unwrap params (which can be a Promise) with React.use()
  const resolvedParams =
    typeof (params as any)?.then === 'function'
      ? use(params as Promise<{ token: string }>)
      : (params as { token: string });
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
          headers: { Accept: 'application/json' },
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
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 gap-8 py-10 px-4 sm:px-8">
      {/* Left: Brand / Hero (same look as login/signup) */}
      <section className="relative hidden lg:flex panel overflow-hidden items-center justify-center rounded-3xl">
        <div className="absolute inset-0 bg-luxe-radial opacity-70 pointer-events-none" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-20 gradient-ink" />
        <div className="relative z-10 p-12 max-w-xl">
          <Link href="/" className="inline-flex items-center gap-3 mb-10">
            <span className="h-14 w-14 rounded-2xl grid place-items-center gradient-ink shadow-glow">
              <i className="ri-brain-line text-white text-2xl" />
            </span>
            <span className="text-4xl font-bold gradient-text font-pacifico">SmartHirex</span>
          </Link>

          <h1 className="text-4xl font-semibold leading-tight mb-4">
            {isVerifying ? (
              <>Verifying your <span className="gradient-text">email</span>…</>
            ) : success ? (
              <>Email <span className="gradient-text">verified</span> successfully</>
            ) : (
              <>Verification <span className="gradient-text">failed</span></>
            )}
          </h1>

          <p className="text-muted-foreground mb-8">
            {isVerifying
              ? 'Please wait while we confirm your verification link.'
              : success
              ? 'Your account is now active. Sign in to access your hiring cockpit.'
              : 'The verification link may be invalid or expired.'}
          </p>

          <ul className="grid gap-4">
            {[
              { icon: 'ri-shield-check-line', text: 'Secure account & encrypted sessions' },
              { icon: 'ri-sparkling-2-line', text: 'AI-powered shortlisting' },
              { icon: 'ri-line-chart-line', text: 'Pipeline insights & analytics' },
            ].map((f, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-[hsl(var(--muted))/0.35] ring-1 ring-border">
                <span className="mt-0.5 h-8 w-8 rounded-xl grid place-items-center bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
                  <i className={f.icon} />
                </span>
                <p className="text-sm">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Right: Verification Card */}
      <section className="flex items-center">
        <div className="w-full">
          <div className="card p-8 sm:p-10 text-center">
            <div
              className={`mx-auto mb-6 h-14 w-14 rounded-2xl grid place-items-center shadow-soft
                ${
                  isVerifying
                    ? 'bg-[hsl(var(--info))] text-[hsl(var(--info-foreground))]'
                    : success
                    ? 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]'
                    : 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]'
                }`}
            >
              <i
                className={
                  isVerifying
                    ? 'ri-shield-line text-2xl'
                    : success
                    ? 'ri-shield-check-line text-2xl'
                    : 'ri-close-circle-line text-2xl'
                }
              />
            </div>

            {isVerifying && (
              <>
                <h1 className="text-2xl font-semibold mb-2">Verifying your email…</h1>
                <p className="text-muted-foreground mb-6">
                  Please wait while we confirm your verification link.
                </p>
                <div className="w-16 h-16 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto" />
              </>
            )}

            {!isVerifying && success && (
              <>
                <h1 className="text-2xl font-semibold mb-2">Email Verified <span className="align-middle">✅</span></h1>
                <p className="text-muted-foreground">
                  {result?.message || 'Your email has been verified successfully.'}
                </p>

                <p className="mt-6 text-sm text-muted-foreground">
                  Redirecting to sign in in <span className="font-medium">{countdown}</span>s…
                </p>

                <Link
                  href="/login?verified=1"
                  className="btn-primary inline-flex items-center justify-center mt-6 px-5 py-3 rounded-2xl"
                >
                  <i className="ri-login-circle-line mr-2" />
                  Go to Login
                </Link>
              </>
            )}

            {!isVerifying && !success && (
              <>
                <h1 className="text-2xl font-semibold mb-2">Verification Failed</h1>
                <p className="text-[hsl(var(--destructive))] mb-4">
                  {result?.message || 'The verification link is invalid or expired.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/signup"
                    className="btn-outline px-5 py-2.5 rounded-2xl"
                  >
                    Back to Signup
                  </Link>
                  <Link
                    href="/login"
                    className="btn-primary px-5 py-2.5 rounded-2xl"
                  >
                    Go to Login
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} SmartHirex. All rights reserved.
          </div>
        </div>
      </section>
    </div>
  );
}
