
'use client';

import { useState } from 'react';

export default function ActionButtons({ candidate, onStatusChange }) {
  const [isShortlisted, setIsShortlisted] = useState(candidate.status === 'shortlisted');
  const [isRejected, setIsRejected] = useState(candidate.status === 'rejected');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  const handleShortlist = () => {
    const newStatus = isShortlisted ? 'new' : 'shortlisted';
    setIsShortlisted(!isShortlisted);
    setIsRejected(false);
    onStatusChange(newStatus);
  };

  const handleReject = () => {
    const newStatus = isRejected ? 'new' : 'rejected';
    setIsRejected(!isRejected);
    setIsShortlisted(false);
    onStatusChange(newStatus);
  };

  const handleSendTest = () => {
    setShowTestModal(true);
  };

  const handleScheduleInterview = () => {
    setShowScheduleModal(true);
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleShortlist}
            className={`flex items-center justify-center px-3 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg whitespace-nowrap cursor-pointer ${
              isShortlisted
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
            }`}
          >
            <i className={`${isShortlisted ? 'ri-heart-fill' : 'ri-heart-line'} mr-1 text-sm`}></i>
            <span className="text-sm">{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
          </button>

          <button
            onClick={handleReject}
            className={`flex items-center justify-center px-3 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg whitespace-nowrap cursor-pointer ${
              isRejected
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'
            }`}
          >
            <i className={`${isRejected ? 'ri-close-fill' : 'ri-close-line'} mr-1 text-sm`}></i>
            <span className="text-sm">{isRejected ? 'Rejected' : 'Reject'}</span>
          </button>

          <button
            onClick={handleSendTest}
            className="flex items-center justify-center px-3 py-2 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-file-list-line mr-1 text-sm"></i>
            <span className="text-sm">Send Test</span>
          </button>

          <button
            onClick={handleScheduleInterview}
            className="flex items-center justify-center px-3 py-2 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-calendar-event-line mr-1 text-sm"></i>
            <span className="text-sm">Schedule</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="mt-3 p-2 bg-gray-50/80 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isShortlisted ? 'bg-green-100 text-green-800' :
              isRejected ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {isShortlisted ? 'Shortlisted' : isRejected ? 'Rejected' : 'Under Review'}
            </span>
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Interview</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg pr-8">
                  <option>Phone Interview</option>
                  <option>Video Interview</option>
                  <option>In-person Interview</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg pr-8">
                  <option>30 minutes</option>
                  <option>45 minutes</option>
                  <option>60 minutes</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    // Handle schedule logic here
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Assessment</h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Type</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg pr-8">
                  <option>Technical Assessment</option>
                  <option>Coding Challenge</option>
                  <option>Personality Test</option>
                  <option>Custom Assessment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg pr-8">
                  <option>Junior Level</option>
                  <option>Mid Level</option>
                  <option>Senior Level</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg pr-8">
                  <option>60 minutes</option>
                  <option>90 minutes</option>
                  <option>120 minutes</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    // Handle send test logic here
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg"
                >
                  Send Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
