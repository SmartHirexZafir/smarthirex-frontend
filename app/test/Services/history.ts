// app/test/services/history.ts
// Thin client for test history endpoints: list-all, list-by-candidate, manual grading, PDF helpers.
// Updated to align with global requirements:
// - Robust exception handling with friendly messages
// - Safe JSON parsing and request timeouts
// - Consistent newest-first sorting
// - Helpers to open/download PDF reports (browser-friendly)
// - No hardcoded URLs beyond env-derived API base

import { API_BASE, clientAuthHeaders } from "@/lib/auth";

export type TestType = "smart" | "custom";

export type CandidateRef = {
  _id?: string;
  name?: string;
  email?: string;
  resume?: { email?: string };
};

export type Attempt = {
  _id: string;
  type: TestType;
  score?: number | null;
  status?: string;
  submitted_at?: string;
  created_at?: string;
  candidateId?: string;
  candidate_id?: string;
  candidate?: CandidateRef;
};

export type HistoryAllResponse = {
  attempts: Attempt[];
  needs_marking: Attempt[];
};

export type CandidateHistoryResponse = {
  candidateId: string;
  attempts: Array<{
    id: string;
    submittedAt?: string;
    score?: number | null;
    pdfUrl?: string;
  }>;
};

export type GradePayload = { score: number };

/* ========================
 * Config & helpers
 * ======================== */
const authHeaders = (): Record<string, string> => {
  // Use centralized auth header builder (cookie/localStorage aware)
  return { ...clientAuthHeaders(), Accept: "application/json" };
};

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(id) };
}

async function safeJson<T = any>(res: Response): Promise<T> {
  const txt = await res.text();
  if (!txt) return {} as T;
  try {
    return JSON.parse(txt) as T;
  } catch {
    // Return a generic object to avoid breaking callers expecting objects
    return { raw: txt } as unknown as T;
  }
}

function friendlyHttpMessage(status: number): string | null {
  switch (status) {
    case 400:
      return "Bad request.";
    case 401:
      return "Unauthorized. Please log in again.";
    case 403:
      return "Forbidden. Your account cannot access this resource.";
    case 404:
      return "Not found.";
    case 409:
      // Aligns with “only one test type” requirement
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

function assertOk(res: Response, body: any) {
  if (!res.ok) {
    const base =
      (body && (body.detail || body.error || body.message)) || undefined;
    const friendly = friendlyHttpMessage(res.status);
    const msg = base || friendly || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }
}

function ts(val?: string): number {
  if (!val) return 0;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function sortAttemptsDesc<T extends { submitted_at?: string; created_at?: string }>(
  arr: T[]
): T[] {
  return [...arr].sort(
    (a, b) =>
      ts(b.submitted_at || b.created_at) - ts(a.submitted_at || a.created_at)
  );
}

function sortCandidateSummariesDesc<T extends { submittedAt?: string }>(
  arr: T[]
): T[] {
  return [...arr].sort((a, b) => ts(b.submittedAt) - ts(a.submittedAt));
}

/* ========================
 * Public API
 * ======================== */

/** List ALL attempts across candidates plus those that need manual marking (custom). */
export async function listAllHistory(timeoutMs = 15000): Promise<HistoryAllResponse> {
  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/tests/history/all`, {
      method: "GET",
      headers: authHeaders(),
      signal,
    });
    const data = await safeJson<HistoryAllResponse>(res);
    assertOk(res, data);
    const attempts = Array.isArray(data?.attempts) ? sortAttemptsDesc(data.attempts) : [];
    const needs_marking = Array.isArray(data?.needs_marking)
      ? sortAttemptsDesc(data.needs_marking)
      : [];
    return { attempts, needs_marking };
  } finally {
    cancel();
  }
}

/** List attempts for a specific candidate (newest first). */
export async function listHistoryForCandidate(
  candidateId: string,
  timeoutMs = 15000
): Promise<CandidateHistoryResponse> {
  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/tests/history/${candidateId}`, {
      method: "GET",
      headers: authHeaders(),
      signal,
    });
    const data = await safeJson<CandidateHistoryResponse>(res);
    assertOk(res, data);
    const attempts = Array.isArray(data?.attempts)
      ? sortCandidateSummariesDesc(data.attempts)
      : [];
    return {
      candidateId: data?.candidateId || candidateId,
      attempts,
    };
  } finally {
    cancel();
  }
}

/** Manually grade a custom attempt. Backend should update the candidate's test score. */
export async function gradeAttempt(
  attemptId: string,
  score: number,
  timeoutMs = 15000
): Promise<{ ok: true }> {
  if (Number.isNaN(score) || score < 0 || score > 100) {
    throw new Error("Score must be between 0 and 100.");
  }
  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/tests/grade/${attemptId}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ score } as GradePayload),
      signal,
    });
    const data = await safeJson(res);
    assertOk(res, data);
    return { ok: true };
  } finally {
    cancel();
  }
}

/** Build the backend PDF URL (browser-friendly). */
export function attemptPdfUrl(candidateId: string, attemptId: string): string {
  return `${API_BASE}/tests/history/${candidateId}/${attemptId}/report.pdf`;
}

/** Open the PDF in a new tab (non-blocking). Throws if popup is blocked. */
export function openAttemptPdfInNewTab(candidateId: string, attemptId: string): void {
  const url = attemptPdfUrl(candidateId, attemptId);
  const w = typeof window !== "undefined" ? window.open(url, "_blank", "noopener,noreferrer") : null;
  if (!w) {
    throw new Error("Unable to open the PDF (popup blocked). Please allow popups for this site.");
  }
}

/** Fetch and trigger download of the PDF report for an attempt. */
export async function downloadAttemptPdf(
  candidateId: string,
  attemptId: string,
  filename?: string
): Promise<void> {
  const url = attemptPdfUrl(candidateId, attemptId);
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const data = await safeJson(res).catch(() => ({}));
    assertOk(res, data);
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename || `assessment_${candidateId}_${attemptId}.pdf`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}
