'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import UploadSection from './UploadSection';
import ChatbotSection from './ChatbotSection';
import CandidateResults from './CandidateResults';

interface Candidate {
  id: number;
  name: string;
  email: string;
  score: number;
  skills: string[];
  experience: string;
  matchedSkills: string[];
  location: string;
  currentRole: string;
  avatar: string;
  _id?: string;
  match_score?: number;
  predicted_role?: string;
  filter_skills?: string[];
  semantic_score?: number; // ✅ Added for semantic matching
}

interface FileUpload extends File {
  preview?: string;
}

interface User {
  firstName: string;
  lastName: string;
  jobTitle?: string;
  company?: string;
  email: string;
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activePrompt, setActivePrompt] = useState<string>('Show all available candidates');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleFileUpload = (files: FileUpload[]) => {
    setUploadedFiles(files);
  };

  const handlePromptSubmit = (prompt: string, results: Candidate[] = []) => {
    setActivePrompt(prompt);
    setCandidates(results);
  };

  const navItems = [
    { label: 'Upload CVs', href: '/upload', icon: 'ri-upload-cloud-2-line', active: true },
    { label: 'History', href: '/history', icon: 'ri-history-line' },
    { label: 'Tests', href: '/meetings', icon: 'ri-file-text-line' }
  ];

  const getUserInitials = () => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    }
    return 'JD';
  };

  const getUserName = () => {
    return user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'John Doe';
  };

  const getUserSubtext = () => {
    return user?.jobTitle || user?.company || 'HR Manager';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />

      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-30">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Logo & Sidebar toggle */}
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

              {/* Navigation Tabs */}
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

              {/* User Profile Dropdown */}
              <div className="relative">
                <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {getUserInitials()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{getUserName()}</p>
                    <p className="text-xs text-gray-500">{getUserSubtext()}</p>
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

        {/* Main Content */}
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          <UploadSection onFileUpload={handleFileUpload} uploadedFiles={uploadedFiles} />
          <div className="max-w-4xl mx-auto">
            <ChatbotSection onPromptSubmit={handlePromptSubmit} isProcessing={isProcessing} activePrompt={activePrompt} />
          </div>
          <CandidateResults candidates={candidates} isProcessing={isProcessing} activePrompt={activePrompt} />
        </div>
      </div>
    </div>
  );
}
