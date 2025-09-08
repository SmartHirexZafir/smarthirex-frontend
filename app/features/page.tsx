// app/features/page.tsx
import Link from "next/link";
import { FEATURES, type Feature } from "../../content/features";

const toneStyles: Record<
  Feature["tone"],
  { grad: string; chipBg: string; chipText: string }
> = {
  info: {
    grad: "from-[hsl(var(--info))] to-[hsl(var(--primary))]",
    chipBg: "bg-[hsl(var(--info)/.16)]",
    chipText: "text-[hsl(var(--info))]",
  },
  accent: {
    grad: "from-[hsl(var(--accent))] to-[hsl(var(--primary))]",
    chipBg: "bg-[hsl(var(--accent)/.16)]",
    chipText: "text-[hsl(var(--accent))]",
  },
  success: {
    grad: "from-[hsl(var(--success))] to-[hsl(var(--primary))]",
    chipBg: "bg-[hsl(var(--success)/.16)]",
    chipText: "text-[hsl(var(--success))]",
  },
  warning: {
    grad: "from-[hsl(var(--warning))] to-[hsl(var(--accent))]",
    chipBg: "bg-[hsl(var(--warning)/.16)]",
    chipText: "text-[hsl(var(--warning))]",
  },
  secondary: {
    grad: "from-[hsl(var(--secondary))] to-[hsl(var(--accent))]",
    chipBg: "bg-[hsl(var(--secondary)/.16)]",
    chipText: "text-[hsl(var(--secondary))]",
  },
  primary: {
    grad: "from-[hsl(var(--primary))] to-[hsl(var(--accent))]",
    chipBg: "bg-[hsl(var(--primary)/.16)]",
    chipText: "text-[hsl(var(--primary))]",
  },
};

export default function FeaturesPage() {
  return (
    <section className="py-16 md:py-24 bg-transparent">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            All <span className="gradient-text">Features</span>
          </h1>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] text-lg max-w-3xl mx-auto">
            Explore the complete toolkit that powers smarter, faster hiring — designed to work beautifully in dark and light with the Neon Eclipse theme.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((f) => {
            const tone = toneStyles[f.tone];
            return (
              <article key={f.id} className="card p-6 md:p-8 ring-1 ring-border shadow-soft">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`inline-flex w-14 h-14 rounded-2xl items-center justify-center bg-gradient-to-r ${tone.grad} shadow-soft`}
                    role="img"
                    aria-label={`${f.title} icon`}
                  >
                    <i className={`${f.icon} text-xl text-[hsl(var(--primary-foreground))]`} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-2 text-[hsl(var(--muted-foreground))]">{f.description}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`chip ${tone.chipBg} ${tone.chipText}`}>{f.label}</span>
                      {f.href && (
                        <Link href={f.href} className="nav-item">
                          Learn more →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
