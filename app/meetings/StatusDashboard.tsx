'use client';

import { useState } from 'react';

export default function StatusDashboard() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedItems, setSelectedItems] = useState([]);

  const mockData = {
    pending: [
      {
        id: '1',
        candidate: 'Sarah Johnson',
        type: 'Interview',
        date: '2024-01-20',
        time: '10:00 AM',
        status: 'Scheduled',
        testScore: null,
        meetUrl: 'https://meet.google.com/abc-def-ghi',
        avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-status-001&orientation=squarish'
      },
      {
        id: '2',
        candidate: 'Michael Chen',
        type: 'Test',
        date: '2024-01-19',
        time: '2:00 PM',
        status: 'In Progress',
        testScore: null,
        meetUrl: null,
        avatar: 'https://readdy.ai/api/search-image?query=professional%20male%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-status-002&orientation=squarish'
      }
    ],
    completed: [
      {
        id: '3',
        candidate: 'Emily Rodriguez',
        type: 'Test',
        date: '2024-01-18',
        time: '11:00 AM',
        status: 'Completed',
        testScore: 85,
        meetUrl: null,
        avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-status-003&orientation=squarish'
      },
      {
        id: '4',
        candidate: 'David Kim',
        type: 'Interview',
        date: '2024-01-17',
        time: '3:30 PM',
        status: 'Completed',
        testScore: 92,
        meetUrl: 'https://meet.google.com/xyz-abc-def',
        avatar: 'https://readdy.ai/api/search-image?query=professional%20male%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-status-004&orientation=squarish'
      }
    ],
    noshow: [
      {
        id: '5',
        candidate: 'Jessica Brown',
        type: 'Interview',
        date: '2024-01-16',
        time: '9:00 AM',
        status: 'No Show',
        testScore: null,
        meetUrl: 'https://meet.google.com/no-show-123',
        avatar: 'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-status-005&orientation=squarish'
      }
    ]
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'No Show': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'Interview' ? 'ri-video-line' : 'ri-test-tube-line';
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const currentData = mockData[activeTab] || [];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <i className="ri-dashboard-line text-2xl text-blue-600 mr-3"></i>
          <h2 className="text-xl font-bold text-gray-900">Meeting & Test Status Dashboard</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <i className="ri-download-line"></i>
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <i className="ri-mail-line"></i>
            <span>Bulk Email</span>
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {[
          { id: 'pending', label: 'Pending', icon: 'ri-time-line', count: mockData.pending.length },
          { id: 'completed', label: 'Completed', icon: 'ri-check-line', count: mockData.completed.length },
          { id: 'noshow', label: 'No-Show / Rejected', icon: 'ri-close-line', count: mockData.noshow.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <i className={`${tab.icon} mr-2`}></i>
            {tab.label}
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>
      
      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                <input
                  type="checkbox"
                  className="rounded"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems(currentData.map(item => item.id));
                    } else {
                      setSelectedItems([]);
                    }
                  }}
                />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Candidate</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Date & Time</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Score</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                  />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={item.avatar} 
                      alt={item.candidate}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{item.candidate}</p>
                      <p className="text-sm text-gray-600">Frontend Developer</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <i className={`${getTypeIcon(item.type)} text-blue-600`}></i>
                    <span className="text-gray-900">{item.type}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <p className="text-gray-900">{item.date}</p>
                    <p className="text-sm text-gray-600">{item.time}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {item.testScore ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">{item.testScore}%</span>
                      <i className="ri-star-fill text-yellow-500"></i>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    {item.testScore && (
                      <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                        <i className="ri-eye-line"></i>
                      </button>
                    )}
                    {item.meetUrl && (
                      <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors">
                        <i className="ri-video-line"></i>
                      </button>
                    )}
                    <button className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors">
                      <i className="ri-mail-line"></i>
                    </button>
                    {item.status === 'No Show' && (
                      <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                        <i className="ri-close-line"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              {selectedItems.length} item(s) selected
            </p>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Send Reminder
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                Reschedule
              </button>
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Extra Features */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">HR Feedback & Settings</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-gray-900 mb-2">Auto-Schedule Next Round</h4>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-600">Enable automatic scheduling</span>
            </label>
          </div>
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-gray-900 mb-2">Test Results</h4>
            <button className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800">
              <i className="ri-file-pdf-line"></i>
              <span>View PDF Reports</span>
            </button>
          </div>
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-gray-900 mb-2">Feedback Form</h4>
            <button className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800">
              <i className="ri-feedback-line"></i>
              <span>Add HR Notes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}