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
  // Experience fields - check all possible aliases
  years_of_experience?: number;
  years_experience?: number | string;
  experience_years?: number | string;
  experience?: number | string;
  total_experience_years?: number | string;
  yoe?: number | string;
  experience_display?: string;
  experience_rounded?: number | string;
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

  // Load candidates with tests - only run once on mount, not on preselectId change
  useEffect(() => {
    let mounted = true;
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
        
        if (!mounted) return;
        
        // Deduplicate candidates by ID to prevent duplicate keys
        const uniqueCandidates = new Map<string, Candidate>();
        list.forEach(c => {
          const id = String(c._id || c.id || '');
          if (id && !uniqueCandidates.has(id)) {
            uniqueCandidates.set(id, c);
          }
        });
        const deduplicatedList = Array.from(uniqueCandidates.values());
        setCandidates(deduplicatedList);

        // Preselect if query param present - try to find candidate in list
        if (preselectId && mounted) {
          const found = deduplicatedList.find(c => String(c._id || c.id) === preselectId);
          if (found) {
            setSelectedId(String(found._id || found.id));
          } else {
            // If candidate not in list, try to fetch directly (might be newly added)
            try {
              const candRes = await fetch(`${API_BASE}/candidate/${preselectId}`, {
                headers: {
                  Accept: 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              });
              if (candRes.ok && mounted) {
                const candData = await candRes.json().catch(() => null);
                if (candData && (candData.test_score != null || candData.testScore != null)) {
                  // Candidate has test score, add to list and select
                  // Extract experience from all possible field aliases
                  const extractExperience = (data: any): number | undefined => {
                    const fields = [
                      data.years_experience,
                      data.experience_years,
                      data.experience_rounded,
                      data.total_experience_years,
                      data.years_of_experience,
                      data.yoe,
                      data.experience,
                    ];
                    for (const field of fields) {
                      if (typeof field === 'number') return field;
                      if (typeof field === 'string' && field.trim() !== '') {
                        const match = field.match(/(\d+(?:\.\d+)?)/);
                        if (match) return parseFloat(match[1]);
                      }
                    }
                    return undefined;
                  };

                  const newCandidate: Candidate = {
                    _id: candData._id || preselectId,
                    id: candData._id || preselectId,
                    name: candData.name,
                    email: candData.email || candData.resume?.email,
                    resume: candData.resume,
                    job_role: candData.job_role || candData.predicted_role || candData.category,
                    predicted_role: candData.predicted_role,
                    category: candData.category,
                    years_of_experience: extractExperience(candData),
                    years_experience: candData.years_experience,
                    experience_years: candData.experience_years,
                    experience_rounded: candData.experience_rounded,
                    total_experience_years: candData.total_experience_years,
                    yoe: candData.yoe,
                    experience: candData.experience,
                    experience_display: candData.experience_display,
                  };
                  
                  if (mounted) {
                    setCandidates(prev => {
                      // Check if candidate already exists to prevent duplicates
                      const exists = prev.some(c => String(c._id || c.id) === String(newCandidate._id || newCandidate.id));
                      return exists ? prev : [...prev, newCandidate];
                    });
                    setSelectedId(String(newCandidate._id || newCandidate.id));
                  }
                }
              }
            } catch {
              // Silently fail - candidate might not have test yet
            }
          }
        }
      } catch (e) {
        if (mounted) {
          error('Failed to load candidates');
          setCandidates([]);
        }
      } finally {
        if (mounted) {
          setLoadingList(false);
        }
      }
    };
    trackPromise(load());
    
    return () => {
      mounted = false;
    };
    // Only run once on mount - preselectId is handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle preselectId changes separately (only when it changes, not on every render)
  useEffect(() => {
    if (!preselectId || !candidates.length) return;
    
    const found = candidates.find(c => String(c._id || c.id) === preselectId);
    if (found) {
      setSelectedId(String(found._id || found.id));
    }
  }, [preselectId, candidates]);

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
    // Extract experience from all possible field aliases
    if (!yoe) {
      const experienceFields = [
        selectedCandidate.years_of_experience,
        selectedCandidate.years_experience,
        selectedCandidate.experience_years,
        selectedCandidate.experience_rounded,
        selectedCandidate.total_experience_years,
        selectedCandidate.yoe,
        selectedCandidate.experience,
      ];

      for (const field of experienceFields) {
        if (field !== null && field !== undefined) {
          if (typeof field === 'number') {
            setYoe(String(field));
            break;
          }
          if (typeof field === 'string' && field.trim() !== '') {
            // Try to extract number from string like "2 years" or "3.5"
            const match = field.match(/(\d+(?:\.\d+)?)/);
            if (match) {
              setYoe(match[1]);
              break;
            }
            setYoe(field);
            break;
          }
        }
      }

      // If experience_display is a string like "2 years", try to extract number
      if (!yoe && selectedCandidate.experience_display && typeof selectedCandidate.experience_display === 'string') {
        const match = selectedCandidate.experience_display.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          setYoe(match[1]);
        }
      }
    }
  }, [selectedCandidate, yoe]); // eslint-disable-line react-hooks/exhaustive-deps

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
                filtered.map((c, index) => {
                  const id = String(c._id || c.id || '');
                  // Ensure unique key - use index as fallback if ID is missing or duplicate
                  const uniqueKey = id || `candidate-${index}`;
                  const active = id === selectedId;
                  return (
                    <button
                      key={`${uniqueKey}-${index}`}
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
