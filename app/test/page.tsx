'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

/** ========================
 *  Types
 *  ======================== */
type TestType = 'smart' | 'custom';

type CandidateDoc = {
  _id: string;
  name?: string;
  email?: string;
  resume?: { email?: string };
  job_role?: string;
  // Experience fields - check all possible aliases
  years_experience?: number | string;
  experience_years?: number | string;
  experience?: number | string;
  total_experience_years?: number | string;
  years_of_experience?: number | string;
  yoe?: number | string;
  experience_display?: string;
  experience_rounded?: number | string;
  score?: number;       // match score
  test_score?: number;  // latest test score
};

type Attempt = {
  _id: string;
  candidate_id?: string;
  candidateId?: string;
  candidate?: { _id?: string; name?: string; email?: string; resume?: { email?: string } };
  score?: number | null;
  type: 'smart' | 'custom';
  status?: string;
  submitted_at?: string;
  created_at?: string;
};

type GradePayload = { score: number };

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

/** ========================
 *  Page Component
 *  ======================== */
export default function TestAssignment() {
  const qp = useSearchParams();
  const candidateId = qp.get('candidateId') || '';

  // Candidate context (auto-fetched)
  const [candidate, setCandidate] = useState<CandidateDoc | null>(null);
  const [loadingCandidate, setLoadingCandidate] = useState(false);

  // Assignment state
  const [testType, setTestType] = useState<TestType>('smart');
  const [questionCount, setQuestionCount] = useState<number>(4);

  // Custom authoring
  type CustomQ = { question: string; type: 'mcq' | 'text'; options?: string[]; correct_answer?: string | null };
  const [customTitle, setCustomTitle] = useState('');
  const [customQuestions, setCustomQuestions] = useState<CustomQ[]>([]);

  // Preview / history
  const [allAttempts, setAllAttempts] = useState<Attempt[]>([]);
  const [needsMarking, setNeedsMarking] = useState<Attempt[]>([]);

  // UI feedback
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const email = useMemo(
    () => candidate?.email || candidate?.resume?.email || '',
    [candidate]
  );
  const role = useMemo(
    () => candidate?.job_role || '—',
    [candidate]
  );
  // Extract experience from all possible field aliases
  const experience = useMemo(() => {
    if (!candidate) return '—';
    
    // Try all possible experience field names in order of preference
    const experienceFields = [
      candidate.years_experience,
      candidate.experience_years,
      candidate.experience_rounded,
      candidate.total_experience_years,
      candidate.years_of_experience,
      candidate.yoe,
      candidate.experience,
    ];

    for (const field of experienceFields) {
      if (field !== null && field !== undefined) {
        if (typeof field === 'number') {
          return field.toString();
        }
        if (typeof field === 'string' && field.trim() !== '') {
          // Try to extract number from string like "2 years" or "3.5"
          const match = field.match(/(\d+(?:\.\d+)?)/);
          if (match) {
            return match[1];
          }
          return field;
        }
      }
    }

    // If experience_display is a string like "2 years", try to extract number
    if (candidate.experience_display && typeof candidate.experience_display === 'string') {
      const match = candidate.experience_display.match(/(\d+(?:\.\d+)?)/);
      if (match) {
        return match[1];
      }
    }

    return '—';
  }, [candidate]);

  /** -------- load candidate -------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!candidateId) return;
      try {
        setLoadingCandidate(true);
        const res = await fetch(`${API_BASE}/candidate/${candidateId}`, { headers: authHeaders() });
        const data = (await res.json().catch(() => ({}))) as CandidateDoc;
        if (!mounted) return;
        setCandidate(data);
      } catch (e) {
        setErr('Failed to load candidate.');
      } finally {
        setLoadingCandidate(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [candidateId]);

  /** -------- load test history (for preview) -------- */
  const normalizeAllHistory = (payload: any): { attempts: Attempt[]; needs: Attempt[] } => {
    const attempts: Attempt[] = Array.isArray(payload?.attempts)
      ? payload.attempts
      : [];
    const needs: Attempt[] = Array.isArray(payload?.needs_marking)
      ? payload.needs_marking
      : [];
    return { attempts, needs };
  };

  const normalizeCandidateHistory = (payload: any): { attempts: Attempt[] } => {
    // /tests/history/{candidateId} returns: { candidateId, attempts: [{ id, submittedAt, score, pdfUrl }] }
    const list = Array.isArray(payload?.attempts) ? payload.attempts : [];
    const mapped: Attempt[] = list.map((a: any) => ({
      _id: String(a.id || a._id || ''),
      candidate_id: payload?.candidateId || candidateId,
      candidateId: payload?.candidateId || candidateId,
      score: typeof a.score === 'number' ? a.score : (typeof a.total_score === 'number' ? a.total_score : null),
      type: 'smart', // we don't know; default to smart for compatibility
      status: 'completed',
      submitted_at: a.submittedAt || a.createdAt || a.created_at || null,
      created_at: a.submittedAt || a.createdAt || a.created_at || null,
    }));
    return { attempts: mapped };
  };

  const loadHistory = async () => {
    try {
      // Preferred: all candidates history for the "Preview Test" section
      const res = await fetch(`${API_BASE}/tests/history/all`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const { attempts, needs } = normalizeAllHistory(data);
        const byTimeDesc = (a: Attempt, b: Attempt) => {
          const ta = new Date(a.created_at || a.submitted_at || 0).getTime();
          const tb = new Date(b.created_at || b.submitted_at || 0).getTime();
          return tb - ta;
        };
        setAllAttempts((attempts || []).sort(byTimeDesc));
        setNeedsMarking((needs || []).sort(byTimeDesc));
        return;
      }

      // Fallback: if /all is not available, fetch candidate-specific history (when we have a candidateId)
      if (candidateId) {
        const resOne = await fetch(`${API_BASE}/tests/history/${candidateId}`, { headers: authHeaders() });
        if (resOne.ok) {
          const data = await resOne.json().catch(() => ({}));
          const { attempts } = normalizeCandidateHistory(data);
          const byTimeDesc = (a: Attempt, b: Attempt) => {
            const ta = new Date(a.created_at || a.submitted_at || 0).getTime();
            const tb = new Date(b.created_at || b.submitted_at || 0).getTime();
            return tb - ta;
          };
          setAllAttempts((attempts || []).sort(byTimeDesc));
          setNeedsMarking([]); // no "needs marking" info in this shape
          return;
        }
      }
    } catch {
      // swallow errors; just show empty state
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  /** -------- send invite (Smart/Custom) -------- */
  const sendInvite = async () => {
    if (!candidateId) return;
    try {
      setIsSending(true);
      const payload: any = {
        candidate_id: candidateId,
        question_count: questionCount,
        test_type: testType,
      };
      if (testType === 'custom') {
        payload.custom = { title: customTitle || 'Custom Test', questions: customQuestions };
      }

      const res = await fetch(`${API_BASE}/tests/invite`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data && (data.detail || data.error)) || 'Failed to send test');
      }

      setToast('Test invite sent to candidate.');
      window.setTimeout(() => setToast(null), 2400);
      await loadHistory();
    } catch (e: any) {
      setErr(typeof e?.message === 'string' ? e.message : 'Could not send invite');
      window.setTimeout(() => setErr(null), 3200);
    } finally {
      setIsSending(false);
    }
  };

  /** -------- manual grade custom attempt -------- */
  const gradeAttempt = async (attemptId: string, score: number) => {
    try {
      if (Number.isNaN(score) || score < 0 || score > 100) {
        setErr('Score must be between 0 and 100.');
        window.setTimeout(() => setErr(null), 2800);
        return;
      }
      const res = await fetch(`${API_BASE}/tests/grade/${attemptId}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ score } as GradePayload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data && (data.detail || data.error)) || 'Failed to save grade');
      setToast('Custom test graded.');
      window.setTimeout(() => setToast(null), 2000);
      await loadHistory();
    } catch (e: any) {
      setErr(typeof e?.message === 'string' ? e.message : 'Could not grade this attempt');
      window.setTimeout(() => setErr(null), 3200);
    }
  };

  /** -------- custom authoring subcomponent -------- */
  const CustomAuthoring = ({ value, onChange }: { value: CustomQ[]; onChange: (v: CustomQ[]) => void }) => {
    const add = () => onChange([...(value || []), { question: '', type: 'text' }]);
    const update = (i: number, patch: Partial<CustomQ>) =>
      onChange(value.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
    const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

    return (
      <div className="space-y-3">
        {(value || []).map((q, i) => (
          <div key={i} className="rounded-xl border border-input p-3 bg-background/60">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
              <select
                className="w-full md:w-40 p-2 rounded-lg bg-background border border-input"
                value={q.type}
                onChange={(e) => update(i, { type: e.target.value as 'mcq' | 'text' })}
              >
                <option value="text">Free Text</option>
                <option value="mcq">MCQ</option>
              </select>
              <input
                className="flex-1 p-2 rounded-lg bg-background border border-input"
                placeholder="Question"
                value={q.question}
                onChange={(e) => update(i, { question: e.target.value })}
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => remove(i)}
                type="button"
                aria-label="Remove question"
                title="Remove question"
              >
                <i className="ri-delete-bin-line" />
              </button>
            </div>

            {q.type === 'mcq' && (
              <div className="grid md:grid-cols-2 gap-2 mt-3">
                <input
                  className="p-2 rounded-lg bg-background border border-input"
                  placeholder="Option A"
                  value={q.options?.[0] || ''}
                  onChange={(e) =>
                    update(i, {
                      options: [e.target.value, q.options?.[1] || '', q.options?.[2] || '', q.options?.[3] || ''],
                    })
                  }
                />
                <input
                  className="p-2 rounded-lg bg-background border border-input"
                  placeholder="Option B"
                  value={q.options?.[1] || ''}
                  onChange={(e) =>
                    update(i, {
                      options: [q.options?.[0] || '', e.target.value, q.options?.[2] || '', q.options?.[3] || ''],
                    })
                  }
                />
                <input
                  className="p-2 rounded-lg bg-background border border-input"
                  placeholder="Option C"
                  value={q.options?.[2] || ''}
                  onChange={(e) =>
                    update(i, {
                      options: [q.options?.[0] || '', q.options?.[1] || '', e.target.value, q.options?.[3] || ''],
                    })
                  }
                />
                <input
                  className="p-2 rounded-lg bg-background border border-input"
                  placeholder="Option D"
                  value={q.options?.[3] || ''}
                  onChange={(e) =>
                    update(i, {
                      options: [q.options?.[0] || '', q.options?.[1] || '', q.options?.[2] || '', e.target.value],
                    })
                  }
                />
                <input
                  className="md:col-span-2 p-2 rounded-lg bg-background border border-input"
                  placeholder="(Optional) Correct Answer"
                  value={q.correct_answer || ''}
                  onChange={(e) => update(i, { correct_answer: e.target.value })}
                />
              </div>
            )}
          </div>
        ))}
        <button
          className="btn btn-outline btn-sm"
          type="button"
          onClick={add}
        >
          <i className="ri-add-line" /> Add question
        </button>
      </div>
    );
  };

  /** -------- attempts list (all) -------- */
  const AttemptsPanel = ({ title, attempts }: { title: string; attempts: Attempt[] }) => {
    const getCand = (a: Attempt) => a.candidate || {};
    const getCandId = (a: Attempt) => a.candidateId || a.candidate_id || getCand(a)?._id || '';
    const getCandEmail = (a: Attempt) =>
      getCand(a)?.email || getCand(a)?.resume?.email || '—';
    return (
      <div className="bg-card text-foreground rounded-2xl shadow-xl border border-border p-4">
        <div className="text-sm font-medium mb-3">{title}</div>
        <div className="space-y-2">
          {(attempts || []).map((a) => (
            <div key={a._id} className="rounded-lg border border-border p-3 flex flex-wrap items-center gap-3">
              <div className="text-sm">
                <div className="font-medium">
                  {getCand(a)?.name || getCandEmail(a) || getCandId(a)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Score: {a.score ?? '—'} / 100 · Type: {a.type}
                </div>
              </div>
              {getCandId(a) ? (
                <a
                  className="ml-auto text-sm underline"
                  href={`/candidate/${getCandId(a)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open profile
                </a>
              ) : null}
            </div>
          ))}
          {(attempts || []).length === 0 && (
            <div className="text-sm text-muted-foreground">No attempts yet.</div>
          )}
        </div>
      </div>
    );
  };

  /** -------- manual marking panel -------- */
  const ManualMarkingPanel = ({
    title,
    attempts,
    onGrade,
  }: {
    title: string;
    attempts: Attempt[];
    onGrade: (id: string, score: number) => void;
  }) => {
    const [local, setLocal] = useState<Record<string, number>>({});
    return (
      <div className="bg-card text-foreground rounded-2xl shadow-xl border border-border p-4">
        <div className="text-sm font-medium mb-3">{title}</div>
        <div className="space-y-3">
          {(attempts || []).length === 0 && (
            <div className="text-sm text-muted-foreground">No custom tests awaiting marking.</div>
          )}
          {(attempts || []).map((a) => (
            <div key={a._id} className="rounded-lg border border-border p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {a.candidate?.name ||
                    a.candidate?.email ||
                    a.candidate?.resume?.email ||
                    a.candidateId ||
                    a.candidate_id}
                </div>
                <div className="text-xs text-muted-foreground">
                  Submitted: {a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '—'}
                </div>
              </div>
              <input
                type="number"
                min={0}
                max={100}
                className="input w-24 p-2 rounded-lg bg-background border border-input"
                placeholder="Score"
                value={local[a._id] ?? ''}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, [a._id]: Number(e.target.value) }))
                }
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onGrade(a._id, Number(local[a._id] ?? 0))}
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Candidate context — three neat boxes (Email, Job Role, Experience) */}
      <div className="bg-card text-foreground backdrop-blur-sm rounded-2xl shadow-xl border border-border p-6">
        <div className="flex items-center mb-4">
          <i className="ri-test-tube-line text-2xl text-foreground/80 mr-3" />
          <h2 className="text-xl font-bold">Assign Test</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Email</div>
            <div className="font-medium">
              {loadingCandidate ? 'Loading…' : email || '—'}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Job Role</div>
            <div className="font-medium">{loadingCandidate ? 'Loading…' : role}</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Experience</div>
            <div className="font-medium">{loadingCandidate ? 'Loading…' : experience}</div>
          </div>
        </div>

        {/* Test type & question count */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Test Type
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border border-input rounded-xl cursor-pointer hover:bg-muted/40">
                <input
                  type="radio"
                  name="testType"
                  value="smart"
                  checked={testType === 'smart'}
                  onChange={(e) => setTestType(e.target.value as TestType)}
                  className="mr-3"
                  aria-label="Smart AI Test"
                />
                <div>
                  <p className="font-medium">Smart AI Test</p>
                  <p className="text-sm text-muted-foreground">
                    Auto-generated based on candidate profile
                  </p>
                </div>
              </label>

              <label className="flex items-center p-3 border border-input rounded-xl cursor-pointer hover:bg-muted/40">
                <input
                  type="radio"
                  name="testType"
                  value="custom"
                  checked={testType === 'custom'}
                  onChange={(e) => setTestType(e.target.value as TestType)}
                  className="mr-3"
                  aria-label="Custom Test"
                />
                <div>
                  <p className="font-medium">Custom Test</p>
                  <p className="text-sm text-muted-foreground">Create your own questions</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Settings
            </label>
            <div className="flex items-center gap-3">
              <span className="text-sm">Questions:</span>
              <input
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-24 p-2 rounded-lg bg-background border border-input"
              />
              <div className="ml-auto">
                <button
                  onClick={sendInvite}
                  type="button"
                  disabled={!candidateId || isSending}
                  className="btn btn-primary"
                  aria-busy={isSending}
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/70 border-t-transparent rounded-full animate-spin" />
                      <span>Sending…</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line" />
                      <span>Send Test</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom authoring when custom is selected */}
        {testType === 'custom' && (
          <div className="mt-4 space-y-3">
            <input
              className="w-full p-3 rounded-xl bg-background border border-input text-foreground"
              placeholder="Custom Test Title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
            <div className="text-sm text-muted-foreground">
              Add questions (MCQ or free text). For MCQ, you may also provide the correct
              answer; leaving it empty means manual marking later.
            </div>
            <CustomAuthoring value={customQuestions} onChange={setCustomQuestions} />
          </div>
        )}
      </div>

      {/* Preview Tests (All + Needs manual marking) */}
      <div className="grid lg:grid-cols-2 gap-6">
        <AttemptsPanel title="All attempts" attempts={allAttempts} />
        <ManualMarkingPanel
          title="Needs manual marking (custom)"
          attempts={needsMarking}
          onGrade={gradeAttempt}
        />
      </div>

      {/* Toasts */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div role="status" aria-live="polite" className="panel glass shadow-lux px-4 py-3 min-w-[260px]">
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

      {err && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div role="status" aria-live="assertive" className="panel glass shadow-lux px-4 py-3 min-w-[260px]">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--destructive))]" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Action failed</div>
                <div className="mt-0.5 text-[hsl(var(--muted-foreground))]">{err}</div>
              </div>
              <button
                type="button"
                onClick={() => setErr(null)}
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
