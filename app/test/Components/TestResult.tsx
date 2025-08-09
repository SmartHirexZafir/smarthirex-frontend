// app/test/Components/TestResult.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

export type SubmitDetail = {
  question: string;
  submitted: string;
  correct: string;
  is_correct: boolean;
  explanation: string;
};

export type SubmitResponse = {
  test_id: string;
  candidate_id: string;
  score: number;          // PERCENT from backend (e.g., 75.0)
  details: SubmitDetail[]; // all questions in order
};

type Props = {
  result: SubmitResponse;
  onBack: () => void;         // legacy: navigate back to site (kept for compatibility)
  onRetake?: () => void;      // optional retake handler if you add that later
  title?: string;             // optional override title text

  /** NEW (optional): show the legacy "Back" button that calls onBack. Default: false */
  allowSiteBack?: boolean;
};

export default function TestResult({ result, onBack, onRetake, title, allowSiteBack = false }: Props) {
  const { score, details } = result || { score: 0, details: [] };
  const [toast, setToast] = useState<string | null>(null);

  // Compute MCQ correctness from details (MCQ rows have a non-empty 'correct')
  const { totalMcq, correctMcq, percent } = useMemo(() => {
    const onlyMcq = (details || []).filter((d) => (d.correct || "").trim().length > 0);
    const total = onlyMcq.length;
    const correct = onlyMcq.filter((d) => d.is_correct).length;
    // Backend already returns % in result.score; just round it for display.
    const pct = Math.round(Number(score || 0));
    return { totalMcq: total, correctMcq: correct, percent: pct };
  }, [details, score]);

  // Soft “no back” guard so candidates don’t go back to site after submit
  useEffect(() => {
    const MARK = "__TEST_RESULT_NO_BACK__";
    try {
      const cur = (history.state || {}) as Record<string, unknown>;
      if (cur[MARK] !== true) {
        history.replaceState({ ...(cur || {}), [MARK]: true }, "");
      }
      history.pushState({ [MARK]: true }, "");
    } catch {}

    const onPop = (e: PopStateEvent) => {
      // Immediately move forward again
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

    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  function tryCloseTab() {
    // Best effort: window.close() only works for tabs opened via script.
    window.close();
    // If it failed, show a hint.
    setToast("You can now close this tab and return to your email.");
    window.clearTimeout((tryCloseTab as any)._t);
    (tryCloseTab as any)._t = window.setTimeout(() => setToast(null), 1600);
  }

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">{title || "Your result"}</h2>
        <div className="text-sm text-gray-600">
          Overall score (MCQs only):{" "}
          <span className="font-semibold">
            {correctMcq}
            {typeof totalMcq === "number" && totalMcq > 0 ? ` / ${totalMcq}` : ""}{" "}
            {`(${Number.isFinite(percent) ? percent : 0}%)`}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Test ID: {result?.test_id || "—"} · Candidate ID: {result?.candidate_id || "—"}
        </div>
        <div className="text-xs text-gray-500">
          You can now safely <span className="font-medium">close this tab</span> and return to your email.
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-4">
        {(details || []).map((d, i) => {
          const isMcq = (d.correct || "").trim().length > 0;
          return (
            <div key={i} className="rounded-xl border border-gray-200 p-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[15px] font-medium">Q{i + 1}. {d.question}</div>
                <div
                  className={
                    "ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs " +
                    (isMcq
                      ? d.is_correct
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700")
                  }
                  title={isMcq ? (d.is_correct ? "MCQ marked correct" : "MCQ marked incorrect") : "Free-form (not auto-graded)"}
                >
                  {isMcq ? (d.is_correct ? "Correct" : "Incorrect") : "Free-form"}
                </div>
              </div>

              <div className="text-sm">
                <div className="mt-1">
                  <span className="text-gray-600">Your answer:</span>{" "}
                  <span className="font-medium break-words">{d.submitted || "—"}</span>
                </div>

                {/* Only show the correct answer row if it exists (MCQs) */}
                {(d.correct || "").trim().length > 0 && (
                  <div className="mt-1">
                    <span className="text-gray-600">Correct answer:</span>{" "}
                    <span className="font-medium break-words">{d.correct || "—"}</span>
                  </div>
                )}

                {d.explanation && (
                  <div className="mt-2 text-xs text-gray-500">{d.explanation}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onRetake && (
          <button
            onClick={onRetake}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Retake
          </button>
        )}

        {/* New default: Close tab (do not navigate back to site) */}
        <button
          onClick={tryCloseTab}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Close tab
        </button>

        {/* Optional legacy Back button */}
        {allowSiteBack && (
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back
          </button>
        )}
      </div>

      {/* tiny toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900/90 px-4 py-2 text-xs text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
