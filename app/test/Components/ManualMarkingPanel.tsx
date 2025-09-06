// app/test/Components/ManualMarkingPanel.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

/* ========================
 * Types
 * ======================== */
type AttemptType = "smart" | "custom";

type CandidateShape = {
  _id?: string;
  name?: string;
  email?: string;
  resume?: { email?: string };
};

export type Attempt = {
  _id: string;
  type: AttemptType;
  score?: number | null;
  status?: string;
  submitted_at?: string; // ISO
  created_at?: string; // ISO
  // candidate linkage (backend may return any of these)
  candidateId?: string;
  candidate_id?: string;
  candidate?: CandidateShape;
};

type HistoryResponse = {
  attempts?: Attempt[];
  needs_marking?: Attempt[];
};

type Props = {
  /** Optional external list. If omitted, the panel will load from /tests/history/all and filter custom attempts needing grades. */
  attempts?: Attempt[];
  /** Called after a successful grade save. Useful for parent-driven refresh. */
  onAfterSave?: () => void;
  /** Title shown at the top of the card. */
  title?: string;
  /** Candidate to visually highlight in the list (optional). */
  highlightCandidateId?: string;
};

/* ========================
 * API helpers
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

const authHeaders = () => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const t = getAuthToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

function toDate(val?: string) {
  try {
    return val ? new Date(val) : null;
  } catch {
    return null;
  }
}

function fmtDate(val?: string) {
  const d = toDate(val);
  if (!d) return "—";
  try {
    return d.toLocaleString();
  } catch {
    return d.toISOString();
  }
}

function getCandId(a: Attempt): string | undefined {
  return a.candidateId || a.candidate_id || a.candidate?._id;
}

function getCandEmail(a: Attempt): string {
  return a.candidate?.email || a.candidate?.resume?.email || "—";
}

function getCandName(a: Attempt): string {
  return a.candidate?.name || getCandEmail(a) || getCandId(a) || "Candidate";
}

function needsManualMarking(a: Attempt): boolean {
  // Heuristics: custom test & no score yet OR explicit pending status
  const pendingFlags = ["pending", "awaiting", "manual", "review"];
  const s = (a.status || "").toLowerCase();
  const pending = pendingFlags.some((k) => s.includes(k));
  return a.type === "custom" && (a.score === undefined || a.score === null || pending);
}

/* ========================
 * Component
 * ======================== */
export default function ManualMarkingPanel({
  attempts: attemptsProp,
  onAfterSave,
  title = "Needs manual marking (custom)",
  highlightCandidateId,
}: Props) {
  const [loading, setLoading] = useState<boolean>(!attemptsProp);
  const [err, setErr] = useState<string | null>(null);

  const [attempts, setAttempts] = useState<Attempt[]>(attemptsProp || []);

  // local grade inputs
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // auto-grade progress
  const [autoGrading, setAutoGrading] = useState<boolean>(false);
  const [autoProgress, setAutoProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  // toasts
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const fetchNeedsMarking = useCallback(async () => {
    if (attemptsProp) return; // parent manages data
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/tests/history/all`, { headers: authHeaders() });
      const data = (await res.json().catch(() => ({}))) as HistoryResponse;

      // Prefer dedicated list if provided; else filter from attempts
      const base: Attempt[] = Array.isArray(data?.needs_marking)
        ? data!.needs_marking!
        : Array.isArray(data?.attempts)
        ? data!.attempts!.filter(needsManualMarking)
        : [];

      // Sort latest first
      const sortDesc = (x: Attempt, y: Attempt) => {
        const tx = toDate(x.submitted_at || x.created_at)?.getTime() ?? 0;
        const ty = toDate(y.submitted_at || y.created_at)?.getTime() ?? 0;
        return ty - tx;
      };
      setAttempts([...base].sort(sortDesc));
    } catch (e: any) {
      setErr(typeof e?.message === "string" ? e.message : "Failed to load custom attempts.");
    } finally {
      setLoading(false);
    }
  }, [attemptsProp]);

  useEffect(() => {
    if (!attemptsProp) fetchNeedsMarking();
  }, [attemptsProp, fetchNeedsMarking]);

  // Keep in sync when a parent provides attempts prop
  useEffect(() => {
    if (attemptsProp) setAttempts(attemptsProp);
  }, [attemptsProp]);

  const highlightSet = useMemo(
    () => new Set<string>(highlightCandidateId ? [highlightCandidateId] : []),
    [highlightCandidateId]
  );

  const onSaveGrade = async (attemptId: string) => {
    const score = Number(grades[attemptId]);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      showToast("Score must be a number between 0 and 100.");
      return;
    }
    try {
      setSavingId(attemptId);
      const res = await fetch(`${API_BASE}/tests/grade/${attemptId}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ score }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data && (data.detail || data.error)) || "Could not save grade.");
      }
      showToast("Custom test graded.");
      setGrades((g) => {
        const n = { ...g };
        delete n[attemptId];
        return n;
      });
      // Refresh local data
      if (!attemptsProp) {
        await fetchNeedsMarking();
      }
      // Notify parent if needed
      onAfterSave?.();
    } catch (e: any) {
      setErr(typeof e?.message === "string" ? e.message : "Failed to grade attempt.");
    } finally {
      setSavingId(null);
    }
  };

  /** 🔄 Attempt to auto-grade a custom attempt (MCQ / AI-check).
   *  Backend should grade MCQs immediately and can AI-check text answers.
   *  Falls back gracefully if endpoint is unavailable. */
  const autoGradeAttempt = async (attemptId: string) => {
    try {
      const res = await fetch(`${API_BASE}/tests/grade/auto/${attemptId}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}), // payload optional; kept empty for compatibility
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && (data.detail || data.error)) || `Auto-grade failed (${res.status})`);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleAutoGradeAll = async () => {
    if (autoGrading) return;
    const pending = attempts.filter(needsManualMarking);
    if (pending.length === 0) {
      showToast("Nothing to auto-grade.");
      return;
    }

    setAutoGrading(true);
    setAutoProgress({ done: 0, total: pending.length });

    let successCount = 0;
    for (let i = 0; i < pending.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await autoGradeAttempt(pending[i]._id);
      if (ok) successCount += 1;
      setAutoProgress({ done: i + 1, total: pending.length });
    }

    setAutoGrading(false);
    if (successCount > 0) {
      showToast(`Auto-graded ${successCount}/${pending.length} attempt${pending.length === 1 ? "" : "s"}.`);
      if (!attemptsProp) {
        await fetchNeedsMarking();
      }
      onAfterSave?.();
    } else {
      setErr("Auto-grade was not available for these attempts.");
    }
  };

  return (
    <div className="bg-card text-foreground rounded-2xl shadow-xl border border-border p-4 md:p-5">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="font-medium">{title}</div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {attempts.length} to review
          </div>
          <button
            type="button"
            onClick={handleAutoGradeAll}
            disabled={autoGrading || attempts.length === 0}
            aria-busy={autoGrading}
            className="btn btn-outline whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
            title="Auto-grade MCQs and AI-check text where supported"
          >
            {autoGrading ? (
              <span className="inline-flex items-center">
                <span className="w-4 h-4 mr-2 inline-block border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
                {autoProgress.done}/{autoProgress.total}
              </span>
            ) : (
              <>
                <i className="ri-magic-line mr-1" />
                Auto-grade all
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Loading…
        </div>
      )}
      {err && !loading && (
        <div
          className="rounded-xl border border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--destructive)/0.1)] p-3 text-sm text-[hsl(var(--destructive))] mb-3"
          role="alert"
          aria-live="assertive"
        >
          {err}
        </div>
      )}

      {!loading && attempts.length === 0 && (
        <div className="text-sm text-muted-foreground">No custom tests awaiting marking.</div>
      )}

      {!loading && attempts.length > 0 && (
        <div className="space-y-2">
          {attempts.map((a) => {
            const cid = getCandId(a);
            const pdfHref = cid ? `/tests/history/${cid}/${a._id}/report.pdf` : undefined;
            const highlighted = cid && highlightSet.has(cid);

            return (
              <div
                key={a._id}
                className={[
                  "rounded-xl border border-border p-3 md:p-4 bg-card/60 backdrop-blur-sm transition-colors",
                  highlighted ? "ring-2 ring-[hsl(var(--primary)/.6)]" : "",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <div className="text-sm font-medium">{getCandName(a)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Submitted: {fmtDate(a.submitted_at || a.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="input w-24"
                      placeholder="Score"
                      value={grades[a._id] ?? ""}
                      onChange={(e) =>
                        setGrades((s) => ({
                          ...s,
                          [a._id]: Number(e.target.value),
                        }))
                      }
                    />

                    {/* Save (manual) */}
                    <button
                      type="button"
                      onClick={() => onSaveGrade(a._id)}
                      disabled={savingId === a._id}
                      aria-busy={savingId === a._id}
                      className="btn btn-primary whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {savingId === a._id ? (
                        <span className="inline-flex items-center">
                          <span className="w-4 h-4 mr-2 inline-block border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                          Saving…
                        </span>
                      ) : (
                        <>
                          <i className="ri-save-3-line mr-1" />
                          Save
                        </>
                      )}
                    </button>

                    {/* Auto-grade single attempt */}
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await autoGradeAttempt(a._id);
                        if (ok) {
                          showToast("Auto-graded.");
                          if (!attemptsProp) await fetchNeedsMarking();
                          onAfterSave?.();
                        } else {
                          setErr("Auto-grade not available for this attempt.");
                        }
                      }}
                      className="btn btn-ghost whitespace-nowrap"
                      title="Auto-grade this attempt"
                    >
                      <i className="ri-sparkling-line mr-1" />
                      Auto
                    </button>

                    {cid && (
                      <a
                        href={`/candidate/${cid}`}
                        className="btn btn-outline text-sm"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <i className="ri-user-line mr-1" />
                        Profile
                      </a>
                    )}
                    {pdfHref && (
                      <a
                        href={pdfHref}
                        className="btn btn-outline text-sm"
                        target="_blank"
                        rel="noreferrer"
                        title="Open PDF report"
                      >
                        <i className="ri-file-pdf-line mr-1" />
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toasts */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div
            role="status"
            aria-live="polite"
            className="panel glass shadow-lux px-4 py-3 min-w-[260px]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Success</div>
                <div className="mt-0.5 text-[hsl(var(--muted-foreground))]">{toast}</div>
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
