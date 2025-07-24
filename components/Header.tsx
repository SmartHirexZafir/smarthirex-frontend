
'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <i className="ri-brain-line text-white text-xl"></i>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent font-pacifico">
                SmartHirex
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-gray-700 hover:text-blue-700 font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:bg-blue-50 whitespace-nowrap">
              Login
            </Link>
            <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl whitespace-nowrap">
              Sign Up
            </Link>
          </div>

          <button 
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className="ri-menu-line text-2xl text-gray-700"></i>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-6 bg-white/95 backdrop-blur-sm">
            <div className="flex flex-col space-y-4">
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <Link href="/login" className="block text-gray-700 hover:text-blue-700 font-semibold py-2 transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-center hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}