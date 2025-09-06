import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "./Card";
import Button from "./Button";

/**
 * Dashboard (global-only UI)
 * - Uses global primitives (.card, .btn, .chip, .badge, .tabs, etc.)
 * - No local UI styles that override global Neon Eclipse theme
 * - Live KPIs via SSE (if backend stream available), with safe fallbacks to HTTP
 * - Export table data
 * - Quick Accept/Reject actions (wire-up endpoints; no hardcoding)
 */

type Summary = {
  activeUsers: number;
  conversion: number; // percent 0..100
  mrr: number; // USD numeric
  nps: number;
  deltas?: Partial<Record<keyof Summary, string>>; // e.g., "+4.2%"
};

type Signup = {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Pro" | "Team" | "Enterprise" | string;
  joined: string; // ISO or pretty
  status?: "accepted" | "rejected" | "pending";
};

type RangeKey = "week" | "month" | "quarter";

const USD = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const PCT = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 });

export default function Dashboard() {
  // ---------- KPI state ----------
  const [summary, setSummary] = useState<Summary>({
    activeUsers: 18240,
    conversion: 7.9,
    mrr: 142000,
    nps: 62,
    deltas: { activeUsers: "+4.2%", conversion: "+0.6%", mrr: "+2.3%", nps: "↑" },
  });

  // ---------- Table state ----------
  const [range, setRange] = useState<RangeKey>("week");
  const [rows, setRows] = useState<Signup[]>(
    Array.from({ length: 6 }).map((_, i) => ({
      id: `seed-${i + 1}`,
      name: "Alex Chen",
      email: "alex.chen@example.com",
      plan: "Pro",
      joined: "Aug 23",
      status: "pending",
    }))
  );
  const [loadingRows, setLoadingRows] = useState(false);

  // ---------- Effects: fetch + SSE ----------
  useEffect(() => {
    let abort = false;

    async function fetchSummary() {
      try {
        const res = await fetch(`/api/dashboard/summary`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<Summary>;
        if (abort) return;
        setSummary((prev) => ({
          activeUsers: data.activeUsers ?? prev.activeUsers,
          conversion: data.conversion ?? prev.conversion,
          mrr: data.mrr ?? prev.mrr,
          nps: data.nps ?? prev.nps,
          deltas: { ...prev.deltas, ...(data.deltas || {}) },
        }));
      } catch {
        /* silent fallback */
      }
    }

    // Try initial HTTP load
    fetchSummary();

    // Live updates via SSE if available
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/dashboard/stream`);
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as Partial<Summary>;
          if (abort) return;
          setSummary((prev) => ({
            activeUsers: data.activeUsers ?? prev.activeUsers,
            conversion: data.conversion ?? prev.conversion,
            mrr: data.mrr ?? prev.mrr,
            nps: data.nps ?? prev.nps,
            deltas: { ...prev.deltas, ...(data.deltas || {}) },
          }));
        } catch {
          /* ignore malformed chunk */
        }
      };
      es.onerror = () => {
        // close on error; keep HTTP fallback
        es?.close();
      };
    } catch {
      // ignore if EventSource unsupported
    }

    return () => {
      abort = true;
      es?.close();
    };
  }, []);

  useEffect(() => {
    let abort = false;
    setLoadingRows(true);

    async function fetchRows() {
      try {
        const res = await fetch(`/api/dashboard/recent-signups?range=${range}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Signup[];
        if (!abort && Array.isArray(data) && data.length) {
          setRows(data);
        }
      } catch {
        // keep seeded placeholders
      } finally {
        if (!abort) setLoadingRows(false);
      }
    }

    fetchRows();
    return () => {
      abort = true;
    };
  }, [range]);

  // ---------- Actions ----------
  async function decide(id: string, decision: "accepted" | "rejected") {
    // optimistic UI
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: decision } : r))
    );
    try {
      const res = await fetch(`/api/dashboard/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      if (!res.ok) throw new Error(`Failed decision ${res.status}`);
      // no-op on success; backend should emit SSE to reflect in other views
    } catch {
      // rollback on failure
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "pending" } : r
        )
      );
    }
  }

  function exportCSV() {
    const header = ["Name", "Email", "Plan", "Joined", "Status"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [r.name, r.email, r.plan, r.joined, r.status ?? "pending"]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signups-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Derived KPI tiles ----------
  const kpis = useMemo(
    () => [
      {
        key: "activeUsers",
        label: "Active Users",
        value: summary.activeUsers.toLocaleString(),
        delta: summary.deltas?.activeUsers ?? "",
      },
      {
        key: "conversion",
        label: "Conversion",
        value: `${summary.conversion.toFixed(1)}%`,
        delta: summary.deltas?.conversion ?? "",
      },
      {
        key: "mrr",
        label: "MRR",
        value: USD.format(summary.mrr),
        delta: summary.deltas?.mrr ?? "",
      },
      {
        key: "nps",
        label: "NPS",
        value: `${summary.nps}`,
        delta: summary.deltas?.nps ?? "",
      },
    ],
    [summary]
  );

  return (
    <section className="container max-w-[1600px] py-10 md:py-14">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((k) => (
          <Card key={k.key} className="p-0">
            <CardHeader>
              <span className="text-xs text-muted-foreground">{k.label}</span>
              {k.delta && <span className="chip">{k.delta}</span>}
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-semibold">{k.value}</div>
              <div className="mt-4 h-14 w-full rounded-xl bg-[hsl(var(--muted)/.6)] overflow-hidden">
                {/* Lightweight inline sparkline placeholder (keeps global-only UI) */}
                <svg viewBox="0 0 100 24" className="w-full h-full" aria-hidden="true">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity=".5"
                    strokeWidth="2"
                    points="0,18 15,16 30,19 45,14 60,12 75,10 90,13 100,9"
                  />
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points="0,20 15,17 30,22 45,16 60,14 75,12 90,15 100,11"
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="mt-8 card">
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Signups</h3>
          <div className="flex items-center gap-3">
            <div className="tabs">
              <button
                className={`tab ${range === "week" ? "active" : ""}`}
                onClick={() => setRange("week")}
                aria-pressed={range === "week"}
              >
                Week
              </button>
              <button
                className={`tab ${range === "month" ? "active" : ""}`}
                onClick={() => setRange("month")}
                aria-pressed={range === "month"}
              >
                Month
              </button>
              <button
                className={`tab ${range === "quarter" ? "active" : ""}`}
                onClick={() => setRange("quarter")}
                aria-pressed={range === "quarter"}
              >
                Quarter
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} aria-label="Export CSV">
              <i className="ri-download-2-line" aria-hidden="true" />
              Export
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div role="table" aria-label="Recent signups" className="w-full overflow-x-auto">
            <div role="rowgroup">
              <div
                role="row"
                className="grid grid-cols-5 px-3 py-2 text-xs text-muted-foreground"
              >
                <div role="columnheader">Name</div>
                <div role="columnheader">Email</div>
                <div role="columnheader">Plan</div>
                <div role="columnheader">Joined</div>
                <div role="columnheader" className="text-right">
                  Actions
                </div>
              </div>
            </div>

            <div role="rowgroup" className="divide-y divide-white/10">
              {loadingRows &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    role="row"
                    key={`sk-${i}`}
                    className="grid grid-cols-5 px-3 py-3"
                  >
                    <div role="cell" className="skeleton h-5 w-28" />
                    <div role="cell" className="skeleton h-5 w-56" />
                    <div role="cell" className="skeleton h-5 w-14" />
                    <div role="cell" className="skeleton h-5 w-16" />
                    <div role="cell" className="flex items-center justify-end gap-2">
                      <div className="skeleton h-8 w-16" />
                      <div className="skeleton h-8 w-16" />
                    </div>
                  </div>
                ))}

              {!loadingRows &&
                rows.map((r) => (
                  <div role="row" key={r.id} className="grid grid-cols-5 px-3 py-3 text-sm">
                    <div role="cell">{r.name}</div>
                    <div role="cell" className="truncate">{r.email}</div>
                    <div role="cell">
                      <span className="badge">{r.plan}</span>
                    </div>
                    <div role="cell">
                      {r.joined}
                    </div>
                    <div role="cell" className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => decide(r.id, "accepted")}
                        disabled={r.status === "accepted"}
                      >
                        <i className="ri-check-line" aria-hidden="true" />
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => decide(r.id, "rejected")}
                        disabled={r.status === "rejected"}
                      >
                        <i className="ri-close-line" aria-hidden="true" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </div>
    </section>
  );
}
