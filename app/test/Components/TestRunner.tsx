// app/test/Components/TestRunner.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/** ---------------- Types (backward-compatible; all new fields optional) ---------------- */

export type Question = {
  type: "mcq" | "code" | "scenario" | string;
  question: string;
  options?: string[];              // MCQ only (expected 4)
  correct_answer?: string | null;  // MCQ -> string; others -> null

  // Optional (if backend provides them)
  id?: string | number;
  placeholder?: string;            // textarea placeholder
  language?: string;               // default language for code question, e.g., "python"
  language_options?: string[];     // allowed languages for code question
  starter_code?: string;           // code template (pre-filled)
  max_words?: number;              // soft cap for scenario free-form
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

// Resolve API base safely, supporting both env names
function resolveApiBase(override?: string) {
  const raw =
    override ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "http://localhost:10000";
  return String(raw).replace(/\/$/, "");
}

// --- helpers ---
function validMcqOptions(opts: unknown): opts is string[] {
  return Array.isArray(opts) && opts.length === 4 && opts.every(o => typeof o === "string" && o.trim().length > 0);
}

function fallbackOptions(): string[] {
  return ["Option 1", "Option 2", "Option 3", "Option 4"];
}

function clampWords(text: string, maxWords?: number): { text: string; words: number } {
  if (!maxWords || maxWords <= 0) return { text, words: text.trim() ? text.trim().split(/\s+/).length : 0 };
  const parts = text.trim() ? text.trim().split(/\s+/) : [];
  if (parts.length <= maxWords) return { text, words: parts.length };
  const trimmed = parts.slice(0, maxWords).join(" ");
  return { text: trimmed, words: maxWords };
}

/** ---------------- Component ---------------- */

export default function TestRunner({
  token,
  questions,
  onSubmitted,
  onCancel,
  onError,
  apiBase,
}: Props) {
  const API_BASE = useMemo(() => resolveApiBase(apiBase), [apiBase]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // answers kept by index (string for backward-compat). Separate per-question code language if needed.
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [codeLang, setCodeLang] = useState<Record<number, string>>({});

  // small, unobtrusive toast when we block a restricted action / info nudge
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

  // ---------- Autosave (per token) ----------
  const LS_KEY = useMemo(() => `testrunner_draft_${token}`, [token]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (parsed.answers) setAnswers(parsed.answers);
          if (parsed.codeLang) setCodeLang(parsed.codeLang);
        }
      } else {
        // If any code question has starter_code, pre-fill it
        const prefill: Record<number, string> = {};
        safeQuestions.forEach((q, i) => {
          const t = String(q.type || "").toLowerCase();
          if (t === "code" && typeof q.starter_code === "string" && !(i in answers)) {
            prefill[i] = q.starter_code;
          }
        });
        if (Object.keys(prefill).length) setAnswers(a => ({ ...prefill, ...a }));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [LS_KEY]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ answers, codeLang }));
    } catch {
      // ignore quota
    }
  }, [answers, codeLang, LS_KEY]);

  function updateAnswer(i: number, value: string, maxWords?: number) {
    const capped = clampWords(value, maxWords);
    setAnswers((prev) => ({ ...prev, [i]: capped.text }));
  }

  function updateCodeLang(i: number, lang: string) {
    setCodeLang(prev => ({ ...prev, [i]: lang }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    // Abort after 20s to avoid hanging UI on network issues
    const controller = new AbortController();
    const t = window.setTimeout(() => controller.abort(), 20000);

    try {
      // Backward-compatible: each answer still has ".answer"
      // Extended metadata (type, language, question_id) is optional and safe to ignore on older servers.
      const payloadAnswers = safeQuestions.map((q, i) => {
        const type = String(q.type || "").toLowerCase();
        const lang = type === "code" ? (codeLang[i] || q.language || "python") : undefined;
        return {
          answer: (answers[i] ?? "").toString(),
          type: q.type || undefined,
          language: lang,
          question_id: q.id ?? undefined,
        };
      });

      const res = await fetch(`${API_BASE}/tests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers: payloadAnswers }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to submit test (status ${res.status})`);
      }

      const data = (await res.json().catch(() => null)) as SubmitResponse | null;
      if (!data || !data.test_id) {
        throw new Error("Unexpected server response while submitting the test.");
      }

      // Clear autosave on success
      try { localStorage.removeItem(LS_KEY); } catch {}

      onSubmitted(data);
    } catch (e: any) {
      const aborted = e?.name === "AbortError";
      const msg = aborted ? "Network timeout while submitting the test. Please try again." : (e?.message || "Failed to submit test.");
      setErr(msg);
      onError?.(msg);
    } finally {
      window.clearTimeout(t);
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

    // Block common shortcuts (Ctrl/Cmd + C/V/X/A, PrintScreen, Ctrl+S)
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
      if (isMod && key === "s") {
        e.preventDefault();
        nudge("Saving the page is disabled during the test.");
        return false;
      }
      return true;
    };
    window.addEventListener("keydown", onKey, { capture: true });

    // Try to clear clipboard on blur (best-effort, silent on failure)
    const onBlur = () => {
      try {
        if (typeof navigator !== "undefined" && (navigator as any).clipboard?.writeText) {
          (navigator as any).clipboard.writeText(" ").catch(() => {});
        }
      } catch {
        // ignore
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

  // Soft "are you sure" guard if the user tries to close/leave mid-test
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (loading) return; // allow unload during submit
      e.preventDefault();
      e.returnValue = ""; // required for some browsers
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [loading]);

  // ---------- Small helpers ----------
  function CodeLangPicker({
    idx,
    q,
  }: {
    idx: number;
    q: Question;
  }) {
    const options = Array.isArray(q.language_options) && q.language_options.length > 0
      ? q.language_options
      : ["python", "node", "java", "cpp"]; // non-hardcoded default list matching backend runner; can be ignored by server

    const current = codeLang[idx] || q.language || options[0];

    return (
      <div className="mb-2">
        <label className="text-xs text-gray-600">Language</label>
        <select
          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
          value={current}
          onChange={(e) => updateCodeLang(idx, e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  function WordCounter({
    idx,
    maxWords,
  }: {
    idx: number;
    maxWords?: number;
  }) {
    if (!maxWords || maxWords <= 0) return null;
    const words = (answers[idx] || "").trim() ? (answers[idx] || "").trim().split(/\s+/).length : 0;
    const over = words > maxWords;
    return (
      <div className={`mt-1 text-xs ${over ? "text-red-600" : "text-gray-500"}`}>
        {words}/{maxWords} words
      </div>
    );
  }

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
        const isCode = t === "code";
        const isScenario = t === "scenario";
        const opts = isMcq
          ? (validMcqOptions(q.options) ? q.options! : fallbackOptions())
          : [];

        const placeholder =
          q.placeholder ||
          (isCode ? "Write your solution here…" : isScenario ? "Describe your approach…" : "");

        return (
          <div key={idx} className="rounded-xl border border-gray-200 p-4">
            <div className="mb-2 text-sm font-medium">
              Q{idx + 1}.{" "}
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-normal uppercase tracking-wide text-gray-700">
                {t}
              </span>
            </div>
            <div className="mb-3 text-[15px] leading-relaxed whitespace-pre-wrap">{q.question}</div>

            {isMcq ? (
              <div
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                role="radiogroup"
                aria-labelledby={`q-${idx}-label`}
              >
                {opts.map((opt, oi) => {
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
                })}
              </div>
            ) : (
              <div>
                {isCode && <CodeLangPicker idx={idx} q={q} />}

                <textarea
                  value={answers[idx] ?? (isCode && q.starter_code ? q.starter_code : "")}
                  onChange={(e) => updateAnswer(idx, e.target.value, isScenario ? q.max_words : undefined)}
                  className="h-44 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={placeholder}
                  spellCheck={false}
                />

                {isScenario && <WordCounter idx={idx} maxWords={q.max_words} />}

                {/* Small hints that align with backend behavior but don't enforce hard rules */}
                {isCode && (
                  <p className="mt-1 text-xs text-gray-500">
                    Your code will be evaluated on the backend. Choose a language and submit your solution.
                  </p>
                )}
                {isScenario && (
                  <p className="mt-1 text-xs text-gray-500">
                    Provide a clear, structured response. It may be graded using a rubric.
                  </p>
                )}
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
