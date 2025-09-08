// app/dashboard/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import  Button  from '../../components/ui/Button';

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

const authHeaders = () => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
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
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-muted text-foreground';
  }
}

export default function StatusDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('accepted');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [accepted, setAccepted] = useState<CandidateDoc[]>([]);
  const [rejected, setRejected] = useState<CandidateDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  // Fetch dashboard lists from backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // 🔧 FIX: Use backend route that exists: /dashboard/lists (instead of /dashboard/overview)
        const res = await fetch(`${API_BASE}/dashboard/lists`, { headers: authHeaders() });
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        setAccepted(Array.isArray(data?.accepted) ? data.accepted : []);
        setRejected(Array.isArray(data?.rejected) ? data.rejected : []);
      } catch (e) {
        setErr('Failed to load dashboard. Showing empty state.');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const currentData = useMemo<CandidateDoc[]>(() => {
    return activeTab === 'accepted' ? accepted : rejected;
  }, [activeTab, accepted, rejected]);

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

  return (
    <div className="bg-card text-foreground backdrop-blur-sm rounded-2xl shadow-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <i className="ri-dashboard-line text-2xl text-foreground/80 mr-3" />
          <h2 className="text-xl font-bold">Candidates Dashboard</h2>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="primary" size="md" type="button">
            <i className="ri-download-line mr-2" />
            <span>Export Report</span>
          </Button>
          <Button variant="outline" size="md" type="button">
            <i className="ri-mail-line mr-2" />
            <span>Bulk Email</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigation: Accepted / Rejected */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6 border border-border">
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
            <span className="ml-2 px-2 py-1 rounded-full text-xs bg-muted text-foreground/80 border border-border">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error / Loading Notice */}
      {err && (
        <div className="mb-4 text-sm text-[hsl(var(--destructive))]">
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
              <th className="text-left py-3 px-4 font-medium text-foreground">
                <input
                  type="checkbox"
                  className="rounded"
                  aria-label="Select all"
                  checked={currentData.length > 0 && selectedItems.length === currentData.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Candidate</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Role</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Match</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Test</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Total</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((c) => {
              const isSelected = selectedItems.includes(c._id);
              const total = safeTotal(c);
              return (
                <tr key={c._id} className="border-b border-border hover:bg-muted/40">
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      className="rounded"
                      aria-label={`Select ${c.name || emailOf(c) || c._id}`}
                      checked={isSelected}
                      onChange={() => handleSelectItem(c._id)}
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={c.name || emailOf(c) || 'Candidate'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-background/60 border border-border flex items-center justify-center">
                          <i className="ri-user-line text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{c.name || emailOf(c) || '—'}</p>
                        <p className="text-sm text-muted-foreground">{emailOf(c) || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">{c.job_role || '—'}</td>
                  <td className="py-4 px-4">
                    {typeof c.score === 'number' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold">{c.score}%</span>
                        <i className="ri-star-line text-amber-500" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {typeof c.test_score === 'number' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-emerald-600">{c.test_score}%</span>
                        <i className="ri-star-fill text-emerald-500" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {typeof total === 'number' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{total}%</span>
                        <i className="ri-trophy-line text-primary" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusPill(c.status)}`}>
                      {c.status ? c.status[0].toUpperCase() + c.status.slice(1) : '—'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <a
                        href={`/candidate/${c._id}`}
                        className="icon-btn"
                        aria-label="Open candidate profile"
                        title="Open candidate profile"
                      >
                        <i className="ri-user-search-line" />
                      </a>
                      <a
                        href={`mailto:${emailOf(c)}`}
                        className="icon-btn"
                        aria-label="Send email"
                        title="Send email"
                      >
                        <i className="ri-mail-line" />
                      </a>
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
        <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground/80">{selectedItems.length} item(s) selected</p>
            <div className="flex space-x-2">
              <Button variant="primary" size="md" type="button">
                Send Reminder
              </Button>
              <Button variant="secondary" size="md" type="button">
                Add Note
              </Button>
              <Button variant="outline" size="md" type="button" onClick={() => setSelectedItems([])}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Extra Features (kept, lightly adapted wording) */}
      <div className="mt-6 p-4 bg-gradient-to-r from-muted to-muted/60 rounded-xl border border-border">
        <h3 className="text-lg font-semibold mb-3">HR Tools &amp; Settings</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border border-border">
            <h4 className="font-medium mb-2">Auto-Schedule Next Round</h4>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-muted-foreground">Enable automatic scheduling</span>
            </label>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border">
            <h4 className="font-medium mb-2">Test Results</h4>
            <button
              type="button"
              className="flex items-center space-x-2 text-sm text-foreground hover:text-foreground/80"
            >
              <i className="ri-file-pdf-line" />
              <span>View PDF Reports</span>
            </button>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border">
            <h4 className="font-medium mb-2">Feedback Form</h4>
            <button
              type="button"
              className="flex items-center space-x-2 text-sm text-foreground hover:text-foreground/80"
            >
              <i className="ri-feedback-line" />
              <span>Add HR Notes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
