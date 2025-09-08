// app/docs/page.tsx
import { SECTIONS, type DocItem, type DocSection } from "../../content/docs";

function Diagram({ variant }: { variant: "architecture" | "pipeline" }) {
  if (variant === "architecture") {
    return (
      <div className="w-full rounded-2xl p-6 panel ring-1 ring-border">
        <h4 className="text-sm font-semibold text-foreground mb-4">System Architecture (Simplified)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* UI Layer */}
          <div className="rounded-xl p-4 card ring-1 ring-border shadow-soft">
            <div className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-2">UI Layer</div>
            <div className="grid gap-2">
              <span className="chip">Web App</span>
              <span className="chip">Recruiter Portal</span>
              <span className="chip">Candidate Portal</span>
            </div>
          </div>

          {/* Application Layer */}
          <div className="rounded-xl p-4 card ring-1 ring-border shadow-soft">
            <div className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-2">Application Layer</div>
            <div className="grid gap-2">
              <span className="chip">Resume Parser</span>
              <span className="chip">JD Analyzer</span>
              <span className="chip">Matching Engine</span>
              <span className="chip">Chatbot (AI)</span>
              <span className="chip">Skill Gap / Scoring</span>
              <span className="chip">Scheduling</span>
            </div>
          </div>

          {/* Data / Services */}
          <div className="rounded-xl p-4 card ring-1 ring-border shadow-soft">
            <div className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-2">Data & Services</div>
            <div className="grid gap-2">
              <span className="chip">DB (PostgreSQL/Firebase)</span>
              <span className="chip">Object Storage</span>
              <span className="chip">ML Models (BERT etc.)</span>
              <span className="chip">Calendar APIs</span>
              <span className="chip">Export (PDF/Excel)</span>
            </div>
          </div>
        </div>

        {/* Simple connectors */}
        <div className="mt-6 grid grid-cols-3 items-center gap-2">
          <div className="h-0.5 bg-[hsl(var(--border))]" />
          <div className="text-center text-xs text-[hsl(var(--muted-foreground))]">Secure APIs / Services</div>
          <div className="h-0.5 bg-[hsl(var(--border))]" />
        </div>
      </div>
    );
  }

  // pipeline
  return (
    <div className="w-full rounded-2xl p-6 panel ring-1 ring-border">
      <h4 className="text-sm font-semibold text-foreground mb-4">Hiring Pipeline (High-Level)</h4>
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {[
          "Upload CVs",
          "Parse & Normalize",
          "JD Analyze",
          "Match & Score",
          "Shortlist",
          "Schedule",
          "Offer / Feedback",
        ].map((stage, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-xl card ring-1 ring-border shadow-soft text-sm">{stage}</div>
            {i < 6 && <div className="hidden md:block w-10 h-0.5 bg-[hsl(var(--border))]" aria-hidden />}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderItem(item: DocItem) {
  switch (item.type) {
    case "text":
      return <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{item.text}</p>;
    case "list":
      return (
        <ul className="list-disc pl-5 space-y-2 text-[hsl(var(--muted-foreground))]">
          {item.items?.map((li, idx) => <li key={idx}>{li}</li>)}
        </ul>
      );
    case "image":
      return (
        <figure className="rounded-2xl p-4 card ring-1 ring-border shadow-soft">
          {/* local /public image only */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.src!} alt={item.alt || ""} className="w-28 h-28 object-contain" />
          {item.caption && (
            <figcaption className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{item.caption}</figcaption>
          )}
        </figure>
      );
    case "diagram":
      return <Diagram variant={item.variant || "architecture"} />;
    default:
      return null;
  }
}

export default function DocsPage() {
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="container">
        {/* Heading */}
        <header className="mb-10 md:mb-14 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            SmartHirex <span className="gradient-text">Documentation</span>
          </h1>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
            End-to-end guide for site flow, resume processing, testing, meetings, dashboards, authentication, and more.
          </p>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* TOC */}
          <aside className="lg:col-span-3">
            <nav
              aria-label="Table of contents"
              className="sticky top-24 card p-4 ring-1 ring-border shadow-soft"
            >
              <div className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-3">On this page</div>
              <ul className="space-y-2">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="nav-item">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <div className="lg:col-span-9 space-y-10">
            {SECTIONS.map((section: DocSection) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <div className="card p-6 md:p-8 ring-1 ring-border shadow-soft">
                  <header className="mb-4">
                    <h2 className="text-2xl md:text-3xl font-semibold text-foreground">{section.title}</h2>
                    {section.intro && (
                      <p className="mt-2 text-[hsl(var(--muted-foreground))]">{section.intro}</p>
                    )}
                  </header>

                  <div className="grid gap-6">
                    {section.items.map((item, idx) => (
                      <div key={idx}>{renderItem(item)}</div>
                    ))}
                  </div>
                </div>
              </section>
            ))}

            {/* Back to top */}
            <div className="text-center">
              <a href="#top" className="btn btn-outline">Back to top</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
