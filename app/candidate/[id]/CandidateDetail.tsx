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
  type?: string; // "smart" | "custom"
  needs_marking?: boolean;
  custom?: {
    title?: string;
  };
};

// TABS will be dynamically generated from candidate data or use defaults
const DEFAULT_TABS: TabDef[] = [
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
          type: a.type ?? "smart",
          needs_marking: a.needs_marking ?? false,
          custom: a.custom,
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

  const fullPdfUrl = (pdfUrl?: string) => {
    if (!pdfUrl) return undefined;
    return pdfUrl.startsWith("http")
      ? pdfUrl
      : `${API_BASE}${pdfUrl.startsWith("/") ? pdfUrl : `/${pdfUrl}`}`;
  };

  // Removed local loader - global loader and Suspense fallback handle loading state
  if (loading) {
    return null;
  }

  if (error || !candidate) {
    const errorLabels = (candidate as any)?.labels || {};
    const notFoundLabel = errorLabels.notFound || "Candidate not found";
    const backLabel = errorLabels.backToCandidates || "Back to candidates";
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="surface glass rounded-2xl p-8 text-center max-w-md animate-rise-in">
          <i className="ri-user-line text-6xl text-muted-foreground mb-4 glow" />
          <p className="text-foreground/90 text-lg">{error || notFoundLabel}</p>
          <Link
            href="/upload"
            className="btn btn-primary mt-4 inline-flex items-center gap-2"
            aria-label={backLabel}
          >
            <i className="ri-arrow-left-line" />
            {backLabel}
          </Link>
        </div>
      </div>
    );
  }

  // Dynamic labels from candidate data
  const labels = (candidate as any)?.labels || {};
  const categoryLabel = labels.category || "Category";
  const matchReasonLabel = labels.matchReason || "Match Reason";
  const profileTitle = labels.profileTitle || "Candidate Profile";
  const profileSubtitle = labels.profileSubtitle || "Detailed view and assessment";
  const backToUploadLabel = labels.backToUpload || "Back to upload";
  const testHistoryLabel = labels.testHistory || "Test History";
  const noAttemptsLabel = labels.noAttempts || "No test attempts found for this candidate yet.";
  const openLabel = labels.open || "Open";
  const reportLabel = labels.report || "Report";
  const attemptLabel = labels.attempt || "Attempt";
  const submittedLabel = labels.submitted || "Submitted";
  const scoreLabel = labels.score || "Score";
  
  // Dynamic tabs from candidate data or use defaults
  const tabs: TabDef[] = (candidate as any)?.tabs || DEFAULT_TABS;
  
  const category = candidate.category || candidate.predicted_role || labels.unknown || "";
  const matchReason =
    candidate.match_reason === "Prompt filtered" 
      ? (labels.filteredByPrompt || "Filtered by prompt")
      : (labels.mlClassified || "ML classified");

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
                  aria-label={backToUploadLabel}
                  title={backToUploadLabel}
                >
                  <i className="ri-arrow-left-line" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold leading-tight">
                    <span className="gradient-text">{profileTitle}</span>
                  </h1>
                  <p className="text-muted-foreground">{profileSubtitle}</p>
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
            {/* Score & Analysis removed - available in Analysis tab */}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 space-y-0">
            {/* Tabs Header (themed) */}
            <div className="surface glass rounded-t-2xl border border-border/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="tabs">
                  {tabs.map((tab) => (
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
                    <h3 className="text-lg font-semibold">{testHistoryLabel}</h3>
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
                        {noAttemptsLabel}
                      </p>
                    </div>
                  )}

                  {/* Attempts list */}
                  {!attemptsLoading && !attemptsError && Array.isArray(attempts) && attempts.length > 0 && (
                    <div className="space-y-3">
                      {attempts.map((a) => {
                        const pdf = fullPdfUrl(a.pdfUrl);
                        // Get test name/type
                        const testType = a.type || "smart";
                        const testName = 
                          testType === "custom" && a.custom?.title
                            ? a.custom.title
                            : testType === "smart"
                            ? "Smart Test"
                            : "Custom Test";
                        const isPending = a.needs_marking && (a.score === 0 || a.score === undefined || a.score === null);
                        
                        return (
                          <div
                            key={a.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-card/70 border border-border backdrop-blur-md"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                                <i className="ri-clipboard-line text-[hsl(var(--info))]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  {testName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {submittedLabel}: {fmtDate(a.submittedAt)}
                                </p>
                                {isPending && (
                                  <p className="text-xs text-[hsl(var(--warning))] mt-1">
                                    <i className="ri-time-line mr-1" />
                                    Awaiting manual grading
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="badge">
                                {scoreLabel}: {typeof a.score === "number" ? `${a.score}%` : labels.notAvailable || "—"}
                              </span>

                              {/* ✅ Ensure each item has a working link: View in Tests (app route) */}
                              <Link
                                href={`/test?attemptId=${encodeURIComponent(a.id)}&candidateId=${encodeURIComponent(
                                  candidateId
                                )}`}
                                className="btn btn-outline text-xs px-3 py-1.5"
                                title={labels.openInTests || "Open in Tests"}
                              >
                                <i className="ri-external-link-line mr-1" />
                                {openLabel}
                              </Link>

                              {/* ✅ PDF report (absolute URL-safe) if available */}
                              {pdf ? (
                                <a
                                  href={pdf}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-outline text-xs px-3 py-1.5"
                                  title={labels.openPdfReport || "Open PDF report"}
                                >
                                  <i className="ri-file-pdf-line mr-1" />
                                  {reportLabel}
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
