// app/test/services/history.ts
// Thin client for test history endpoints: list-all, list-by-candidate, manual grading, PDF helpers.

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
export const API_BASE = (
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

const authHeaders = (): Record<string, string> => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const t = getAuthToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(id) };
}

async function safeJson<T = any>(res: Response): Promise<T> {
  const txt = await res.text();
  try {
    return JSON.parse(txt) as T;
  } catch {
  
    return (txt ?? null) as T;
  }
}

function assertOk(res: Response, body: any) {
  if (!res.ok) {
    const msg =
      (body && (body.detail || body.error || body.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }
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
    return {
      attempts: Array.isArray(data?.attempts) ? data.attempts : [],
      needs_marking: Array.isArray(data?.needs_marking) ? data.needs_marking : [],
    };
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
    return {
      candidateId: data?.candidateId || candidateId,
      attempts: Array.isArray(data?.attempts) ? data.attempts : [],
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

/** Fetch and trigger download of the PDF report for an attempt. */
export async function downloadAttemptPdf(
  candidateId: string,
  attemptId: string,
  filename?: string
): Promise<void> {
  const url = attemptPdfUrl(candidateId, attemptId);
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename || `assessment_${candidateId}_${attemptId}.pdf`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}
