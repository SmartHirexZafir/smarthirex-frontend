// smarthirex-frontend-main/app/meetings/components/InterviewScheduleForm.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGlobalLoading } from '@/components/system/GlobalLoadingProvider';
import { useToast } from '@/components/system/Toaster';

type Candidate = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  job_role?: string;
  predicted_role?: string;
  category?: string;
  years_of_experience?: number;
};

type Props = {
  candidate?: Candidate;
  onSuccess: (result: { meetingUrl: string }) => void;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:10000').replace(/\/+$/, '');

const getAuthToken = (): string | null =>
  (typeof window !== 'undefined' &&
    (localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('AUTH_TOKEN'))) ||
  null;

const authHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const coalesceRole = (c?: Candidate) => c?.job_role || c?.predicted_role || c?.category || '';

const commonTimezones = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Dubai',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function InterviewScheduleForm({ candidate, onSuccess }: Props) {
  const { trackPromise } = useGlobalLoading();
  const { success, error } = useToast();

  const userTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [yoe, setYoe] = useState<string>('');
  const [startAt, setStartAt] = useState<string>(''); // datetime-local value
  const [timezone, setTimezone] = useState<string>(userTz);
  const [duration, setDuration] = useState<number>(30);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState<string>('');

  // Prefill when candidate changes
  useEffect(() => {
    if (!candidate) return;
    setEmail(candidate.email || '');
    setRole(coalesceRole(candidate));
    if (candidate.years_of_experience !== undefined && candidate.years_of_experience !== null) {
      setYoe(String(candidate.years_of_experience));
    }
  }, [candidate]);

  const tzOptions = useMemo(() => {
    const set = new Set<string>([userTz, ...commonTimezones]);
    return Array.from(set);
  }, [userTz]);

  const validate = () => {
    if (!email.trim()) return 'Email is required.';
    if (!startAt.trim()) return 'Date & time is required.';
    if (!timezone.trim()) return 'Timezone is required.';
    if (!duration || Number(duration) <= 0) return 'Duration must be greater than 0.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      error(v);
      return;
    }

    const payload = {
      candidateId: candidate?._id || candidate?.id || '',
      email: email.trim(),
      role: role.trim(),
      yearsOfExperience: yoe ? Number(yoe) : undefined,
      startAt, // ISO-like from datetime-local (browser local) – backend should interpret with timezone below
      timezone,
      duration: Number(duration),
      notes: notes.trim() || undefined,
    };

    setSubmitting(true);
    setMeetingUrl('');

    try {
      const run = async () => {
        const res = await fetch(`${API_BASE}/candidate/interviews/schedule`, {
          method: 'POST',
          credentials: 'include',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            data?.detail ||
            data?.message ||
            `Failed to schedule interview (HTTP ${res.status})`;
          throw new Error(msg);
        }
        return data as { meetingUrl?: string };
      };

      const data = await trackPromise(run());
      const url = data?.meetingUrl || '';
      setMeetingUrl(url);
      success('Interview scheduled');
      onSuccess({ meetingUrl: url });
    } catch (err: any) {
      error(err?.message || 'Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      success('Copied to clipboard', undefined, 1500);
    } catch {
      error('Copy failed');
    }
  };

  return (
    <section className="card p-5 md:p-6">
      <h2 className="text-lg font-semibold mb-4">Interview Schedule</h2>

      {/* Success panel (after scheduling) */}
      {meetingUrl && (
        <div className="mb-4 rounded-xl border border-border p-4 bg-[hsl(var(--muted)/.35)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium">Meeting created</div>
              <div className="mt-1 text-sm text-muted-foreground break-all">
                {meetingUrl}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <a
                href={meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
              >
                Open calendar
              </a>
              <button type="button" className="btn btn-primary btn-sm" onClick={copyUrl}>
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={submitting}>
        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            className="input w-full"
            placeholder="candidate@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Candidate email"
            disabled={submitting}
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <input
            type="text"
            className="input w-full"
            placeholder="e.g., Data Scientist"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Role"
            disabled={submitting}
          />
        </div>

        {/* YOE */}
        <div>
          <label className="block text-sm font-medium mb-1">Years of Experience</label>
          <input
            type="number"
            min={0}
            step={0.5}
            className="input w-full"
            placeholder="e.g., 3"
            value={yoe}
            onChange={(e) => setYoe(e.target.value)}
            aria-label="Years of experience"
            disabled={submitting}
          />
        </div>

        {/* Date/Time + Timezone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date &amp; Time *</label>
            <input
              type="datetime-local"
              className="input w-full"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              aria-label="Interview date and time"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Timezone *</label>
            <select
              className="input w-full"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
              aria-label="Timezone"
              disabled={submitting}
            >
              {tzOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
          <input
            type="number"
            min={1}
            step={5}
            className="input w-full"
            placeholder="30"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            required
            aria-label="Duration in minutes"
            disabled={submitting}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            className="input w-full min-h-[90px] resize-y"
            placeholder="Optional notes for the interviewer or candidate…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="Notes"
            disabled={submitting}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary w-full md:w-auto"
            disabled={submitting}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(var(--primary-foreground)/.7)] border-b-transparent" />
                Scheduling…
              </span>
            ) : (
              <>
                <i className="ri-calendar-event-line mr-2" />
                Schedule Interview
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
