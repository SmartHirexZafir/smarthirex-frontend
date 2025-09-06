import Link from "next/link";
import Button from "./Button";

export default function Hero() {
  return (
    <section className="full-bleed">
      <div className="container max-w-[1600px] py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary)/.28)]">
              <span aria-hidden>✨</span> AI-powered recruiting, globally unified UI
            </p>

            <h1 className="font-extrabold leading-tight text-4xl md:text-5xl">
              Hire smarter with
              <span className="gradient-text"> Smart HireX</span>
            </h1>

            <p className="text-[.98rem] text-muted-foreground max-w-[60ch]">
              Upload resumes, analyze candidates, and filter the best matches with intelligent scoring and chat assistance. Built with a global-only design system so buttons, fonts, and themes stay consistent everywhere—light &amp; dark.
            </p>

            <div className="flex flex-wrap gap-3">
              {/* Primary CTA — Sign Up (Login is removed from landing; handled via Get Started) */}
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>

              {/* Secondary CTA — Upload Resume must route to Auth, not open app directly */}
              <Link href="/signup?next=/upload">
                <Button variant="outline">Upload Resume</Button>
              </Link>
            </div>

            {/* Optional helper: provide a clear path to login from landing */}
            <div className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline hover:text-foreground">
                Log in
              </Link>
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
            <p className="mt-6 text-xs text-muted-foreground">
              Live preview blocks (replace with real product UI)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
