// app/pricing/page.tsx
import Link from "next/link";
import { FEATURES, type Feature } from "../../content/features";

type Plan = {
  id: "starter" | "growth" | "enterprise";
  name: string;
  price: string; // display only
  blurb: string;
  featureIds: Feature["id"][];
  ctaSecondaryHref?: string;
};

const byId = Object.fromEntries(FEATURES.map((f) => [f.id, f]));

function pickFeatures(ids: Feature["id"][]): Feature[] {
  return ids
    .map((id) => byId[id])
    .filter(Boolean) as Feature[];
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$0",
    blurb: "Everything you need to try Smart HireX with core AI screening.",
    featureIds: [
      "ai-resume-screening",
      "resume-processing",
      "analytics",
    ],
    ctaSecondaryHref: "/contact",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$49",
    blurb: "Scale your hiring with matching, assessments, and scheduling.",
    featureIds: [
      "ai-resume-screening",
      "resume-processing",
      "analytics",
      "candidate-matching",
      "interview-scheduling",
      "test-generation",
    ],
    ctaSecondaryHref: "/contact",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    blurb: "Advanced security, collaboration, and enterprise support.",
    featureIds: [
      "ai-resume-screening",
      "resume-processing",
      "analytics",
      "candidate-matching",
      "interview-scheduling",
      "test-generation",
      "neural-matching",
      "predictive-scoring",
      "verification-suite",
      "collab-hub",
    ],
    ctaSecondaryHref: "/contact",
  },
];

export default function PricingPage() {
  return (
    <section className="py-16 md:py-24 bg-transparent">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Pricing <span className="gradient-text">Plans</span>
          </h1>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] text-lg max-w-3xl mx-auto">
            Choose the plan that fits your team. Upgrade any time — all plans use the same
            <span className="px-1"> </span>
            Neon Eclipse design system and feature set foundation.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {PLANS.map((plan) => {
            const feats = pickFeatures(plan.featureIds);
            return (
              <article key={plan.id} className="card p-6 md:p-8 ring-1 ring-border shadow-soft flex flex-col">
                {/* Plan header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-foreground">{plan.name}</h2>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-foreground">{plan.price}</div>
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {plan.price === "Custom" ? "" : "/mo"}
                    </span>
                  </div>
                  <p className="mt-3 text-[hsl(var(--muted-foreground))]">{plan.blurb}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {feats.map((f) => (
                    <li key={f.id} className="flex items-start gap-3">
                      <span
                        className={`
                          mt-0.5 inline-grid place-items-center rounded-md w-6 h-6 ring-1 ring-border
                          bg-[hsl(var(--${f.tone})/.16)]
                        `}
                        aria-hidden="true"
                      >
                        <i className={`${f.icon} text-[hsl(var(--${f.tone}))]`} />
                      </span>
                      <div className="flex-1">
                        <div className="text-sm text-foreground font-medium">{f.title}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{f.label}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Actions */}
                <div className="mt-auto flex flex-col sm:flex-row gap-3">
                  <Link href="/signup" className="btn btn-primary w-full sm:w-auto">
                    Get Started
                  </Link>
                  {plan.ctaSecondaryHref && (
                    <Link href={plan.ctaSecondaryHref} className="btn btn-outline w-full sm:w-auto">
                      Talk to Sales
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
