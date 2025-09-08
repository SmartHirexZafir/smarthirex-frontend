// app/(auth)/login/page.tsx

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(''); // success/info banner
  const [verifPending, setVerifPending] = useState(false); // show resend button state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  // --- Google profile completion modal state ---
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');

  const API_BASE = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, ''),
    []
  );

  // If redirected from verify page like /login?verified=1, show success info
  useEffect(() => {
    if (searchParams?.get('verified') === '1') {
      setInfo('Your email has been verified. Please sign in to continue.');
    }
  }, [searchParams]);

  // Helper: robust JSON parsing
  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { __raw: text };
    }
  };

  // Helper: authorized fetch for OAuth-protected endpoints (sends JWT if present and includes cookies)
  const authFetch = async (url: string, init?: RequestInit) => {
    const token = (typeof window !== 'undefined' && localStorage.getItem('token')) || '';
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, {
      credentials: 'include',
      ...init,
      headers,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setResendMsg('');
    setVerifPending(false);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeJson(res);

      // If backend enforces email verification, it should return 403
      if (res.status === 403) {
        const detail = (data as any)?.detail || 'Email not verified';
        setError(detail);
        setVerifPending(true); // show resend button
        return;
      }

      if (!res.ok) {
        throw new Error((data as any)?.detail || 'Login failed');
      }

      // Success -> keep your existing behavior
      localStorage.setItem('token', (data as any).token);
      localStorage.setItem('user', JSON.stringify((data as any).user));
      router.push('/upload');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendMsg('');
    setResendLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }), // uses the email user typed
      });
      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error((data as any)?.detail || 'Failed to resend verification email');
      }
      setResendMsg('Verification email sent. Please check your inbox.');
    } catch (err: any) {
      setResendMsg(err.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  // --- Login with Google: start OAuth flow by redirecting to backend ---
  const handleGoogleLogin = () => {
    // After OAuth, backend should redirect back to this page with ?oauth=google&token=...&needs_profile=0|1
    const redirectUrl = `${window.location.origin}/login`;
    const url = `${API_BASE}/auth/google?redirect_url=${encodeURIComponent(redirectUrl)}`;
    window.location.href = url;
  };

  // --- After OAuth redirect: detect params, store token, fetch user, and decide if profile modal is needed ---
  useEffect(() => {
    const provider =
      (searchParams?.get('oauth') || searchParams?.get('provider') || '').toLowerCase();
    const isGoogle =
      provider === 'google' ||
      searchParams?.get('google') === '1' ||
      searchParams?.get('g') === 'google';

    // Token might come as ?token=... or ?jwt=... or ?access_token=...
    const tokenParam =
      searchParams?.get('token') ||
      searchParams?.get('jwt') ||
      searchParams?.get('access_token') ||
      '';

    const needsProfileParam = searchParams?.get('needs_profile') || '';

    // Only run when redirected from Google OR when token is present
    if (!isGoogle && !tokenParam) return;

    (async () => {
      try {
        if (tokenParam) {
          localStorage.setItem('token', tokenParam);
        }

        // Try to get current user from backend
        const res = await authFetch(`${API_BASE}/auth/me`, { method: 'GET' });
        const data = await safeJson(res);

        // Accept either { user: {...} } or the user object directly
        const user = (data as any)?.user ?? data;

        // Keep any pre-filled values if backend provides them
        if (user?.name) setFullName(user.name);
        if (user?.role) setRole(user.role);
        if (user?.company) setCompany(user.company);

        const needsProfileExplicit =
          needsProfileParam === '1' || needsProfileParam === 'true';
        const missingProfile = !user?.name || !user?.role || !user?.company;

        if (needsProfileExplicit || missingProfile) {
          // Ask for profile completion
          setProfileOpen(true);
        } else {
          // Fully ready; persist and continue
          localStorage.setItem('user', JSON.stringify(user));
          router.push('/upload');
        }
      } catch {
        // If anything fails, still allow user to complete profile so they can proceed
        setProfileOpen(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileLoading(true);
    try {
      if (!fullName?.trim() || !role?.trim() || !company?.trim()) {
        throw new Error('Please provide your name, role, and company.');
      }

      const res = await authFetch(`${API_BASE}/auth/complete-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          role: role.trim(),
          company: company.trim(),
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error((data as any)?.detail || 'Failed to save your profile');
      }

      const user = (data as any)?.user ?? data;
      localStorage.setItem('user', JSON.stringify(user));

      setProfileOpen(false);
      router.push('/upload');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to save your profile');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 gap-8">
      {/* Left: Brand / Hero (neutral panel background only) */}
      <section className="relative hidden lg:flex rounded-3xl panel overflow-hidden items-center justify-center">
        <div className="relative z-10 p-8 max-w-xl">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <span className="h-14 w-14 rounded-2xl shadow-glow grid place-items-center gradient-ink">
              <i className="ri-brain-line text-[hsl(var(--primary-foreground))] text-2xl" />
            </span>
            <span className="text-4xl font-bold gradient-text">SmartHirex</span>
          </Link>

          <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-3">
            Welcome back to your <span className="gradient-text">hiring cockpit</span>
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-6">
            Upload resumes, filter, score & schedule — all in one place. Secure, fast and
            delightful.
          </p>

          <ul className="grid gap-3">
            {[
              { icon: 'ri-sparkling-2-line', text: 'AI-powered shortlisting with explainability' },
              { icon: 'ri-shield-keyhole-line', text: 'Enterprise-grade security & SSO ready' },
              { icon: 'ri-zoom-in-line', text: 'Beautiful analytics & pipeline visibility' },
            ].map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-2xl bg-[hsl(var(--muted))/0.35] ring-1 ring-border"
              >
                <span className="mt-0.5 h-8 w-8 rounded-xl grid place-items-center bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
                  <i className={f.icon} />
                </span>
                <p className="text-sm">{f.text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <i className="ri-lock-2-line" />
            <span>We never store your password. Sessions are securely encrypted.</span>
          </div>
        </div>
      </section>

      {/* Right: Auth Card */}
      <section className="flex items-center">
        <div className="w-full">
          <div className="card p-6 sm:p-8 shadow-elev-2">
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl gradient-ink grid place-items-center shadow-soft">
                  <i className="ri-login-circle-line text-[hsl(var(--primary-foreground))] text-xl" />
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-semibold">Sign in</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Access your SmartHirex workspace
                  </p>
                </div>
              </div>
            </div>

            {/* Info banner (e.g., after verification) */}
            {info && (
              <div className="mb-4 rounded-2xl bg-[hsl(var(--success))/0.12] ring-1 ring-[hsl(var(--success))/0.35] px-4 py-3 text-sm text-[hsl(var(--success))]">
                <div className="flex items-start gap-2">
                  <i className="ri-check-double-line mt-0.5" />
                  <span>{info}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-2xl bg-[hsl(var(--destructive))/0.12] ring-1 ring-[hsl(var(--destructive))/0.35] px-4 py-3 text-sm text-[hsl(var(--destructive))]">
                <div className="flex items-start gap-2">
                  <i className="ri-error-warning-line mt-0.5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10 py-3"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <i className="ri-key-2-line absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10 pr-12 py-3"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost px-2 py-1 rounded-xl"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPass ? 'ri-eye-off-line' : 'ri-eye-line'} />
                  </button>
                </div>
              </div>

              {/* If email not verified, show resend control */}
              {verifPending && (
                <div className="rounded-2xl bg-[hsl(var(--info))/0.12] ring-1 ring-[hsl(var(--info))/0.35] px-4 py-3">
                  <div className="flex flex-col items-start gap-2 text-sm">
                    <div className="flex items-center gap-2 text-[hsl(var(--info))]">
                      <i className="ri-mail-send-line" />
                      <span>Email verification required</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendLoading || !email}
                        className="btn btn-outline px-3 py-1.5 rounded-xl text-xs"
                      >
                        {resendLoading ? 'Sending…' : 'Resend verification email'}
                      </button>
                      {resendMsg && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{resendMsg}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-[hsl(var(--primary))] focus:ring-ring border-input rounded"
                  />
                  Remember me
                </label>
                <Link href="/forgot-password" className="text-sm text-[hsl(var(--secondary))] hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 rounded-2xl transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:ring-offset-0"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-[hsl(var(--primary-foreground))/0.7] border-b-transparent" />
                    Signing…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <i className="ri-login-circle-line" />
                    Sign In
                  </span>
                )}
              </button>

              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-[hsl(var(--muted-foreground))]">or</span>
                </div>
              </div>

              {/* Social: Google with global btn-google */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="btn btn-google w-full"
                  aria-label="Sign in with Google"
                >
                  <i className="ri-google-fill" /> Login with Google
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[hsl(var(--primary))] hover:underline font-medium">
                Sign up now
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
            © {new Date().getFullYear()} SmartHirex. All rights reserved.
          </div>
        </div>
      </section>

      {/* Profile Completion Modal (shown after successful Login with Google if needed) */}
      {profileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[hsl(var(--background))/0.6]" />
          <div className="relative z-10 w-full max-w-lg card p-6 shadow-elev-3 rounded-3xl">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Complete your profile</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                You&apos;re signed in with Google. Please tell us a bit about you.
              </p>
            </div>

            {profileError && (
              <div className="mb-3 rounded-2xl bg-[hsl(var(--destructive))/0.12] ring-1 ring-[hsl(var(--destructive))/0.35] px-4 py-3 text-sm text-[hsl(var(--destructive))]">
                <div className="flex items-start gap-2">
                  <i className="ri-error-warning-line mt-0.5" />
                  <span>{typeof profileError === 'string' ? profileError : String(profileError)}</span>
                </div>
              </div>
            )}

            <form className="grid gap-4" onSubmit={handleCompleteProfile}>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  className="input py-3"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="role">
                    Role
                  </label>
                  <input
                    id="role"
                    className="input py-3"
                    placeholder="Recruiter / HRBP / Hiring Manager"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="company">
                    Company
                  </label>
                  <input
                    id="company"
                    className="input py-3"
                    placeholder="Acme Inc."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="btn-primary mt-2 w-full py-3 rounded-2xl"
              >
                {profileLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-[hsl(var(--primary-foreground))/0.7] border-b-transparent" />
                    Saving…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <i className="ri-check-line" />
                    Save and continue
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
