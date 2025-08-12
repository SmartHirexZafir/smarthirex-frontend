'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../upload/Sidebar';
import HistoryFilter from './HistoryFilter';
import HistoryBlocks from './HistoryBlocks';
import ResultsModal from './ResultsModal';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/$/, '');

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // accepts optional AbortSignal so we can cancel on unmount
  const fetchHistory = async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`${API_BASE}/history/user-history`, {
        credentials: 'include',
        signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      const data = await res.json();
      setHistoryData(data || []);
      setFilteredData(data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
      setHistoryData([]);
      setFilteredData([]);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchHistory(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (filteredResults: any[]) => {
    setFilteredData(filteredResults);
  };

  const handleViewResults = (history: any) => {
    setSelectedHistory(history);
    setShowModal(true);
  };

  const handleRerunPrompt = async (prompt: string) => {
    try {
      const res = await fetch(`${API_BASE}/chatbot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      // 🔁 Re-fetch to get fresh history from backend
      await fetchHistory();
    } catch (err) {
      console.error('Failed to rerun prompt:', err);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: 'ri-dashboard-line' },
    { label: 'Resume Upload', href: '/upload', icon: 'ri-upload-cloud-2-line' },
    { label: 'Chat Assistant', href: '/upload', icon: 'ri-message-3-line' },
    { label: 'Search History', href: '/history', icon: 'ri-history-line', active: true },
    { label: 'Tests', href: '/meetings', icon: 'ri-file-text-line' },
    { label: 'Settings', href: '/settings', icon: 'ri-settings-line' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />

      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-30">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <i className="ri-menu-line text-gray-600"></i>
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <i className="ri-briefcase-line text-white text-xl"></i>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">SmartHirex</h1>
                </div>
              </div>

              <div className="hidden lg:flex items-center space-x-8">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-100 ${
                      item.active ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    <i className={`${item.icon} text-lg`}></i>
                    <span className="font-medium">{item.label}</span>
                  </a>
                ))}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    JD
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">John Doe</p>
                    <p className="text-xs text-gray-500">HR Manager</p>
                  </div>
                  <i className="ri-arrow-down-s-line text-gray-400"></i>
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-50">
                    <a href="#" className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors">
                      <i className="ri-user-line text-gray-500"></i>
                      <span className="text-sm text-gray-700">Profile</span>
                    </a>
                    <a href="#" className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors">
                      <i className="ri-settings-line text-gray-500"></i>
                      <span className="text-sm text-gray-700">Settings</span>
                    </a>
                    <hr className="my-2 border-gray-200" />
                    <a href="#" className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors text-red-600">
                      <i className="ri-logout-circle-line"></i>
                      <span className="text-sm">Logout</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="px-8 py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="text-center animate-fade-in">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Prompt History & Matching Results
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Track and review all your AI-powered resume matching activities with detailed analytics and insights
              </p>
              <div className="flex items-center justify-center space-x-8 mt-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <i className="ri-database-2-line text-white text-xl"></i>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{historyData.length}</p>
                    <p className="text-sm text-gray-600">Total Searches</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                    <i className="ri-group-line text-white text-xl"></i>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {historyData.reduce((sum: number, item: any) => sum + (item.totalMatches || 0), 0)}
                    </p>
                    <p className="text-sm text-gray-600">Total Matches</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            <HistoryFilter onFilter={handleFilter} />
            <HistoryBlocks
              historyData={filteredData}
              onViewResults={handleViewResults}
              onRerunPrompt={handleRerunPrompt}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <ResultsModal history={selectedHistory} onClose={() => setShowModal(false)} />
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
