'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  type: 'smart' | 'custom';
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
  'http://localhost:10000'
).replace(/\/$/, '');

const getAuthToken = (): string | null =>
  (typeof window !== 'undefined' &&
    (localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('AUTH_TOKEN'))) ||
  null;

const authHeaders = () => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = getAuthToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

/** Combine a YYYY-MM-DD date and a 'hh:mm AM/PM' time into ISO string */
function toISOFromDateAnd12h(dateStr: string, time12h: string): string | null {
  if (!dateStr || !time12h) return null;
  const m = time12h.trim().match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (!m) return null;
  let [, hh, mm, ap] = m;
  let h = parseInt(hh, 10);
  const minutes = parseInt(mm, 10);
  const isPM = ap.toUpperCase() === 'PM';
  if (h === 12) h = isPM ? 12 : 0;
  else if (isPM) h += 12;

  // Build a Date in local timezone
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(h, minutes, 0, 0);
  return d.toISOString();
}

/** Safe pick meeting URL from varied field names */
function pickMeetingUrl(resp?: ScheduleResponse): string | undefined {
  return (resp?.meetingUrl as string) || (resp?.meeting_url as string) || undefined;
}

/** ========================
 *  Component
 *  ======================== */
export default function InterviewScheduler({ prefilled, onToast }: Props) {
  const router = useRouter();

  // ---- Local UI state (kept from original logic) ----
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ---- New: real candidates (only with tests) + fallbacks ----
  const [candidates, setCandidates] = useState<CandidateDoc[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Prefilled candidate details and latest test
  const [prefilledCandidate, setPrefilledCandidate] = useState<CandidateDoc | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<Attempt | null>(null);

  // Small success toast for this component (if parent doesn't provide onToast)
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    if (onToast) onToast(msg);
    else {
      setToast(msg);
      window.setTimeout(() => setToast(null), 2200);
    }
  };

  // Meeting URL to show on confirmation
  const [meetingUrl, setMeetingUrl] = useState<string | undefined>(undefined);

  // ---- Static fallback candidates (kept, used only if backend fails) ----
  const fallbackCandidates: CandidateDoc[] = [
    {
      _id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      job_role: 'Frontend Developer',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-interview-001&orientation=squarish',
      test_score: 80,
    },
    {
      _id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      job_role: 'Backend Developer',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20male%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-interview-002&orientation=squarish',
      test_score: 76,
    },
    {
      _id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@email.com',
      job_role: 'Full Stack Developer',
      avatar:
        'https://readdy.ai/api/search-image?query=professional%20female%20software%20developer%20headshot%2C%20confident%20tech%20professional%2C%20modern%20corporate%20portrait%2C%20clean%20background%2C%20business%20casual%20attire%2C%20friendly%20smile%2C%20professional%20photography&width=100&height=100&seq=candidate-interview-003&orientation=squarish',
      test_score: 92,
    },
  ];

  // Time slots (unchanged)
  const timeSlots = [
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM',
  ];

  /** ========================
   *  Effects
   *  ======================== */

  // Load only candidates who have taken a test (for non-prefilled flow)
  useEffect(() => {
    if (prefilled?.candidateId) return; // list isn't needed if prefilled
    (async () => {
      try {
        // 🔧 FIX: point to backend-mounted path under /candidate
        const res = await fetch(`${API_BASE}/candidate/candidates/with-tests`, { headers: authHeaders() });
        if (!res.ok) throw new Error('err');
        const data = await res.json().catch(() => ({}));
        const list: CandidateDoc[] = Array.isArray(data?.candidates) ? data.candidates : [];
        if (list.length) setCandidates(list);
        else setCandidates(fallbackCandidates); // fallback when empty
      } catch {
        setCandidates(fallbackCandidates); // fallback when API fails
        setLoadError('Showing demo candidates (backend list unavailable).');
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
        const cDoc = (await cRes.json().catch(() => ({}))) as CandidateDoc;
        const hist = await hRes.json().catch(() => ({}));
        const attempts: Attempt[] = Array.isArray(hist?.attempts) ? hist.attempts : [];
        // pick latest by created_at/submitted_at
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
      } catch {
        // keep silent; UI will still show prefilled email/role
        setPrefilledCandidate({
          _id: cid,
          email: prefilled?.email,
          job_role: prefilled?.role,
        });
      }
    })();
  }, [prefilled?.candidateId, prefilled?.email, prefilled?.role]);

  /** ========================
   *  Derived state
   *  ======================== */

  const selectedCandidateData = useMemo(() => {
    if (prefilled?.candidateId) return null; // handled separately
    return candidates.find((c) => c._id === selectedCandidate);
  }, [prefilled?.candidateId, candidates, selectedCandidate]);

  const scheduleDisabled =
    (prefilled?.candidateId ? false : !selectedCandidate) ||
    !selectedDate ||
    !selectedTime ||
    isScheduling;

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
        role: payload.title?.replace(/^Interview\s*[-–]\s*/i, '') || payload.title,
        when: payload.startsAt,
        timezone: payload.timezone,
        durationMins: payload.durationMins,
        title: payload.title,
        notes: payload.notes,
      };
      const res = await fetch(`${API_BASE}/interviews/schedule`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(unified),
      });
      const data = (await res.json().catch(() => ({}))) as ScheduleResponse;
      if (res.ok) return data;
      // else fall through
    } catch {
      // fall through
    }

    // Fallback 2: candidate-scoped endpoint accepts the original payload
    const res2 = await fetch(`${API_BASE}/candidate/${payload.candidateId}/schedule`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data2 = (await res2.json().catch(() => ({}))) as ScheduleResponse;
    if (!res2.ok) {
      throw new Error((data2 as any)?.detail || 'Failed to schedule interview');
    }
    return data2;
  };

  const handleSchedule = async () => {
    setIsScheduling(true);
    try {
      // Resolve candidate & identity
      const cid = prefilled?.candidateId || selectedCandidate;
      const c = prefilled?.candidateId ? prefilledCandidate : selectedCandidateData;

      const email = c?.email || c?.resume?.email;
      if (!cid || !email) {
        setIsScheduling(false);
        showToast('Candidate email required to schedule.');
        return;
      }

      // Combine date/time into ISO
      const iso = toISOFromDateAnd12h(selectedDate, selectedTime);
      if (!iso) {
        setIsScheduling(false);
        showToast('Please choose a valid date and time.');
        return;
      }

      // Reasonable defaults for missing fields
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const durationMins = 45;
      const role = c?.job_role || prefilled?.role || 'Interview';
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
      showToast('Interview invite sent');
    } catch (e: any) {
      showToast(typeof e?.message === 'string' ? e.message : 'Could not schedule interview');
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
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-100">
            <i className="ri-check-line text-3xl text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Interview Scheduled Successfully!</h2>
          <p className="text-muted-foreground mb-6">All participants have been notified</p>

          <div className="rounded-xl p-6 border border-border mb-6 bg-gradient-to-r from-muted to-muted/60">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 bg-primary">
                  <i className="ri-video-line text-primary-foreground" />
                </div>
                <p className="text-sm font-medium">Video invite generated</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 bg-blue-600">
                  <i className="ri-mail-line text-white" />
                </div>
                <p className="text-sm font-medium">Email sent to candidate</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 bg-violet-600">
                  <i className="ri-dashboard-line text-white" />
                </div>
                <p className="text-sm font-medium">Dashboard updated</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-6 bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {ConfCandidate?.avatar ? (
                  <img
                    src={ConfCandidate.avatar}
                    alt={ConfCandidate?.name || ConfCandidate?.email || 'Candidate'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-background/60 border border-border flex items-center justify-center">
                    <i className="ri-user-line text-muted-foreground" />
                  </div>
                )}
                <div className="text-left">
                  <p className="font-medium">{ConfCandidate?.name || ConfCandidate?.email}</p>
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
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <i className="ri-video-line" />
                  <span>Join Meeting</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground/70"
                  title="Meeting link not available"
                >
                  <i className="ri-video-line" />
                  <span>Join Meeting</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowConfirmation(false)}
              type="button"
              className="px-6 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Schedule Another
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              type="button"
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    ? (prefilledCandidate?.email || prefilled?.email || '—')
    : (selectedCandidateData?.email || selectedCandidateData?.resume?.email || '—');

  const roleBox = prefilled?.candidateId
    ? (prefilledCandidate?.job_role || prefilled?.role || '—')
    : (selectedCandidateData?.job_role || '—');

  // Helpful link to view the candidate's test before scheduling
  const testLink =
    prefilled?.candidateId
      ? `/candidate/${prefilled.candidateId}`
      : selectedCandidate
      ? `/candidate/${selectedCandidate}`
      : null;

  return (
    <div className="bg-card text-foreground backdrop-blur-sm rounded-2xl shadow-xl border border-border p-6">
      <div className="flex items-center mb-6">
        <i className="ri-calendar-event-line text-2xl text-foreground/80 mr-3" />
        <h2 className="text-xl font-bold">Schedule Interview</h2>
      </div>

      {/* Prefilled context boxes */}
      {prefilled?.candidateId && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-border bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Email</div>
            <div className="font-medium">{emailBox}</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Role</div>
            <div className="font-medium">{roleBox}</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Latest Test</div>
                <div className="text-sm">
                  {latestAttempt ? (
                    <>
                      Type: {latestAttempt.type} · Score: {latestAttempt.score ?? '—'}
                    </>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              {prefilled?.candidateId && (
                <a
                  className="text-xs underline ml-3"
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Candidate Selection / Prefilled card */}
        <div className="space-y-4">
          {showDropdown ? (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Select Candidate
                </label>
                <select
                  value={selectedCandidate}
                  onChange={(e) => setSelectedCandidate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-background border border-input text-foreground pr-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Select candidate"
                >
                  <option value="">Choose a candidate...</option>
                  {candidates.map((c) => (
                    <option key={c._id} value={c._id}>
                      {(c.name || c.email) ?? c._id} — {c.job_role || '—'}
                    </option>
                  ))}
                </select>
                {loadError && (
                  <p className="mt-2 text-xs text-muted-foreground">{loadError}</p>
                )}
              </div>

              {selectedCandidateData && (
                <div className="p-4 rounded-xl border border-border bg-muted/50">
                  <div className="flex items-center gap-3">
                    {selectedCandidateData.avatar ? (
                      <img
                        src={selectedCandidateData.avatar}
                        alt={selectedCandidateData.name || selectedCandidateData.email || 'Candidate'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-background/60 border border-border flex items-center justify-center">
                        <i className="ri-user-line text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">
                        {selectedCandidateData.name || selectedCandidateData.email}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedCandidateData.email || selectedCandidateData.resume?.email}
                      </p>
                      <p className="text-sm">{selectedCandidateData.job_role || '—'}</p>
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
                </div>
              )}
            </>
          ) : null}

          {/* Interview Date */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Interview Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 rounded-xl bg-background border border-input text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Time Selection + Notes */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Available Time Slots
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {timeSlots.map((time) => {
                const isActive = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    type="button"
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-foreground hover:bg-muted/70 border border-border'
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
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Interview Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any specific topics or requirements for the interview..."
              className="w-full p-3 rounded-xl bg-background border border-input text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Schedule Button */}
      <div className="mt-6 flex justify-between items-center">
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
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-busy={isScheduling}
          title={
            scheduleDisabled
              ? 'Please select candidate (if required), date and time'
              : undefined
          }
        >
          {isScheduling ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/70 border-t-transparent rounded-full animate-spin" />
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
            className="panel glass shadow-lux px-4 py-3 min-w-[260px]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Success</div>
                <div className="mt-0.5 text-[hsl(var(--muted-foreground))]">{toast}</div>
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
