import Button from "./Button";

export default function Hero() {
  return (
    <section className="full-bleed">
      <div className="container max-w-[1600px] py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary)/.28)]">
              <span aria-hidden>✨</span> Premium, accessible, future-proof
            </p>
            <h1 className="font-extrabold leading-tight">
              Build world-class experiences with
              <span className="gradient-text"> Nebula Luxe Pro</span>
            </h1>
            <p className="text-[.98rem] text-muted-foreground max-w-[60ch]">
              A complete design system and component kit engineered for speed, scale, and beauty.
              WCAG-compliant, mobile-first, SEO-smart.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>Get Started</Button>
              <Button variant="outline">View Components</Button>
            </div>
          </div>

          {/* Visual */}
          <div className="card p-6 animate-subtle-float">
            <div className="grid grid-cols-2 gap-4">
              <div className="panel h-28 skeleton" />
              <div className="panel h-28 skeleton" />
              <div className="panel h-28 skeleton" />
              <div className="panel h-28 skeleton" />
            </div>
            <p className="mt-6 text-xs text-muted-foreground">Live preview blocks (replace with real product UI)</p>
          </div>
        </div>
      </div>
    </section>
  );
}
