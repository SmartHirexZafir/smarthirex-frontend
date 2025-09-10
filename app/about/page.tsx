// smarthirex-frontend-main/app/about/page.tsx
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "About",
  description: "Learn about our mission, pipeline, security & privacy, team, FAQ, and the tech we use.",
};

export default function AboutPage() {
  return (
    <div className="container max-w-[1100px] py-10 md:py-14">
      {/* Page header */}
      <header className="mb-10 md:mb-14">
        <div className="flex items-start md:items-center gap-4">
          <div className="gradient-border rounded-2xl p-[1px] shadow-lux">
            <div className="panel rounded-[calc(theme(borderRadius.2xl)-1px)] p-3">
              <Image
                src="/web-logo.png"
                alt="Company mark: stylized logo"
                width={48}
                height={48}
                priority
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">About</h1>
            <p className="mt-1 text-[hsl(var(--muted-foreground))]">
              Who we are, what we&apos;re building, and how it all works under the hood.
            </p>
          </div>
        </div>
      </header>

      {/* Mission */}
      <section aria-labelledby="mission" className="mb-12 md:mb-16">
        <div className="gradient-border rounded-3xl p-[1px] shadow-lux">
          <div className="panel rounded-[calc(theme(borderRadius.3xl)-1px)] p-6 md:p-8">
            <h2 id="mission" className="text-2xl md:text-3xl font-medium">Our Mission</h2>
            <p className="mt-3 leading-7 text-[hsl(var(--muted-foreground))]">
              We help teams hire smarter and faster by turning unstructured candidate signals into
              clear, actionable insights—without compromising privacy or control.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip">Bias-aware</span>
              <span className="chip">Candidate-first</span>
              <span className="chip">Human-in-the-loop</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (pipeline) */}
      <section aria-labelledby="how" className="mb-12 md:mb-16">
        <h2 id="how" className="text-2xl md:text-3xl font-medium mb-6">How it works</h2>
        <ol className="grid md:grid-cols-4 gap-4">
          <li className="card p-5 rounded-2xl shadow-lux">
            <div className="text-sm mb-2 text-[hsl(var(--muted-foreground))]">Step 1</div>
            <h3 className="font-semibold">Ingest</h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Import resumes, job reqs, and notes from your ATS or files.
            </p>
          </li>
          <li className="card p-5 rounded-2xl shadow-lux">
            <div className="text-sm mb-2 text-[hsl(var(--muted-foreground))]">Step 2</div>
            <h3 className="font-semibold">Normalize</h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Clean, dedupe, and structure data into consistent candidate profiles.
            </p>
          </li>
          <li className="card p-5 rounded-2xl shadow-lux">
            <div className="text-sm mb-2 text-[hsl(var(--muted-foreground))]">Step 3</div>
            <h3 className="font-semibold">Evaluate</h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Score skills &amp; experience against role criteria with transparent rationales.
            </p>
          </li>
          <li className="card p-5 rounded-2xl shadow-lux">
            <div className="text-sm mb-2 text-[hsl(var(--muted-foreground))]">Step 4</div>
            <h3 className="font-semibold">Decide</h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Collaborate, compare, and move the right candidates forward—confidently.
            </p>
          </li>
        </ol>
      </section>

      {/* Security & Privacy */}
      <section aria-labelledby="security" className="mb-12 md:mb-16">
        <div className="gradient-border rounded-3xl p-[1px] shadow-lux">
          <div className="panel rounded-[calc(theme(borderRadius.3xl)-1px)] p-6 md:p-8">
            <h2 id="security" className="text-2xl md:text-3xl font-medium">Security &amp; Privacy</h2>
            <div className="mt-5 grid md:grid-cols-3 gap-4">
              <div className="card rounded-2xl p-5">
                <h3 className="font-semibold">Data ownership</h3>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Your data remains yours. We don&apos;t sell or train on your private info.
                </p>
              </div>
              <div className="card rounded-2xl p-5">
                <h3 className="font-semibold">Encryption</h3>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  In transit and at rest. Keys are rotated and access is least-privilege.
                </p>
              </div>
              <div className="card rounded-2xl p-5">
                <h3 className="font-semibold">Compliance ready</h3>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Built with auditability to support modern compliance workflows.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip">Role-based access</span>
              <span className="chip">Audit logs</span>
              <span className="chip">Data residency options</span>
            </div>
          </div>
        </div>
      </section>

      {/* Team / Contact */}
      <section aria-labelledby="team" className="mb-12 md:mb-16">
        <h2 id="team" className="text-2xl md:text-3xl font-medium">Team &amp; Contact</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="card rounded-2xl p-5 flex items-start gap-4">
            <Image
              src="/web-logo.png"
              alt="Team emblem used as placeholder avatar"
              width={48}
              height={48}
              className="rounded-xl"
            />
            <div>
              <h3 className="font-semibold">Our Team</h3>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                We&apos;re a small, product-obsessed group with experience in recruiting,
                data, and developer tools.
              </p>
            </div>
          </div>
          <div className="card rounded-2xl p-5">
            <h3 className="font-semibold">Get in touch</h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Questions, partnerships, or press:{" "}
              <Link href="mailto:hello@yourcompany.com" className="underline">
                hello@yourcompany.com
              </Link>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip">Support</span>
              <span className="chip">Partnerships</span>
              <span className="chip">Careers</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq" className="mb-12 md:mb-16">
        <h2 id="faq" className="text-2xl md:text-3xl font-medium">FAQ</h2>
        <div className="mt-4 space-y-3">
          <details className="card rounded-2xl p-5">
            <summary className="font-medium cursor-pointer">Do you integrate with my ATS?</summary>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              We support common import/export flows and are expanding native integrations.
            </p>
          </details>
          <details className="card rounded-2xl p-5">
            <summary className="font-medium cursor-pointer">Can I control model usage?</summary>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Yes—controls allow you to choose providers, limit data retention, and trace outputs.
            </p>
          </details>
          <details className="card rounded-2xl p-5">
            <summary className="font-medium cursor-pointer">How do you handle bias?</summary>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              We combine structured criteria, explanations, and reviewer feedback to reduce bias.
            </p>
          </details>
        </div>
      </section>

      {/* Tech at a glance */}
      <section aria-labelledby="tech" className="mb-2">
        <div className="gradient-border rounded-3xl p-[1px] shadow-lux">
          <div className="panel rounded-[calc(theme(borderRadius.3xl)-1px)] p-6 md:p-8">
            <h2 id="tech" className="text-2xl md:text-3xl font-medium">Tech at a glance</h2>
            <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
              A pragmatic stack focused on reliability, speed, and maintainability.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip">Next.js</span>
              <span className="chip">TypeScript</span>
              <span className="chip">Tailwind</span>
              <span className="chip">shadcn/ui</span>
              <span className="chip">PostgreSQL</span>
              <span className="chip">Prisma</span>
              <span className="chip">Edge caching</span>
              <span className="chip">CI/CD</span>
            </div>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="card p-5 rounded-2xl">
                <h3 className="font-semibold">Performance</h3>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Static and server-rendered pages optimized for fast first paint.
                </p>
              </div>
              <div className="card p-5 rounded-2xl">
                <h3 className="font-semibold">Observability</h3>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Metrics and tracing for reliability and quick incident response.
                </p>
              </div>
              <div className="card p-5 rounded-2xl">
                <h3 className="font-semibold">Scalability</h3>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Stateless services, queues where needed, and efficient data access patterns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
