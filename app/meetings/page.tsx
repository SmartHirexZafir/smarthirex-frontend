// app/meetings/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGlobalLoading } from '@/components/system/GlobalLoadingProvider';
import { useToast } from '@/components/system/Toaster';
import InterviewScheduleForm from './components/InterviewScheduleForm';

type Candidate = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  resume?: { email?: string };
  avatar?: string;
  job_role?: string;
  predicted_role?: string;
  category?: string;
  years_of_experience?: number;
};

type ScheduleBody = {
  candidateId: string;
  email: string;
  role?: string;
  yearsOfExperience?: number | null;
  startAt: string;        // ISO string
  timezone: string;
  duration: number;       // minutes
  notes?: string;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/+$/, '');

const getAuthToken = (): string | null =>
  (typeof window !== 'undefined' &&
    (localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('AUTH_TOKEN'))) ||
  null;

export default function MeetingsPage() {
  const searchParams = useSearchParams();
  const preselectId = searchParams.get('candidateId') || '';

  const { trackPromise } = useGlobalLoading();
  const { success, error } = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const selectedCandidate = useMemo(
    () => candidates.find(c => String(c._id || c.id) === selectedId),
    [candidates, selectedId]
  );

  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(c =>
      [c.name, c.email, c.job_role, c.predicted_role, c.category]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    );
  }, [candidates, search]);

  // Form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [yoe, setYoe] = useState<string>('');
  const [dateTime, setDateTime] = useState<string>(''); // local datetime-local value
  const [timezone, setTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });
  const [duration, setDuration] = useState<number>(30);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null);

  // Load candidates with tests
  useEffect(() => {
    const load = async () => {
      setLoadingList(true);
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/candidate/candidates/with-tests`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Candidate[] | { candidates?: Candidate[] };
        const list = Array.isArray(data) ? data : Array.isArray(data?.candidates) ? data.candidates : [];
        setCandidates(list);

        // Preselect if query param present
        if (preselectId) {
          const found = list.find(c => String(c._id || c.id) === preselectId);
          if (found) setSelectedId(String(found._id || found.id));
        }
      } catch (e) {
        error('Failed to load candidates');
        setCandidates([]);
      } finally {
        setLoadingList(false);
      }
    };
    trackPromise(load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill form when selection changes
  useEffect(() => {
    if (!selectedCandidate) return;
    const mail = selectedCandidate.email || selectedCandidate.resume?.email || '';
    setEmail(mail || '');
    if (!role) {
      const suggested =
        selectedCandidate.job_role || selectedCandidate.predicted_role || selectedCandidate.category || '';
      if (suggested) setRole(suggested);
    }
    if (!yoe && typeof selectedCandidate.years_of_experience === 'number') {
      setYoe(String(selectedCandidate.years_of_experience));
    }
  }, [selectedCandidate]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = (): string | null => {
    if (!selectedId) return 'Please select a candidate.';
    if (!email.trim()) return 'Email is required.';
    if (!dateTime) return 'Date & time is required.';
    if (!timezone) return 'Timezone is required.';
    if (!duration || duration <= 0) return 'Duration must be greater than 0.';
    return null;
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = validate();
    if (v) {
      error(v);
      return;
    }

    const isoStart = new Date(dateTime).toISOString();
    const body: ScheduleBody = {
      candidateId: selectedId,
      email: email.trim(),
      role: role.trim() || undefined,
      yearsOfExperience: yoe.trim() ? Number(yoe) : null,
      startAt: isoStart,
      timezone,
      duration: Number(duration),
      notes: notes.trim() || undefined,
    };

    setSubmitting(true);
    setMeetingUrl(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/interviews/schedule`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || data?.detail || `Failed to schedule (HTTP ${res.status})`;
        throw new Error(msg);
      }
      const url = data?.meetingUrl || data?.meeting_url || data?.url || null;
      setMeetingUrl(url);
      success('Interview scheduled');
    } catch (e: any) {
      error(e?.message || 'Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  };

  const copyUrl = async () => {
    if (!meetingUrl) return;
    try {
      await navigator.clipboard.writeText(meetingUrl);
      success('Link copied');
    } catch {
      error('Could not copy link');
    }
  };

  // Timezone options (minimal, common set + detected)
  const commonTimezones = useMemo(() => {
    const detected = timezone;
    const base = [
      'UTC',
      'America/Los_Angeles',
      'America/Denver',
      'America/Chicago',
      'America/New_York',
      'Europe/London',
      'Europe/Berlin',
      'Europe/Paris',
      'Europe/Madrid',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Singapore',
      'Asia/Tokyo',
      'Australia/Sydney',
    ];
    return [detected, ...base.filter(tz => tz !== detected)];
  }, [timezone]);

  // Header row values (email / role / experience)
  const headerEmail = selectedCandidate?.email || selectedCandidate?.resume?.email || '—';
  const headerRole =
    selectedCandidate?.job_role || selectedCandidate?.predicted_role || selectedCandidate?.category || '—';
  const headerYoe =
    typeof selectedCandidate?.years_of_experience === 'number'
      ? `${selectedCandidate.years_of_experience}`
      : '—';

  return (
    <main>
      <div className="container mx-auto p-4 md:p-6">
        {/* ===== Header row (like Test page: email / role / experience) ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl border border-border bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Email</div>
            <div className="font-medium truncate">{headerEmail}</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Job Role</div>
            <div className="font-medium truncate">{headerRole}</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Experience (years)</div>
            <div className="font-medium truncate">{headerYoe}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
          {/* Left: Tested candidates list (unchanged) */}
          <section className="card p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Tested Candidates</h2>
            </div>

            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="input w-full mb-3"
              aria-label="Search candidates"
            />

            <div
              className="divide-y divide-border rounded-2xl border border-border overflow-hidden max-h-[70vh] overflow-y-auto"
              aria-busy={loadingList}
            >
              {loadingList ? (
                <div className="p-4 text-sm text-muted-foreground">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No candidates found.</div>
              ) : (
                filtered.map((c) => {
                  const id = String(c._id || c.id);
                  const active = id === selectedId;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedId(id)}
                      className={[
                        'w-full text-left p-4 flex items-center gap-3 transition',
                        active
                          ? 'bg-[hsl(var(--primary)/.06)] ring-1 ring-[hsl(var(--primary)/.25)]'
                          : 'hover:bg-muted/50',
                      ].join(' ')}
                      aria-pressed={active}
                    >
                      <img
                        src={
                          c.avatar ||
                          `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(c.name || 'C')}`
                        }
                        alt={c.name || 'Candidate'}
                        className="h-10 w-10 rounded-full border border-border object-cover"
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.name || 'Unnamed'}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {c.email || c.resume?.email || 'No email'}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Right: Middle section = full schedule form (moved into component) */}
          <section className="card p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Schedule Interview</h2>
              <p className="text-xs text-muted-foreground">
                Fill the details and send an interview invite.
              </p>
            </div>

            <InterviewScheduleForm
              email={email}
              setEmail={setEmail}
              role={role}
              setRole={setRole}
              yoe={yoe}
              setYoe={setYoe}
              dateTime={dateTime}
              setDateTime={setDateTime}
              timezone={timezone}
              setTimezone={setTimezone}
              duration={duration}
              setDuration={setDuration}
              notes={notes}
              setNotes={setNotes}
              submitting={submitting}
              onSubmit={e => trackPromise(onSubmit(e))}
              timezoneOptions={commonTimezones}
            />

            {/* Bottom: single Send button (submit) */}
            <div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="submit"
                form="scheduleForm"
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(var(--primary-foreground))/0.7] border-b-transparent" />
                    Scheduling…
                  </span>
                ) : (
                  <>
                    <i className="ri-calendar-check-line mr-1" />
                    Schedule Interview
                  </>
                )}
              </button>
            </div>

            {meetingUrl && (
              <div className="mt-5 rounded-2xl border border-border p-4 bg-[hsl(var(--muted)/.35)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">Meeting link</div>
                    <div className="text-sm text-muted-foreground truncate">{meetingUrl}</div>
                  </div>
                  <button type="button" onClick={copyUrl} className="btn btn-outline">
                    <i className="ri-file-copy-line mr-1" />
                    Copy
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
