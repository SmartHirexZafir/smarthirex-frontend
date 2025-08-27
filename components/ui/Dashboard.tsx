import { Card, CardContent, CardHeader } from "./Card";

export default function Dashboard() {
  return (
    <section className="container max-w-[1600px] py-10 md:py-14">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* KPI Cards */}
        {[
          { label: "Active Users", value: "18,240", delta: "+4.2%" },
          { label: "Conversion", value: "7.9%", delta: "+0.6%" },
          { label: "MRR", value: "$142k", delta: "+2.3%" },
          { label: "NPS", value: "62", delta: "↑" },
        ].map((k, i) => (
          <Card key={i} className="p-0">
            <CardHeader>
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <span className="chip">{k.delta}</span>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-semibold">{k.value}</div>
              <div className="mt-4 h-14 w-full rounded-xl bg-[hsl(var(--muted)/.6)] overflow-hidden">
                {/* Lightweight inline sparkline placeholder */}
                <svg viewBox="0 0 100 24" className="w-full h-full" aria-hidden="true">
                  <polyline fill="none" stroke="currentColor" strokeOpacity=".5" strokeWidth="2"
                    points="0,18 15,16 30,19 45,14 60,12 75,10 90,13 100,9" />
                  <polyline fill="none" stroke="currentColor" strokeWidth="2"
                    points="0,20 15,17 30,22 45,16 60,14 75,12 90,15 100,11" />
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
          <div className="tabs">
            <button className="tab active">Week</button>
            <button className="tab">Month</button>
            <button className="tab">Quarter</button>
          </div>
        </CardHeader>
        <CardContent>
          <div role="table" aria-label="Recent signups" className="w-full overflow-x-auto">
            <div role="rowgroup">
              <div role="row" className="grid grid-cols-4 px-3 py-2 text-xs text-muted-foreground">
                <div role="columnheader">Name</div>
                <div role="columnheader">Email</div>
                <div role="columnheader">Plan</div>
                <div role="columnheader">Joined</div>
              </div>
            </div>
            <div role="rowgroup" className="divide-y divide-white/10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div role="row" key={i} className="grid grid-cols-4 px-3 py-3 text-sm">
                  <div role="cell">Alex Chen</div>
                  <div role="cell" className="truncate">alex.chen@example.com</div>
                  <div role="cell"><span className="badge">Pro</span></div>
                  <div role="cell">Aug 23</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </div>
    </section>
  );
}
