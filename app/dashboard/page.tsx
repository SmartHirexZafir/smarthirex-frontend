// app/dashboard/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type UpcomingTest = {
  _id: string;
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  job_role?: string;
  status?: string;
  scheduledDateTime?: string;
  testDurationMinutes?: number;
};

type UpcomingMeeting = {
  _id: string;
  candidateId?: string;
  status?: string;
  starts_at?: string;
  ends_at?: string;
  title?: string;
  duration_mins?: number;
  timezone?: string;
  email?: string;
  meeting_url?: string;
};

type DayCount = { date: string; count: number };

type RecentActivity = {
  type: 'test_submitted' | 'meeting_scheduled' | 'status_changed';
  at: string;
  candidateId?: string;
  label: string;
  status?: string;
};

type DashboardSummary = {
  totalCandidatesUploaded: number;
  totalFilteredCandidates: number;
  totalTestsConducted: number;
  totalTestsPending: number;
  totalApproved: number;
  totalShortlisted: number;
  totalRejected: number;
  totalAwaitingReview: number;
  todayTestsCount: number;
  todayMeetingsCount: number;
  upcomingTests: UpcomingTest[];
  upcomingMeetings: UpcomingMeeting[];
  last7DaysTestSubmissions?: DayCount[];
  last7DaysCvUploads?: DayCount[];
  recentActivities?: RecentActivity[];
  generatedAt?: string;
};

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
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const EMPTY_SUMMARY: DashboardSummary = {
  totalCandidatesUploaded: 0,
  totalFilteredCandidates: 0,
  totalTestsConducted: 0,
  totalTestsPending: 0,
  totalApproved: 0,
  totalShortlisted: 0,
  totalRejected: 0,
  totalAwaitingReview: 0,
  todayTestsCount: 0,
  todayMeetingsCount: 0,
  upcomingTests: [],
  upcomingMeetings: [],
  last7DaysTestSubmissions: [],
  last7DaysCvUploads: [],
  recentActivities: [],
};

const POLL_MS = 45_000;

function safeDate(value?: string): string {
  if (!value) return 'N/A';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'N/A';
  return dt.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  }) + ' UTC';
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async (mode: 'initial' | 'refresh' = 'refresh') => {
    try {
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);

      const res = await fetch(`${API_BASE}/dashboard/summary`, {
        method: 'GET',
        headers: authHeaders(),
      });
      const payload = (await res.json().catch(() => ({}))) as Partial<DashboardSummary>;
      if (!res.ok) {
        throw new Error((payload as { detail?: string })?.detail || 'Failed to load dashboard summary');
      }

      setData({
        ...EMPTY_SUMMARY,
        ...payload,
        upcomingTests: Array.isArray(payload.upcomingTests) ? payload.upcomingTests : [],
        upcomingMeetings: Array.isArray(payload.upcomingMeetings) ? payload.upcomingMeetings : [],
        last7DaysTestSubmissions: Array.isArray(payload.last7DaysTestSubmissions) ? payload.last7DaysTestSubmissions : [],
        last7DaysCvUploads: Array.isArray(payload.last7DaysCvUploads) ? payload.last7DaysCvUploads : [],
        recentActivities: Array.isArray(payload.recentActivities) ? payload.recentActivities : [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard summary');
      if (mode === 'initial') setData(EMPTY_SUMMARY);
    } finally {
      if (mode === 'initial') setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    const safeRefresh = async (mode: 'initial' | 'refresh' = 'refresh') => {
      if (!active) return;
      await loadSummary(mode);
    };

    safeRefresh('initial');

    const onFocus = () => safeRefresh('refresh');
    const onVisibility = () => {
      if (document.visibilityState === 'visible') safeRefresh('refresh');
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'candidate_status_changed') safeRefresh('refresh');
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') safeRefresh('refresh');
    }, POLL_MS);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const funnel = useMemo(() => {
    const total = Math.max(1, data.totalCandidatesUploaded);
    return [
      { label: 'Uploaded', value: data.totalCandidatesUploaded, percent: pct(data.totalCandidatesUploaded, total), tone: 'bg-sky-500' },
      { label: 'Filtered', value: data.totalFilteredCandidates, percent: pct(data.totalFilteredCandidates, total), tone: 'bg-indigo-500' },
      { label: 'Tested', value: data.totalTestsConducted, percent: pct(data.totalTestsConducted, total), tone: 'bg-violet-500' },
      { label: 'Shortlisted', value: data.totalShortlisted, percent: pct(data.totalShortlisted, total), tone: 'bg-amber-500' },
      { label: 'Approved / Rejected', value: data.totalApproved + data.totalRejected, percent: pct(data.totalApproved + data.totalRejected, total), tone: 'bg-emerald-500' },
    ];
  }, [data]);

  const statusChartData = useMemo(() => {
    const items = [
      { name: 'Approved', value: data.totalApproved, color: 'hsl(var(--chart-1, 142 76% 36%))' },
      { name: 'Shortlisted', value: data.totalShortlisted, color: 'hsl(var(--chart-2, 38 92% 50%))' },
      { name: 'Rejected', value: data.totalRejected, color: 'hsl(var(--destructive, 0 84% 60%))' },
      { name: 'Awaiting Review', value: data.totalAwaitingReview, color: 'hsl(var(--muted-foreground))' },
    ].filter((d) => d.value > 0);
    return items.length ? items : [{ name: 'No data', value: 1, color: 'hsl(var(--muted))' }];
  }, [data.totalApproved, data.totalShortlisted, data.totalRejected, data.totalAwaitingReview]);

  const trendChartData = useMemo(() => {
    const tests = data.last7DaysTestSubmissions ?? [];
    const uploads = data.last7DaysCvUploads ?? [];
    const dateSet = new Set<string>([...tests.map((t) => t.date), ...uploads.map((u) => u.date)]);
    const dates = Array.from(dateSet).sort();
    const byDate: Record<string, { date: string; tests: number; uploads: number }> = {};
    for (const d of dates) byDate[d] = { date: d, tests: 0, uploads: 0 };
    tests.forEach((t) => { byDate[t.date] = byDate[t.date] ?? { date: t.date, tests: 0, uploads: 0 }; byDate[t.date].tests = t.count; });
    uploads.forEach((u) => { byDate[u.date] = byDate[u.date] ?? { date: u.date, tests: 0, uploads: 0 }; byDate[u.date].uploads = u.count; });
    return dates.map((d) => ({ ...byDate[d], label: d }));
  }, [data.last7DaysTestSubmissions, data.last7DaysCvUploads]);

  const activities = data.recentActivities ?? [];

  const metrics = [
    { label: 'Candidates Uploaded', value: data.totalCandidatesUploaded, icon: 'ri-upload-cloud-2-line' },
    { label: 'Filtered Candidates', value: data.totalFilteredCandidates, icon: 'ri-filter-3-line' },
    { label: 'Tests Conducted', value: data.totalTestsConducted, icon: 'ri-file-list-3-line' },
    { label: 'Tests Pending', value: data.totalTestsPending, icon: 'ri-time-line' },
    { label: 'Approved', value: data.totalApproved, icon: 'ri-checkbox-circle-line' },
    { label: 'Shortlisted', value: data.totalShortlisted, icon: 'ri-award-line' },
    { label: 'Rejected', value: data.totalRejected, icon: 'ri-close-circle-line' },
    { label: 'Awaiting Review', value: data.totalAwaitingReview, icon: 'ri-loader-4-line' },
  ];

  return (
    <div className="bg-card text-foreground rounded-2xl shadow-xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <i className="ri-dashboard-line text-2xl text-foreground/80" />
          <div>
            <h2 className="text-xl font-bold">Recruiter Dashboard</h2>
            <p className="text-xs text-muted-foreground">
              Live summary {data.generatedAt ? `• Updated ${safeDate(data.generatedAt)}` : ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => loadSummary('refresh')}
          className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm"
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="text-sm border border-[hsl(var(--destructive))] text-[hsl(var(--destructive))] rounded-lg p-3">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-background p-4 animate-pulse">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded mt-3" />
              </div>
            ))
          : metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <i className={`${m.icon} text-lg text-foreground/80`} />
                </div>
                <p className="text-3xl font-bold mt-2">{m.value}</p>
              </div>
            ))}
      </section>

      <section className="rounded-xl border border-border bg-background p-4">
        <h3 className="text-lg font-semibold mb-4">Process Funnel</h3>
        <p className="text-sm text-muted-foreground mb-3">Uploaded → Filtered → Tested → Shortlisted → Approved/Rejected (backend numbers)</p>
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-2 bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            funnel.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${item.tone} transition-[width] duration-300`} style={{ width: `${Math.max(2, item.percent)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-3">Status Distribution</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg animate-pulse" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={80}
                    paddingAngle={2}
                    label={({ name, value }) => ((value ?? 0) > 0 ? `${name}: ${value}` : null)}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-3">Last 7 Days Trend</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg animate-pulse" />
          ) : trendChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No trend data yet</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tests" name="Test submissions" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="uploads" name="CV uploads" stroke="hsl(var(--chart-2, 38 92% 50%))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-3">Today Events (UTC)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">Tests Today</p>
              <p className="text-2xl font-bold">{data.todayTestsCount}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm text-muted-foreground">Meetings Today</p>
              <p className="text-2xl font-bold">{data.todayMeetingsCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-3">Activity Summary</h3>
          <div className="space-y-2 text-sm">
            <p>Open reviews: <span className="font-semibold">{data.totalAwaitingReview}</span></p>
            <p>Decisioned candidates: <span className="font-semibold">{data.totalApproved + data.totalRejected + data.totalShortlisted}</span></p>
            <p>Pending assessments: <span className="font-semibold">{data.totalTestsPending}</span></p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-3">Upcoming Tests</h3>
          <div className="space-y-2">
            {data.upcomingTests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming tests.</p>
            ) : (
              data.upcomingTests.map((item) => (
                <div key={item._id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{item.candidateName || 'Candidate'}</p>
                  <p className="text-muted-foreground">{item.job_role || 'Role not specified'}</p>
                  <p>{safeDate(item.scheduledDateTime)}</p>
                  <p className="text-muted-foreground">Status: {item.status || 'pending'}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-4">
          <h3 className="text-lg font-semibold mb-3">Upcoming Meetings</h3>
          <div className="space-y-2">
            {data.upcomingMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming meetings.</p>
            ) : (
              data.upcomingMeetings.map((item) => (
                <div key={item._id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{item.title || 'Interview'}</p>
                  <p>{safeDate(item.starts_at)}</p>
                  <p className="text-muted-foreground">Status: {item.status || 'scheduled'}</p>
                  {item.candidateId ? (
                    <Link href={`/candidate/${item.candidateId}`} className="text-primary hover:underline">
                      Open candidate
                    </Link>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-background p-4">
        <h3 className="text-lg font-semibold mb-3">Activity Timeline</h3>
        <p className="text-sm text-muted-foreground mb-4">Recent 10: test submissions, meetings scheduled, status changes</p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ul className="space-y-0">
            {activities.map((act, idx) => {
              const icon =
                act.type === 'test_submitted'
                  ? 'ri-file-list-3-line'
                  : act.type === 'meeting_scheduled'
                    ? 'ri-calendar-check-line'
                    : 'ri-user-settings-line';
              const iconBg =
                act.type === 'test_submitted'
                  ? 'bg-primary/10 text-primary'
                  : act.type === 'meeting_scheduled'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-amber-500/10 text-amber-600';
              return (
                <li key={`${act.type}-${act.at}-${idx}`} className="flex gap-3 py-3 border-b border-border last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                    <i className={`${icon} text-sm`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{act.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{safeDate(act.at)}</p>
                    {act.candidateId ? (
                      <Link href={`/candidate/${act.candidateId}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                        View candidate →
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
