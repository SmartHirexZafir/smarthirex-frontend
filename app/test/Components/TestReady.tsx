// app/test/Components/TestReady.tsx
"use client";

import React, { useState } from "react";

type Question = {
  type: "mcq" | "code" | "scenario" | string;
  question: string;
  options?: string[];
  correct_answer?: string | null;
};

export type StartResponse = {
  test_id: string;
  candidate_id: string;
  questions: Question[];
};

type Props = {
  token: string;
  onStarted: (data: StartResponse) => void;
  onCancel: () => void;
  onError?: (message: string) => void;
  apiBase?: string; // optional override; defaults from env
};

const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "http://localhost:10000";

export default function TestReady({
  token,
  onStarted,
  onCancel,
  onError,
  apiBase = DEFAULT_API_BASE,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleStart() {
    if (!token) {
      const msg = "Invalid or missing token.";
      setErr(msg);
      onError?.(msg);
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/tests/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      // Friendly handling for common flow guards
      if (!res.ok) {
        const txt = await res.text();
        const msg =
          res.status === 410
            ? "This test link has expired."
            : res.status === 409
            ? "A test has already been started for this candidate (only one test type is allowed)."
            : txt || `Failed to start test (status ${res.status})`;
        throw new Error(msg);
      }

      const data = (await res.json()) as StartResponse;
      onStarted(data);
    } catch (e: any) {
      const msg = e?.message || "Failed to start test.";
      setErr(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="panel glass rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl"
      aria-labelledby="test-ready-title"
    >
      <h2 id="test-ready-title" className="mb-2 text-lg font-semibold">
        Are you ready to begin?
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Find a quiet place and ensure a stable internet connection. Once you
        start, you can answer the questions at your pace and submit when
        finished.
      </p>

      {err && (
        <div
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {err}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleStart}
          disabled={loading || !token}
          aria-disabled={loading || !token}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Starting…" : "Yes, start the test"}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-lg border border-input px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={loading}
          aria-disabled={loading}
        >
          Not now
        </button>
      </div>
    </section>
  );
}
