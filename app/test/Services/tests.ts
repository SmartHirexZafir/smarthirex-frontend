// app/test/services/tests.ts
// Centralized client for Test-related API calls (invites, start/submit, history, grading, PDFs)
// Safe to import from client components. Uses fetch with small conveniences (auth header, timeouts).

/* ========================
 * Types
 * ======================== */
export type TestType = "smart" | "custom";

export type CandidateRef = {
  _id?: string;
  name?: string;
  email?: string;
  resume?: { email?: string };
};

export type InvitePayload = {
  candidate_id: string;                  // required
  subject?: string;
  body_html?: string;                    // backend replaces {TEST_LINK}
  question_count?: number;               // 1..50 (default 4)
  // Soft extensions (backend may ignore if unsupported):
  test_type?: TestType;                  // "smart" | "custom"
  custom?: {
    title?: string;
    questions?: Array<{
      question: string;
      type: "mcq" | "text";
      options?: string[];
      correct_answer?: string | null;
    }>;
  };
};

export type InviteResponse = {
  invite_id: string;
  token: string;
  test_link: string;
  email: string;
  sent: boolean;
  expires_at: string; // ISO
};

export type Question =
  | {
      type: "mcq";
      question: string;
      options: string[];
      correct_answer?: string;
      id?: string | number;
    }
  | {
      type: "code";
      question: string;
      language?: string;
      starter?: string;
      tests?: Array<{
        name?: string;
        input?: string;
        args?: unknown[];
        expected_stdout?: string;
        match?: "exact" | "contains" | "regex";
      }>;
      id?: string | number;
    }
  | {
      type: "scenario" | "freeform" | "free-form";
      question: string;
      id?: string | number;
    };

export type StartRequest = { token: string };
export type StartResponse = {
  test_id: string;
  candidate_id: string;
  questions: Question[];
};

export type Answer = {
  answer: string;
  type?: "mcq" | "code" | "scenario";
  language?: string;
  question_id?: string | number;
};

export type SubmitRequest = { token: string; answers: Answer[] };
export type SubmitResponse = {
  test_id: string;
  candidate_id: string;
  score: number; // MCQ percent (backend-compatible)
  details: Array<{
    question?: string;
    is_correct?: boolean;
    explanation?: string;
    type?: string;
    question_id?: string | number;
    // Optional grading enrichments:
    auto_points?: number;
    auto_max?: number;
    tests?: Array<{ ok?: boolean; name?: string }>;
    score?: number;
    max_score?: number;
  }>;
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

async function safeJson<T = any>(res: Response): Promise<T> {
  const txt = await res.text();
  try {
    return JSON.parse(txt) as T;
  } catch {
  
    return (txt ?? null) as T;
  }
}

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return {
    signal: ctrl.signal,
    cancel: () => clearTimeout(id),
  };
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

/** Create + send a test invite (smart or custom). */
export async function inviteTest(payload: InvitePayload, timeoutMs = 20000): Promise<InviteResponse> {
  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/tests/invite`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
      signal,
    });
    const data = await safeJson<InviteResponse>(res);
    assertOk(res, data);
    return data;
  } finally {
    cancel();
  }
}

/** Start a test by token – validates and returns generated questions. */
export async function startTest(token: string, timeoutMs = 20000): Promise<StartResponse> {
  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/tests/start`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ token } as StartRequest),
      signal,
    });
    const data = await safeJson<StartResponse>(res);
    assertOk(res, data);
    return data;
  } finally {
    cancel();
  }
}

/** Submit answers – returns score + details; backend also updates candidate.test_score */
export async function submitTest(token: string, answers: Answer[], timeoutMs = 30000): Promise<SubmitResponse> {
  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/tests/submit`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ token, answers } as SubmitRequest),
      signal,
    });
    const data = await safeJson<SubmitResponse>(res);
    assertOk(res, data);
    return data;
  } finally {
    cancel();
  }
}

/** List ALL attempts across candidates plus the subset that still need manual marking (custom). */
export async function listAllAttempts(timeoutMs = 15000): Promise<HistoryAllResponse> {
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
      attempts: Array.isArray(data.attempts) ? data.attempts : [],
      needs_marking: Array.isArray(data.needs_marking) ? data.needs_marking : [],
    };
  } finally {
    cancel();
  }
}

/** List attempts for a specific candidate (newest first). */
export async function listAttemptsForCandidate(candidateId: string, timeoutMs = 15000): Promise<CandidateHistoryResponse> {
  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/tests/history/${candidateId}`, {
      method: "GET",
      headers: authHeaders(),
      signal,
    });
    const data = await safeJson<CandidateHistoryResponse>(res);
    assertOk(res, data);
    // Normalize shape defensively
    return {
      candidateId: data.candidateId || candidateId,
      attempts: Array.isArray(data.attempts) ? data.attempts : [],
    };
  } finally {
    cancel();
  }
}

/** Save a manual grade for a custom attempt; backend should update candidate test_score. */
export async function gradeCustomAttempt(attemptId: string, score: number, timeoutMs = 15000): Promise<{ ok: true }> {
  if (Number.isNaN(score) || score < 0 || score > 100) {
    throw new Error("Score must be between 0 and 100.");
  }
  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/tests/grade/${attemptId}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ score }),
      signal,
    });
    const data = await safeJson(res);
    assertOk(res, data);
    return { ok: true };
  } finally {
    cancel();
  }
}

/** Convenience: Build the PDF report URL for an attempt (browser will fetch directly). */
export function attemptPdfUrl(candidateId: string, attemptId: string): string {
  return `${API_BASE}/tests/history/${candidateId}/${attemptId}/report.pdf`;
}

/** Optional helper to download a PDF and trigger a browser download. */
export async function downloadAttemptPdf(candidateId: string, attemptId: string, filename?: string): Promise<void> {
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

/* ========================
 * Optional Proctor helpers
 * (These gracefully no-op if backend endpoints are absent.)
 * ======================== */

type HeartbeatPayload = {
  testId: string | null;
  candidateId: string | null;
  token: string;
};

type SnapshotPayload = HeartbeatPayload & {
  imageBase64: string; // dataURL or base64
};

async function tryPost(path: string, body: any): Promise<void> {
  try {
    await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  } catch {
    // swallow – proctoring is best-effort
  }
}

/** Send a periodic heartbeat (best-effort; ignores errors). */
export async function proctorHeartbeat(payload: HeartbeatPayload): Promise<void> {
  await tryPost("/proctor/heartbeat", payload);
}

/** Upload a snapshot image (best-effort; ignores errors). */
export async function proctorSnapshot(payload: SnapshotPayload): Promise<void> {
  await tryPost("/proctor/snapshot", payload);
}
