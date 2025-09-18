// app/meetings/components/InterviewScheduleForm.tsx
'use client';

import React from 'react';

type Props = {
  // controlled fields
  email: string;
  setEmail: (v: string) => void;

  role: string;
  setRole: (v: string) => void;

  yoe: string;
  setYoe: (v: string) => void;

  dateTime: string;
  setDateTime: (v: string) => void;

  timezone: string;
  setTimezone: (v: string) => void;

  duration: number;
  setDuration: (v: number) => void;

  notes: string;
  setNotes: (v: string) => void;

  // submit
  submitting: boolean;
  onSubmit: (e?: React.FormEvent) => void;

  // timezone options (provided by parent)
  timezoneOptions: string[];
};

export default function InterviewScheduleForm({
  email,
  setEmail,
  role,
  setRole,
  yoe,
  setYoe,
  dateTime,
  setDateTime,
  timezone,
  setTimezone,
  duration,
  setDuration,
  notes,
  setNotes,
  submitting,
  onSubmit,
  timezoneOptions,
}: Props) {
  return (
    <form id="scheduleForm" onSubmit={onSubmit} className="space-y-4" aria-busy={submitting}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email <span className="text-[hsl(var(--destructive))]">*</span>
          </label>
          <input
            id="email"
            type="email"
            className="input w-full"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="candidate@company.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="role">
            Role
          </label>
          <input
            id="role"
            type="text"
            className="input w-full"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="e.g., Frontend Engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="yoe">
            Years of Experience
          </label>
          <input
            id="yoe"
            type="number"
            className="input w-full"
            value={yoe}
            onChange={e => setYoe(e.target.value)}
            min={0}
            step="0.1"
            placeholder="e.g., 3"
          />
        </div>

        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="dt">
              Date &amp; Time <span className="text-[hsl(var(--destructive))]">*</span>
            </label>
            <input
              id="dt"
              type="datetime-local"
              className="input w-full"
              value={dateTime}
              onChange={e => setDateTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="tz">
              Timezone <span className="text-[hsl(var(--destructive))]">*</span>
            </label>
            <select
              id="tz"
              className="input w-full"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              required
            >
              {timezoneOptions.map(tz => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="duration">
            Duration (minutes) <span className="text-[hsl(var(--destructive))]">*</span>
          </label>
          <input
            id="duration"
            type="number"
            className="input w-full"
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            min={1}
            step={5}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1" htmlFor="notes">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            className="input w-full min-h-[90px]"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything the interviewer should know…"
          />
        </div>
      </div>
      {/* Submit button rendered by parent (bottom single button per requirements). */}
    </form>
  );
}

// Keep a named export to ensure TS treats this file as a module
export type InterviewScheduleFormProps = Props;
