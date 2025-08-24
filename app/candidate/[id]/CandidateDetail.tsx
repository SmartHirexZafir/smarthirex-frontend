// app/candidate/[id]/CandidateDetail.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import CandidateProfile from "./CandidateProfile";
import ResumePreview from "./ResumePreview";
import ActionButtons from "./ActionButtons";
import ScoreAnalysis from "./ScoreAnalysis";

/* ---------- API base (dual env + trim trailing slash) ---------- */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

/* ---------- helpers ---------- */
async function safeJson(res: Response) {
  // handle non-JSON / empty bodies gracefully
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { __raw: text };
  }
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/* ---------- types ---------- */
type TabId = "profile" | "analysis" | "history";

type TabDef = {
  id: TabId;
  label: string;
  icon: string;
};

const TABS: TabDef[] = [
  { id: "profile", label: "Resume", icon: "ri-file-text-line" },
  { id: "analysis", label: "Analysis", icon: "ri-bar-chart-line" },
  { id: "history", label: "History", icon: "ri-history-line" },
];

export default function CandidateDetail({ candidateId }: { candidateId: string }) {
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const mountedAtRef = useRef<number>(Date.now()); // for short-lived polling
  const pollingIdRef = useRef<number | null>(null);

  const fetchCandidate = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ Build headers without union types
      const headers: Record<string, string> = { "Cache-Control": "no-cache" };
      const token = getAuthToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/candidate/${candidateId}`, {
        method: "GET",
        headers, // typed as Record<string,string> => compatible with HeadersInit
      });

      if (res.status === 401) {
        setError("Unauthorized. Please log in again.");
        setCandidate(null);
        return;
      }

      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any)?.detail || "Failed to fetch candidate");

      setCandidate(data);
      setError("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  // initial load
  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  // live auto-refresh (short window) to catch score updates soon after a test submission
  useEffect(() => {
    // poll every 15s for up to 3 minutes after mount
    const POLL_MS = 15000;
    const MAX_MS = 3 * 60 * 1000;

    function shouldPollNow() {
      return Date.now() - mountedAtRef.current < MAX_MS;
    }

    if (pollingIdRef.current) {
      window.clearInterval(pollingIdRef.current);
      pollingIdRef.current = null;
    }

    if (shouldPollNow()) {
      pollingIdRef.current = window.setInterval(() => {
        if (!shouldPollNow()) {
          if (pollingIdRef.current) {
            window.clearInterval(pollingIdRef.current);
            pollingIdRef.current = null;
          }
          return;
        }
        const score = Number(candidate?.test_score ?? 0);
        if (!candidate || !Number.isFinite(score) || score === 0 || activeTab === "analysis") {
          fetchCandidate();
        }
      }, POLL_MS) as any;
    }

    return () => {
      if (pollingIdRef.current) {
        window.clearInterval(pollingIdRef.current);
        pollingIdRef.current = null;
      }
    };
  }, [candidate?.test_score, activeTab, fetchCandidate, candidate]);

  // refresh when the tab becomes visible / regains focus (common after test completion)
  useEffect(() => {
    const onFocusOrVisible = () => fetchCandidate();
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocusOrVisible();
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchCandidate]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      // ✅ Build headers without union types
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = getAuthToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/candidate/${candidateId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.status === 401) {
        alert("Unauthorized. Please log in again.");
        return;
      }

      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any)?.detail || "Failed to update status");

      setCandidate((prev: any) => ({
        ...prev,
        status: newStatus,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Status update failed";
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center surface glass rounded-2xl px-8 py-10 animate-rise-in">
          <div className="w-16 h-16 rounded-full border-4 border-primary/70 border-t-transparent animate-spin mx-auto mb-5 glow" />
          <p className="text-muted-foreground">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="surface glass rounded-2xl p-8 text-center max-w-md animate-rise-in">
          <i className="ri-user-line text-6xl text-muted-foreground mb-4 glow" />
          <p className="text-foreground/90 text-lg">{error || "Candidate not found"}</p>
          <Link
            href="/upload"
            className="btn btn-primary mt-4 inline-flex items-center gap-2"
            aria-label="Back to candidates"
          >
            <i className="ri-arrow-left-line" />
            Back to candidates
          </Link>
        </div>
      </div>
    );
  }

  const category = candidate.category || candidate.predicted_role || "Unknown";
  const confidence =
    candidate.confidence !== undefined ? `${Number(candidate.confidence).toFixed(2)}%` : "N/A";
  const matchReason =
    candidate.match_reason === "Prompt filtered" ? "Filtered by prompt" : "ML classified";

  // fresh test score from backend (tests/submit updates parsed_resumes.test_score)
  const testScore =
    typeof candidate.test_score === "number" && Number.isFinite(candidate.test_score)
      ? Math.round(candidate.test_score)
      : null;

  return (
    <div className="min-h-screen">
      {/* In-page subheader (does NOT replace global header/footer) */}
      <div className="sticky top-0 z-40 full-bleed">
        <div className="surface glass gradient-border border border-border/60">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/upload"
                  className="icon-btn"
                  aria-label="Back to upload"
                  title="Back"
                >
                  <i className="ri-arrow-left-line" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold leading-tight">
                    <span className="gradient-text">Candidate Profile</span>
                  </h1>
                  <p className="text-muted-foreground">Detailed view and assessment</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {Number(candidate?.rank) > 0 && (
                  <div className="badge badge-primary">
                    <i className="ri-medal-line mr-2" />
                    Rank #{candidate.rank}
                  </div>
                )}
                <div className="badge badge-info">
                  <i className="ri-briefcase-line mr-1" />
                  {category}
                </div>
                <div className="badge badge-warning">
                  <i className="ri-flashlight-line mr-1" />
                  {confidence}
                </div>
                <div className="badge badge-accent">
                  <i className="ri-compass-3-line mr-1" />
                  {matchReason}
                </div>

                {testScore !== null && (
                  <div
                    className="badge badge-success"
                    title="Latest assessment score (MCQ percent)"
                  >
                    <i className="ri-checkbox-circle-line mr-1" />
                    Score: {testScore}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-4">
            <CandidateProfile candidate={candidate} />
            <ActionButtons candidate={candidate} onStatusChange={handleStatusChange} />
            <ScoreAnalysis candidate={candidate} />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 space-y-0">
            {/* Tabs Header */}
            <div className="surface glass rounded-t-2xl border border-border/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
                      aria-pressed={activeTab === tab.id}
                      aria-label={tab.label}
                      type="button"
                    >
                      <i className={`${tab.icon} mr-2`} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Quick manual refresh */}
                <button
                  onClick={fetchCandidate}
                  className="btn btn-ghost"
                  title="Refresh candidate"
                  type="button"
                >
                  <i className="ri-refresh-line mr-1" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Tab Panels */}
            <div className="surface glass rounded-b-2xl border-x border-b border-border/60">
              {activeTab === "profile" && <ResumePreview candidate={candidate} />}
              {activeTab === "analysis" && <ScoreAnalysis candidate={candidate} detailed />}

              {activeTab === "history" && (
                <div className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Interaction History</h3>
                    <button
                      onClick={fetchCandidate}
                      className="btn btn-ghost"
                      title="Refresh history"
                      type="button"
                    >
                      <i className="ri-refresh-line mr-1" />
                      Refresh
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-info/10 border border-info/20">
                      <i className="ri-eye-line text-info" />
                      <div>
                        <p className="text-sm font-medium">Profile viewed</p>
                        <p className="text-xs text-muted-foreground">Just now</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                      <i className="ri-upload-line text-success" />
                      <div>
                        <p className="text-sm font-medium">Resume uploaded</p>
                        <p className="text-xs text-muted-foreground">From database</p>
                      </div>
                    </div>
                    {/* TODO: append dynamic items from history API here later */}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
