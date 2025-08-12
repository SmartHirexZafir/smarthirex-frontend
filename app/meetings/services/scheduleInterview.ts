// app/meetings/services/scheduleInterview.ts
// Thin, typed client for the Schedule Interview API
// Usage:
//   import { scheduleInterview } from "@/app/meetings/services/scheduleInterview";
//   await scheduleInterview(payload);

export type ScheduleInterviewRequest = {
  candidateId: string;
  email: string;            // candidate email
  startsAt: string;         // ISO-8601 (UTC), e.g. "2025-08-10T09:30:00Z"
  timezone: string;         // IANA tz, e.g. "Asia/Karachi"
  durationMins: number;     // 30, 45, 60, ...
  title: string;            // email/meeting subject
  notes?: string;           // optional message to candidate
};

export type ScheduleInterviewResponse = {
  meetingUrl?: string;
  meetingId?: string;
  status?: string;          // e.g. "scheduled"
  [key: string]: unknown;
};

export class ScheduleInterviewError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ScheduleInterviewError";
    this.status = status;
  }
}

/** Resolve API base URL from env with a clear error if missing. */
const getApiBase = (): string => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
  if (!base) {
    // In dev we prefer explicit base to avoid hitting Next.js app routes by mistake
    console.warn("NEXT_PUBLIC_API_BASE_URL is not set; using relative path.");
  }
  return base;
};

/**
 * Call backend to schedule an interview and email the invite to the candidate.
 * Backend is expected to expose POST /interviews/schedule.
 */
export async function scheduleInterview(
  payload: ScheduleInterviewRequest,
  init?: { signal?: AbortSignal }
): Promise<ScheduleInterviewResponse> {
  // Quick client-side validation
  if (!payload?.candidateId) throw new ScheduleInterviewError("candidateId is required");
  if (!payload?.email) throw new ScheduleInterviewError("email is required");
  if (!payload?.startsAt) throw new ScheduleInterviewError("startsAt (ISO) is required");
  if (!payload?.timezone) throw new ScheduleInterviewError("timezone is required");
  if (!Number.isFinite(payload?.durationMins)) throw new ScheduleInterviewError("durationMins is required");

  const base = getApiBase();
  const url = `${base}/interviews/schedule`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
    signal: init?.signal,
  });

  const text = await res.text();
  let data: unknown = undefined;
  try { data = text ? JSON.parse(text) : {}; } catch { /* keep text */ }

  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "message" in (data as any)
        ? String((data as any).message)
        : text || `Request failed with status ${res.status}`;
    throw new ScheduleInterviewError(msg, res.status);
  }

  return (data || {}) as ScheduleInterviewResponse;
}

// Optional helper for UI to show a success toast
export const summarizeScheduleSuccess = (resp: ScheduleInterviewResponse) => {
  if (resp?.meetingUrl) return "Interview scheduled. Meeting link created.";
  return "Interview scheduled. Invite email sent to the candidate.";
};
