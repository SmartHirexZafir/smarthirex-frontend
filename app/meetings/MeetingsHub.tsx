// app/meetings/MeetingsHub.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import InterviewScheduler from "./InterviewScheduler";

/** ========================
 * Types
 * ======================== */
type HubTab = "schedule";

type CandidateAttemptSummary = {
  id: string;
  submittedAt?: string;
  score?: number | null;
};

type CandidateHistoryResponse = {
  candidateId: string;
  attempts: CandidateAttemptSummary[];
};

type TodayStats = {
  scheduled_today?: number;
  tests_pending?: number;
};

/** ========================
 * Small API helpers (env-driven, no hardcoding)
 * ======================== */
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

const authHeaders = (): Record<string, string> => {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const t = getAuthToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

async function safeJson<T = any>(res: Response): Promise<T> {
  const txt = await res.text();
  if (!txt) return {} as T;
  try {
    return JSON.parse(txt) as T;
  } catch {
    return { raw: txt } as unknown as T;
  }
}

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(id) };
}

/** ========================
 * Component
 * ======================== */
export default function MeetingsHub() {
  const [activeTab, setActiveTab] = useState<HubTab>("schedule");

  // Read candidateId from the query string so we can render the prefilled flow
  const params = useSearchParams();
  const candidateId = params.get("candidateId") || "";

  // Page-level toast (used when InterviewScheduler sends emails/schedules)
  const [toast, setToast] = useState<string | null>(null);
  const handleToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  /** ----------------
   * Gate on test completion (Req 8.1)
   * If a candidateId is provided via query, we must verify they have at least one submitted attempt.
   * Meetings are not allowed until a test exists.
   * ---------------- */
  const [checkingGate, setCheckingGate] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [blockedByGate, setBlockedByGate] = useState(false);

  const gateMessage = useMemo(() => {
    if (!candidateId) return null;
    if (checkingGate) return "Checking candidate eligibility…";
    if (gateError) return gateError;
    if (blockedByGate)
      return "Meetings are not allowed until the candidate has completed a test.";
    return null;
  }, [candidateId, checkingGate, gateError, blockedByGate]);

  useEffect(() => {
    let cancelled = false;
    async function checkEligibility() {
      if (!candidateId) {
        setBlockedByGate(false);
        setGateError(null);
        return;
      }
      setCheckingGate(true);
      setGateError(null);
      try {
        const { signal, cancel } = withTimeout(12000);
        try {
          const res = await fetch(
            `${API_BASE}/tests/history/${encodeURIComponent(candidateId)}`,
            {
              method: "GET",
              headers: authHeaders(),
              signal,
            }
          );
          const data = await safeJson<CandidateHistoryResponse>(res);
          if (!res.ok) {
            const msg =
              (data as any)?.detail ||
              (data as any)?.error ||
              `Failed to verify candidate (status ${res.status})`;
            throw new Error(msg);
          }
          const attempts = Array.isArray(data?.attempts) ? data.attempts : [];
          // Eligibility rule: at least one attempt that has a submittedAt timestamp
          const eligible = attempts.some((a) => !!a.submittedAt);
          if (!cancelled) {
            setBlockedByGate(!eligible);
          }
        } finally {
          cancel();
        }
      } catch (e: any) {
        if (!cancelled) {
          setGateError(
            e?.message || "Unable to verify candidate eligibility right now."
          );
          // Safer default: block scheduling until we know for sure
          setBlockedByGate(true);
        }
      } finally {
        if (!cancelled) setCheckingGate(false);
      }
    }
    checkEligibility();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  /** ----------------
   * Optional: tiny stats on header chips (no hardcoding; hide if unavailable)
   * ---------------- */
  const [stats, setStats] = useState<{ today?: TodayStats } | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const { signal, cancel } = withTimeout(8000);
        try {
          // Best guess endpoint; backend file list includes "dashboard_router" and "interviews_router".
          // We try interviews stats first; if it fails, we silently hide chips.
          const res = await fetch(`${API_BASE}/interviews/stats/today`, {
            headers: authHeaders(),
            signal,
          });
          if (res.ok) {
            const data = await safeJson<TodayStats>(res);
            if (!cancelled) setStats({ today: data });
          }
        } finally {
          cancel();
        }
      } catch {
        // ignore – just hide chips if unavailable
      }
    }
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduledToday =
    stats?.today?.scheduled_today ?? null; // null => hide; number => show
  const testsPending = stats?.today?.tests_pending ?? null;

  return (
    <div className="min-h-screen bg-background page-aurora">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-sm shadow-lg">
        <div className="mx-auto max-w-7xl px-6 md:px-8 py-5 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/upload"
                className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Go back"
              >
                <i className="ri-arrow-left-line text-xl" />
              </Link>

              <div>
                <h1 className="flex items-center text-foreground text-2xl font-bold">
                  <i className="ri-calendar-event-line mr-3 text-foreground/80" />
                  Interviews &amp; Tests Center
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage interviews, tests, and candidate assessments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {typeof scheduledToday === "number" && (
                <div className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  <i className="ri-calendar-check-line mr-2" />
                  {scheduledToday} Scheduled Today
                </div>
              )}
              {typeof testsPending === "number" && (
                <div className="rounded-full border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground">
                  <i className="ri-test-tube-line mr-2" />
                  {testsPending} Tests Pending
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-6">
        <div className="mb-6 rounded-2xl border border-border bg-card/90 p-4 md:p-6 shadow-lg backdrop-blur-sm">
          <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
            {(
              [
                {
                  id: "schedule",
                  label: "Schedule Interviews",
                  icon: "ri-calendar-event-line",
                },
              ] as Array<{ id: HubTab; label: string; icon: string }>
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={`flex flex-1 items-center justify-center rounded-lg px-4 md:px-6 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? "border border-border bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                  aria-pressed={isActive}
                >
                  <i className={`${tab.icon} mr-2`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* If we have a candidateId, show a subtle eligibility banner for context */}
          {candidateId && (
            <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {checkingGate ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Checking test completion for candidate{" "}
                  <span className="font-medium text-foreground">{candidateId}</span>
                  …
                </span>
              ) : blockedByGate ? (
                <>
                  <i className="ri-information-line mr-1" />
                  Candidate <span className="font-medium text-foreground">{candidateId}</span>{" "}
                  has not completed a test yet. Scheduling is blocked until a test is
                  completed.
                </>
              ) : (
                <>
                  <i className="ri-check-line mr-1 text-success" />
                  Candidate{" "}
                  <span className="font-medium text-foreground">{candidateId}</span>{" "}
                  is eligible for scheduling.
                </>
              )}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "schedule" && !blockedByGate && (
            <InterviewScheduler
              prefilled={candidateId ? { candidateId } : undefined}
              onToast={handleToast}
              // Passing through an optional onError if the component supports it; ignored otherwise
              onError={(msg: string) => handleToast(msg)}
            />
          )}

          {/* Gate overlay card when blocked */}
          {activeTab === "schedule" && blockedByGate && (
            <div className="rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--destructive))]" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">Test required before scheduling</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Meetings can’t be scheduled until the candidate has taken a test.
                    Please send a test invite and wait for completion. This ensures
                    fairness and keeps your pipeline clean.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link
                      href="/test"
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <i className="ri-mail-send-line mr-2" />
                      Send a Test
                    </Link>
                    <Link
                      href="/history"
                      className="inline-flex items-center justify-center rounded-lg border border-input px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <i className="ri-hourglass-line mr-2" />
                      Check Test Status
                    </Link>
                    <button
                      type="button"
                      onClick={() => (window.location.href = "/upload")}
                      className="inline-flex items-center justify-center rounded-lg border border-input px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <i className="ri-arrow-left-line mr-2" />
                      Back to Uploads
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast from child actions (email sent / scheduled, etc.) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div
            role="status"
            aria-live="polite"
            className="panel glass shadow-lux min-w-[260px] px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Success</div>
                <div className="mt-0.5 text-[hsl(var(--muted-foreground))]">
                  {toast}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
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
    </div>
  );
}
