export default function PricingPage() {
  const tiers = [
    {
      name: "Starter",
      price: "$0",
      period: "/mo",
      highlight: "Best for testing",
      features: [
        "Up to 100 resumes / month",
        "Basic parsing & matching",
        "Email support",
      ],
      cta: { href: "/signup", label: "Start Free" },
    },
    {
      name: "Pro",
      price: "$39",
      period: "/mo",
      highlight: "Most popular",
      features: [
        "5,000 resumes / month",
        "JD analyzer + semantic ranking",
        "AI shortlist & duplicate detection",
        "Interview scheduling",
        "Priority support",
      ],
      cta: { href: "/signup?plan=pro", label: "Get Pro" },
      featured: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      highlight: "For large teams",
      features: [
        "Unlimited resumes",
        "SSO, audit logs, roles",
        "Custom model integration",
        "Dedicated CSM & SLOs",
      ],
      cta: { href: "/contact-sales", label: "Contact Sales" },
    },
  ];

  return (
    <main className="container max-w-6xl py-14">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold">Simple, transparent pricing</h1>
        <p className="text-muted-foreground mt-2">
          Start free — upgrade when you’re ready.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-3xl p-6 md:p-7 glass gradient-border ring-1 ring-border ${
              t.featured ? "scale-[1.02] shadow-xl" : "shadow-soft"
            }`}
          >
            {t.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary)/0.3)]">
                {t.highlight}
              </div>
            )}
            <h3 className="text-2xl font-bold mb-1">{t.name}</h3>
            {!t.featured && <div className="text-xs text-muted-foreground mb-4">{t.highlight}</div>}
            <div className="flex items-end gap-1 mb-6">
              <span className="text-4xl font-extrabold gradient-text">{t.price}</span>
              <span className="text-muted-foreground mb-1">{t.period}</span>
            </div>
            <ul className="space-y-3 text-sm mb-8">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <i className="ri-check-line text-[hsl(var(--success))] mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a href={t.cta.href} className={`btn w-full ${t.featured ? "btn-primary" : "btn-outline"}`}>
              {t.cta.label}
            </a>
          </div>
        ))}
      </div>

      <section className="mt-12 text-center text-sm text-muted-foreground">
        Need a custom plan? <a className="underline hover:no-underline" href="/contact-sales">Talk to us</a>.
      </section>
    </main>
  );
}
