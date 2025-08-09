// app/candidate/[id]/ActionButtons.tsx
"use client";

import { useState, useEffect } from "react";
import TestEmailModal from "@/app/(shared)/TestEmailModal";

type ActionButtonsProps = {
  candidate: {
    _id: string;
    status?: string;
    name?: string;
    email?: string;
    resume?: { email?: string };
    job_role?: string;
  };
  onStatusChange: (newStatus: string) => void;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:10000";

export default function ActionButtons({ candidate, onStatusChange }: ActionButtonsProps) {
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsShortlisted(candidate.status === "shortlisted");
    setIsRejected(candidate.status === "rejected");
  }, [candidate.status]);

  const updateCandidateStatus = async (newStatus: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/candidate/${candidate._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        onStatusChange(newStatus);
      } else {
        console.error("Status update failed:", result);
        alert("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error updating status");
    } finally {
      setLoading(false);
    }
  };

  const handleShortlist = () => {
    const newStatus = isShortlisted ? "new" : "shortlisted";
    setIsShortlisted(!isShortlisted);
    setIsRejected(false);
    updateCandidateStatus(newStatus);
  };

  const handleReject = () => {
    const newStatus = isRejected ? "new" : "rejected";
    setIsRejected(!isRejected);
    setIsShortlisted(false);
    updateCandidateStatus(newStatus);
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
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                : "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
            }`}
          >
            <i className={`${isShortlisted ? "ri-heart-fill" : "ri-heart-line"} mr-1 text-sm`}></i>
            <span className="text-sm">{isShortlisted ? "Shortlisted" : "Shortlist"}</span>
          </button>

          <button
            onClick={handleReject}
            disabled={loading}
            className={`flex items-center justify-center px-3 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg whitespace-nowrap cursor-pointer ${
              isRejected
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md"
                : "bg-red-100 text-red-800 hover:bg-red-200 border border-red-200"
            }`}
          >
            <i className={`${isRejected ? "ri-close-fill" : "ri-close-line"} mr-1 text-sm`}></i>
            <span className="text-sm">{isRejected ? "Rejected" : "Reject"}</span>
          </button>

          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center justify-center px-3 py-2 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-file-list-line mr-1 text-sm"></i>
            <span className="text-sm">Send Test</span>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
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
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isShortlisted
                  ? "bg-green-100 text-green-800"
                  : isRejected
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {isShortlisted ? "Shortlisted" : isRejected ? "Rejected" : "Under Review"}
            </span>
          </div>
        </div>
      </div>

      {/* Schedule Modal (placeholder) */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule Interview</h3>
            <p className="text-sm text-gray-600 mb-4">This is a placeholder. Integration pending.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-md text-sm bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button className="px-4 py-2 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Modal (real integration) */}
      {showTestModal && (
        <TestEmailModal
          open={showTestModal}
          onClose={() => setShowTestModal(false)}
          candidate={candidate}
        />
      )}
    </>
  );
}
