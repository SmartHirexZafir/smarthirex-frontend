'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState('upload');

  useEffect(() => {
    const current = pathname?.split('/')[1];
    if (current) setActiveItem(current);
  }, [pathname]);

  const menuItems = [
    { id: 'upload', label: 'Upload CVs', icon: 'ri-upload-cloud-2-line', href: '/upload' },
    { id: 'history', label: 'Search History', icon: 'ri-history-line', href: '/history' },
    { id: 'meetings', label: 'Tests', icon: 'ri-file-text-line', href: '/meetings' }
  ];

  const handleNewJobPost = () => {
    // 🔁 Future logic: open modal or route
    alert('New job posting clicked!');
  };

  const handleExport = () => {
    // 🔁 Future logic: export current results
    alert('Export triggered!');
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white/90 backdrop-blur-md border-r border-gray-200/50 shadow-2xl z-50 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b border-gray-200/50 ${collapsed ? 'px-4' : ''}`}>
        {!collapsed && (
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
              <i className="ri-briefcase-line text-white text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">SmartHirex</h2>
              <p className="text-xs text-gray-500">AI Recruitment</p>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto">
            <i className="ri-briefcase-line text-white text-xl"></i>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.id} className="relative group">
            <Link
              href={item.href}
              onClick={() => setActiveItem(item.id)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl text-left transition-all duration-200 transform hover:scale-105 ${
                activeItem === item.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gray-100/80 hover:text-blue-600'
              }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
                activeItem === item.id
                  ? 'bg-white/20 scale-110'
                  : 'bg-gray-100 group-hover:bg-blue-100 group-hover:scale-110'
              }`}>
                <i className={`${item.icon} text-lg transition-all duration-200 ${
                  activeItem === item.id
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-blue-600'
                }`}></i>
              </div>
              {!collapsed && (
                <span className="font-medium transition-all duration-200">{item.label}</span>
              )}
            </Link>

            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Stats Card */}
      {!collapsed && (
        <div className="mx-4 mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200/50 transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Today's Activity</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Resumes Processed</span>
              <span className="text-sm font-bold text-blue-600">247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Matches Found</span>
              <span className="text-sm font-bold text-green-600">42</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Tests Scheduled</span>
              <span className="text-sm font-bold text-purple-600">8</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!collapsed && (
        <div className="absolute bottom-6 left-4 right-4">
          <div className="space-y-2">
            <button
              onClick={handleNewJobPost}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <i className="ri-add-line mr-2"></i>
              New Job Posting
            </button>
            <button
              onClick={handleExport}
              className="w-full border border-gray-200 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
            >
              <i className="ri-download-line mr-2"></i>
              Export Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
