// app/test/Components/TestReady.tsx
"use client";

import React, { useState, useEffect } from "react";
import CountdownTimer from "./CountdownTimer";

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
  scheduled_datetime?: string;
  expires_at?: string;
  duration_minutes?: number;
};

type Props = {
  token: string;
  onStarted: (data: StartResponse) => void;
  onCancel: () => void;
  onError?: (message: string) => void;
  apiBase?: string; // optional override; defaults from env
  onCountdownChange?: (showing: boolean) => void; // notify parent when countdown is shown
};

const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:10000";

export default function TestReady({
  token,
  onStarted,
  onCancel,
  onError,
  apiBase = DEFAULT_API_BASE,
  onCountdownChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [scheduledDateTime, setScheduledDateTime] = useState<string | null>(null);
  const [checkingSchedule, setCheckingSchedule] = useState(true);

  // ✅ Check if test is scheduled - this runs immediately when component mounts
  useEffect(() => {
    async function checkSchedule() {
      if (!token) {
        setCheckingSchedule(false);
        return;
      }
      try {
        const res = await fetch(`${apiBase}/tests/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (res.status === 403) {
          // Test not yet available - extract scheduled time from error
          try {
            const data = await res.json();
            const detail = (data as any)?.detail || "";
            let extractedDateTime: string | null = null;
            
            // Pattern 1: Look for explicit "SCHEDULED_DATETIME:" prefix (most reliable)
            let isoMatch = detail.match(/SCHEDULED_DATETIME:(\d{4}-\d{2}-\d{2}T[\d:.-]+(?:Z)?)/i);
            if (isoMatch && isoMatch[1]) {
              extractedDateTime = isoMatch[1];
            }
            
            // Pattern 2: ISO format with Z
            if (!extractedDateTime) {
              isoMatch = detail.match(/(\d{4}-\d{2}-\d{2}T[\d:.-]+Z)/);
              if (isoMatch && isoMatch[1]) {
                extractedDateTime = isoMatch[1];
              }
            }
            
            // Pattern 3: ISO format without Z
            if (!extractedDateTime) {
              isoMatch = detail.match(/(\d{4}-\d{2}-\d{2}T[\d:.-]+)/);
              if (isoMatch && isoMatch[1]) {
                extractedDateTime = isoMatch[1];
              }
            }
            
            // Pattern 4: Look for "scheduled for" followed by datetime
            if (!extractedDateTime) {
              isoMatch = detail.match(/scheduled for\s+(\d{4}-\d{2}-\d{2}T[\d:.-]+(?:Z)?)/i);
              if (isoMatch && isoMatch[1]) {
                extractedDateTime = isoMatch[1];
              }
            }
            
            if (extractedDateTime) {
              // Ensure it's a valid ISO string
              if (!extractedDateTime.endsWith('Z') && !extractedDateTime.includes('+')) {
                // Try to parse and convert to ISO
                try {
                  const date = new Date(extractedDateTime);
                  if (!isNaN(date.getTime())) {
                    extractedDateTime = date.toISOString();
                  }
                } catch {}
              }
              setScheduledDateTime(extractedDateTime);
              setErr(null); // Clear any error
            } else {
              // If we can't extract, still try to show a message
              console.warn("Could not extract scheduled datetime from:", detail);
            }
          } catch (parseError) {
            console.error("Error parsing 403 response:", parseError);
          }
        } else if (res.ok) {
          // Test is available
          const data = (await res.json()) as StartResponse;
          if (data.scheduled_datetime) {
            const scheduled = new Date(data.scheduled_datetime);
            const now = new Date();
            if (scheduled > now) {
              setScheduledDateTime(data.scheduled_datetime);
            } else {
              // Time reached, allow start
              onStarted(data);
            }
          } else {
            // No schedule, allow start
            onStarted(data);
          }
        } else {
          // Other error statuses
          setCheckingSchedule(false);
        }
      } catch (e) {
        console.error("Error checking schedule:", e);
      } finally {
        setCheckingSchedule(false);
      }
    }
    checkSchedule();
  }, [token, apiBase, onStarted]);

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
        // Handle 403 - show countdown instead of error
        if (res.status === 403) {
          try {
            const data = await res.json();
            const detail = (data as any)?.detail || "";
            let extractedDateTime: string | null = null;
            
            // Pattern 1: Look for explicit "SCHEDULED_DATETIME:" prefix (most reliable)
            let isoMatch = detail.match(/SCHEDULED_DATETIME:(\d{4}-\d{2}-\d{2}T[\d:.-]+(?:Z)?)/i);
            if (isoMatch && isoMatch[1]) {
              extractedDateTime = isoMatch[1];
            }
            
            // Pattern 2: ISO format with Z
            if (!extractedDateTime) {
              isoMatch = detail.match(/(\d{4}-\d{2}-\d{2}T[\d:.-]+Z)/);
              if (isoMatch && isoMatch[1]) {
                extractedDateTime = isoMatch[1];
              }
            }
            
            // Pattern 3: ISO format without Z
            if (!extractedDateTime) {
              isoMatch = detail.match(/(\d{4}-\d{2}-\d{2}T[\d:.-]+)/);
              if (isoMatch && isoMatch[1]) {
                extractedDateTime = isoMatch[1];
              }
            }
            
            // Pattern 4: Look for "scheduled for" followed by datetime
            if (!extractedDateTime) {
              isoMatch = detail.match(/scheduled for\s+(\d{4}-\d{2}-\d{2}T[\d:.-]+(?:Z)?)/i);
              if (isoMatch && isoMatch[1]) {
                extractedDateTime = isoMatch[1];
              }
            }
            
            if (extractedDateTime) {
              // Ensure it's a valid ISO string
              if (!extractedDateTime.endsWith('Z') && !extractedDateTime.includes('+')) {
                try {
                  const date = new Date(extractedDateTime);
                  if (!isNaN(date.getTime())) {
                    extractedDateTime = date.toISOString();
                  }
                } catch {}
              }
              setScheduledDateTime(extractedDateTime);
              setErr(null);
              setLoading(false);
              return; // Don't throw error, show countdown instead
            }
          } catch {}
        }
        
        const txt = await res.text();
        let msg =
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

  // Notify parent about countdown state
  useEffect(() => {
    if (scheduledDateTime) {
      const scheduled = new Date(scheduledDateTime);
      const now = new Date();
      if (scheduled > now) {
        onCountdownChange?.(true);
        return () => onCountdownChange?.(false);
      }
    }
    onCountdownChange?.(false);
  }, [scheduledDateTime, onCountdownChange]);

  // ✅ PRIORITY: Show countdown if scheduled time is in the future (check this FIRST)
  if (scheduledDateTime) {
    const scheduled = new Date(scheduledDateTime);
    const now = new Date();
    if (scheduled > now) {
      return (
        <CountdownTimer
          scheduledDateTime={scheduledDateTime}
          onTimeReached={() => {
            setScheduledDateTime(null);
            onCountdownChange?.(false);
            handleStart();
          }}
        />
      );
    }
  }

  // Show loading state while checking
  if (checkingSchedule) {
    return (
      <div className="rounded-2xl border border-border bg-card text-foreground p-6 shadow-sm">
        <div className="text-center">Checking test availability...</div>
      </div>
    );
  }

  // Show ready/start screen (only if no scheduled time or time has passed)
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
