// app/test/Components/TestResult.tsx
"use client";

import React, { useMemo } from "react";

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
  score: number;          // MCQs count correct
  details: SubmitDetail[]; // all questions in order
};

type Props = {
  result: SubmitResponse;
  onBack: () => void;         // e.g., navigate to candidate profile
  onRetake?: () => void;      // optional retake handler if you add that later
  title?: string;             // optional override title text
};

export default function TestResult({ result, onBack, onRetake, title }: Props) {
  const { score, details } = result || { score: 0, details: [] };

  // Derive MCQ totals based on presence of a non-empty "correct" answer.
  // (Non-MCQ items were saved with empty correct answers in this version.)
  const { totalMcq, percent } = useMemo(() => {
    const totalMcqQ = (details || []).filter((d) => (d.correct || "").trim().length > 0).length;
    const pct = totalMcqQ > 0 ? Math.round((Number(score || 0) / totalMcqQ) * 100) : 0;
    return { totalMcq: totalMcqQ, percent: pct };
  }, [details, score]);

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">{title || "Your result"}</h2>
        <div className="text-sm text-gray-600">
          Overall score (MCQs only):{" "}
          <span className="font-semibold">
            {score}
            {typeof totalMcq === "number" && totalMcq > 0 ? ` / ${totalMcq}` : ""}{" "}
            {typeof percent === "number" ? `(${percent}%)` : ""}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Test ID: {result?.test_id || "—"} · Candidate ID: {result?.candidate_id || "—"}
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
        <button
          onClick={onBack}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back
        </button>
      </div>
    </div>
  );
}
