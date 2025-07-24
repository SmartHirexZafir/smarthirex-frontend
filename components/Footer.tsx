
'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="ri-brain-line text-white text-xl"></i>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-pacifico">
                SmartHirex
              </span>
            </Link>
            <p className="text-gray-300 text-lg mb-8 max-w-md leading-relaxed">
              Revolutionizing recruitment with AI-powered solutions that help companies find, evaluate, and hire the best talent faster than ever before.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a href="#" className="group w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-110 shadow-lg">
                <i className="ri-twitter-x-line text-lg text-white"></i>
              </a>
              <a href="#" className="group w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-110 shadow-lg">
                <i className="ri-linkedin-fill text-lg text-white"></i>
              </a>
              <a href="#" className="group w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-110 shadow-lg">
                <i className="ri-facebook-fill text-lg text-white"></i>
              </a>
              <a href="#" className="group w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-110 shadow-lg">
                <i className="ri-youtube-fill text-lg text-white"></i>
              </a>
              <a href="#" className="group w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-110 shadow-lg">
                <i className="ri-instagram-line text-lg text-white"></i>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-xl mb-6 text-white">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/upload" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Resume Upload</Link></li>
              <li><Link href="/history" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Search History</Link></li>
              <li><Link href="/meetings" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Meeting Hub</Link></li>
              <li><Link href="/candidate/1" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Candidate View</Link></li>
              <li><Link href="/analytics" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Analytics</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-xl mb-6 text-white">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">About Us</Link></li>
              <li><Link href="/careers" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Careers</Link></li>
              <li><Link href="/blog" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Blog</Link></li>
              <li><Link href="/news" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">News</Link></li>
              <li><Link href="/investors" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Investors</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-bold text-xl mb-6 text-white">Support</h4>
            <ul className="space-y-3">
              <li><Link href="/help" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Help Center</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Contact Us</Link></li>
              <li><Link href="/documentation" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Documentation</Link></li>
              <li><Link href="/community" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Community</Link></li>
              <li><Link href="/status" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">System Status</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-gray-700 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Stay Updated</h3>
              <p className="text-gray-300">Get the latest updates on AI recruitment trends and SmartHirex features.</p>
            </div>
            <div className="flex space-x-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-300"
              />
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 SmartHirex. All rights reserved. Made with ❤️ for better hiring.
            </p>
            <div className="flex space-x-8">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">
                Terms of Service
              </Link>
              <Link href="/security" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">
                Security
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}