// app/(shared)/ScheduleInterviewModal.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

export type CandidateLite = {
  id: string;
  name?: string | null;
  email: string;
  // ✅ Added fields for schedule gating (Req. 8)
  testTaken?: boolean;
  hasTestResult?: boolean;
  test_score?: number;
  testCompleted?: boolean;
};

export type SchedulePayload = {
  candidateId: string;
  email: string;
  startsAt: string; // ISO string in UTC
  timezone: string;
  durationMins: number;
  title: string;
  notes?: string;
  // backend supports this optional field
  candidate_name?: string | null;
};

export type ScheduleInterviewModalProps = {
  open: boolean;
  onClose: () => void;
  candidate: CandidateLite;
  onSubmit?: (payload: SchedulePayload) => Promise<{ meetingUrl?: string } | void>;
  onScheduled?: (resp: { meetingUrl?: string } & SchedulePayload) => void;
};

// ---- small helpers (no extra libs) ----
const parseISO = (s: string) => new Date(s);
const isAfter = (a: Date, b: Date) => a.getTime() > b.getTime();

const getTimeZones = (): string[] => {
  const anyIntl = Intl as any;
  if (anyIntl && typeof anyIntl.supportedValuesOf === "function") {
    try {
      const tz = anyIntl.supportedValuesOf("timeZone") as string[];
      if (Array.isArray(tz) && tz.length) return tz;
    } catch {}
  }
  return [
    "UTC",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Madrid",
    "Africa/Cairo",
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
  ];
};

const getTzOffsetMinutes = (date: Date, timeZone: string): number => {
  const dtf = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, number> = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 };
  for (const p of parts) {
    if (p.type in map) map[p.type] = parseInt(p.value, 10);
  }
  const asLocal = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
  // Positive for zones east of UTC (e.g., Asia/Karachi ≈ +300)
  return (asLocal - date.getTime()) / (60 * 1000);
};

/**
 * Convert a local date/time (in tz) to a UTC ISO string.
 * IMPORTANT: the offset must be SUBTRACTED (not added).
 * Example: 17:00 Asia/Karachi (UTC+5) -> 12:00Z.
 */
const toUtcIso = (dateStr: string, timeStr: string, tz: string): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  // Construct a UTC "container" for the chosen wall-clock time
  const dt = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const offsetMinutes = getTzOffsetMinutes(dt, tz);
  // Convert local wall-clock to real UTC instant by subtracting the offset
  const utc = new Date(dt.getTime() - offsetMinutes * 60 * 1000);
  return utc.toISOString();
};

const durations = [30, 45, 60, 90];

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  open,
  onClose,
  candidate,
  onSubmit,
  onScheduled,
}) => {
  const zones = useMemo(() => getTimeZones(), []);
  const defaultTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timezone, setTimezone] = useState(defaultTz);
  const [durationMins, setDurationMins] = useState<number>(60);
  const [title, setTitle] = useState<string>(`Interview with ${candidate.name ?? "Candidate"}`);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccessUrl(null);
      setTimezone(defaultTz);
      setDurationMins(60);
      setTitle(`Interview with ${candidate.name ?? "Candidate"}`);
      setNotes("");
      setDate("");
      setTime("");
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // ✅ Centralized test-completion rule (Req. 8)
  const testEvidence =
    candidate?.testTaken === true ||
    candidate?.hasTestResult === true ||
    candidate?.testCompleted === true ||
    (typeof candidate?.test_score === "number" && !Number.isNaN(candidate.test_score));

  const scheduleBlocked = !testEvidence;

  const canSubmit = useMemo(() => {
    if (scheduleBlocked) return false; // block submit if test not taken
    if (!date || !time || !candidate?.email) return false;
    try {
      const utcIso = toUtcIso(date, time, timezone);
      return isAfter(parseISO(utcIso), new Date());
    } catch {
      return false;
    }
  }, [date, time, timezone, candidate?.email, scheduleBlocked]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  const submit = async () => {
    setError(null);
    if (!canSubmit) {
      setError(
        scheduleBlocked
          ? "This candidate hasn’t taken the test yet, so the interview can’t be scheduled."
          : "Please choose a valid future date & time and ensure the candidate email exists."
      );
      return;
    }
    setLoading(true);
    try {
      const payload: SchedulePayload = {
        candidateId: candidate.id,
        email: candidate.email,
        startsAt: toUtcIso(date, time, timezone),
        timezone,
        durationMins,
        title,
        notes: notes || undefined,
        candidate_name: candidate.name ?? undefined,
      };

      let resp: { meetingUrl?: string } | void;
      if (onSubmit) {
        resp = await onSubmit(payload);
      } else {
        const r = await fetch(`${API_BASE}/candidate/interviews/schedule`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
        if (!r.ok) {
          let msg = `Request failed with ${r.status}`;
          try {
            const data = await r.json();
            if (data?.detail) msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
          } catch {
            const t = await r.text().catch(() => "");
            if (t) msg = t;
          }
          throw new Error(msg);
        }
        resp = await r.json();
      }

      const meetingUrl = resp && (resp as any).meetingUrl ? (resp as any).meetingUrl : undefined;
      setSuccessUrl(meetingUrl ?? null);
      onScheduled?.({ ...(payload as SchedulePayload), meetingUrl });
    } catch (e: any) {
      setError(e?.message || "Failed to schedule interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
    >
      {/* Panel */}
      <div className="w-full max-w-xl rounded-2xl surface glass gradient-border shadow-glow animate-blur-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/70">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-luxe-aurora text-white grid place-items-center shadow-glow">
              <i className="ri-calendar-event-line text-base" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold tracking-wide">Schedule Interview</h3>
          </div>
          <button
            onClick={onClose}
            className="icon-btn rounded-xl hover:shadow-glow focus-visible:outline-none"
            aria-label="Close"
            disabled={loading}
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="text-sm text-muted-foreground">
            {candidate.name ? <span className="font-medium text-foreground">{candidate.name}</span> : null}
            {candidate.name ? " · " : null}
            <span>{candidate.email}</span>
          </div>

          {/* ✅ Blocker message when test not taken (Req. 8) */}
          {scheduleBlocked && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
              This candidate hasn’t taken the test yet, so the interview can’t be scheduled.
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-foreground mb-1">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none shadow-inner-highlight"
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-foreground mb-1">
                Time
              </label>
              <input
                id="time"
                type="time"
                step={60}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none shadow-inner-highlight"
              />
            </div>
          </div>

          {/* TZ & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Timezone</label>
              <select
                className="w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none shadow-inner-highlight"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Duration</label>
              <select
                className="w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none shadow-inner-highlight"
                value={String(durationMins)}
                onChange={(e) => setDurationMins(parseInt(e.target.value))}
              >
                {durations.map((d) => (
                  <option key={d} value={String(d)}>
                    {d} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none shadow-inner-highlight"
              placeholder="Interview title"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-28 w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none shadow-inner-highlight"
              placeholder="Anything the candidate should prepare…"
            />
          </div>

          {/* Alerts */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {successUrl && (
            <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              Interview scheduled!{" "}
              {successUrl ? (
                <a className="underline hover:opacity-90" href={successUrl} target="_blank" rel="noreferrer">
                  Open meeting link
                </a>
              ) : (
                <>Invite email sent.</>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Close
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit || loading || scheduleBlocked}
              className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              title={
                scheduleBlocked
                  ? "This candidate hasn’t taken the test yet, so the interview can’t be scheduled."
                  : undefined
              }
            >
              {loading ? "Scheduling…" : "Send Invite"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
