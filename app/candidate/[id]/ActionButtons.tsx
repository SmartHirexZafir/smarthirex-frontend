// app/candidate/[id]/ActionButtons.tsx
"use client";

import { useState, useEffect } from "react";
import TestEmailModal from "@/app/(shared)/TestEmailModal";

// ✅ NEW: import the scheduler modal + service
import ScheduleInterviewModal from "@/app/(shared)/ScheduleInterviewModal";
import { scheduleInterview } from "@/app/meetings/services/scheduleInterview";

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

// Safer API base (supports both env names), trims trailing slash
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

export default function ActionButtons({ candidate, onStatusChange }: ActionButtonsProps) {
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ NEW: simple success popup state
  const [showInviteToast, setShowInviteToast] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | undefined>(undefined);

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

  // ✅ NEW: derive a safe candidate email for scheduling
  const candidateEmail = candidate.email || candidate.resume?.email || "";

  // ✅ NEW: show toast helper
  const showSuccessToast = (url?: string) => {
    setInviteUrl(url);
    setShowInviteToast(true);
    // auto-hide after 4s
    window.setTimeout(() => setShowInviteToast(false), 4000);
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

      {/* ✅ Real Schedule Modal integration */}
      {showScheduleModal && (
        <ScheduleInterviewModal
          open={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          candidate={{
            id: candidate._id,
            name: candidate.name || undefined,
            email: candidateEmail,
          }}
          // Use service client so it hits your FastAPI backend
          onSubmit={(payload) => scheduleInterview(payload)}
          onScheduled={(resp) => {
            // Close after success + show small success popup
            setShowScheduleModal(false);
            showSuccessToast(resp?.meetingUrl);
          }}
        />
      )}

      {/* Send Test Modal (real integration) */}
      {showTestModal && (
        <TestEmailModal open={showTestModal} onClose={() => setShowTestModal(false)} candidate={candidate} />
      )}

      {/* ✅ NEW: tiny success toast (no dependencies) */}
      {showInviteToast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div className="rounded-xl border border-green-200 bg-white shadow-xl px-4 py-3 min-w-[260px]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-green-500"></div>
              <div className="flex-1 text-sm">
                <div className="font-medium text-gray-900">Interview invite sent</div>
                <div className="mt-0.5 text-gray-600">
                  The candidate has received the invitation email.
                  {inviteUrl ? (
                    <>
                      {" "}
                      <a className="text-indigo-600 underline" href={inviteUrl} target="_blank" rel="noreferrer">
                        View meeting page
                      </a>
                      .
                    </>
                  ) : null}
                </div>
              </div>
              <button
                onClick={() => setShowInviteToast(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
