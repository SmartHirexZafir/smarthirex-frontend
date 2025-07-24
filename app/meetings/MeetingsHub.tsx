'use client';

import { useState } from 'react';
import Link from 'next/link';
import TestAssignment from './TestAssignment';
import InterviewScheduler from './InterviewScheduler';
import StatusDashboard from './StatusDashboard';

export default function MeetingsHub() {
  const [activeTab, setActiveTab] = useState('tests');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/upload" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="ri-arrow-left-line text-xl text-gray-600"></i>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <i className="ri-calendar-event-line mr-3 text-blue-600"></i>
                  Interviews & Tests Center
                </h1>
                <p className="text-gray-600">Manage interviews, tests, and candidate assessments</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                <i className="ri-calendar-check-line mr-2"></i>
                5 Scheduled Today
              </div>
              <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                <i className="ri-test-tube-line mr-2"></i>
                12 Tests Pending
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'tests', label: 'Assign Tests', icon: 'ri-test-tube-line' },
              { id: 'schedule', label: 'Schedule Interviews', icon: 'ri-calendar-event-line' },
              { id: 'dashboard', label: 'Status Dashboard', icon: 'ri-dashboard-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'tests' && <TestAssignment />}
          {activeTab === 'schedule' && <InterviewScheduler />}
          {activeTab === 'dashboard' && <StatusDashboard />}
        </div>
      </div>
    </div>
  );
}