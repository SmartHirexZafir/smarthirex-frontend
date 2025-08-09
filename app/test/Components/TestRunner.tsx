// app/test/Components/TestRunner.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

export type Question = {
  type: "mcq" | "code" | "scenario" | string;
  question: string;
  options?: string[];              // MCQ only
  correct_answer?: string | null;  // MCQ -> string; others -> null
};

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
  score: number;
  details: SubmitDetail[];
};

type Props = {
  token: string;
  questions: Question[];
  onSubmitted: (result: SubmitResponse) => void;
  onCancel: () => void;
  onError?: (msg: string) => void;
  apiBase?: string; // optional override; defaults to env
};

const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:10000";

export default function TestRunner({
  token,
  questions,
  onSubmitted,
  onCancel,
  onError,
  apiBase = DEFAULT_API_BASE,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // answers kept as strings by index
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // small, unobtrusive toast when we block a restricted action
  const [toast, setToast] = useState<string | null>(null);
  function nudge(msg: string) {
    setToast(msg);
    window.clearTimeout((nudge as any)._t);
    (nudge as any)._t = window.setTimeout(() => setToast(null), 1600);
  }

  const safeQuestions = useMemo<Question[]>(
    () => (Array.isArray(questions) ? questions : []),
    [questions]
  );

  function updateAnswer(i: number, value: string) {
    setAnswers((prev) => ({ ...prev, [i]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const payloadAnswers = safeQuestions.map((_, i) => ({
        answer: (answers[i] ?? "").toString(),
      }));

      const res = await fetch(`${apiBase}/tests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers: payloadAnswers }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed to submit test (status ${res.status})`);
      }

      const data = (await res.json()) as SubmitResponse;
      onSubmitted(data);
    } catch (e: any) {
      const msg = e?.message || "Failed to submit test.";
      setErr(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }

  // --- Light “surveillance/security” guards on this form only ---
  useEffect(() => {
    // Block right-click menu
    const onContext = (ev: Event) => {
      ev.preventDefault();
      nudge("Right-click is disabled during the test.");
    };
    document.addEventListener("contextmenu", onContext);

    // Block copy/cut/paste
    const onCopy = (ev: ClipboardEvent) => {
      ev.preventDefault();
      nudge("Copy is disabled during the test.");
    };
    const onCut = (ev: ClipboardEvent) => {
      ev.preventDefault();
      nudge("Cut is disabled during the test.");
    };
    const onPaste = (ev: ClipboardEvent) => {
      ev.preventDefault();
      nudge("Paste is disabled during the test.");
    };
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener("paste", onPaste);

    // Block common shortcuts (Ctrl/Cmd + C/V/X, PrintScreen)
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (
        (isMod && (key === "c" || key === "v" || key === "x" || key === "a")) ||
        key === "printscreen"
      ) {
        e.preventDefault();
        nudge("Clipboard and screenshots are disabled during the test.");
        return false;
      }
      // Optional: block Ctrl+S (save page)
      if (isMod && key === "s") {
        e.preventDefault();
        nudge("Saving the page is disabled during the test.");
        return false;
      }
      return true;
    };
    window.addEventListener("keydown", onKey, { capture: true });

    // Try to clear clipboard on blur (best-effort)
    const onBlur = () => {
      if (navigator.clipboard && "writeText" in navigator.clipboard) {
        navigator.clipboard.writeText(" ");
      }
    };
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      window.removeEventListener("keydown", onKey, { capture: true } as any);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <form
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm select-none"
      onSubmit={handleSubmit}
      // double safety nets (browser won’t always obey all):
      onCopy={(e) => {
        e.preventDefault();
        nudge("Copy is disabled during the test.");
      }}
      onPaste={(e) => {
        e.preventDefault();
        nudge("Paste is disabled during the test.");
      }}
      onCut={(e) => {
        e.preventDefault();
        nudge("Cut is disabled during the test.");
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        nudge("Right-click is disabled during the test.");
      }}
      autoComplete="off"
    >
      {/* tiny anti-autofill honeypot */}
      <input type="text" name="no-fill" className="hidden" autoComplete="off" />

      <h2 className="text-lg font-medium">Answer the questions</h2>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {safeQuestions.length === 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          No questions were generated. You can still submit or go back.
        </div>
      )}

      {safeQuestions.map((q, idx) => {
        const t = String(q.type || "mcq").toLowerCase();
        const isMcq = t === "mcq";
        return (
          <div key={idx} className="rounded-xl border border-gray-200 p-4">
            <div className="mb-2 text-sm font-medium">
              Q{idx + 1}.{" "}
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-normal uppercase tracking-wide text-gray-700">
                {t}
              </span>
            </div>
            <div className="mb-3 text-[15px] leading-relaxed">{q.question}</div>

            {isMcq ? (
              <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                role="radiogroup"
                aria-labelledby={`q-${idx}-label`}
              >
                {(q.options && q.options.length === 4 ? q.options : ["A", "B", "C", "D"]).map(
                  (opt, oi) => {
                    const id = `q${idx}-opt${oi}`;
                    const selected = (answers[idx] ?? "") === opt;
                    return (
                      <label
                        key={id}
                        htmlFor={id}
                        className={
                          "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition " +
                          (selected
                            ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50"
                            : "border-gray-300 hover:bg-gray-50")
                        }
                      >
                        <input
                          id={id}
                          type="radio"
                          name={`q-${idx}`}
                          value={opt}
                          checked={selected}
                          onChange={(e) => updateAnswer(idx, e.target.value)}
                          className="h-4 w-4"
                        />
                        <span className="break-words">{opt}</span>
                      </label>
                    );
                  }
                )}
              </div>
            ) : (
              <div>
                <textarea
                  value={answers[idx] ?? ""}
                  onChange={(e) => updateAnswer(idx, e.target.value)}
                  className="h-36 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t === "code" ? "Write your solution here…" : "Describe your approach…"}
                  spellCheck={false}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Free-form answers won’t be auto-graded in this version, but they’ll be saved.
                </p>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Submit"}
        </button>
      </div>

      {/* tiny toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900/90 px-4 py-2 text-xs text-white shadow-lg">
          {toast}
        </div>
      )}
    </form>
  );
}
