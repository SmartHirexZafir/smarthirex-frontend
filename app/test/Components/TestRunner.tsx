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
  expiresAt?: string | null; // ✅ Test expiration time (ISO string)
  durationMinutes?: number | null; // ✅ Test duration in minutes
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
  expiresAt,
  durationMinutes,
}: Props) {
  const API_BASE = useMemo(() => resolveApiBase(apiBase), [apiBase]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // answers kept by index (string for backward-compat). Separate per-question code language if needed.
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [codeLang, setCodeLang] = useState<Record<number, string>>({});

  // small, unobtrusive toast when we block a restricted action / info nudge
  const [toast, setToast] = useState<string | null>(null);
  const submittingRef = React.useRef(false);
  function nudge(msg: string) {
    setToast(msg);
    window.clearTimeout((nudge as any)._t);
    (nudge as any)._t = window.setTimeout(() => setToast(null), 1600);
  }

  // ✅ Auto-submit timer ref - will be set after handleSubmit is defined
  const handleSubmitRef = React.useRef<((e: React.FormEvent) => Promise<void>) | null>(null);

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

  // Keep multiple tabs in sync if the same token is open.
  useEffect(() => {
    const onStorage = (ev: StorageEvent) => {
      if (ev.key !== LS_KEY || !ev.newValue) return;
      try {
        const parsed = JSON.parse(ev.newValue);
        if (parsed?.answers && typeof parsed.answers === "object") {
          setAnswers(parsed.answers);
        }
        if (parsed?.codeLang && typeof parsed.codeLang === "object") {
          setCodeLang(parsed.codeLang);
        }
      } catch {
        // ignore malformed sync payload
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [LS_KEY]);

  function updateAnswer(i: number, value: string, maxWords?: number) {
    const capped = clampWords(value, maxWords);
    setAnswers((prev) => ({ ...prev, [i]: capped.text }));
  }

  function updateCodeLang(i: number, lang: string) {
    setCodeLang(prev => ({ ...prev, [i]: lang }));
  }

  // Store handleSubmit ref for auto-submit timer
  const handleSubmit = async (e: React.FormEvent) => {
    if (submittingRef.current) return;
    e.preventDefault();
    setErr(null);
    setLoading(true);
    submittingRef.current = true;

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
        // ✅ Handle 410 (test expired) with user-friendly message
        if (res.status === 410) {
          const errorData = await res.json().catch(() => ({}));
          const msg = (errorData as any)?.detail || "Your test time has expired. You can no longer submit answers.";
          throw new Error(msg);
        }
        
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
      submittingRef.current = false;
    }
  };
  
  // Update ref after handleSubmit is defined
  handleSubmitRef.current = handleSubmit;

  // ✅ Auto-submit when duration expires
  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      try {
        const expires = parseUtcDate(expiresAt);
        const now = new Date();
        
        // Validate date
        if (isNaN(expires.getTime())) {
          console.error("Invalid expiresAt date:", expiresAt);
          setTimeRemaining("");
          return;
        }
        
        const diff = expires.getTime() - now.getTime();

        // Only auto-submit if time has actually expired (with small buffer to avoid race conditions)
        if (diff <= -1000) {
          // Time expired - auto-submit (only if not already loading/submitting)
          if (!loading && handleSubmitRef.current && !err) {
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            handleSubmitRef.current(fakeEvent);
          }
          return;
        }

        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}:${String(seconds).padStart(2, "0")}`);

        // Warning at 5 minutes
        if (minutes === 5 && seconds === 0) {
          nudge("⚠️ 5 minutes remaining! Test will auto-submit when time expires.");
        }
        // Warning at 1 minute
        if (minutes === 1 && seconds === 0) {
          nudge("⚠️ 1 minute remaining! Test will auto-submit soon.");
        }
      } catch (e) {
        console.error("Timer error:", e);
        setTimeRemaining("");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, loading, nudge, err]);

  const payloadAnswers = useMemo(
    () =>
      safeQuestions.map((q, i) => {
        const type = String(q.type || "").toLowerCase();
        const lang = type === "code" ? (codeLang[i] || q.language || "python") : undefined;
        return {
          answer: (answers[i] ?? "").toString(),
          type: q.type || undefined,
          language: lang,
          question_id: q.id ?? undefined,
        };
      }),
    [safeQuestions, codeLang, answers]
  );

  // Backend autosave is the source of truth. localStorage remains a best-effort fallback cache.
  useEffect(() => {
    if (!token) return;
    const save = async () => {
      try {
        await fetch(`${API_BASE}/tests/autosave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, answers: payloadAnswers }),
        });
      } catch {
        // keep typing flow uninterrupted; next autosave retry will run soon
      }
    };
    const id = window.setInterval(save, 8000);
    return () => window.clearInterval(id);
  }, [token, payloadAnswers]);

  useEffect(() => {
    const flushAutosave = () => {
      if (!token) return;
      const body = JSON.stringify({ token, answers: payloadAnswers });
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(`${API_BASE}/tests/autosave`, blob);
        return;
      }
      fetch(`${API_BASE}/tests/autosave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    };
    const onVisibility = () => {
      if (document.hidden) flushAutosave();
    };
    window.addEventListener("beforeunload", flushAutosave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flushAutosave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [token, payloadAnswers]);

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

    // ✅ Tab switch detection with warning
    let tabSwitchCount = 0;
    const onBlur = () => {
      tabSwitchCount++;
      // Capture screenshot on tab switch (suspicious activity)
      if (typeof window !== "undefined") {
        // Trigger screenshot capture via ProctorGuard if available
        window.dispatchEvent(new CustomEvent("proctor-suspicious-activity", {
          detail: { type: "tab_switch", count: tabSwitchCount }
        }));
      }
      
      // Show warning
      nudge("⚠️ Switching tabs may lead to test failure. Please stay on this page.");
      
      try {
        if (typeof navigator !== "undefined" && (navigator as any).clipboard?.writeText) {
          (navigator as any).clipboard.writeText(" ").catch(() => {});
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("blur", onBlur);
    
    // ✅ Visibility change detection
    const onVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCount++;
        window.dispatchEvent(new CustomEvent("proctor-suspicious-activity", {
          detail: { type: "page_hidden", count: tabSwitchCount }
        }));
        nudge("⚠️ Page hidden detected. Switching tabs may lead to test failure.");
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener("paste", onPaste);
      window.removeEventListener("keydown", onKey, { capture: true } as any);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
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
        <label className="text-xs text-[hsl(var(--muted-foreground))]">Language</label>
        <select
          className="mt-1 w-full rounded-md border border-input px-2 py-1 text-sm bg-background text-foreground"
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
      <div className={`mt-1 text-xs ${over ? "text-destructive" : "text-[hsl(var(--muted-foreground))]"}`}>
        {words}/{maxWords} words
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ✅ Timer display - polished and professional */}
      {timeRemaining && (
        <div className="sticky top-4 z-10 flex items-center justify-center">
          <div className={`px-6 py-3 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 ${
            timeRemaining.startsWith("0:") || (timeRemaining.startsWith("1:") && parseInt(timeRemaining.split(":")[1]) < 5)
              ? "bg-warning/20 border-warning/50 text-warning animate-pulse"
              : timeRemaining.startsWith("1:")
              ? "bg-warning/10 border-warning/30 text-warning"
              : "bg-info/20 border-info/50 text-info"
          }`}>
            <div className="flex items-center gap-3">
              <i className={`ri-${timeRemaining.startsWith("0:") || (timeRemaining.startsWith("1:") && parseInt(timeRemaining.split(":")[1]) < 5) ? "alarm-warning" : "timer-line"} text-lg`} />
              <div>
                <div className="text-xs font-medium opacity-80">Time Remaining</div>
                <div className="font-mono font-bold text-lg tracking-wider">{timeRemaining}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form
        className="space-y-6 rounded-2xl border border-border bg-card text-foreground p-6 shadow-sm select-none"
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      {safeQuestions.length === 0 && (
        <div className="rounded-lg border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 px-3 py-2 text-sm text-foreground">
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
          <div key={idx} className="rounded-xl border border-border p-4">
            <div className="mb-2 text-sm font-medium">
              Q{idx + 1}.{" "}
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-normal uppercase tracking-wide text-foreground/80">
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
                          ? "border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--ring))] bg-[hsl(var(--primary)/.08)]"
                          : "border-input hover:bg-muted")
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
                  className="h-44 w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={placeholder}
                  spellCheck={false}
                />

                {isScenario && <WordCounter idx={idx} maxWords={q.max_words} />}

                {/* Small hints that align with backend behavior but don't enforce hard rules */}
                {isCode && (
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Your code will be evaluated on the backend. Choose a language and submit your solution.
                  </p>
                )}
                {isScenario && (
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
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
          className="btn btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Submitting…" : "Submit"}
        </button>
      </div>

      {/* tiny toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[hsl(var(--muted))] px-4 py-2 text-xs text-foreground shadow-lg">
          {toast}
        </div>
      )}
      </form>
    </div>
  );
}

function parseUtcDate(input?: string | null): Date {
  const raw = String(input || "").trim();
  if (!raw) return new Date(NaN);
  const hasTz = /(?:Z|[+\-]\d{2}:\d{2})$/i.test(raw);
  return new Date(hasTz ? raw : `${raw}Z`);
}
