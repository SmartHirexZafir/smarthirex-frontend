'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
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

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // ✅ store user info

      router.push('/login'); // Redirect to login page
    } catch (err: any) {
      setError(err.message);
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-gray-600">Start your free trial today</p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input id="firstName" name="firstName" type="text" required value={formData.firstName} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input id="lastName" name="lastName" type="text" required value={formData.lastName} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none" />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input id="company" name="company" type="text" required value={formData.company} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none" />
            </div>

            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input id="jobTitle" name="jobTitle" type="text" required value={formData.jobTitle} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none" />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:outline-none" />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <div>
              <button type="submit" disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all">
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center text-sm text-gray-600">
          Already have an account? <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">Login here</Link>
        </div>
      </div>
    </div>
  );
}
