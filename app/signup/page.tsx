'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    jobTitle: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string>(''); // shows the success screen
  const [successEmail, setSuccessEmail] = useState<string>('');     // store email to display

  // On mount: if signup already completed earlier, keep success screen (prevents back → form)
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('signup_success_email') : null;
    if (saved) {
      setSuccessEmail(saved);
      setSuccessMessage('SmartHirex has sent you a verification email. Please check your inbox to continue.');
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Signup failed');

      // ✅ Success: lock the page into a "check email" state (no login links here)
      const email = formData.email;
      setSuccessEmail(email);
      setSuccessMessage('SmartHirex has sent you a verification email. Please check your inbox to continue.');

      // Clear form fields (optional)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        company: '',
        jobTitle: ''
      });

      // Persist success so Back button won't reopen the form
      if (typeof window !== 'undefined') {
        localStorage.setItem('signup_success_email', email);
        // Replace current history state so going "Back" won't reveal the form state
        window.history.replaceState({}, '', '/signup');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
              <i className="ri-brain-line text-white text-2xl"></i>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent font-pacifico">
              SmartHirex
            </span>
          </Link>
        </div>

        {/* ✅ If success: show ONLY the check-email screen (no login button/link here) */}
        {successMessage ? (
          <div className="bg-white py-10 px-6 shadow-xl rounded-2xl border border-gray-100 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Check your email 📧</h2>
            <p className="text-gray-700">
              Verification email has been sent to <span className="font-semibold">{successEmail}</span>.
            </p>
            <p className="text-gray-600 mt-2">
              Please open your inbox and click the verification link to proceed. Login is only possible via the email link.
            </p>
            {/* Intentionally no login button/link here */}
          </div>
        ) : (
          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  required
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* When success screen is showing, do NOT show any login link */}
        {!successMessage && (
          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <span className="text-gray-500">Login is only possible via the verification email.</span>
          </div>
        )}
      </div>
    </div>
  );
}
