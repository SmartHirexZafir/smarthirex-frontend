// app/test/Components/PreviewPanel.tsx
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
  return (
    a.candidate?.email ||
    a.candidate?.resume?.email ||
    "—"
  );
}

function getCandName(a: Attempt): string {
  return a.candidate?.name || getCandEmail(a) || getCandId(a) || "Candidate";
}

/* ========================
 * Component
 * ======================== */
export default function PreviewPanel({ highlightCandidateId }: { highlightCandidateId?: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [needsMarking, setNeedsMarking] = useState<Attempt[]>([]);

  // local grade inputs
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // toasts
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/tests/history/all`, { headers: authHeaders() });
      const data = (await res.json().catch(() => ({}))) as HistoryResponse;

      const arr = Array.isArray(data?.attempts) ? data!.attempts! : [];
      const needs = Array.isArray(data?.needs_marking) ? data!.needs_marking! : [];

      const sortDesc = (x: Attempt, y: Attempt) => {
        const tx = toDate(x.submitted_at || x.created_at)?.getTime() ?? 0;
        const ty = toDate(y.submitted_at || y.created_at)?.getTime() ?? 0;
        return ty - tx;
      };

      setAttempts([...arr].sort(sortDesc));
      setNeedsMarking([...needs].sort(sortDesc));
    } catch (e: any) {
      setErr(typeof e?.message === "string" ? e.message : "Failed to load test history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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
      await fetchHistory();
    } catch (e: any) {
      setErr(typeof e?.message === "string" ? e.message : "Failed to grade attempt.");
    } finally {
      setSavingId(null);
    }
  };

  const highlightSet = useMemo(() => new Set<string>(highlightCandidateId ? [highlightCandidateId] : []), [highlightCandidateId]);

  return (
    <div className="space-y-6">
      {/* Header / Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preview Tests</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchHistory}
            className="px-3 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <i className="ri-refresh-line mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Loading test history…
        </div>
      )}
      {err && !loading && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      {/* All attempts */}
      {!loading && (
        <div className="bg-card text-foreground rounded-2xl shadow-xl border border-border p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">All tests & scores</div>
            <div className="text-xs text-muted-foreground">{attempts.length} total</div>
          </div>

          {attempts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No attempts yet.</div>
          ) : (
            <div className="space-y-2">
              {attempts.map((a) => {
                const cid = getCandId(a);
                const isSmart = a.type === "smart";
                const isHighlighted = cid && highlightSet.has(cid);
                const scoreStr =
                  a.score === null || a.score === undefined ? "—" : `${a.score}%`;
                const pdfHref = cid
                  ? `${API_BASE}/tests/history/${cid}/${a._id}/report.pdf`
                  : undefined;

                return (
                  <div
                    key={a._id}
                    className={[
                      "rounded-xl border border-border p-3 md:p-4",
                      isHighlighted ? "ring-2 ring-primary/60" : "",
                      "bg-muted/30",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[220px]">
                        <div className="text-sm font-medium flex items-center gap-2">
                          <span className="truncate">{getCandName(a)}</span>
                          <span
                            className={[
                              "px-2 py-0.5 rounded-full text-[11px] border",
                              isSmart
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200",
                            ].join(" ")}
                            title={isSmart ? "Auto-evaluated by AI" : "Custom test (may require manual marking)"}
                          >
                            {isSmart ? "Smart AI" : "Custom"}
                          </span>
                          {isHighlighted && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary border border-primary/20">
                              From this profile
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Submitted: {fmtDate(a.submitted_at || a.created_at)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-auto">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Score</div>
                          <div className="text-base font-semibold">{scoreStr}</div>
                        </div>

                        {cid && (
                          <a
                            href={`/candidate/${cid}`}
                            className="px-3 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 text-sm"
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
                            className="px-3 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 text-sm"
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
        </div>
      )}

      {/* Needs manual marking (custom tests) */}
      {!loading && (
        <div className="bg-card text-foreground rounded-2xl shadow-xl border border-border p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Needs manual marking (custom)</div>
            <div className="text-xs text-muted-foreground">
              {needsMarking.length} to review
            </div>
          </div>

          {needsMarking.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No custom tests awaiting marking.
            </div>
          ) : (
            <div className="space-y-2">
              {needsMarking.map((a) => {
                const cid = getCandId(a);
                const pdfHref = cid
                  ? `${API_BASE}/tests/history/${cid}/${a._id}/report.pdf`
                  : undefined;
                return (
                  <div
                    key={a._id}
                    className="rounded-xl border border-border p-3 md:p-4 bg-muted/20"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[220px]">
                        <div className="text-sm font-medium">
                          {getCandName(a)}
                        </div>
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
                        <button
                          type="button"
                          onClick={() => onSaveGrade(a._id)}
                          disabled={savingId === a._id}
                          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
                        >
                          {savingId === a._id ? "Saving…" : "Save"}
                        </button>

                        {cid && (
                          <a
                            href={`/candidate/${cid}`}
                            className="px-3 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 text-sm"
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
                            className="px-3 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 text-sm"
                            target="_blank"
                            rel="noreferrer"
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

      {err && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div
            role="status"
            aria-live="assertive"
            className="panel glass shadow-lux px-4 py-3 min-w-[260px]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--destructive))]" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Action failed</div>
                <div className="mt-0.5 text-[hsl(var(--muted-foreground))]">
                  {err}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErr(null)}
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
