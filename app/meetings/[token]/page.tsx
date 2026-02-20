"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

type AccessState = "countdown" | "open" | "expired";
type AccessPayload = {
  token: string;
  title?: string;
  status?: string;
  email?: string;
  candidate_id?: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  duration_mins: number;
  now: string;
  state: AccessState;
  notes?: string | null;
  join_url?: string;
};

function fmtLocal(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz || "UTC",
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const candidateAccess = searchParams.get("access") || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccessPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [serverNowMs, setServerNowMs] = useState<number | null>(null);
  const [syncLocalMs, setSyncLocalMs] = useState<number>(Date.now());
  const redirectedRef = useRef(false);

  const refresh = async (silenceLoading = true) => {
    if (!silenceLoading) setLoading(true);
    try {
      const qs = candidateAccess ? `?access=${encodeURIComponent(candidateAccess)}` : "";
      const res = await fetch(`${API_BASE}/interviews/access/${encodeURIComponent(token)}${qs}`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.detail || `Failed (${res.status})`);
      }
      const payload = body as AccessPayload;
      setData(payload);
      setServerNowMs(new Date(payload.now).getTime());
      setSyncLocalMs(Date.now());
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to load meeting.");
    } finally {
      if (!silenceLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let stopped = false;
    (async () => {
      if (!stopped) await refresh(false);
    })();
    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, candidateAccess]);

  // Keep server-authoritative state fresh to avoid refresh bypass.
  useEffect(() => {
    const id = setInterval(() => {
      refresh(true);
    }, 2000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, candidateAccess]);

  const effectiveNowMs = useMemo(() => {
    if (!serverNowMs) return Date.now();
    return serverNowMs + (Date.now() - syncLocalMs);
  }, [serverNowMs, syncLocalMs]);

  const remainingMs = useMemo(() => {
    if (!data) return 0;
    return new Date(data.starts_at).getTime() - effectiveNowMs;
  }, [data, effectiveNowMs]);

  // UX-only clock tick between backend polls
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!data || data.state !== "open" || !data.join_url || redirectedRef.current) return;
    redirectedRef.current = true;
    const id = setTimeout(() => {
      window.location.href = data.join_url as string;
    }, 700);
    return () => clearTimeout(id);
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-xl border border-border bg-card px-6 py-4 shadow-sm">
          <span className="text-sm text-muted-foreground">Loading meeting...</span>
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mb-2 text-xl font-semibold">Meeting unavailable</div>
          <div className="text-muted-foreground">{err || "Could not load meeting."}</div>
          <button onClick={() => router.push("/")} className="btn-primary mt-4">
            Go home
          </button>
        </div>
      </div>
    );
  }

  const localWhen = fmtLocal(data.starts_at, data.timezone);
  const { days, hours, minutes, seconds } = msToParts(remainingMs);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-card shadow-xl border border-border p-6">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">{data.title || "Interview Meeting"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            When: <span className="font-medium">{localWhen}</span> ({data.timezone})
          </p>
          <p className="text-sm text-muted-foreground">
            Duration: <span className="font-medium">{data.duration_mins} min</span>
          </p>
        </div>

        {data.state === "countdown" && (
          <>
            <div className="mt-4 rounded-xl border border-[hsl(var(--info))/0.3] bg-[hsl(var(--info))/0.1] px-4 py-3 text-center">
              <div className="text-sm text-[hsl(var(--info-foreground))/0.8]">Starts in</div>
              <div className="mt-1 text-3xl font-bold tracking-wider text-[hsl(var(--info-foreground))]">
                {days > 0 && <span className="mr-2">{String(days)}d</span>}
                {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
                {String(seconds).padStart(2, "0")}
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              The meeting link will open automatically at the scheduled time.
            </p>
          </>
        )}

        {data.state === "open" && (
          <>
            <div className="mt-4 rounded-xl border border-[hsl(var(--success))/0.3] bg-[hsl(var(--success))/0.1] px-4 py-3 text-center">
              <div className="text-sm text-[hsl(var(--success-foreground))/0.9]">It is time!</div>
              <div className="mt-1 text-lg font-semibold text-[hsl(var(--success-foreground))]">
                Redirecting you to the meeting...
              </div>
            </div>
            {data.join_url ? (
              <a href={data.join_url} className="btn-primary mt-6 block w-full text-center">
                Open Google Meet
              </a>
            ) : (
              <button disabled className="btn-outline mt-6 w-full disabled:opacity-50">
                Join link unavailable
              </button>
            )}
          </>
        )}

        {data.state === "expired" && (
          <div className="mt-4 rounded-xl border border-[hsl(var(--destructive))/0.35] bg-[hsl(var(--destructive))/0.1] px-4 py-5 text-center">
            <div className="text-lg font-semibold text-[hsl(var(--destructive))]">Meeting expired</div>
            <div className="mt-2 text-sm text-muted-foreground">
              This meeting window has ended and can no longer be accessed.
            </div>
          </div>
        )}

        {data.notes ? (
          <div className="mt-6 rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div className="text-sm font-medium">Notes</div>
            <div className="mt-1 text-sm text-muted-foreground">{data.notes}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
