// app/test/Components/TestResult.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/** ---------- Types (backward-compatible, all new fields optional) ---------- */

export type MatchResult = {
  mode?: string;
  passed?: boolean;
  expected?: string;
  detail?: string;
};

export type CodeTestCaseResult = {
  name?: string;
  ok?: boolean;
  timeout?: boolean;
  stdout?: string;
  stderr?: string;
  time_sec?: number;
  match_result?: MatchResult;
};

export type RubricCriterion = {
  id?: string;
  description?: string;
  weight?: number;     // 0..1
  score?: number;      // 0..5 (or any scale returned by backend)
  comments?: string;
};

export type RubricBreakdown = {
  question_id?: string;
  total?: number;
  max_total?: number;
  criteria?: RubricCriterion[];
};

export type SubmitDetail = {
  question: string;
  submitted: string;
  correct: string;      // MCQs have this; free-form often empty
  is_correct: boolean;  // may be false for ungraded, true/false for auto-graded
  explanation: string;  // backend comments / rubric notes

  // New (optional) — shown when provided by backend:
  type?: "mcq" | "code" | "scenario";
  score?: number;             // points earned
  max_score?: number;         // max points
  tests?: CodeTestCaseResult[];          // for code questions
  rubric_breakdown?: RubricBreakdown;    // for scenario (or code) questions
  rubric?: RubricBreakdown;              // alt key some backends use
};

export type SubmitResponse = {
  test_id: string;
  candidate_id: string;
  score: number;           // percent from backend (legacy)
  details: SubmitDetail[];
};

type Props = {
  result: SubmitResponse;
  onBack: () => void;
  onRetake?: () => void;
  title?: string;
  /** NEW (optional): show legacy "Back" button that calls onBack. Default: false */
  allowSiteBack?: boolean;
};

/** ------------------------- Small UI helpers ------------------------- */
function Badge({
  children,
  tone = "gray",
  title,
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "red" | "amber" | "indigo";
  title?: string;
}) {
  const map: Record<string, string> = {
    gray: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
    green: "bg-[hsl(var(--success))] text-white",
    red: "bg-[hsl(var(--destructive))] text-white",
    amber: "bg-[hsl(var(--warning))] text-black",
    indigo: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
  };
  return (
    <div
      className={`ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${map[tone]}`}
      title={title}
    >
      {children}
    </div>
  );
}

function Disclose({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="mt-3 rounded-lg border border-border" {...(defaultOpen ? { open: true } : {})}>
      <summary className="cursor-pointer select-none rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
        {summary}
      </summary>
      <div className="px-3 pb-3 pt-1">{children}</div>
    </details>
  );
}

function KeyVal({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-12 gap-2 text-xs">
      <div className="col-span-4 text-[hsl(var(--muted-foreground))]">{k}</div>
      <div className="col-span-8 break-words font-medium text-foreground">{v}</div>
    </div>
  );
}

function MonoBlock({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-2 text-xs text-foreground">
      {children}
    </pre>
  );
}

/** ------------------------- Component ------------------------- */

export default function TestResult({
  result,
  onBack,
  onRetake,
  title,
  allowSiteBack = false,
}: Props) {
  const safeDetails = Array.isArray(result?.details) ? result.details : [];
  const safeScorePct = Number.isFinite(result?.score) ? Number(result.score) : 0;

  const [toast, setToast] = useState<string | null>(null);

  // Derive MCQ stats (kept as-is for backward compatibility)
  const { totalMcq, correctMcq, percent } = useMemo(() => {
    const onlyMcq = safeDetails.filter((d) => (d?.correct || "").trim().length > 0);
    const total = onlyMcq.length;
    const correct = onlyMcq.filter((d) => d?.is_correct).length;
    const pct = Math.round(safeScorePct);
    return { totalMcq: total, correctMcq: correct, percent: pct };
  }, [safeDetails, safeScorePct]);

  // Optional: compute auto-graded (free-form) aggregate if backend provides scores
  const autoAgg = useMemo(() => {
    let sum = 0;
    let max = 0;
    safeDetails.forEach((d) => {
      const s = Number(d?.score);
      const m = Number(d?.max_score);
      if (Number.isFinite(s) && Number.isFinite(m) && m > 0) {
        sum += s;
        max += m;
      }
    });
    const pct = max > 0 ? Math.round((sum / max) * 100) : null;
    return { sum, max, pct };
  }, [safeDetails]);

  // Strong “no back” guard so candidates don’t navigate away after submit
  useEffect(() => {
    const MARK = "__TEST_RESULT_NO_BACK__";
    try {
      const cur = (history.state || {}) as Record<string, unknown>;
      if ((cur as any)[MARK] !== true) {
        history.replaceState({ ...(cur || {}), [MARK]: true }, "");
      }
      history.pushState({ [MARK]: true }, "");
    } catch {}

    const onPop = () => {
      try {
        history.go(1);
      } catch {
        try {
          history.pushState({ [MARK]: true }, "");
        } catch {}
      }
      setToast("This page can’t be navigated back to. Please close this tab.");
      window.clearTimeout((onPop as any)._t);
      (onPop as any)._t = window.setTimeout(() => setToast(null), 1600);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function tryCloseTab() {
    window.close();
    setToast("You can now close this tab and return to your email.");
    window.clearTimeout((tryCloseTab as any)._t);
    (tryCloseTab as any)._t = window.setTimeout(() => setToast(null), 1600);
  }

  // Label chip per row (kept logic, extended for auto-graded)
  function rowChip(d: SubmitDetail) {
    const hasCorrect = (d?.correct || "").trim().length > 0;
    const isFreeForm = !hasCorrect;
    const isAutoGraded =
      isFreeForm && typeof d?.is_correct === "boolean" && (d.explanation?.length > 0 || Number.isFinite(d?.score));

    if (hasCorrect) {
      return (
        <Badge tone={d.is_correct ? "green" : "red"} title={d.is_correct ? "MCQ marked correct" : "MCQ marked incorrect"}>
          {d.is_correct ? "Correct" : "Incorrect"}
        </Badge>
      );
    }
    if (isAutoGraded) {
      return (
        <Badge tone={d.is_correct ? "green" : "amber"} title="Free-form auto-graded">
          {d.is_correct ? "Auto-graded: Pass" : "Auto-graded"}
        </Badge>
      );
    }
    return <Badge tone="gray" title="Free-form (not auto-graded)">Free-form</Badge>;
  }

  // Derive type if backend omitted it
  function deriveType(d: SubmitDetail): "mcq" | "code" | "scenario" {
    if (d.type) return d.type;
    if ((d.correct || "").trim()) return "mcq";
    if (Array.isArray(d.tests) && d.tests.length > 0) return "code";
    return "scenario";
  }

  function rubricBlock(d: SubmitDetail) {
    const rb = d.rubric_breakdown || d.rubric;
    if (!rb) return null;

    const crits = Array.isArray(rb.criteria) ? rb.criteria : [];
    const max = Number.isFinite(rb.max_total) ? Number(rb.max_total) : undefined;
    const total = Number.isFinite(rb.total) ? Number(rb.total) : undefined;

    return (
      <Disclose summary={<span>View rubric breakdown</span>}>
        <div className="space-y-2">
          {crits.length === 0 && <div className="text-xs text-[hsl(var(--muted-foreground))]">No rubric criteria provided.</div>}
          {crits.length > 0 && (
            <div className="overflow-hidden rounded-md border border-border">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-muted/30 text-[hsl(var(--muted-foreground))]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Criterion</th>
                    <th className="px-3 py-2 font-medium">Weight</th>
                    <th className="px-3 py-2 font-medium">Score</th>
                    <th className="px-3 py-2 font-medium">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {crits.map((c, idx) => {
                    const wPct =
                      Number.isFinite(c?.weight) && (c!.weight as number) >= 0
                        ? `${Math.round((c!.weight as number) * 100)}%`
                        : "—";
                    const sc = Number.isFinite(c?.score) ? String(c!.score) : "—";
                    return (
                      <tr key={idx} className="align-top">
                        <td className="px-3 py-2">
                          <div className="font-medium text-foreground">{c?.description || c?.id || "—"}</div>
                        </td>
                        <td className="px-3 py-2 text-foreground">{wPct}</td>
                        <td className="px-3 py-2 text-foreground">{sc}</td>
                        <td className="px-3 py-2 text-[hsl(var(--muted-foreground))]">{c?.comments || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(Number.isFinite(total) || Number.isFinite(max)) && (
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              Total:{" "}
              <span className="font-semibold text-foreground">
                {Number.isFinite(total) ? total : "—"}
                {Number.isFinite(max) ? ` / ${max}` : ""}
              </span>
            </div>
          )}
        </div>
      </Disclose>
    );
  }

  function codeTestsBlock(d: SubmitDetail) {
    const tests = Array.isArray(d.tests) ? d.tests : [];
    if (tests.length === 0) return null;

    const passed = tests.filter((t) => t?.ok).length;
    const total = tests.length;

    return (
      <Disclose
        summary={
          <span>
            View code tests <span className="text-[hsl(var(--muted-foreground))]">({passed}/{total} passed)</span>
          </span>
        }
      >
        <div className="space-y-3">
          {tests.map((t, idx) => {
            const tone = t.ok ? "green" : t.timeout ? "amber" : "red";
            return (
              <div key={idx} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">{t.name || `Test ${idx + 1}`}</div>
                  <Badge tone={tone as any}>
                    {t.ok ? "Pass" : t.timeout ? "Timeout" : "Fail"}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-12 gap-3">
                  <div className="col-span-12 md:col-span-6">
                    <KeyVal k="Time" v={`${Number.isFinite(t.time_sec) ? t.time_sec!.toFixed(3) : "—"} s`} />
                    {t.match_result && (
                      <>
                        <KeyVal k="Match mode" v={t.match_result.mode || "—"} />
                        {"expected" in (t.match_result || {}) && (
                          <KeyVal k="Expected" v={<MonoBlock>{t.match_result.expected || ""}</MonoBlock>} />
                        )}
                      </>
                    )}
                    <KeyVal k="Stdout" v={<MonoBlock>{t.stdout || ""}</MonoBlock>} />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <KeyVal k="Stderr" v={<MonoBlock>{t.stderr || ""}</MonoBlock>} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Disclose>
    );
  }

  function perQuestionScore(d: SubmitDetail) {
    const s = Number(d?.score);
    const m = Number(d?.max_score);
    if (!Number.isFinite(s) || !Number.isFinite(m) || m <= 0) return null;
    return (
      <Badge tone="indigo" title="Auto-graded score">
        {s} / {m}
      </Badge>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card text-foreground p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">{title || "Your result"}</h2>

        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          Overall score (MCQs only):{" "}
          <span className="font-semibold text-foreground">
            {correctMcq}
            {typeof totalMcq === "number" && totalMcq > 0 ? ` / ${totalMcq}` : ""}{" "}
            {`(${Number.isFinite(percent) ? percent : 0}%)`}
          </span>
        </div>

        {/* Optional: show aggregate auto-graded score if backend provided per-question scores */}
        {autoAgg.max > 0 && (
          <div className="text-sm text-[hsl(var(--muted-foreground))]">
            Auto-graded score (free-form/coding):{" "}
            <span className="font-semibold text-foreground">
              {autoAgg.sum} / {autoAgg.max} {autoAgg.pct !== null ? `(${autoAgg.pct}%)` : ""}
            </span>
          </div>
        )}

        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          Test ID: {result?.test_id || "—"} · Candidate ID: {result?.candidate_id || "—"}
        </div>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          You can now safely <span className="font-medium text-foreground">close this tab</span> and return to your email.
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-4">
        {safeDetails.map((d, i) => {
          const hasCorrect = (d?.correct || "").trim().length > 0;
          const qType = deriveType(d);

          return (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[15px] font-medium text-foreground">
                  Q{i + 1}. {d?.question || "—"}
                </div>
                <div className="flex items-center">
                  {perQuestionScore(d)}
                  {rowChip(d)}
                </div>
              </div>

              <div className="text-sm">
                <div className="mt-1">
                  <span className="text-[hsl(var(--muted-foreground))]">Your answer:</span>{" "}
                  <span className="break-words font-medium text-foreground">{d?.submitted || "—"}</span>
                </div>

                {/* Only show the correct answer row if it exists (MCQs) */}
                {hasCorrect && (
                  <div className="mt-1">
                    <span className="text-[hsl(var(--muted-foreground))]">Correct answer:</span>{" "}
                    <span className="break-words font-medium text-foreground">{d?.correct || "—"}</span>
                  </div>
                )}

                {d?.explanation && (
                  <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{d.explanation}</div>
                )}
              </div>

              {/* Optional blocks */}
              {qType === "code" && codeTestsBlock(d)}
              {(qType === "scenario" || qType === "code") && rubricBlock(d)}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onRetake && (
          <button
            onClick={onRetake}
            className="btn btn-outline"
          >
            Retake
          </button>
        )}

        {/* New default: Close tab (do not navigate back to site) */}
        <button
          onClick={tryCloseTab}
          className="btn btn-primary"
        >
          Close tab
        </button>

        {/* Optional legacy Back button */}
        {allowSiteBack && (
          <button
            onClick={onBack}
            className="btn btn-outline"
          >
            Back
          </button>
        )}
      </div>

      {/* Tiny toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[hsl(var(--muted))] px-4 py-2 text-xs text-foreground shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
