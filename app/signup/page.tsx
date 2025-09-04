'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const SUCCESS_KEY = 'signup_success_meta';          // { email: string, savedAt: number }
const SUCCESS_TTL_MS = 24 * 60 * 60 * 1000;         // 24 hours

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    jobTitle: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string>(''); // shows the success screen
  const [successEmail, setSuccessEmail] = useState<string>('');     // store email to display

  // purely-UI helpers (no backend change)
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // === Google login (only addition) ===
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');
  const handleGoogleLogin = () => {
    const redirectUrl = `${window.location.origin}/login`;
    window.location.href = `${API_BASE}/auth/google?redirect_url=${encodeURIComponent(redirectUrl)}`;
  };
  // ====================================

  // Ensure success lock only when recent + optional reset flag
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const reset = params.get('reset') === '1';

    const raw = localStorage.getItem(SUCCESS_KEY);
    if (reset) {
      localStorage.removeItem(SUCCESS_KEY);
      setSuccessMessage('');
      setSuccessEmail('');
      return;
    }

    if (raw) {
      try {
        const meta = JSON.parse(raw) as { email?: string; savedAt?: number };
        const fresh = meta?.savedAt && Date.now() - meta.savedAt < SUCCESS_TTL_MS;
        if (fresh && meta.email) {
          setSuccessEmail(meta.email);
          setSuccessMessage(
            'SmartHirex has sent you a verification email. Please check your inbox to continue.'
          );
        } else {
          localStorage.removeItem(SUCCESS_KEY); // expired -> unlock form
        }
      } catch {
        localStorage.removeItem(SUCCESS_KEY);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // visual-only password strength (does not affect submit)
  const passStrength = useMemo(() => {
    const p = formData.password || '';
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 5);
  }, [formData.password]);

  const strengthText = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong', 'Excellent'][passStrength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Signup failed');

      // ✅ Success: lock the page into a "check email" state (no login links here)
      const email = formData.email;
      setSuccessEmail(email);
      setSuccessMessage(
        'SmartHirex has sent you a verification email. Please check your inbox to continue.'
      );

      // Clear form fields (optional)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        company: '',
        jobTitle: '',
      });

      // Persist success so Back button won't reopen the form (with TTL)
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          SUCCESS_KEY,
          JSON.stringify({ email, savedAt: Date.now() })
        );
        // Replace current history state so going "Back" won't reveal the form state
        window.history.replaceState({}, '', '/signup');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  // allow user to unlock form manually (no backend change)
  const clearSuccessAndShowForm = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SUCCESS_KEY);
    }
    setSuccessMessage('');
    setSuccessEmail('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 gap-8 py-10 px-4 sm:px-8">
      {/* Left: Brand / Hero (same visuals) */}
      <section className="relative hidden lg:flex panel overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-luxe-radial opacity-70 pointer-events-none" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-20 gradient-ink" />
        <div className="relative z-10 p-12 max-w-xl">
          <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
            <span className="h-14 w-14 rounded-2xl grid place-items-center gradient-ink shadow-glow">
              <i className="ri-brain-line text-white text-2xl" />
            </span>
            <span className="text-4xl font-bold gradient-text font-pacifico group-hover:opacity-90 transition">
              SmartHirex
            </span>
          </Link>

          <h1 className="text-4xl font-semibold leading-tight mb-4">
            Create your <span className="gradient-text">recruiting HQ</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Collaborate on candidates, automate screening, and make faster, fairer hiring
            decisions — securely.
          </p>

          <ul className="grid gap-4">
            {[
              { icon: 'ri-magic-line', text: 'AI suggestions for better shortlists' },
              { icon: 'ri-file-shield-2-line', text: 'Privacy-first. Your data, your control.' },
              { icon: 'ri-line-chart-line', text: 'Pipeline insights & time-to-hire analytics' },
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

          <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
            <i className="ri-lock-2-line" />
            <span>No passwords stored. Tokens are securely encrypted.</span>
          </div>
        </div>
      </section>

      {/* Right: Card / Form */}
      <section className="flex items-center">
        <div className="w-full">
          {/* Success screen (unchanged layout) */}
          {successMessage ? (
            <div className="card p-10 text-center">
              <div className="mx-auto mb-6 h-14 w-14 rounded-2xl grid place-items-center bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                <i className="ri-mail-check-line text-2xl" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Check your email 📧</h2>
              <p>
                Verification email has been sent to <span className="font-semibold">{successEmail}</span>.
              </p>
              <p className="text-muted-foreground mt-2">
                Please open your inbox and click the verification link to proceed. Login is only possible via the email link.
              </p>

              {/* NEW: manual reset button (frontend-only) */}
              <button
                type="button"
                onClick={clearSuccessAndShowForm}
                className="mt-6 btn-outline px-4 py-2 rounded-xl text-sm"
                title="Use a different email"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div className="card p-8 sm:p-10">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl grid place-items-center gradient-ink text-white shadow-soft">
                    <i className="ri-user-add-line text-xl" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-semibold">Create your account</h2>
                    <p className="text-sm text-muted-foreground">Start hiring smarter with SmartHirex</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl bg-[hsl(var(--destructive))/0.12] ring-1 ring-[hsl(var(--destructive))/0.35] px-4 py-3 text-sm text-[hsl(var(--destructive))]">
                  <div className="flex items-start gap-2">
                    <i className="ri-error-warning-line mt-0.5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                      First Name
                    </label>
                    <div className="relative">
                      <i className="ri-user-3-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="input pl-10 py-3"
                        placeholder="Ayesha"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                      Last Name
                    </label>
                    <div className="relative">
                      <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="input pl-10 py-3"
                        placeholder="Khan"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="input pl-10 py-3"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium mb-1">
                      Company
                    </label>
                    <div className="relative">
                      <i className="ri-building-2-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="company"
                        name="company"
                        type="text"
                        required
                        value={formData.company}
                        onChange={handleChange}
                        className="input pl-10 py-3"
                        placeholder="Acme Inc."
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium mb-1">
                      Job Title
                    </label>
                    <div className="relative">
                      <i className="ri-id-card-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="jobTitle"
                        name="jobTitle"
                        type="text"
                        required
                        value={formData.jobTitle}
                        onChange={handleChange}
                        className="input pl-10 py-3"
                        placeholder="Talent Lead"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <i className="ri-key-2-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="password"
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="input pl-10 pr-12 py-3"
                      placeholder="Minimum 8 characters"
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

                  {/* visual strength bar only */}
                  <div className="mt-2">
                    <div className="h-2 rounded-full bg-[hsl(var(--muted))/0.6] overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-ink transition-all"
                        style={{ width: `${(passStrength / 5) * 100}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{strengthText}</div>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <i className="ri-shield-check-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`input pl-10 pr-12 py-3 ${
                        formData.confirmPassword && formData.confirmPassword === formData.password
                          ? 'ring-2 ring-[hsl(var(--success))]/40 border-[hsl(var(--success))]/40'
                          : ''
                      }`}
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 btn-ghost px-2 py-1 rounded-xl"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      <i className={showConfirm ? 'ri-eye-off-line' : 'ri-eye-line'} />
                    </button>
                  </div>

                  {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                    <p className="mt-1 text-xs text-[hsl(var(--destructive))] flex items-center gap-1">
                      <i className="ri-close-circle-line" /> Passwords do not match
                    </p>
                  )}
                  {formData.confirmPassword && formData.confirmPassword === formData.password && (
                    <p className="mt-1 text-xs text-[hsl(var(--success))] flex items-center gap-1">
                      <i className="ri-check-line" /> Looks good
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 rounded-2xl transition-transform hover:scale-[1.01] active:scale-[0.99] focus-visible:ring-offset-0"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/70 border-b-transparent" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <i className="ri-user-add-line" />
                      Create Account
                    </span>
                  )}
                </button>

                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground">
                      By continuing you agree to our terms
                    </span>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* When success screen is showing, do NOT show any login link */}
          {!successMessage && (
            <>
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <span className="opacity-80">Login is only possible via the verification email.</span>
              </div>

              {/* === Added Google at the END of signup page === */}
              <div className="mt-8 text-center">
                <div className="text-sm text-muted-foreground mb-2">Prefer single sign-on?</div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="btn-outline"
                  aria-label="Login with Google"
                >
                  <i className="ri-google-fill" /> Login with Google
                </button>
              </div>
              {/* ============================================== */}
            </>
          )}

          <div className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} SmartHirex. All rights reserved.
          </div>
        </div>
      </section>
    </div>
  );
}
