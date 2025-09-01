// app/candidate/[id]/ActionButtons.tsx
"use client";

import { useState, useEffect } from "react";
import TestEmailModal from "@/app/(shared)/TestEmailModal";

// Scheduler modal + service
import ScheduleInterviewModal from "@/app/(shared)/ScheduleInterviewModal";
import { scheduleInterview } from "@/app/meetings/services/scheduleInterview";

type Candidate = {
  _id: string;
  status?: string;
  name?: string;
  email?: string;
  resume?: { email?: string };
  job_role?: string;
  predicted_role?: string;
  category?: string;
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

// Optional type for scheduleInterview response (non-breaking)
type ScheduleResponse = {
  ok?: boolean;
  meetingUrl?: string;
  [k: string]: unknown;
};

/** Pull a bearer token if present (keeps parity with CandidateDetail) */
const getAuthToken =(): string | null =>
  (typeof window !== "undefined" &&
    (localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("AUTH_TOKEN"))) ||
  null;

const authHeaders = () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export default function ActionButtons({ candidate, onStatusChange }: ActionButtonsProps) {
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Success toast (schedule)
  const [showInviteToast, setShowInviteToast] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | undefined>(undefined);

  // Error toast (non-blocking replacement for alert)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsShortlisted(candidate.status === "shortlisted");
    setIsRejected(candidate.status === "rejected");
  }, [candidate.status]);

  // Derive a safe candidate email for scheduling
  const candidateEmail = candidate.email || candidate.resume?.email || "";

  const updateCandidateStatus = async (newStatus: string): Promise<boolean> => {
    if (!candidate?._id) {
      console.error("Missing candidate _id for status update");
      setErrorMsg("Unable to update status. Candidate ID is missing.");
      return false;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/candidate/${candidate._id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      const result = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok) {
        onStatusChange(newStatus);
        return true;
      } else {
        console.error("Status update failed:", result);
        setErrorMsg("Failed to update status. Please try again.");
        return false;
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setErrorMsg("A network error occurred while updating status.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleShortlist = async () => {
    if (loading) return;
    const prevShortlisted = isShortlisted;
    const prevRejected = isRejected;

    const newStatus = isShortlisted ? "new" : "shortlisted";
    // optimistic UI
    setIsShortlisted(!isShortlisted);
    setIsRejected(false);

    const ok = await updateCandidateStatus(newStatus);
    if (!ok) {
      // revert optimistic change on failure
      setIsShortlisted(prevShortlisted);
      setIsRejected(prevRejected);
    }
  };

  const handleReject = async () => {
    if (loading) return;
    const prevShortlisted = isShortlisted;
    const prevRejected = isRejected;

    const newStatus = isRejected ? "new" : "rejected";
    // optimistic UI
    setIsRejected(!isRejected);
    setIsShortlisted(false);

    const ok = await updateCandidateStatus(newStatus);
    if (!ok) {
      // revert optimistic change on failure
      setIsRejected(prevRejected);
      setIsShortlisted(prevShortlisted);
    }
  };

  // show toast helper
  const showSuccessToast = (url?: string) => {
    setInviteUrl(url);
    setShowInviteToast(true);
    // auto-hide after 4s
    window.setTimeout(() => setShowInviteToast(false), 4000);
  };

  const scheduleDisabled = !candidateEmail; // guard if no email available

  // Unified schedule submit handler:
  // 1) try service client (scheduleInterview)
  // 2) if it throws/fails, fallback to direct backend endpoint: POST /candidate/{id}/schedule
  const handleScheduleSubmit = async (payload: any) => {
    try {
      // Always attach candidate identity / email so backend has context
      const enriched = {
        ...payload,
        candidateId: candidate._id,
        candidateEmail: candidateEmail || payload?.email,
        candidateName: candidate.name,
      };

      let resp: ScheduleResponse | undefined;

      try {
        resp = (await scheduleInterview(enriched)) as ScheduleResponse | undefined;
      } catch (serviceErr) {
        console.warn("scheduleInterview service failed, attempting direct API:", serviceErr);
      }

      if (!resp || (resp && resp.ok === false && !resp.meetingUrl)) {
        // direct API fallback
        const res = await fetch(`${API_BASE}/candidate/${candidate._id}/schedule`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(enriched),
        });
        const data = (await res.json().catch(() => ({}))) as ScheduleResponse;
        if (!res.ok) throw new Error((data as any)?.detail || "Failed to schedule interview");
        resp = data;
      }

      // success
      setShowScheduleModal(false);
      showSuccessToast(resp?.meetingUrl);
    } catch (err: any) {
      console.error("Scheduling failed:", err);
      setErrorMsg(
        typeof err?.message === "string"
          ? err.message
          : "Could not schedule interview. Please try again."
      );
    }
  };

  // ---- Unified visual style for ALL four action buttons ----
  const baseBtn = "btn btn-soft w-full hover:translate-y-[-1px]"; // same shape/background
  const shortlistBtnCls = [
    baseBtn,
    isShortlisted
      ? "ring-2 ring-[hsl(var(--success))] bg-[hsl(var(--success)/.15)] text-[hsl(var(--success))]"
      : "text-[hsl(var(--success))]",
    loading ? "opacity-80 cursor-not-allowed" : "",
  ].join(" ");

  const rejectBtnCls = [
    baseBtn,
    isRejected
      ? "ring-2 ring-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/.15)] text-[hsl(var(--destructive))]"
      : "text-[hsl(var(--destructive))]",
    loading ? "opacity-80 cursor-not-allowed" : "",
  ].join(" ");

  const sendTestBtnCls = [baseBtn, "text-[hsl(var(--info))]"].join(" ");
  const scheduleBtnCls = [
    baseBtn,
    scheduleDisabled ? "opacity-60 cursor-not-allowed" : "text-[hsl(var(--primary))]",
  ].join(" ");

  return (
    <>
      {/* Themed panel using your global utilities */}
      <div className="panel glass p-4 md:p-5 shadow-lux gradient-border">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold leading-none">Quick Actions</h3>
          {/* Role chip removed per request (kept logic out to avoid "Data Science" pill) */}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Shortlist */}
          <button
            type="button"
            onClick={handleShortlist}
            disabled={loading}
            aria-pressed={isShortlisted}
            className={shortlistBtnCls}
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
            className={rejectBtnCls}
          >
            <i className={`${isRejected ? "ri-close-fill" : "ri-close-line"} text-[1.05em]`} />
            <span className="text-sm">{isRejected ? "Rejected" : "Reject"}</span>
          </button>

          {/* Send Test */}
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className={sendTestBtnCls}
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
            className={scheduleBtnCls}
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
                  : "bg-[hsl(var(--info)/0.18)] text-[hsl(var(--info))]",
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
          onSubmit={handleScheduleSubmit}
          onScheduled={(resp: ScheduleResponse | undefined) => {
            // onSubmit already handles success toast; this remains for backward-compat
            if (resp?.meetingUrl) showSuccessToast(resp.meetingUrl);
            setShowScheduleModal(false);
          }}
        />
      )}

      {/* Send Test Modal */}
      {showTestModal && (
        <TestEmailModal open={showTestModal} onClose={() => setShowTestModal(false)} candidate={candidate} />
      )}

      {/* Tiny success toast */}
      {showInviteToast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div role="status" aria-live="polite" className="panel glass shadow-lux px-4 py-3 min-w-[260px]">
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

      {/* Error toast */}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div role="status" aria-live="assertive" className="panel glass shadow-lux px-4 py-3 min-w-[260px]">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--destructive))]" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Action failed</div>
                <div className="mt-0.5 text-[hsl(var(--muted-foreground))]">{errorMsg}</div>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
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
