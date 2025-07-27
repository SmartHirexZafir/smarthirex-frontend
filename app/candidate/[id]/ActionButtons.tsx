'use client';

import { useState } from 'react';

export default function ActionButtons({ candidate, onStatusChange }) {
  const [isShortlisted, setIsShortlisted] = useState(candidate.status === 'shortlisted');
  const [isRejected, setIsRejected] = useState(candidate.status === 'rejected');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateCandidateStatus = async (newStatus: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:10000/candidate/${candidate._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await res.json();
      if (res.ok) {
        onStatusChange(newStatus); // tell parent
      } else {
        console.error('Status update failed:', result);
        alert('Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating status');
    } finally {
      setLoading(false);
    }
  };

  const handleShortlist = () => {
    const newStatus = isShortlisted ? 'new' : 'shortlisted';
    setIsShortlisted(!isShortlisted);
    setIsRejected(false);
    updateCandidateStatus(newStatus);
  };

  const handleReject = () => {
    const newStatus = isRejected ? 'new' : 'rejected';
    setIsRejected(!isRejected);
    setIsShortlisted(false);
    updateCandidateStatus(newStatus);
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
            disabled={loading}
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
            disabled={loading}
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

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          {/* ...unchanged modal content... */}
        </div>
      )}

      {/* Send Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          {/* ...unchanged modal content... */}
        </div>
      )}
    </>
  );
}
