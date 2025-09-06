'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/** =========================
 * Types
 * ========================= */
type TabId = 'accepted' | 'rejected';

type CandidateDoc = {
  _id: string;
  name?: string;
  email?: string;
  resume?: { email?: string };
  job_role?: string;
  status?: string; // 'accepted' | 'rejected' | ...
  score?: number | null; // match score
  test_score?: number | null;
  total_score?: number | null; // may be provided by backend
  avatar?: string; // optional; fallback UI if missing
};

type DashboardStats = {
  uploaded: number;
  filtered: number;
  tests_taken: number;
  meetings: number;
  accepted: number;
  rejected: number;
  // optional extensions
  [k: string]: number | undefined;
};

type ApiListResponse = {
  accepted?: CandidateDoc[];
  rejected?: CandidateDoc[];
};

type ApiAcceptRejectResponse = {
  ok?: boolean;
  status?: string;
  candidateId?: string;
  sent_email?: boolean;
};

type ApiExportFormat = 'csv' | 'xlsx' | 'json';

/* =========================
 * API helpers (aligned with app)
 * ========================= */
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

const authHeaders = (json = true) => {
  const h: Record<string, string> = json ? { 'Content-Type': 'application/json' } : {};
  const t = getAuthToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

function emailOf(c: CandidateDoc): string {
  return c.email || c.resume?.email || '';
}

function safeTotal(c: CandidateDoc): number | null {
  if (typeof c.total_score === 'number') return c.total_score;
  const m = Number(c.score ?? 0);
  const t = Number(c.test_score ?? 0);
  if (Number.isNaN(m) && Number.isNaN(t)) return null;
  // Reasonable initial: average of match & test
  const total = ((Number.isNaN(m) ? 0 : m) + (Number.isNaN(t) ? 0 : t)) / 2;
  return Math.round(total * 10) / 10;
}

function statusPill(status?: string): string {
  switch ((status || '').toLowerCase()) {
    case 'accepted':
      return 'bg-emerald-100 text-emerald-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-muted text-foreground';
  }
}

/** Friendly HTTP error text */
function friendly(status: number): string {
  const map: Record<number, string> = {
    400: 'Bad request.',
    401: 'Unauthorized. Please log in again.',
    403: 'Forbidden.',
    404: 'Not found.',
    409: 'Conflict.',
    410: 'Link expired.',
    422: 'Validation error.',
    500: 'Server error. Please try again.',
  };
  return map[status] || `Request failed (${status}).`;
}

/** =========================
 * Component
 * ========================= */
export default function StatusDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('accepted');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [accepted, setAccepted] = useState<CandidateDoc[]>([]);
  const [rejected, setRejected] = useState<CandidateDoc[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    uploaded: 0,
    filtered: 0,
    tests_taken: 0,
    meetings: 0,
    accepted: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  // toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  // SSE connection ref
  const esRef = useRef<EventSource | null>(null);

  /** -------- Initial data fetch -------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Lists
        const res = await fetch(`${API_BASE}/dashboard/lists`, { headers: authHeaders(false) });
        const data: ApiListResponse = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as any)?.detail || friendly(res.status));

        // Stats
        const sres = await fetch(`${API_BASE}/dashboard/stats`, { headers: authHeaders(false) });
        const sdata: DashboardStats = await sres.json().catch(() => ({} as DashboardStats));
        if (!sres.ok) throw new Error((sdata as any)?.detail || friendly(sres.status));

        if (!mounted) return;
        setAccepted(Array.isArray(data?.accepted) ? data.accepted : []);
        setRejected(Array.isArray(data?.rejected) ? data.rejected : []);
        setStats({
          uploaded: sdata?.uploaded ?? 0,
          filtered: sdata?.filtered ?? 0,
          tests_taken: sdata?.tests_taken ?? 0,
          meetings: sdata?.meetings ?? 0,
          accepted: sdata?.accepted ?? 0,
          rejected: sdata?.rejected ?? 0,
        });
      } catch (e: any) {
        if (!mounted) return;
        setErr(typeof e?.message === 'string' ? e.message : 'Failed to load dashboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /** -------- Realtime updates via SSE (live stats/changes) -------- */
  useEffect(() => {
    // Try to connect; if server doesn’t support SSE, we silently ignore.
    try {
      const es = new EventSource(`${API_BASE}/dashboard/stream`, { withCredentials: true } as any);
      esRef.current = es;

      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data || '{}');
          // Expected shapes:
          // { type: "stats", data: { uploaded, filtered, ... } }
          // { type: "status_change", candidate: {...}, new_status: "accepted"|"rejected" }
          // { type: "list_refresh" } --> refetch lists
          if (payload?.type === 'stats' && payload?.data) {
            setStats((prev) => ({ ...prev, ...payload.data }));
          } else if (payload?.type === 'status_change' && payload?.candidate) {
            const cand: CandidateDoc = payload.candidate;
            const ns: string = String(payload.new_status || cand.status || '').toLowerCase();
            if (ns === 'accepted') {
              setRejected((r) => r.filter((x) => x._id !== cand._id));
              setAccepted((a) => {
                const exists = a.some((x) => x._id === cand._id);
                return exists ? a.map((x) => (x._id === cand._id ? { ...x, status: 'accepted' } : x)) : [{ ...cand, status: 'accepted' }, ...a];
              });
            } else if (ns === 'rejected') {
              setAccepted((a) => a.filter((x) => x._id !== cand._id));
              setRejected((r) => {
                const exists = r.some((x) => x._id === cand._id);
                return exists ? r.map((x) => (x._id === cand._id ? { ...x, status: 'rejected' } : x)) : [{ ...cand, status: 'rejected' }, ...r];
              });
            }
          } else if (payload?.type === 'list_refresh') {
            // soft refresh lists
            (async () => {
              try {
                const res = await fetch(`${API_BASE}/dashboard/lists`, { headers: authHeaders(false) });
                const data: ApiListResponse = await res.json().catch(() => ({}));
                if (res.ok) {
                  setAccepted(Array.isArray(data?.accepted) ? data.accepted : []);
                  setRejected(Array.isArray(data?.rejected) ? data.rejected : []);
                }
              } catch {}
            })();
          }
        } catch {}
      };

      es.onerror = () => {
        // Network/server might not support SSE; close quietly.
        try {
          es.close();
        } catch {}
      };

      return () => {
        try {
          es.close();
        } catch {}
        esRef.current = null;
      };
    } catch {
      // ignore
    }
  }, []);

  /** -------- Derived -------- */
  const currentData = useMemo<CandidateDoc[]>(() => {
    return activeTab === 'accepted' ? accepted : rejected;
  }, [activeTab, accepted, rejected]);

  const totalEvaluated = (stats.accepted ?? 0) + (stats.rejected ?? 0);
  const totalPipeline =
    (stats.uploaded ?? 0) +
    (stats.filtered ?? 0) +
    (stats.tests_taken ?? 0) +
    (stats.meetings ?? 0);

  /** -------- Actions: selection -------- */
  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(currentData.map((c) => c._id));
    } else {
      setSelectedItems([]);
    }
  };

  /** -------- Actions: accept/reject (Req 9.1 & 9.2) -------- */
  async function markStatus(candidateId: string, next: 'accepted' | 'rejected', sendEmail = false) {
    // Primary: /dashboard/{accept|reject}
    // Fallback: /candidate/{id}/status { status, sendEmail }
    try {
      const body = { candidateId, sendEmail };
      const res = await fetch(`${API_BASE}/dashboard/${next}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data: ApiAcceptRejectResponse = await res.json().catch(() => ({}));
        applyLocalStatusChange(candidateId, next);
        if (next === 'accepted' && (data?.sent_email || sendEmail)) {
          showToast('Candidate accepted. Acceptance email sent.');
        } else {
          showToast(`Candidate ${next}.`);
        }
        return;
      }

      // Fallback
      const fres = await fetch(`${API_BASE}/candidate/${encodeURIComponent(candidateId)}/status`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ status: next, sendEmail }),
      });
      if (!fres.ok) {
        throw new Error(friendly(fres.status));
      }
      applyLocalStatusChange(candidateId, next);
      if (next === 'accepted' && sendEmail) {
        showToast('Candidate accepted. Acceptance email sent.');
      } else {
        showToast(`Candidate ${next}.`);
      }
    } catch (e: any) {
      setErr(typeof e?.message === 'string' ? e.message : `Failed to update status (${next})`);
    }
  }

  function applyLocalStatusChange(candidateId: string, next: 'accepted' | 'rejected') {
    setAccepted((a) => {
      const hit = a.find((x) => x._id === candidateId);
      if (next === 'accepted') {
        // already in accepted -> update status
        return hit ? a.map((x) => (x._id === candidateId ? { ...x, status: 'accepted' } : x)) : a;
      } else {
        // move from accepted -> rejected
        return a.filter((x) => x._id !== candidateId);
      }
    });
    setRejected((r) => {
      const hit = r.find((x) => x._id === candidateId);
      if (next === 'rejected') {
        return hit ? r.map((x) => (x._id === candidateId ? { ...x, status: 'rejected' } : x)) : r;
      } else {
        // move from rejected -> accepted
        return r.filter((x) => x._id !== candidateId);
      }
    });

    // Adjust stats optimistically
    setStats((s) => {
      const delta = { ...s };
      if (next === 'accepted') {
        delta.accepted = (delta.accepted ?? 0) + 1;
        if ((delta.rejected ?? 0) > 0) delta.rejected = (delta.rejected ?? 0) - 1;
      } else {
        delta.rejected = (delta.rejected ?? 0) + 1;
        if ((delta.accepted ?? 0) > 0) delta.accepted = (delta.accepted ?? 0) - 1;
      }
      return delta;
    });

    // If tab is different, ensure it appears where expected immediately
    if (next === 'accepted') {
      const fromRejected = rejected.find((x) => x._id === candidateId);
      if (fromRejected) setAccepted((a) => [{ ...fromRejected, status: 'accepted' }, ...a]);
    } else {
      const fromAccepted = accepted.find((x) => x._id === candidateId);
      if (fromAccepted) setRejected((r) => [{ ...fromAccepted, status: 'rejected' }, ...r]);
    }
  }

  /** -------- Actions: export (Req 9.2) -------- */
  async function handleExport(format: ApiExportFormat = 'csv') {
    // Try server export first; fallback to client CSV from current lists.
    try {
      const res = await fetch(`${API_BASE}/dashboard/export?format=${encodeURIComponent(format)}`, {
        headers: authHeaders(false),
      });
      if (!res.ok) throw new Error(friendly(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `smarthirex-dashboard-${stamp}.${format === 'json' ? 'json' : format}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      showToast('Export generated.');
    } catch {
      // Fallback: simple CSV
      const rows: Array<string[]> = [
        ['Status', 'Candidate ID', 'Name', 'Email', 'Role', 'Match %', 'Test %', 'Total %'],
      ];
      const push = (status: 'accepted' | 'rejected', c: CandidateDoc) => {
        rows.push([
          status,
          c._id,
          c.name || '',
          emailOf(c),
          c.job_role || '',
          typeof c.score === 'number' ? String(c.score) : '',
          typeof c.test_score === 'number' ? String(c.test_score) : '',
          safeTotal(c) !== null ? String(safeTotal(c)) : '',
        ]);
      };
      accepted.forEach((c) => push('accepted', c));
      rejected.forEach((c) => push('rejected', c));
      const csv = rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `smarthirex-dashboard-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      showToast('Export generated (client CSV).');
    }
  }

  /** -------- Render -------- */
  return (
    <div className="bg-card text-foreground backdrop-blur-sm rounded-2xl shadow-xl border border-border p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <i className="ri-dashboard-line mr-3 text-2xl text-foreground/80" />
          <h2 className="text-xl font-bold">Candidates Dashboard</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Export as CSV"
          >
            <i className="ri-download-line" />
            <span>Export Report</span>
          </button>
          <button
            type="button"
            className="flex items-center space-x-2 rounded-lg border border-input px-4 py-2 text-foreground transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Bulk email (coming soon)"
          >
            <i className="ri-mail-line" />
            <span>Bulk Email</span>
          </button>
        </div>
      </div>

      {/* Live Stats (Req 9.2) */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { label: 'Uploaded', key: 'uploaded', icon: 'ri-upload-2-line' },
          { label: 'Filtered', key: 'filtered', icon: 'ri-filter-3-line' },
          { label: 'Tests Taken', key: 'tests_taken', icon: 'ri-test-tube-line' },
          { label: 'Meetings', key: 'meetings', icon: 'ri-calendar-check-line' },
          { label: 'Accepted', key: 'accepted', icon: 'ri-check-line' },
          { label: 'Rejected', key: 'rejected', icon: 'ri-close-line' },
        ].map((it) => {
          const val = Number(stats[it.key as keyof DashboardStats] ?? 0);
          const base = Math.max(1, totalPipeline || val || 1);
          const pct = Math.min(100, Math.round((val / base) * 100));
          return (
            <div
              key={it.key}
              className="rounded-xl border border-border bg-background/60 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{it.label}</div>
                <i className={`${it.icon} text-muted-foreground`} />
              </div>
              <div className="mt-1 text-2xl font-bold">{val}</div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
                <div
                  className="h-2 bg-primary"
                  style={{ width: `${isFinite(pct) ? pct : 0}%` }}
                  aria-hidden
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Navigation: Accepted / Rejected */}
      <div className="mb-6 flex space-x-1 rounded-lg border border-border bg-muted p-1">
        {([
          { id: 'accepted', label: 'Accepted', icon: 'ri-check-line', count: accepted.length },
          { id: 'rejected', label: 'Rejected', icon: 'ri-close-line', count: rejected.length },
        ] as Array<{ id: TabId; label: string; icon: string; count: number }>).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedItems([]);
            }}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === tab.id
                ? 'bg-background text-primary shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <i className={`${tab.icon} mr-2`} />
            {tab.label}
            <span className="ml-2 rounded-full border border-border bg-muted px-2 py-1 text-xs text-foreground/80">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error / Loading Notice */}
      {err && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-[hsl(var(--destructive))]">
          {err}
        </div>
      )}
      {loading && (
        <div className="mb-4 text-sm text-muted-foreground">Loading…</div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-foreground">
                <input
                  type="checkbox"
                  className="rounded"
                  aria-label="Select all"
                  checked={currentData.length > 0 && selectedItems.length === currentData.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Candidate</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Match</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Test</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Total</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((c) => {
              const isSelected = selectedItems.includes(c._id);
              const total = safeTotal(c);
              return (
                <tr key={c._id} className="border-b border-border hover:bg-muted/40">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      className="rounded"
                      aria-label={`Select ${c.name || emailOf(c) || c._id}`}
                      checked={isSelected}
                      onChange={() => handleSelectItem(c._id)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={c.name || emailOf(c) || 'Candidate'}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/60">
                          <i className="ri-user-line text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{c.name || emailOf(c) || '—'}</p>
                        <p className="text-sm text-muted-foreground">{emailOf(c) || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{c.job_role || '—'}</td>
                  <td className="px-4 py-4">
                    {typeof c.score === 'number' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold">{c.score}%</span>
                        <i className="ri-star-line text-amber-500" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {typeof c.test_score === 'number' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-emerald-600">{c.test_score}%</span>
                        <i className="ri-star-fill text-emerald-500" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {typeof total === 'number' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{total}%</span>
                        <i className="ri-trophy-line text-primary" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusPill(c.status)}`}>
                      {c.status ? c.status[0].toUpperCase() + c.status.slice(1) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <a
                        href={`/candidate/${c._id}`}
                        className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Open candidate profile"
                        title="Open candidate profile"
                      >
                        <i className="ri-user-search-line" />
                      </a>
                      <a
                        href={`mailto:${emailOf(c)}`}
                        className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Send email"
                        title="Send email"
                      >
                        <i className="ri-mail-line" />
                      </a>

                      {/* Quick actions (Req 9.1) */}
                      {activeTab !== 'accepted' && (
                        <button
                          type="button"
                          onClick={() => markStatus(c._id, 'accepted', true /* send acceptance email */)}
                          className="rounded-lg p-2 text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          title="Accept (send acceptance email)"
                        >
                          <i className="ri-check-line" />
                        </button>
                      )}
                      {activeTab !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => markStatus(c._id, 'rejected')}
                          className="rounded-lg p-2 text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          title="Reject"
                        >
                          <i className="ri-close-line" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {currentData.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No candidates in this list yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-muted p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground/80">{selectedItems.length} item(s) selected</p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  // bulk accept with email
                  selectedItems.forEach((id) => markStatus(id, 'accepted', true));
                  setSelectedItems([]);
                }}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Accept selected (send email)"
              >
                Accept + Email
              </button>
              <button
                type="button"
                onClick={() => {
                  selectedItems.forEach((id) => markStatus(id, 'rejected'));
                  setSelectedItems([]);
                }}
                className="rounded-lg bg-destructive px-4 py-2 text-destructive-foreground transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Reject selected"
              >
                Reject
              </button>
              <button
                type="button"
                className="rounded-lg border border-border bg-muted px-4 py-2 text-foreground transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setSelectedItems([])}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extra Features (kept, lightly adapted wording) */}
      <div className="mt-6 rounded-xl border border-border bg-gradient-to-r from-muted to-muted/60 p-4">
        <h3 className="mb-3 text-lg font-semibold">HR Tools &amp; Settings</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 font-medium">Auto-Schedule Next Round</h4>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-muted-foreground">Enable automatic scheduling</span>
            </label>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 font-medium">Test Results</h4>
            <button
              type="button"
              className="flex items-center space-x-2 text-sm text-foreground hover:text-foreground/80"
              onClick={() => handleExport('csv')}
            >
              <i className="ri-file-pdf-line" />
              <span>Export PDF/CSV Reports</span>
            </button>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 font-medium">Feedback Form</h4>
            <button
              type="button"
              className="flex items-center space-x-2 text-sm text-foreground hover:text-foreground/80"
              title="Add HR notes (coming soon)"
            >
              <i className="ri-feedback-line" />
              <span>Add HR Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60]">
          <div role="status" aria-live="polite" className="panel glass shadow-lux min-w-[260px] px-4 py-3">
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
    </div>
  );
}
