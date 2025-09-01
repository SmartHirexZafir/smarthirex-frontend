// app/candidate/[id]/CandidateDetail.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { __raw: text };
  }
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token") ||
    null
  );
}

/* ---------- types ---------- */
type TabId = "profile" | "analysis" | "history";

type TabDef = {
  id: TabId;
  label: string;
  icon: string;
};

type Attempt = {
  id: string;
  submittedAt?: string;
  score?: number;
  pdfUrl?: string;
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

  // History state (from backend)
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);

  const fetchCandidate = useCallback(async () => {
    try {
      setLoading(true);

      const headers: Record<string, string> = { "Cache-Control": "no-cache" };
      const token = getAuthToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/candidate/${candidateId}`, {
        method: "GET",
        headers,
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

  // Fetch tests history for the History tab
  const fetchAttempts = useCallback(async () => {
    try {
      setAttemptsLoading(true);
      setAttemptsError(null);

      const headers: Record<string, string> = { "Cache-Control": "no-cache" };
      const token = getAuthToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/tests/history/${candidateId}`, {
        method: "GET",
        headers,
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any)?.detail || "Failed to fetch attempts");

      const source = Array.isArray((data as any)?.attempts) ? (data as any).attempts : Array.isArray(data) ? data : [];
      const norm: Attempt[] = source.map((a: any) => {
        const rawScore = a.score ?? a.result_score ?? a.test_score;
        const parsedScore =
          typeof rawScore === "number"
            ? Math.round(rawScore)
            : typeof rawScore === "string" && !isNaN(parseFloat(rawScore))
            ? Math.round(parseFloat(rawScore))
            : undefined;

        return {
          id: String(a.id ?? a._id ?? a.attemptId ?? a.attempt_id ?? ""),
          submittedAt: a.submittedAt ?? a.createdAt ?? a.created_at ?? a.timestamp,
          score: parsedScore,
          pdfUrl: a.pdfUrl ?? a.pdf_url ?? a.reportUrl ?? a.report_url,
        };
      });

      setAttempts(norm);
    } catch (err: any) {
      setAttemptsError(err?.message || "Failed to load history");
      setAttempts(null);
    } finally {
      setAttemptsLoading(false);
    }
  }, [candidateId]);

  // initial load
  useEffect(() => {
    void fetchCandidate();
  }, [fetchCandidate]);

  // 🔕 No interval polling (prevents blink). Refresh on focus/visibility only.
  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchCandidate();
        if (activeTab === "history") void fetchAttempts();
      }
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [fetchCandidate, fetchAttempts, activeTab]);

  // Load history when switching to History tab
  useEffect(() => {
    if (activeTab === "history") {
      void fetchAttempts();
    }
  }, [activeTab, fetchAttempts]);

  const handleStatusChange = async (newStatus: string) => {
    try {
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
  const matchReason =
    candidate.match_reason === "Prompt filtered" ? "Filtered by prompt" : "ML classified";

  // helpers
  const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const fullPdfUrl = (pdfUrl?: string) => {
    if (!pdfUrl) return undefined;
    return pdfUrl.startsWith("http")
      ? pdfUrl
      : `${API_BASE}${pdfUrl.startsWith("/") ? pdfUrl : `/${pdfUrl}`}`;
  };

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

              {/* RIGHT SIDE: Only keep Category + ML classified */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="badge badge-info">
                  <i className="ri-briefcase-line mr-1" />
                  {category}
                </div>
                <div className="badge badge-accent">
                  <i className="ri-compass-3-line mr-1" />
                  {matchReason}
                </div>
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
            {/* Tabs Header (themed) */}
            <div className="surface glass rounded-t-2xl border border-border/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="tabs">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab ${activeTab === tab.id ? "active" : ""}`}
                      aria-pressed={activeTab === tab.id}
                      aria-label={tab.label}
                      type="button"
                    >
                      <i className={`${tab.icon} mr-2`} />
                      {tab.label}
                    </button>
                  ))}
                </div>
                {/* No manual refresh button (prevents blink) */}
              </div>
            </div>

            {/* Tab Panels */}
            <div className="surface glass rounded-b-2xl border-x border-b border-border/60">
              {activeTab === "profile" && <ResumePreview candidate={candidate} />}

              {activeTab === "analysis" && <ScoreAnalysis candidate={candidate} detailed />}

              {activeTab === "history" && (
                <div className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Test History</h3>
                  </div>

                  {/* Loading state */}
                  {attemptsLoading && (
                    <div className="space-y-3">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="animate-loading-bar rounded-xl border border-border p-3">
                          <div className="h-5 w-40 skeleton mb-2" />
                          <div className="h-4 w-24 skeleton" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error state */}
                  {attemptsError && !attemptsLoading && (
                    <div className="rounded-xl bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.25)] p-3">
                      <div className="flex items-center gap-2 text-[hsl(var(--destructive))]">
                        <i className="ri-error-warning-line" />
                        <span className="text-sm">{attemptsError}</span>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!attemptsLoading && !attemptsError && Array.isArray(attempts) && attempts.length === 0 && (
                    <div className="rounded-xl bg-muted/30 border border-border p-4">
                      <p className="text-sm text-muted-foreground">
                        No test attempts found for this candidate yet.
                      </p>
                    </div>
                  )}

                  {/* Attempts list */}
                  {!attemptsLoading && !attemptsError && Array.isArray(attempts) && attempts.length > 0 && (
                    <div className="space-y-3">
                      {attempts.map((a) => {
                        const pdf = fullPdfUrl(a.pdfUrl);
                        return (
                          <div
                            key={a.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-card/70 border border-border backdrop-blur-md"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                                <i className="ri-clipboard-line text-[hsl(var(--info))]" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  Attempt <span className="text-muted-foreground">#{a.id.slice(-6)}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted: {fmtDate(a.submittedAt)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="badge">
                                Score: {typeof a.score === "number" ? `${a.score}%` : "N/A"}
                              </span>
                              {pdf ? (
                                <a
                                  href={pdf}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-outline text-xs px-3 py-1.5"
                                  title="Open PDF report"
                                >
                                  <i className="ri-file-pdf-line mr-1" />
                                  Report
                                </a>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
