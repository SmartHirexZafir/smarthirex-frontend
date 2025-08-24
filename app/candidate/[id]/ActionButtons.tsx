// app/candidate/[id]/ActionButtons.tsx
"use client";

import { useState, useEffect } from "react";
import TestEmailModal from "@/app/(shared)/TestEmailModal";

// Scheduler modal + service (no backend change)
import ScheduleInterviewModal from "@/app/(shared)/ScheduleInterviewModal";
import { scheduleInterview } from "@/app/meetings/services/scheduleInterview";

type Candidate = {
  _id: string;
  status?: string;
  name?: string;
  email?: string;
  resume?: { email?: string };
  job_role?: string;
};

type ActionButtonsProps = {
  candidate: Candidate;
  onStatusChange: (newStatus: string) => void;
};

// Safer API base (supports both env names), trims trailing slash
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

// Optional type for scheduleInterview response (non‑breaking)
type ScheduleResponse = {
  ok?: boolean;
  meetingUrl?: string;
  [k: string]: unknown;
};

export default function ActionButtons({ candidate, onStatusChange }: ActionButtonsProps) {
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tiny success toast state
  const [showInviteToast, setShowInviteToast] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    setIsShortlisted(candidate.status === "shortlisted");
    setIsRejected(candidate.status === "rejected");
  }, [candidate.status]);

  // Derive a safe candidate email for scheduling
  const candidateEmail = candidate.email || candidate.resume?.email || "";

  const updateCandidateStatus = async (newStatus: string) => {
    if (!candidate?._id) {
      console.error("Missing candidate _id for status update");
      alert("Unable to update status. Candidate ID is missing.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/candidate/${candidate._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = (await res.json().catch(() => ({}))) as Record<string, unknown>;
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
    void updateCandidateStatus(newStatus);
  };

  const handleReject = () => {
    const newStatus = isRejected ? "new" : "rejected";
    setIsRejected(!isRejected);
    setIsShortlisted(false);
    void updateCandidateStatus(newStatus);
  };

  // show toast helper
  const showSuccessToast = (url?: string) => {
    setInviteUrl(url);
    setShowInviteToast(true);
    // auto-hide after 4s
    window.setTimeout(() => setShowInviteToast(false), 4000);
  };

  const scheduleDisabled = !candidateEmail; // guard if no email available

  return (
    <>
      {/* Themed panel using your global utilities */}
      <div className="panel glass p-4 md:p-5 shadow-lux gradient-border">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold leading-none">Quick Actions</h3>
          {/* subtle chip showing current role if present */}
          {candidate.job_role ? (
            <span className="chip" title="Job role">
              <i className="ri-briefcase-line" />
              {candidate.job_role}
            </span>
          ) : null}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          {/* Shortlist */}
          <button
            type="button"
            onClick={handleShortlist}
            disabled={loading}
            aria-pressed={isShortlisted}
            className={[
              "btn w-full transition-all ease-lux",
              loading ? "opacity-80 cursor-not-allowed" : "hover:translate-y-[-1px]",
              isShortlisted
                ? "text-[hsl(var(--success-foreground))] bg-[hsl(var(--success))] shadow-glow"
                : "btn-outline text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.12)]"
            ].join(" ")}
          >
            <i className={`${isShortlisted ? "ri-heart-fill" : "ri-heart-line"} text-[1.05em]`} />
            <span className="text-sm">{isShortlisted ? "Shortlisted" : "Shortlist"}</span>
          </button>

          {/* Reject */}
          <button
            type="button"
            onClick={handleReject}
            disabled={loading}
            aria-pressed={isRejected}
            className={[
              "btn w-full transition-all ease-lux",
              loading ? "opacity-80 cursor-not-allowed" : "hover:translate-y-[-1px]",
              isRejected
                ? "text-[hsl(var(--destructive-foreground))] bg-[hsl(var(--destructive))] shadow-glow"
                : "btn-outline text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.12)]"
            ].join(" ")}
          >
            <i className={`${isRejected ? "ri-close-fill" : "ri-close-line"} text-[1.05em]`} />
            <span className="text-sm">{isRejected ? "Rejected" : "Reject"}</span>
          </button>

          {/* Send Test */}
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="btn btn-secondary w-full hover:translate-y-[-1px]"
          >
            <i className="ri-file-list-line text-[1.05em]" />
            <span className="text-sm">Send Test</span>
          </button>

          {/* Schedule */}
          <button
            type="button"
            onClick={() => !scheduleDisabled && setShowScheduleModal(true)}
            disabled={scheduleDisabled}
            title={scheduleDisabled ? "Candidate email required to schedule" : undefined}
            className={[
              "btn btn-primary w-full hover:translate-y-[-1px]",
              scheduleDisabled ? "opacity-60 cursor-not-allowed" : ""
            ].join(" ")}
          >
            <i className="ri-calendar-event-line text-[1.05em]" />
            <span className="text-sm">Schedule</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 rounded-2xl bg-[hsl(var(--muted)/0.4)] p-3 ring-1 ring-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Status</span>
            <span
              className={[
                "badge",
                isShortlisted
                  ? "bg-[hsl(var(--success)/0.18)] text-[hsl(var(--success))]"
                  : isRejected
                  ? "bg-[hsl(var(--destructive)/0.18)] text-[hsl(var(--destructive))]"
                  : "bg-[hsl(var(--info)/0.18)] text-[hsl(var(--info))]"
              ].join(" ")}
            >
              {isShortlisted ? "Shortlisted" : isRejected ? "Rejected" : "Under Review"}
            </span>
          </div>
        </div>
      </div>

      {/* Real Schedule Modal integration */}
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
          onScheduled={(resp: ScheduleResponse | undefined) => {
            setShowScheduleModal(false);
            showSuccessToast(resp?.meetingUrl);
          }}
        />
      )}

      {/* Send Test Modal */}
      {showTestModal && (
        <TestEmailModal open={showTestModal} onClose={() => setShowTestModal(false)} candidate={candidate} />
      )}

      {/* Tiny success toast (no dependencies) */}
      {showInviteToast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div
            role="status"
            aria-live="polite"
            className="panel glass shadow-lux px-4 py-3 min-w-[260px]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Interview invite sent</div>
                <div className="mt-0.5 text-[hsl(var(--muted-foreground))]">
                  The candidate has received the invitation email.
                  {inviteUrl ? (
                    <>
                      {" "}
                      <a className="text-[hsl(var(--primary))] underline" href={inviteUrl} target="_blank" rel="noreferrer">
                        View meeting page
                      </a>
                      .
                    </>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteToast(false)}
                className="icon-btn h-8 w-8"
                aria-label="Close"
                title="Close"
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
