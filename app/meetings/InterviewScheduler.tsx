// app/meetings/InterviewScheduler.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/** ========================
 *  Types
 *  ======================== */
type Prefilled = {
  candidateId: string;
  email?: string;
  role?: string;
};

type Props = {
  /** Optional: when provided, we render the prefilled flow (no dropdown),
   *  show Email/Role boxes and the candidate's latest test */
  prefilled?: Prefilled;
  /** Optional: bubble up a toast string after scheduling */
  onToast?: (msg: string) => void;
  /** Optional: bubble up errors (used by parent); safe to omit */
  onError?: (msg: string) => void;
};

type CandidateDoc = {
  _id: string;
  name?: string;
  email?: string;
  resume?: { email?: string };
  job_role?: string;
  test_score?: number;
  avatar?: string;
};

type ScheduleResponse = {
  ok?: boolean;
  meetingUrl?: string;
  meeting_url?: string;
  [k: string]: unknown;
};

type Attempt = {
  _id: string;
  type: "smart" | "custom";
  score?: number | null;
  created_at?: string;
  submitted_at?: string;
};

/** ========================
 *  API helpers
 *  ======================== */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

const getAuthToken = (): string | null =>
  (typeof window !== "undefined" &&
    (localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("AUTH_TOKEN"))) ||
  null;

const authHeaders = () => {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const t = getAuthToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

async function safeJson<T = any>(res: Response): Promise<T> {
  const txt = await res.text();
  if (!txt) return {} as T;
  try {
    return JSON.parse(txt) as T;
  } catch {
    return { raw: txt } as unknown as T;
  }
}

/** Combine a YYYY-MM-DD date and a 'hh:mm AM/PM' time into ISO string */
function toISOFromDateAnd12h(dateStr: string, time12h: string): string | null {
  if (!dateStr || !time12h) return null;
  const m = time12h.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!m) return null;
  let [, hh, mm, ap] = m;
  let h = parseInt(hh, 10);
  const minutes = parseInt(mm, 10);
  const isPM = ap.toUpperCase() === "PM";
  if (h === 12) h = isPM ? 12 : 0;
  else if (isPM) h += 12;

  // Build a Date in local timezone
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(h, minutes, 0, 0);
  return d.toISOString();
}

/** Safe pick meeting URL from varied field names */
function pickMeetingUrl(resp?: ScheduleResponse): string | undefined {
  return (resp?.meetingUrl as string) || (resp?.meeting_url as string) || undefined;
}

/** Friendly mapping for common server errors (Req 8.2) */
function friendlyHttpMessage(status: number): string | null {
  switch (status) {
    case 400:
      return "Bad request.";
    case 401:
      return "Unauthorized. Please log in again.";
    case 403:
      return "Forbidden. You don’t have access to this action.";
    case 404:
      return "Not found.";
    case 409:
      return "A test has already been started for this candidate (only one test type is allowed).";
    case 410:
      return "This link has expired.";
    case 422:
      return "Unprocessable request. Please check your inputs.";
    case 500:
      return "Server error. Please try again.";
    default:
      return null;
  }
}

/** ========================
 *  Component
 *  ======================== */
export default function InterviewScheduler({ prefilled, onToast, onError }: Props) {
  const router = useRouter();

  // ---- Local UI state (kept from original logic) ----
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ---- Candidates from backend (NO local hardcoded fallbacks per “no hardcoding”) ----
  const [candidates, setCandidates] = useState<CandidateDoc[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  // Prefilled candidate details and latest test
  const [prefilledCandidate, setPrefilledCandidate] = useState<CandidateDoc | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<Attempt | null>(null);

  // If user chooses from dropdown, also verify latest attempt for that candidate (extra safety gate)
  const [selectedLatestAttempt, setSelectedLatestAttempt] = useState<Attempt | null>(null);
  const [checkingSelectedGate, setCheckingSelectedGate] = useState(false);

  // Small success toast for this component (if parent doesn't provide onToast)
  const [toast, setToast] = useState<string | null>(null);
  const emitToast = (msg: string) => {
    if (onToast) onToast(msg);
    else {
      setToast(msg);
      window.setTimeout(() => setToast(null), 2200);
    }
  };
  const emitError = (msg: string) => {
    if (onError) onError(msg);
    else emitToast(msg);
  };

  // Meeting URL to show on confirmation
  const [meetingUrl, setMeetingUrl] = useState<string | undefined>(undefined);

  // Time slots (unchanged)
  const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
  ];

  /** ========================
   *  Effects
   *  ======================== */

  // Load only candidates who have taken a test (non-prefilled flow)
  useEffect(() => {
    if (prefilled?.candidateId) return; // list isn't needed if prefilled
    (async () => {
      setLoadingList(true);
      setLoadError(null);
      try {
        const res = await fetch(`${API_BASE}/candidate/candidates/with-tests`, {
          headers: authHeaders(),
        });
        const data = await safeJson(res);
        if (!res.ok) {
          const msg =
            (data as any)?.detail ||
            friendlyHttpMessage(res.status) ||
            "Unable to load candidates.";
          throw new Error(msg);
        }
        const list: CandidateDoc[] = Array.isArray((data as any)?.candidates)
          ? (data as any).candidates
          : [];
        setCandidates(list);
        if (list.length === 0) {
          setLoadError(
            "No candidates with completed tests found. Send tests first from the Test page."
          );
        }
      } catch (e: any) {
        setLoadError(
          typeof e?.message === "string"
            ? e.message
            : "Unable to load candidates right now."
        );
        setCandidates([]);
      } finally {
        setLoadingList(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load prefilled candidate details and latest test
  useEffect(() => {
    const cid = prefilled?.candidateId;
    if (!cid) return;
    (async () => {
      try {
        const [cRes, hRes] = await Promise.all([
          fetch(`${API_BASE}/candidate/${cid}`, { headers: authHeaders() }),
          fetch(`${API_BASE}/tests/history/${cid}`, { headers: authHeaders() }),
        ]);
        const cDoc = (await safeJson<CandidateDoc>(cRes)) as CandidateDoc;
        const hist = await safeJson<any>(hRes);
        if (!cRes.ok) {
          throw new Error(
            (hist as any)?.detail ||
              friendlyHttpMessage(cRes.status) ||
              "Failed to load candidate profile."
          );
        }
        const attempts: Attempt[] = Array.isArray(hist?.attempts) ? hist.attempts : [];
        attempts.sort((a, b) => {
          const ta = new Date(a.created_at || a.submitted_at || 0).getTime();
          const tb = new Date(b.created_at || b.submitted_at || 0).getTime();
          return tb - ta;
        });
        setPrefilledCandidate({
          ...cDoc,
          email: cDoc?.email || cDoc?.resume?.email || prefilled?.email,
          job_role: cDoc?.job_role || prefilled?.role,
        });
        setLatestAttempt(attempts[0] || null);
      } catch (e: any) {
        setPrefilledCandidate({
          _id: cid,
          email: prefilled?.email,
          job_role: prefilled?.role,
        });
        setLatestAttempt(null);
      }
    })();
  }, [prefilled?.candidateId, prefilled?.email, prefilled?.role]);

  // When user selects a candidate from dropdown, verify they have at least one submitted attempt
  useEffect(() => {
    if (!selectedCandidate) {
      setSelectedLatestAttempt(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setCheckingSelectedGate(true);
      try {
        const res = await fetch(`${API_BASE}/tests/history/${selectedCandidate}`, {
          headers: authHeaders(),
        });
        const hist = await safeJson<any>(res);
        const attempts: Attempt[] = Array.isArray(hist?.attempts) ? hist.attempts : [];
        attempts.sort((a, b) => {
          const ta = new Date(a.created_at || a.submitted_at || 0).getTime();
          const tb = new Date(b.created_at || b.submitted_at || 0).getTime();
          return tb - ta;
        });
        if (!cancelled) {
          setSelectedLatestAttempt(attempts[0] || null);
        }
      } catch {
        if (!cancelled) setSelectedLatestAttempt(null);
      } finally {
        if (!cancelled) setCheckingSelectedGate(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCandidate]);

  /** ========================
   *  Derived state & gating (Req 8.1)
   *  ======================== */
  const selectedCandidateData = useMemo(() => {
    if (prefilled?.candidateId) return null; // handled separately
    return candidates.find((c) => c._id === selectedCandidate);
  }, [prefilled?.candidateId, candidates, selectedCandidate]);

  // Gate: meetings cannot be scheduled until a test is completed
  const prefilledGateBlocked =
    !!prefilled?.candidateId && !latestAttempt?.submitted_at;

  const dropdownGateBlocked =
    !prefilled?.candidateId &&
    !!selectedCandidate &&
    !checkingSelectedGate &&
    !selectedLatestAttempt?.submitted_at;

  const scheduleDisabled =
    (prefilled?.candidateId ? false : !selectedCandidate) ||
    !selectedDate ||
    !selectedTime ||
    isScheduling ||
    prefilledGateBlocked ||
    dropdownGateBlocked;

  /** ========================
   *  Actions
   *  ======================== */

  // Core schedule call:
  // 1) try /interviews/schedule (new unified endpoint; expects different keys)
  // 2) fallback to /candidate/{id}/schedule (legacy candidate-scoped endpoint)
  const scheduleInterview = async (payload: {
    candidateId: string;
    email: string;
    startsAt: string; // ISO
    timezone: string;
    durationMins: number;
    title: string;
    notes?: string;
    candidate_name?: string;
  }): Promise<ScheduleResponse> => {
    // Attempt 1: unified endpoint expects { candidateEmail, candidateName, when, ... }
    try {
      const unified = {
        candidateId: payload.candidateId,
        candidateEmail: payload.email,
        candidateName: payload.candidate_name,
        role: payload.title?.replace(/^Interview\s*[-–]\s*/i, "") || payload.title,
        when: payload.startsAt,
        timezone: payload.timezone,
        durationMins: payload.durationMins,
        title: payload.title,
        notes: payload.notes,
      };
      const res = await fetch(`${API_BASE}/interviews/schedule`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(unified),
      });
      const data = (await safeJson<ScheduleResponse>(res)) as ScheduleResponse;
      if (res.ok) return data;
      const msg =
        (data as any)?.detail ||
        friendlyHttpMessage(res.status) ||
        "Failed to schedule interview.";
      // fall through to legacy endpoint on known server-side errors
      if (res.status >= 500 || res.status === 404) {
        // try fallback
      } else {
        throw new Error(msg);
      }
    } catch {
      // fall through
    }

    // Fallback 2: candidate-scoped endpoint accepts the original payload
    const res2 = await fetch(`${API_BASE}/candidate/${payload.candidateId}/schedule`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data2 = (await safeJson<ScheduleResponse>(res2)) as ScheduleResponse;
    if (!res2.ok) {
      throw new Error(
        (data2 as any)?.detail ||
          friendlyHttpMessage(res2.status) ||
          "Failed to schedule interview."
      );
    }
    return data2;
  };

  const handleSchedule = async () => {
    // Guard: show a nice dialog-like toast if blocked
    if (prefilledGateBlocked || dropdownGateBlocked) {
      emitToast(
        "Meetings aren’t allowed until the candidate has completed a test."
      );
      return;
    }

    setIsScheduling(true);
    try {
      // Resolve candidate & identity
      const cid = prefilled?.candidateId || selectedCandidate;
      const c = prefilled?.candidateId ? prefilledCandidate : selectedCandidateData;

      const email = c?.email || c?.resume?.email;
      if (!cid || !email) {
        setIsScheduling(false);
        emitToast("Candidate email required to schedule.");
        return;
      }

      // Combine date/time into ISO
      const iso = toISOFromDateAnd12h(selectedDate, selectedTime);
      if (!iso) {
        setIsScheduling(false);
        emitToast("Please choose a valid date and time.");
        return;
      }

      // Reasonable defaults for missing fields
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const durationMins = 45;
      const role = c?.job_role || prefilled?.role || "Interview";
      const title = `Interview – ${role}`;

      const payload = {
        candidateId: cid,
        email,
        startsAt: iso,
        timezone: tz,
        durationMins,
        title,
        notes: notes || undefined,
        candidate_name: c?.name,
      };

      const resp = await scheduleInterview(payload);
      setMeetingUrl(pickMeetingUrl(resp));
      setShowConfirmation(true);
      emitToast("Interview invite sent");
    } catch (e: any) {
      emitError(
        typeof e?.message === "string" ? e.message : "Could not schedule interview"
      );
    } finally {
      setIsScheduling(false);
    }
  };

  /** ========================
   *  Confirmation screen
   *  ======================== */
  const ConfCandidate = prefilled?.candidateId ? prefilledCandidate : selectedCandidateData;

  if (showConfirmation) {
    return (
      <div className="bg-card text-foreground backdrop-blur-sm rounded-2xl shadow-xl border border-border p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
            <i className="ri-check-line text-3xl text-primary" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Interview Scheduled Successfully!</h2>
          <p className="mb-6 text-muted-foreground">All participants have been notified</p>

          <div className="mb-6 rounded-xl border border-border bg-muted/40 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <i className="ri-video-line text-primary-foreground" />
                </div>
                <p className="text-sm font-medium">Video invite generated</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                  <i className="ri-mail-line text-secondary-foreground" />
                </div>
                <p className="text-sm font-medium">Email sent to candidate</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <i className="ri-dashboard-line text-accent-foreground" />
                </div>
                <p className="text-sm font-medium">Dashboard updated</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl bg-muted p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {ConfCandidate?.avatar ? (
                  <img
                    src={ConfCandidate.avatar}
                    alt={ConfCandidate?.name || ConfCandidate?.email || "Candidate"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/60">
                    <i className="ri-user-line text-muted-foreground" />
                  </div>
                )}
                <div className="text-left">
                  <p className="font-medium">
                    {ConfCandidate?.name || ConfCandidate?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate} at {selectedTime}
                  </p>
                </div>
              </div>
              {meetingUrl ? (
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <i className="ri-video-line" />
                  <span>Join Meeting</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm text-foreground/70"
                  title="Meeting link not available"
                >
                  <i className="ri-video-line" />
                  <span>Join Meeting</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowConfirmation(false)}
              type="button"
              className="rounded-lg border border-input px-6 py-2 text-sm text-foreground transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Schedule Another
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              type="button"
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /** ========================
   *  Main form
   *  ======================== */

  // Non-prefilled header content (dropdown) vs prefilled (two boxes + latest test)
  const showDropdown = !prefilled?.candidateId;

  const emailBox = prefilled?.candidateId
    ? prefilledCandidate?.email || prefilled?.email || "—"
    : selectedCandidateData?.email ||
      selectedCandidateData?.resume?.email ||
      "—";

  const roleBox = prefilled?.candidateId
    ? prefilledCandidate?.job_role || prefilled?.role || "—"
    : selectedCandidateData?.job_role || "—";

  // Helpful link to view the candidate's test before scheduling
  const testLink =
    prefilled?.candidateId
      ? `/candidate/${prefilled.candidateId}`
      : selectedCandidate
      ? `/candidate/${selectedCandidate}`
      : null;

  // Gate banners
  const showPrefilledGateBanner = prefilledGateBlocked;
  const showDropdownGateBanner =
    dropdownGateBlocked && !!selectedCandidate && !checkingSelectedGate;

  return (
    <div className="bg-card text-foreground backdrop-blur-sm rounded-2xl shadow-xl border border-border p-6">
      <div className="mb-6 flex items-center">
        <i className="ri-calendar-event-line mr-3 text-2xl text-foreground/80" />
        <h2 className="text-xl font-bold">Schedule Interview</h2>
      </div>

      {/* Gating banners */}
      {showPrefilledGateBanner && (
        <div
          className="mb-4 rounded-xl border border-border bg-destructive/10 p-3 text-sm text-[hsl(var(--destructive))]"
          role="alert"
          aria-live="assertive"
        >
          <i className="ri-error-warning-line mr-2" />
          Meetings are not allowed until the candidate has completed a test.
        </div>
      )}
      {showDropdownGateBanner && (
        <div
          className="mb-4 rounded-xl border border-border bg-destructive/10 p-3 text-sm text-[hsl(var(--destructive))]"
          role="alert"
          aria-live="assertive"
        >
          <i className="ri-error-warning-line mr-2" />
          This candidate hasn’t completed a test yet. Please send a test first.
        </div>
      )}

      {/* Prefilled context boxes */}
      {prefilled?.candidateId && (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <div className="mb-1 text-xs text-muted-foreground">Email</div>
            <div className="font-medium">{emailBox}</div>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <div className="mb-1 text-xs text-muted-foreground">Role</div>
            <div className="font-medium">{roleBox}</div>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 text-xs text-muted-foreground">Latest Test</div>
                <div className="text-sm">
                  {latestAttempt ? (
                    <>
                      Type: {latestAttempt.type} · Score: {latestAttempt.score ?? "—"}
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
              {prefilled?.candidateId && (
                <a
                  className="ml-3 text-xs underline"
                  href={`/candidate/${prefilled.candidateId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Candidate Selection / Prefilled card */}
        <div className="space-y-4">
          {showDropdown ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Select Candidate
                </label>
                <select
                  value={selectedCandidate}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-3 text-foreground pr-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Select candidate"
                  disabled={loadingList}
                >
                  <option value="">
                    {loadingList ? "Loading candidates…" : "Choose a candidate..."}
                  </option>
                  {candidates.map((c) => (
                    <option key={c._id} value={c._id}>
                      {(c.name || c.email) ?? c._id} — {c.job_role || "—"}
                    </option>
                  ))}
                </select>
                {loadError && (
                  <p className="mt-2 text-xs text-muted-foreground">{loadError}</p>
                )}
              </div>

              {selectedCandidateData && (
                <div className="rounded-xl border border-border bg-muted/50 p-4">
                  <div className="flex items-center gap-3">
                    {selectedCandidateData.avatar ? (
                      <img
                        src={selectedCandidateData.avatar}
                        alt={
                          selectedCandidateData.name ||
                          selectedCandidateData.email ||
                          "Candidate"
                        }
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/60">
                        <i className="ri-user-line text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">
                        {selectedCandidateData.name || selectedCandidateData.email}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedCandidateData.email ||
                          selectedCandidateData.resume?.email}
                      </p>
                      <p className="text-sm">
                        {selectedCandidateData.job_role || "—"}
                      </p>
                    </div>
                    {testLink && (
                      <a
                        className="ml-auto text-xs underline"
                        href={testLink}
                        target="_blank"
                        rel="noreferrer"
                        title="Open candidate profile (see Test tab)"
                      >
                        View Test
                      </a>
                    )}
                  </div>
                  {checkingSelectedGate && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Checking test completion…
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}

          {/* Interview Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              Interview Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-3 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        {/* Time Selection + Notes */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              Available Time Slots
            </label>
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
              {timeSlots.map((time) => {
                const isActive = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    type="button"
                    className={`rounded-lg p-3 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-muted text-foreground hover:bg-muted/70"
                    }`}
                    aria-pressed={isActive}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              Interview Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any specific topics or requirements for the interview..."
              className="w-full resize-none rounded-xl border border-input bg-background p-3 text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Schedule Button */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-muted-foreground">
              Auto-schedule next round if passed
            </span>
          </label>
        </div>

        <button
          onClick={handleSchedule}
          disabled={scheduleDisabled}
          type="button"
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          aria-busy={isScheduling}
          title={
            scheduleDisabled
              ? prefilledGateBlocked || dropdownGateBlocked
                ? "A completed test is required before scheduling."
                : "Please select candidate (if required), date and time"
              : undefined
          }
        >
          {isScheduling ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/70 border-t-transparent" />
              <span>Scheduling...</span>
            </>
          ) : (
            <>
              <i className="ri-video-line" />
              <span>Schedule via Google Meet</span>
            </>
          )}
        </button>
      </div>

      {/* Local toast (used only if parent didn't pass onToast) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div
            role="status"
            aria-live="polite"
            className="panel glass shadow-lux min-w-[260px] px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Notice</div>
                <div className="mt-0.5 text-[hsl(var(--muted-foreground))]">
                  {toast}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="icon-btn h-8 w-8"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
