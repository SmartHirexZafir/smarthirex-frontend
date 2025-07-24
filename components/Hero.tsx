
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen flex items-center overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
              <i className="ri-star-line mr-2"></i>
              AI-Powered Recruitment Revolution
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-8">
              Hire <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Smarter</span>,
              <br />
              Not <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Harder</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-2xl">
              Transform your recruitment process with AI that screens thousands of resumes in seconds, scores candidates intelligently, and finds your perfect match.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 mb-12">
              <Link href="/signup" className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl text-center whitespace-nowrap">
                <span className="flex items-center justify-center">
                  <i className="ri-rocket-line mr-3 text-xl"></i>
                  Start Free Trial
                </span>
              </Link>
              <Link href="/upload" className="group border-2 border-gray-300 text-gray-700 px-10 py-5 rounded-2xl font-bold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-center whitespace-nowrap">
                <span className="flex items-center justify-center">
                  <i className="ri-upload-cloud-line mr-3 text-xl"></i>
                  Upload Resume
                </span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">500K+</div>
                <div className="text-gray-600 text-sm">Resumes Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
                <div className="text-gray-600 text-sm">Match Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">10x</div>
                <div className="text-gray-600 text-sm">Faster Hiring</div>
              </div>
            </div>
          </div>
          
          {/* Image */}
          <div className={`relative transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur opacity-20"></div>
              <img 
                src="https://readdy.ai/api/search-image?query=modern%20AI%20recruitment%20dashboard%20with%20holographic%20interface%20displaying%20candidate%20profiles%20and%20analytics%2C%20futuristic%20HR%20technology%20workspace%20with%20floating%20data%20visualizations%2C%20sleek%20professional%20business%20environment%20with%20digital%20screens%20showing%20resume%20analysis%2C%20advanced%20artificial%20intelligence%20hiring%20platform%20interface%2C%20clean%20modern%20office%20setting%20with%20blue%20and%20purple%20ambient%20lighting%2C%20sophisticated%20recruitment%20technology%20visualization%2C%20professional%20AI%20powered%20hiring%20dashboard%2C%20cutting-edge%20HR%20management%20system%20interface&width=800&height=600&seq=hero-redesign-001&orientation=landscape"
                alt="SmartHirex AI Platform"
                className="relative w-full h-auto rounded-3xl shadow-2xl"
              />
              
              {/* Floating Cards */}
              <div className="absolute -top-8 -left-8 bg-white rounded-2xl p-6 shadow-xl animate-bounce">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="ri-check-line text-green-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">98% Match Found</div>
                    <div className="text-xs text-gray-500">React Developer</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-8 -right-8 bg-white rounded-2xl p-6 shadow-xl animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="ri-time-line text-blue-600"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">5 Min Saved</div>
                    <div className="text-xs text-gray-500">Per Resume</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}