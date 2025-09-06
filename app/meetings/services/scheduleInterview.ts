// app/meetings/services/scheduleInterview.ts
// Thin, typed client for the Schedule Interview API
// Usage:
//   import { scheduleInterview } from "@/app/meetings/services/scheduleInterview";
//   await scheduleInterview(payload);

import { API_BASE, clientAuthHeaders } from "@/lib/auth";

export type ScheduleInterviewRequest = {
  candidateId: string;
  email: string;            // candidate email
  startsAt: string;         // ISO-8601 (UTC), e.g. "2025-08-10T09:30:00Z"
  timezone: string;         // IANA tz, e.g. "Asia/Karachi"
  durationMins: number;     // 30, 45, 60, ...
  title: string;            // email/meeting subject
  notes?: string;           // optional message to candidate
  // Soft extension (optionally used by unified endpoint if present)
  candidate_name?: string;
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

/** Use centralized API base from lib/auth.ts */
const getApiBase = (): string => API_BASE;

/** Use centralized client auth headers (cookie/localStorage aware) */
const authHeaders = (): Record<string, string> => ({
  ...clientAuthHeaders(),
  Accept: "application/json",
});

function withTimeout(ms: number, extSignal?: AbortSignal) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  if (extSignal) {
    if (extSignal.aborted) ctrl.abort();
    else extSignal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }
  return {
    signal: ctrl.signal,
    cancel: () => clearTimeout(id),
  };
}

async function safeJson<T = any>(res: Response): Promise<T> {
  const txt = await res.text();
  try {
    return txt ? (JSON.parse(txt) as T) : ({} as T);
  } catch {
    return ({ raw: txt } as unknown) as T;
  }
}

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

function normalizeMeetingUrl(resp: any): ScheduleInterviewResponse {
  if (resp && typeof resp === "object" && resp.meeting_url && !resp.meetingUrl) {
    return { ...resp, meetingUrl: resp.meeting_url };
  }
  return resp || {};
}

/**
 * Call backend to schedule an interview and email the invite to the candidate.
 * Primary:  POST /interviews/schedule              (unified endpoint)
 * Fallback: POST /candidate/{id}/schedule          (legacy per-candidate endpoint)
 */
export async function scheduleInterview(
  payload: ScheduleInterviewRequest,
  init?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<ScheduleInterviewResponse> {
  // Quick client-side validation
  if (!payload?.candidateId) throw new ScheduleInterviewError("candidateId is required");
  if (!payload?.email) throw new ScheduleInterviewError("email is required");
  if (!payload?.startsAt) throw new ScheduleInterviewError("startsAt (ISO) is required");
  if (!payload?.timezone) throw new ScheduleInterviewError("timezone is required");
  if (!Number.isFinite(payload?.durationMins)) throw new ScheduleInterviewError("durationMins is required");

  const base = getApiBase();
  const timeoutMs = init?.timeoutMs ?? 20000;
  const { signal, cancel } = withTimeout(timeoutMs, init?.signal);

  try {
    // ---------- Attempt 1: unified endpoint ----------
    // Many backends expect slightly different keys for the unified schedule route.
    const unifiedBody = {
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

    const unifiedRes = await fetch(`${base}/interviews/schedule`, {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify(unifiedBody),
      signal,
    });

    const unifiedData: any = await safeJson(unifiedRes);

    if (unifiedRes.ok) {
      return normalizeMeetingUrl(unifiedData);
    }

    // If unified endpoint failed with a client error other than "not found" or a well-known condition,
    // surface a friendly message without trying fallback (prevents double actions on the server).
    const unifiedMsg =
      unifiedData?.detail ||
      unifiedData?.message ||
      friendlyHttpMessage(unifiedRes.status) ||
      `Request failed with status ${unifiedRes.status}`;

    // Permit fallback on 404 or 5xx; otherwise throw now.
    if (!(unifiedRes.status === 404 || (unifiedRes.status >= 500 && unifiedRes.status <= 599))) {
      throw new ScheduleInterviewError(String(unifiedMsg), unifiedRes.status);
    }

    // ---------- Attempt 2: legacy per-candidate endpoint ----------
    const legacyRes = await fetch(`${base}/candidate/${encodeURIComponent(payload.candidateId)}/schedule`, {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
      signal,
    });

    const legacyData: any = await safeJson(legacyRes);

    if (!legacyRes.ok) {
      const legacyMsg =
        legacyData?.detail ||
        legacyData?.message ||
        friendlyHttpMessage(legacyRes.status) ||
        `Request failed with status ${legacyRes.status}`;
      throw new ScheduleInterviewError(String(legacyMsg), legacyRes.status);
    }

    return normalizeMeetingUrl(legacyData);
  } finally {
    cancel();
  }
}

// Optional helper for UI to show a success toast
export const summarizeScheduleSuccess = (resp: ScheduleInterviewResponse) => {
  if (resp?.meetingUrl) return "Interview scheduled. Meeting link created.";
  return "Interview scheduled. Invite email sent to the candidate.";
};
