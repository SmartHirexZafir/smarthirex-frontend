'use client';

import { useState } from 'react';
import Sidebar from '../upload/Sidebar';
import HistoryFilter from './HistoryFilter';
import HistoryBlocks from './HistoryBlocks';
import ResultsModal from './ResultsModal';

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState([
    {
      id: 1,
      prompt: "Show React developers with 3+ years experience",
      timestamp: "July 20, 2025 – 03:22 PM",
      totalMatches: 8,
      candidates: [
        {
          id: 1,
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          score: 92,
          matchReasons: ['React', '4+ years', 'JavaScript', 'TypeScript'],
          avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20react%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=400&height=400&seq=history-001&orientation=squarish'
        },
        {
          id: 2,
          name: 'Michael Chen',
          email: 'michael.chen@email.com',
          score: 88,
          matchReasons: ['React', '5+ years', 'Frontend', 'Redux'],
          avatar: 'https://readdy.ai/api/search-image?query=professional%20male%20react%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=400&height=400&seq=history-002&orientation=squarish'
        },
        {
          id: 3,
          name: 'Emily Rodriguez',
          email: 'emily.rodriguez@email.com',
          score: 85,
          matchReasons: ['React', '3+ years', 'Vue.js', 'Frontend'],
          avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20frontend%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=400&height=400&seq=history-003&orientation=squarish'
        }
      ]
    },
    {
      id: 2,
      prompt: "Find Python developers in San Francisco with Machine Learning experience",
      timestamp: "July 19, 2025 – 11:45 AM",
      totalMatches: 12,
      candidates: [
        {
          id: 4,
          name: 'David Kim',
          email: 'david.kim@email.com',
          score: 94,
          matchReasons: ['Python', 'Machine Learning', 'San Francisco', 'TensorFlow'],
          avatar: 'https://readdy.ai/api/search-image?query=professional%20male%20python%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=400&height=400&seq=history-004&orientation=squarish'
        },
        {
          id: 5,
          name: 'Lisa Wang',
          email: 'lisa.wang@email.com',
          score: 91,
          matchReasons: ['Python', 'Machine Learning', 'Data Science', 'Pandas'],
          avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20data%20scientist%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=400&height=400&seq=history-005&orientation=squarish'
        }
      ]
    },
    {
      id: 3,
      prompt: "Show full-stack developers with AWS and Node.js experience",
      timestamp: "July 18, 2025 – 04:15 PM",
      totalMatches: 15,
      candidates: [
        {
          id: 6,
          name: 'Alex Martinez',
          email: 'alex.martinez@email.com',
          score: 89,
          matchReasons: ['AWS', 'Node.js', 'Full-stack', 'Docker'],
          avatar: 'https://readdy.ai/api/search-image?query=professional%20male%20full%20stack%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=400&height=400&seq=history-006&orientation=squarish'
        },
        {
          id: 7,
          name: 'Rachel Green',
          email: 'rachel.green@email.com',
          score: 87,
          matchReasons: ['AWS', 'Node.js', 'React', 'PostgreSQL'],
          avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20full%20stack%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=400&height=400&seq=history-007&orientation=squarish'
        }
      ]
    },
    {
      id: 4,
      prompt: "Find UI/UX designers with Figma and prototyping skills",
      timestamp: "July 17, 2025 – 09:30 AM",
      totalMatches: 6,
      candidates: [
        {
          id: 8,
          name: 'Sophie Turner',
          email: 'sophie.turner@email.com',
          score: 93,
          matchReasons: ['Figma', 'UI/UX', 'Prototyping', 'Design Systems'],
          avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20ui%20ux%20designer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=400&height=400&seq=history-008&orientation=squarish'
        }
      ]
    },
    {
      id: 5,
      prompt: "Show backend developers with Java and Spring Boot experience",
      timestamp: "July 16, 2025 – 02:20 PM",
      totalMatches: 10,
      candidates: [
        {
          id: 9,
          name: 'James Wilson',
          email: 'james.wilson@email.com',
          score: 86,
          matchReasons: ['Java', 'Spring Boot', 'Backend', 'REST APIs'],
          avatar: 'https://readdy.ai/api/search-image?query=professional%20male%20java%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=400&height=400&seq=history-009&orientation=squarish'
        }
      ]
    }
  ]);

  const [filteredData, setFilteredData] = useState(historyData);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleFilter = (filters) => {
    let filtered = [...historyData];

    // Date filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        
        return (!fromDate || itemDate >= fromDate) && (!toDate || itemDate <= toDate);
      });
    }

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(item => 
        item.prompt.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Sort
    if (filters.sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (filters.sort === 'mostMatches') {
      filtered.sort((a, b) => b.totalMatches - a.totalMatches);
    } else {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    setFilteredData(filtered);
  };

  const handleViewResults = (history) => {
    setSelectedHistory(history);
    setShowModal(true);
  };

  const handleRerunPrompt = (prompt) => {
    // Simulate re-running the prompt
    console.log(`Re-running prompt: ${prompt}`);
    // Add new entry to history
    const newEntry = {
      id: Date.now(),
      prompt: prompt,
      timestamp: new Date().toLocaleString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      totalMatches: Math.floor(Math.random() * 20) + 1,
      candidates: []
    };
    setHistoryData(prev => [newEntry, ...prev]);
    setFilteredData(prev => [newEntry, ...prev]);
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
        {/* Global Navbar */}
        <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-30">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <i className="ri-menu-line text-gray-600"></i>
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <i className="ri-briefcase-line text-white text-xl"></i>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">SmartHirex</h1>
                </div>
              </div>

              {/* Navigation Items */}
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

              {/* Profile Dropdown */}
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

        {/* Enhanced Title Section */}
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
                    <p className="text-2xl font-bold text-gray-900">{historyData.reduce((sum, item) => sum + item.totalMatches, 0)}</p>
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
        <ResultsModal 
          history={selectedHistory}
          onClose={() => setShowModal(false)}
        />
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