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
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:10000";

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

      if (!res.ok) {
        const txt = await res.text();
        const msg =
          res.status === 410
            ? "This test link has expired."
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
    <div className="rounded-2xl border border-border bg-card text-foreground p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-medium">Are you ready to begin?</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Find a quiet place and ensure a stable internet connection. Once you
        start, you can answer the questions at your pace and submit when
        finished.
      </p>

      {err && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleStart}
          disabled={loading || !token}
          className="btn btn-primary"
        >
          {loading ? "Starting…" : "Yes, start the test"}
        </button>
        <button
          onClick={onCancel}
          className="btn btn-outline"
          disabled={loading}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
