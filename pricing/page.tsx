// app/pricing/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

/* =========================
 * Types & Data
 * ========================= */
type Billing = "monthly" | "yearly";

type Plan = {
  id: "starter" | "pro" | "business" | "enterprise";
  name: string;
  tagline: string;
  monthly: number;     // USD per month
  yearly: number;      // USD per month billed yearly (already discounted)
  cta: { href: string; label: string; secondary?: { href: string; label: string } };
  features: string[];
  limits?: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Get going with CV uploads and quick filtering.",
    monthly: 19,
    yearly: 15, // billed yearly (~20% off)
    cta: { href: "/signup?plan=starter", label: "Get Started" },
    features: [
      "CV Upload & Parsing",
      "Prompt Matching Score",
      "Basic Filters (Role, Experience)",
      "History & Re-run Prompt",
      "Light/ Dark theme UI",
    ],
    limits: ["Up to 100 CVs / month", "1 team member"],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Deeper search, tests, and better collaboration.",
    monthly: 49,
    yearly: 39,
    cta: { href: "/signup?plan=pro", label: "Start Pro" },
    features: [
      "All Starter features",
      "Advanced Filters (Education, Skills, Projects, CV Phrasing)",
      "Smart AI Tests (auto-generated)",
      "Custom Tests (instant MCQ grading)",
      "Candidate Profile w/ Resume preview",
      "Schedule Interviews (Google Meet)",
      "Mongo-backed Scores (no hardcoding)",
    ],
    limits: ["Up to 1,000 CVs / month", "Up to 5 team members"],
    highlight: true,
  },
  {
    id: "business",
    name: "Business",
    tagline: "Scale up with automation and dashboards.",
    monthly: 129,
    yearly: 99,
    cta: { href: "/signup?plan=business", label: "Start Business" },
    features: [
      "All Pro features",
      "Real-time Dashboard & Exports",
      "Accept/Reject Quick Actions",
      "Meetings Gate on Test Completion",
      "SSE live updates (where available)",
      "Usage Reports & Email Templates",
      "Priority Support",
    ],
    limits: ["Up to 10,000 CVs / month", "Up to 20 team members"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Security, scale, and custom workflows.",
    monthly: 0,
    yearly: 0,
    cta: { href: "mailto:sales@smarthirex.example?subject=Enterprise%20Inquiry", label: "Contact Sales", secondary: { href: "/docs", label: "Read Docs" } },
    features: [
      "Everything in Business",
      "Custom Roles & Scoring Models",
      "SLA & Dedicated Support",
      "Audit Logs & Extended Retention",
      "Custom Integrations",
    ],
    limits: ["Unlimited CVs", "Unlimited team members"],
  },
];

const ALL_FEATURES = Array.from(
  new Set(PLANS.flatMap((p) => p.features))
).sort((a, b) => a.localeCompare(b));

/* =========================
 * Helpers
 * ========================= */
function fmtUSD(n: number) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function priceFor(plan: Plan, billing: Billing) {
  const perMonth = billing === "monthly" ? plan.monthly : plan.yearly;
  if (plan.id === "enterprise") return { display: "Custom", perMonth: 0 };
  return { display: `${fmtUSD(perMonth)}/mo`, perMonth };
}

/* =========================
 * Page
 * ========================= */
export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("monthly");

  const yearlyNote = useMemo(
    () => (billing === "yearly" ? "Save up to 20% with annual billing" : undefined),
    [billing]
  );

  return (
    <div className="min-h-screen bg-background page-aurora">
      {/* Header */}
      <div className="bg-card/90 backdrop-blur-sm shadow-lg border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg transition-colors text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Go home"
              >
                <i className="ri-arrow-left-line text-xl" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center">
                  <i className="ri-price-tag-3-line mr-3 text-foreground/80" />
                  Pricing
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose a plan that scales with your hiring workflow.
                </p>
              </div>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-xs text-muted-foreground">{yearlyNote}</div>
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    billing === "monthly"
                      ? "bg-background text-primary border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={billing === "monthly"}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("yearly")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    billing === "yearly"
                      ? "bg-background text-primary border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={billing === "yearly"}
                >
                  Yearly
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {PLANS.map((plan) => {
            const p = priceFor(plan, billing);
            const isHighlighted = !!plan.highlight;
            return (
              <article
                key={plan.id}
                className={[
                  "rounded-2xl border border-border bg-card p-6 shadow-xl transition-shadow",
                  isHighlighted ? "ring-2 ring-primary/60" : "hover:shadow-2xl",
                ].join(" ")}
              >
                {isHighlighted && (
                  <div className="mb-3 inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] px-2.5 py-0.5">
                    <i className="ri-sparkling-2-line mr-1" />
                    Recommended
                  </div>
                )}

                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>

                <div className="mt-5 flex items-end gap-2">
                  <div className="text-3xl font-extrabold tracking-tight">
                    {p.display}
                  </div>
                  {plan.id !== "enterprise" && (
                    <div className="text-xs text-muted-foreground mb-1">
                      billed {billing === "monthly" ? "monthly" : "yearly"}
                    </div>
                  )}
                </div>

                {plan.limits && plan.limits.length > 0 && (
                  <ul className="mt-4 text-sm text-muted-foreground space-y-1">
                    {plan.limits.map((l, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <i className="ri-information-line text-foreground/80" />
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    href={plan.cta.href}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <i className="ri-arrow-right-up-line" />
                    {plan.cta.label}
                  </Link>
                  {plan.cta.secondary && (
                    <Link
                      href={plan.cta.secondary.href}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <i className="ri-login-box-line" />
                      {plan.cta.secondary.label}
                    </Link>
                  )}
                </div>

                {/* Included features (explicit list per requirements) */}
                <div className="mt-6">
                  <div className="text-sm font-semibold">What’s included</div>
                  <ul className="mt-2 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <i className="ri-checkbox-circle-line mt-0.5 text-success" />
                        <span className="text-foreground/90">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Comparison (optional, global-only UI) */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pb-12">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold flex items-center">
              <i className="ri-contrast-drop-2-line mr-2 text-foreground/80" />
              Compare plans
            </h4>
            <div className="text-xs text-muted-foreground">
              Feature availability across plans
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium w-2/5 text-foreground">Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="text-left py-3 px-4 font-medium text-foreground">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ALL_FEATURES.map((feat) => (
                  <tr key={feat}>
                    <td className="py-3 px-4 text-foreground/90">{feat}</td>
                    {PLANS.map((p) => {
                      const included = p.features.includes(feat);
                      return (
                        <td key={p.id} className="py-3 px-4">
                          {included ? (
                            <span className="inline-flex items-center text-success">
                              <i className="ri-checkbox-circle-line mr-1" />
                              <span className="sr-only">Included</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-muted-foreground/60">
                              <i className="ri-close-circle-line mr-1" />
                              <span className="sr-only">Not included</span>
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            * Yearly pricing shown as the effective monthly rate when billed annually.
          </div>
        </div>
      </div>

      {/* FAQ (short, clean, global UI) */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pb-16">
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {[
            {
              q: "Can I change plans later?",
              a: "Yes, you can upgrade or downgrade anytime. Changes take effect immediately, with prorated billing for paid plans.",
            },
            {
              q: "Do you offer trials?",
              a: "Yes, Pro includes a 14-day trial. No credit card required to get started.",
            },
            {
              q: "Is my data secure?",
              a: "We store structured data in MongoDB with role-based access and auditability on higher tiers. CV files remain accessible via secure links.",
            },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-xl">
              <div className="font-semibold">{f.q}</div>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <i className="ri-rocket-2-line" />
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
