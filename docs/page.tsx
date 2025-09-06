// app/docs/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { copyToClipboard } from "../lib/util";

/* =========================
 * API base (aligned with app)
 * ========================= */
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:10000"
).replace(/\/$/, "");

/* =========================
 * Types
 * ========================= */
type GalleryImage = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  caption?: string;
};

type DocsData = {
  overview?: string;
  features?: string[];
  flows?: Array<{ name: string; steps: string[] }>;
  faq?: Array<{ q: string; a: string }>;
  notes?: string[];
  // Optional images support (to satisfy “include images” requirement)
  gallery?: GalleryImage[];
  // Fallback alias if backend uses "images"
  images?: GalleryImage[];
};

type Section =
  | "overview"
  | "getting-started"
  | "features"
  | "flows"
  | "scores"
  | "data"
  | "auth"
  | "ui-theming"
  | "faq"
  | "gallery";

/* =========================
 * Fallback content (from spec)
 * ========================= */
const DEFAULT_DOCS: DocsData = {
  overview:
    "SmartHireX helps you go from resume intake to decision—fast. Upload CVs, filter with precise prompts or structured criteria, auto-grade candidates with Smart AI or Custom tests, gate interviews until tests are done, and track everything on a real-time dashboard. The entire UI is globally themed (Neon Eclipse), consistent across pages, and works beautifully in light and dark modes.",
  features: [
    "Global, unified UI (Neon Eclipse) with light/dark modes across ALL pages",
    "Single global Footer on every page",
    "Navbar fonts slightly heavier (consistent, global-only)",
    "Route protection: unauthenticated users cannot navigate protected routes",
    "Landing page: Logo unified across site, no extra dot/span area",
    "Header: Components tab removed; keep Home, Features, Pricing, Docs",
    "Auth: Get Started (Sign Up) primary; Login link below; Google auth on Login & Sign Up",
    "Hero Upload Resume redirects to Login/Sign Up when not authenticated",
    "Upload: Logo subtly enhanced; profile menu → Profile page; Logout option",
    "Toasts auto-dismiss; no stuck loaders; robust loading state handling",
    "Chatbot Filters: scrollable, flyout/card style (like History re-run)",
    "Filter logic targeted by section (Job Role, Experience, Education, Skills, Projects, CV phrasing)",
    "Related roles show % match vs ML-predicted role",
    "MongoDB as source of truth: no hardcoded values; fix nulls and normalization",
    "Scores: Prompt Matching Score and ML Confidence Score displayed where relevant",
    "History: Inline View Results (no jumping), correct Matching Score from Mongo; Send Test / Schedule Interview navigate directly",
    "Candidate Profile: accurate data, open resume in browser, and test history links open",
    "Tests: score updates; one test type per candidate; randomized generation; custom tests instantly graded (MCQs) and LLM-graded for freeform",
    "Meetings: cannot schedule before test; fix 500 error; keep countdown & UI",
    "Dashboard: Accept/Reject flows, acceptance email, export, live stats (SSE ready)",
    "Exception handling, loaders, error pages, scrollbars/overlays tuned globally",
  ],
  flows: [
    {
      name: "Authentication & Access",
      steps: [
        "Sign Up (primary) with email & Google; Login available with Google.",
        "Route protection enforced globally: protected pages block unauthenticated navigation.",
        "Hero ‘Upload Resume’ sends users to Login/Sign Up when needed.",
      ],
    },
    {
      name: "Upload & Parsing",
      steps: [
        "Upload CVs on the Upload page; parsing normalizes data fields in Mongo.",
        "Global toast confirms success and auto-dismisses.",
        "Logo slightly enhanced; footer visible here too.",
      ],
    },
    {
      name: "Filtering & Chatbot",
      steps: [
        "Use Filters flyout (card/flyout UI like History re-run) or write a Prompt.",
        "Search runs in the relevant section only (Job Role, Experience, Education, Skills, Projects, CV phrasing).",
        "Robust loader handling: spinner stops on ‘no results’; Candidate filter never stuck.",
      ],
    },
    {
      name: "Tests",
      steps: [
        "Send Smart AI or Custom test (one type per candidate).",
        "Smart AI test is randomized per candidate.",
        "Custom MCQs auto-graded immediately; other answers graded by the model.",
        "Scores update in Mongo; PDFs and detailed breakdowns available.",
      ],
    },
    {
      name: "Meetings",
      steps: [
        "Scheduling is gated until the candidate completes a test.",
        "Attempting to schedule early shows a clear dialog.",
        "Backend 500s handled; robust UI with countdown; emails sent with meeting link.",
      ],
    },
    {
      name: "History & Candidate Profile",
      steps: [
        "History ‘View Results’ opens inline without jumping; Matching Score read from Mongo.",
        "Re-run Prompt mirrors Upload chatbot, scoped to that block’s CVs.",
        "Candidate Profile shows accurate info, resume opens in browser, and test history links open.",
      ],
    },
    {
      name: "Dashboard",
      steps: [
        "Quick Accept/Reject actions update lists.",
        "Acceptance emails sent; exports available.",
        "Real-time stats across uploads, filters, tests, meetings, decisions (SSE-ready).",
      ],
    },
  ],
  faq: [
    {
      q: "How are the two scores different?",
      a: "Prompt Matching Score shows how closely a CV matches your prompt/filters. ML Confidence Score shows how confident the model is in its predicted role for that CV.",
    },
    {
      q: "Why do related roles show percentages?",
      a: "Each related role displays its match percentage against the ML-predicted role to provide quick context.",
    },
    {
      q: "Why do I see nulls in Mongo?",
      a: "Legacy parsing and partial uploads can leave fields empty. The normalization step ensures consistent schemas and fills derived fields; UI reads only from Mongo (no hardcoding).",
    },
    {
      q: "Can I schedule interviews before tests?",
      a: "No. Meeting scheduling is gated until tests are completed to improve signal quality.",
    },
  ],
  notes: [
    "All UI elements—fonts, buttons, overlays—are globally themed. Components import global tokens; no local overrides that conflict.",
    "Navbar fonts are slightly heavier globally.",
    "Footer appears across all pages via layout.",
  ],
};

/* =========================
 * Safe fetcher with fallback
 * ========================= */
async function loadDocsData(): Promise<DocsData> {
  // Preferred: backend static JSON maintained by you
  try {
    const res = await fetch(`${API_BASE}/static/usage_guide.json`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as DocsData;
      // Normalize possible "images" alias to "gallery"
      if (!json.gallery && Array.isArray(json.images)) json.gallery = json.images;
      return json || DEFAULT_DOCS;
    }
  } catch {
    // ignore and fallback
  }

  // Optional alternate path if your backend exposes a docs route
  try {
    const res = await fetch(`${API_BASE}/docs/usage`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as DocsData;
      if (!json.gallery && Array.isArray(json.images)) json.gallery = json.images;
      return json || DEFAULT_DOCS;
    }
  } catch {
    // ignore and fallback
  }

  return DEFAULT_DOCS;
}

/* =========================
 * Small UI helpers
 * ========================= */
const BASE_SECTIONS: Array<{ id: Exclude<Section, "gallery">; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "ri-compass-3-line" },
  { id: "getting-started", label: "Getting Started", icon: "ri-rocket-2-line" },
  { id: "features", label: "Features", icon: "ri-list-check-2" },
  { id: "flows", label: "System Flows", icon: "ri-route-line" },
  { id: "scores", label: "Scores", icon: "ri-bar-chart-2-line" },
  { id: "data", label: "Data & Mongo", icon: "ri-database-2-line" },
  { id: "auth", label: "Auth & Routing", icon: "ri-shield-check-line" },
  { id: "ui-theming", label: "UI & Theming", icon: "ri-palette-line" },
  { id: "faq", label: "FAQ", icon: "ri-questionnaire-line" },
];

function Anchor({ id, children }: { id: string; children: React.ReactNode }) {
  const handleCopy = async () => {
    const url = `${location.origin}${location.pathname}#${id}`;
    await copyToClipboard(url);
  };
  return (
    <div className="group flex items-center gap-2 mb-3">
      <a id={id} href={`#${id}`} className="text-xl font-bold">
        {children}
      </a>
      <button
        type="button"
        aria-label="Copy link"
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:bg-muted"
        title="Copy link to section"
      >
        <i className="ri-link-m" />
      </button>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-muted p-3 text-xs text-foreground/90">
      {children}
    </pre>
  );
}

/* =========================
 * Page
 * ========================= */
export default function DocsPage() {
  const [docs, setDocs] = useState<DocsData>(DEFAULT_DOCS);
  const [q, setQ] = useState("");

  useEffect(() => {
    let mounted = true;
    loadDocsData().then((d) => mounted && setDocs(d));
    return () => {
      mounted = false;
    };
  }, []);

  const filteredFeatures = useMemo(() => {
    const all = docs.features || [];
    if (!q.trim()) return all;
    const term = q.toLowerCase();
    return all.filter((f) => f.toLowerCase().includes(term));
  }, [docs.features, q]);

  const hasGallery = Array.isArray(docs.gallery) && docs.gallery.length > 0;
  const navSections = useMemo(() => {
    return hasGallery
      ? [
          ...BASE_SECTIONS,
          { id: "gallery" as const, label: "Gallery", icon: "ri-image-2-line" },
        ]
      : BASE_SECTIONS;
  }, [hasGallery]);

  return (
    <div className="min-h-screen bg-background page-aurora">
      {/* Header */}
      <div className="bg-card/90 backdrop-blur-sm shadow-lg border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg transition-colors text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Go home"
              >
                <i className="ri-arrow-left-line text-xl" />
              </Link>
              <div className="flex items-center gap-3">
                <Image
                  src="/web-logo.png"
                  width={40}
                  height={40}
                  alt="SmartHireX"
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-2xl font-bold">Documentation</h1>
                  <p className="text-sm text-muted-foreground">
                    Learn how SmartHireX is wired end-to-end.
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/features"
                className="px-3 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
              >
                <i className="ri-stars-line mr-1" />
                Features
              </Link>
              <Link
                href="/pricing"
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
              >
                <i className="ri-price-tag-3-line mr-1" />
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content with sticky sidebar */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block col-span-3">
          <div className="sticky top-24 space-y-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xl">
              <div className="text-sm font-semibold mb-3">On this page</div>
              <nav className="space-y-1">
                {navSections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <i className={`${s.icon}`} />
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-xl">
              <div className="text-sm font-semibold mb-2">Search features</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type to filter…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-2 text-xs text-muted-foreground">
                Showing {filteredFeatures.length} of {(docs.features || []).length}
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 lg:col-span-9 space-y-10">
          {/* Overview */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Anchor id="overview">Overview</Anchor>
            <p className="text-foreground/90">{docs.overview}</p>
          </section>

          {/* Getting Started */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Anchor id="getting-started">Getting Started</Anchor>
            <ol className="list-decimal pl-5 space-y-2 text-foreground/90">
              <li>
                <span className="font-medium">Sign Up:</span> Use{" "}
                <Link href="/signup" className="underline">
                  Get Started
                </Link>{" "}
                (Google login supported). Already have an account? Use{" "}
                <Link href="/login" className="underline">
                  Login
                </Link>.
              </li>
              <li>
                <span className="font-medium">Upload CVs:</span> Go to{" "}
                <Link href="/upload" className="underline">
                  Upload
                </Link>{" "}
                and add resumes. Toasts auto-dismiss when complete.
              </li>
              <li>
                <span className="font-medium">Filter & Chatbot:</span> Open the Filters flyout (same style as History → Re-run Prompt) or write a prompt. Results respect targeted sections (Role, Experience, Education, Skills, Projects, CV phrasing).
              </li>
              <li>
                <span className="font-medium">Test Candidates:</span> Send Smart AI or Custom tests (one type per candidate). Custom MCQs grade instantly; other answers graded by the model.
              </li>
              <li>
                <span className="font-medium">Schedule Interviews:</span> After tests, schedule via{" "}
                <Link href="/meetings" className="underline">
                  Meetings
                </Link>. Meeting scheduling is gated until a test is complete.
              </li>
              <li>
                <span className="font-medium">Track & Decide:</span> Use{" "}
                <Link href="/dashboard" className="underline">
                  Dashboard
                </Link>{" "}
                for live stats; Accept/Reject flows, export, and emails.
              </li>
            </ol>
          </section>

          {/* Features */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Anchor id="features">Features</Anchor>
            <div className="grid md:grid-cols-2 gap-3">
              {filteredFeatures.map((f) => (
                <div
                  key={f}
                  className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3"
                >
                  <i className="ri-checkbox-circle-line text-success mt-0.5" />
                  <span className="text-sm">{f}</span>
                </div>
              ))}
              {filteredFeatures.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No matching features for “{q}”.
                </div>
              )}
            </div>
          </section>

          {/* Flows */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Anchor id="flows">System Flows</Anchor>
            <div className="space-y-5">
              {(docs.flows || []).map((flow, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                      <i className="ri-route-line" />
                    </div>
                    <h3 className="font-semibold">{flow.name}</h3>
                  </div>
                  <ol className="mt-3 list-decimal pl-5 space-y-1 text-sm">
                    {flow.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          {/* Scores */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Anchor id="scores">Scores</Anchor>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-sm font-semibold">Prompt Matching Score</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Measures how closely a CV matches the filters/prompt you provided.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-sm font-semibold">ML Confidence Score</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confidence of the model in its predicted role for the CV.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-sm font-semibold">Related Roles %</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each related role shows its match % compared to the ML-predicted role.
                </p>
              </div>
            </div>
          </section>

          {/* Data & Mongo */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Anchor id="data">Data & Mongo</Anchor>
            <p className="text-sm text-foreground/90">
              MongoDB is the single source of truth—no hardcoded values. Normalization fixes nulls and schema gaps so UI can reliably display accurate, complete information.
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              Typical collections: <code>candidates</code>, <code>attempts</code>, <code>history</code>,{" "}
              <code>meetings</code>, <code>dashboard</code>.
            </div>
            <Code>
{`// Example: read test history for a candidate (client-safe)
// GET ${API_BASE}/tests/history/{candidateId}
fetch(\`${API_BASE}/tests/history/123\`, { headers: { Authorization: "Bearer <token>" }})
  .then(r => r.json())
  .then(console.log);`}
            </Code>
          </section>

          {/* Auth & Routing */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Anchor id="auth">Auth & Routing</Anchor>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Public pages: Home, Features, Pricing, Docs, Login, Signup.</li>
              <li>Protected pages: Upload, History, Candidate Profile, Test, Meetings, Dashboard.</li>
              <li>
                Middleware enforces protection; unauthenticated users are redirected to{" "}
                <code>/login?next=…</code>.
              </li>
            </ul>
            <Code>
{`// Middleware logic (simplified):
if (!isPublicPath && !hasAuthCookie) {
  return NextResponse.redirect(new URL("/login?next=" + pathname, req.url));
}`}
            </Code>
          </section>

          {/* UI & Theming */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Anchor id="ui-theming">UI & Theming</Anchor>
            <p className="text-sm text-foreground/90">
              The entire UI is governed by global tokens in <code>globals.css</code>,{" "}
              <code>tailwind.config.js</code>, and <code>layout.tsx</code>. Individual components import and use
              these tokens—no local visual overrides that could conflict. Light and Dark modes are thoroughly tested.
            </p>
            <div className="mt-4 grid md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-sm font-semibold">Neon Eclipse</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Global theme name and palette applied across backgrounds, buttons, overlays, and scrollbars.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-sm font-semibold">Typography</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Navbar fonts slightly heavier. Text scales via tokens for consistent hierarchy.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-sm font-semibold">Footer</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Single, global footer surfaces on every page via the root layout.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <Anchor id="faq">FAQ</Anchor>
            <div className="grid md:grid-cols-2 gap-4">
              {(docs.faq || []).map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="font-semibold">{f.q}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
            {docs.notes && docs.notes.length > 0 && (
              <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-sm font-semibold mb-2">Notes</div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {docs.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Gallery (images) */}
          {hasGallery && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-xl">
              <Anchor id="gallery">Gallery</Anchor>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.gallery!.map((img, i) => {
                  const w = img.width || 1200;
                  const h = img.height || 720;
                  return (
                    <figure
                      key={`${img.src}-${i}`}
                      className="overflow-hidden rounded-xl border border-border bg-background"
                    >
                      <Image
                        src={img.src}
                        alt={img.alt || "Documentation image"}
                        width={w}
                        height={h}
                        className="h-auto w-full object-cover"
                      />
                      {img.caption && (
                        <figcaption className="p-3 text-xs text-muted-foreground">
                          {img.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            </section>
          )}

          {/* API Examples (bonus) */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="group flex items-center gap-2 mb-3">
              <h2 className="text-xl font-bold">API Examples</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-semibold">Start a Test</div>
                <Code>
{`// POST ${API_BASE}/tests/start
fetch("${API_BASE}/tests/start", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: "<invite-token>" }),
}).then(r => r.json());`}
                </Code>
              </div>
              <div>
                <div className="text-sm font-semibold">Submit Test Answers</div>
                <Code>
{`// POST ${API_BASE}/tests/submit
fetch("${API_BASE}/tests/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: "<invite-token>", answers: [] }),
}).then(r => r.json());`}
                </Code>
              </div>
              <div>
                <div className="text-sm font-semibold">Schedule Interview</div>
                <Code>
{`// POST ${API_BASE}/interviews/schedule
fetch("${API_BASE}/interviews/schedule", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    candidateId: "<id>",
    email: "candidate@email.com",
    startsAt: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    durationMins: 45,
    title: "Interview – Frontend Developer",
  }),
}).then(r => r.json());`}
                </Code>
              </div>
              <div>
                <div className="text-sm font-semibold">Download Attempt PDF</div>
                <Code>
{`// GET ${API_BASE}/tests/history/<candidateId>/<attemptId>/report.pdf
const url = "${API_BASE}/tests/history/<candidateId>/<attemptId>/report.pdf";
window.open(url, "_blank");`}
                </Code>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
