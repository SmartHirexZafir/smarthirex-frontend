"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Candidate = {
  _id: string;
  status?: string;
  name?: string;
  email?: string;
  resume?: { email?: string };
  job_role?: string;
  predicted_role?: string;
  category?: string;
  test_score?: number;
  testCompleted?: boolean;
  hasTestResult?: boolean;
};

type ActionButtonsProps = {
  candidate: Candidate;
  onStatusChange: (newStatus: string) => void;
};

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

const getAuthToken = (): string | null =>
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
  const router = useRouter();
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduleRouting, setScheduleRouting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsShortlisted(candidate.status === "shortlisted");
    setIsRejected(candidate.status === "rejected");
  }, [candidate.status]);

  const candidateEmail = candidate.email || candidate.resume?.email || "";

  const updateCandidateStatus = async (newStatus: string): Promise<boolean> => {
    if (!candidate?._id) { setErrorMsg("Unable to update status. Candidate ID is missing."); return false; }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/candidate/${candidate._id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { onStatusChange(newStatus); return true; }
      setErrorMsg("Failed to update status. Please try again.");
      return false;
    } catch {
      setErrorMsg("A network error occurred while updating status.");
      return false;
    } finally { setLoading(false); }
  };

  const handleShortlist = async () => {
    if (loading) return;
    const prevShortlisted = isShortlisted;
    const prevRejected = isRejected;
    const newStatus = isShortlisted ? "new" : "shortlisted";
    setIsShortlisted(!isShortlisted);
    setIsRejected(false);
    const ok = await updateCandidateStatus(newStatus);
    if (!ok) { setIsShortlisted(prevShortlisted); setIsRejected(prevRejected); }
    else if (newStatus === "shortlisted") { router.push("/dashboard"); }
  };

  const handleReject = async () => {
    if (loading) return;
    const prevShortlisted = isShortlisted;
    const prevRejected = isRejected;
    const newStatus = isRejected ? "new" : "rejected";
    setIsRejected(!isRejected);
    setIsShortlisted(false);
    const ok = await updateCandidateStatus(newStatus);
    if (!ok) { setIsRejected(prevRejected); setIsShortlisted(prevShortlisted); }
    else if (newStatus === "rejected") { router.push("/dashboard"); }
  };

  const handleSendTest = () => {
    if (!candidate?._id) { setErrorMsg("Unable to open Test page — candidate ID is missing."); return; }
    router.push(`/test?candidateId=${candidate._id}`);
  };

  const hasEmail = !!candidateEmail;
  const hasTestScore = candidate?.test_score != null && !Number.isNaN(Number(candidate?.test_score));
  const hasTestCompleted = candidate?.testCompleted === true || candidate?.hasTestResult === true;
  const scheduleSoftBlocked = !(hasTestScore || hasTestCompleted);
  const scheduleHardDisabled = !hasEmail;

  const handleSchedule = () => {
    if (!candidate?._id) { setErrorMsg("Unable to schedule — candidate ID is missing."); return; }
    if (scheduleHardDisabled) return;
    if (scheduleSoftBlocked) {
      setErrorMsg("This user has to attempt the test first for the interview.");
      return;
    }
    setScheduleRouting(true);
    router.push(`/meetings?candidateId=${candidate._id}`);
  };

  const baseBtn = "btn btn-outline w-full";
  const shortlistBtnCls = baseBtn;
  const rejectBtnCls = baseBtn;
  const sendTestBtnCls = baseBtn;
  const scheduleBtnCls = [baseBtn, scheduleHardDisabled || scheduleSoftBlocked || scheduleRouting ? "opacity-60" : ""].join(" ");

  return (
    <>
      <div className="panel glass p-4 md:p-5 shadow-lux gradient-border">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold leading-none">Quick Actions</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={handleShortlist} disabled={loading} aria-pressed={isShortlisted} className={shortlistBtnCls}>
            <i className={`${isShortlisted ? "ri-heart-fill" : "ri-heart-line"} text-[1.05em]`} />
            <span className="text-sm">{isShortlisted ? "Shortlisted" : "Shortlist"}</span>
          </button>

          <button type="button" onClick={handleReject} disabled={loading} aria-pressed={isRejected} className={rejectBtnCls}>
            <i className={`${isRejected ? "ri-close-fill" : "ri-close-line"} text-[1.05em]`} />
            <span className="text-sm">{isRejected ? "Rejected" : "Reject"}</span>
          </button>

          <button type="button" onClick={handleSendTest} className={sendTestBtnCls}>
            <i className="ri-file-list-line text-[1.05em]" />
            <span className="text-sm">Send Test</span>
          </button>

          <button
            type="button"
            onClick={handleSchedule}
            disabled={scheduleHardDisabled || scheduleRouting}
            title={scheduleHardDisabled ? "Candidate email required to schedule" : scheduleSoftBlocked ? "Please complete the test first" : undefined}
            aria-disabled={scheduleHardDisabled || scheduleSoftBlocked || scheduleRouting}
            aria-busy={scheduleRouting ? "true" : "false"}
            aria-label="Send Schedule"
            className={scheduleBtnCls}
          >
            <i className="ri-calendar-event-line text-[1.05em]" />
            <span className="text-sm">Schedule</span>
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-[hsl(var(--muted)/0.4)] p-3 ring-1 ring-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Status</span>
            <span className={[
                "badge",
                isShortlisted ? "bg-[hsl(var(--success)/0.18)] text-[hsl(var(--success))]"
                : isRejected ? "bg-[hsl(var(--destructive)/0.18)] text-[hsl(var(--destructive))]"
                : "bg-[hsl(var(--info)/0.18)] text-[hsl(var(--info))]",
              ].join(" ")}
            >
              {isShortlisted ? "Shortlisted" : isRejected ? "Rejected" : "Under Review"}
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div role="status" aria-live="assertive" className="panel glass shadow-lux px-4 py-3 min-w:[260px]">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--destructive))]" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Action needed</div>
                <div className="mt-0.5 text-[hsl(var(--muted-foreground))]">{errorMsg}</div>
              </div>
              <button type="button" onClick={() => setErrorMsg(null)} className="icon-btn h-8 w-8" aria-label="Close" title="Close">✕</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
