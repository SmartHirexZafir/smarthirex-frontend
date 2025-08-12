// app/meetings/[token]/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// Resolve API base (supports both env names) and trim trailing slash
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

type MeetingInfo = {
  _id?: string;
  token?: string;
  title?: string;
  email?: string;
  candidate_id?: string;
  status?: string; // scheduled | scheduled_email_failed | canceled | completed ...
  starts_at: string | number; // may arrive as ISO string, "YYYY-MM-DD HH:mm:ss", or epoch
  timezone: string;           // IANA TZ name saved with meeting
  duration_mins: number;
  meeting_url?: string;       // fallback join URL (frontend)
  google_meet_url?: string;   // Google Meet link
  external_url?: string;      // any external link
  join_url?: string;          // generic join field (supported defensively)
  notes?: string | null;
};

/** Normalize the backend's starts_at into a UTC ISO string the Date ctor can digest. */
function normalizeUtcIso(input: string | number): string {
  if (typeof input === "number") {
    // epoch ms or seconds
    const ms = input > 1e12 ? input : input * 1000;
    return new Date(ms).toISOString();
  }
  let s = (input || "").toString().trim();
  if (!s) return new Date(NaN).toISOString();

  // Handle "YYYY-MM-DD HH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s)) {
    s = s.replace(" ", "T");
    // treat naive as UTC
    if (!/[zZ]|([+-]\d{2}:\d{2})$/.test(s)) s += "Z";
    return s;
  }

  // Handle "YYYY-MM-DDTHH:mm[:ss]" (no zone) -> treat as UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s) && !/[zZ]|([+-]\d{2}:\d{2})$/.test(s)) {
    return s + "Z";
  }

  // Already ISO with zone or Z
  return s;
}

function fmtLocal(dtIsoLike: string | number, tz: string) {
  try {
    const iso = normalizeUtcIso(dtIsoLike);
    const d = new Date(iso);
    const fmt = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return fmt.format(d);
  } catch {
    try {
      return new Date(dtIsoLike as any).toLocaleString();
    } catch {
      return "Invalid Date";
    }
  }
}

function msToParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

export default function MeetingGatePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [meeting, setMeeting] = useState<MeetingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // countdown state
  const [now, setNow] = useState<number>(Date.now());
  const redirectedRef = useRef(false);

  // fetch meeting details
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/interviews/by-token/${encodeURIComponent(token)}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Failed (${res.status})`);
        }
        const data = (await res.json()) as MeetingInfo | null;
        if (!cancelled) {
          if (!data) {
            setError("Meeting not found.");
          } else {
            setMeeting(data);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load meeting.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // tick every second for countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const startMs = useMemo(() => {
    if (!meeting) return null;
    const iso = normalizeUtcIso(meeting.starts_at);
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : null;
  }, [meeting]);

  const remainingMs = useMemo(() => (startMs ? startMs - now : null), [startMs, now]);
  const isTimeReached = !!(remainingMs !== null && remainingMs <= 0);

  const joinHref = useMemo(() => {
    if (!meeting) return undefined;
    // Accept any of these fields as a join link (prefer Meet if present)
    return (
      meeting.google_meet_url ||
      meeting.external_url ||
      meeting.join_url ||
      meeting.meeting_url
    );
  }, [meeting]);

  // Auto redirect when time reached and we have a join URL
  useEffect(() => {
    if (!isTimeReached || !joinHref || redirectedRef.current) return;
    redirectedRef.current = true;
    const id = setTimeout(() => {
      window.location.href = joinHref;
    }, 800);
    return () => clearTimeout(id);
  }, [isTimeReached, joinHref]);

  // UI blocks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-indigo-600" />
            <span className="text-sm text-gray-700">Loading meeting…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="mb-2 text-2xl font-semibold text-gray-900">404</div>
          <div className="text-gray-700">{error || "Meeting not found."}</div>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  const localWhen = fmtLocal(meeting.starts_at, meeting.timezone);
  const { days, hours, minutes, seconds } = msToParts(remainingMs ?? 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-gray-200/70 p-6">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {meeting.title || "Interview Meeting"}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            When: <span className="font-medium">{localWhen}</span> ({meeting.timezone})
          </p>
          <p className="text-sm text-gray-600">
            Duration: <span className="font-medium">{meeting.duration_mins} min</span>
          </p>
        </div>

        {!isTimeReached ? (
          <>
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-center">
              <div className="text-sm text-indigo-700">Starts in</div>
              <div className="mt-1 text-3xl font-bold tracking-wider text-indigo-800">
                {days > 0 && <span className="mr-2">{String(days)}d</span>}
                {String(hours).padStart(2, "0")}:
                {String(minutes).padStart(2, "0")}:
                {String(seconds).padStart(2, "0")}
              </div>
            </div>

            <button
              disabled
              className="mt-6 w-full rounded-lg bg-gray-200 px-4 py-3 text-sm font-medium text-gray-600 cursor-not-allowed"
              title="Join will be enabled at the scheduled time"
            >
              Join (available at start time)
            </button>

            {joinHref ? (
              <p className="mt-2 text-center text-xs text-gray-500">
                The Google Meet link will open automatically when the meeting starts.
              </p>
            ) : (
              <p className="mt-2 text-center text-xs text-red-600">
                Join link is missing. Please contact the organizer.
              </p>
            )}
          </>
        ) : (
          <>
            <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-center">
              <div className="text-sm text-green-700">It’s time!</div>
              <div className="mt-1 text-lg font-semibold text-green-800">
                Redirecting you to the meeting…
              </div>
            </div>

            {joinHref ? (
              <a
                href={joinHref}
                className="mt-6 block w-full rounded-lg bg-indigo-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-indigo-700"
              >
                Open Google Meet
              </a>
            ) : (
              <button
                disabled
                className="mt-6 w-full rounded-lg bg-gray-200 px-4 py-3 text-sm font-medium text-gray-600 cursor-not-allowed"
              >
                Join link not available
              </button>
            )}
          </>
        )}

        {meeting.notes ? (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="text-sm font-medium text-gray-700">Notes</div>
            <div className="mt-1 text-sm text-gray-600">{meeting.notes}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
