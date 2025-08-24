'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FeatureGrid() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Using design tokens (tones) rather than hard-coded Tailwind colors
  const features = [
    {
      icon: 'ri-upload-cloud-2-line',
      title: 'Lightning-Fast Resume Processing',
      description:
        'Upload thousands of resumes in seconds with our cutting-edge AI parsing technology that extracts key information with surgical precision.',
      stats: '10,000+ resumes/min',
      tone: 'info' as const,
    },
    {
      icon: 'ri-brain-line',
      title: 'Neural Matching Algorithm',
      description:
        "Our AI doesn't just match keywords—it understands context, evaluates potential, and predicts success with human-like intelligence.",
      stats: '98% accuracy rate',
      tone: 'accent' as const,
    },
    {
      icon: 'ri-line-chart-line',
      title: 'Predictive Scoring Engine',
      description:
        'Get crystal-clear candidate scores based on skills, experience, cultural fit, and success probability to make data-driven decisions.',
      stats: '15+ scoring factors',
      tone: 'success' as const,
    },
    {
      icon: 'ri-calendar-schedule-line',
      title: 'Smart Interview Orchestration',
      description:
        'Automate your entire interview pipeline with intelligent scheduling, reminder systems, and seamless calendar integration.',
      stats: 'Zero scheduling conflicts',
      tone: 'warning' as const,
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Advanced Verification Suite',
      description:
        'Verify credentials, employment history, and references with our integrated background check system powered by trusted data sources.',
      stats: 'Real-time verification',
      tone: 'secondary' as const,
    },
    {
      icon: 'ri-team-line',
      title: 'Collaborative Decision Hub',
      description:
        'Unite your hiring team with shared candidate profiles, real-time comments, and collaborative decision-making workflows.',
      stats: 'Team-based hiring',
      tone: 'primary' as const,
    },
  ];

  // Tone → styles via HSL tokens
  const toneStyles: Record<
    string,
    { grad: string; soft: string; text: string; chipBg: string }
  > = {
    info: {
      grad: 'from-[hsl(var(--info))] to-[hsl(var(--primary))]',
      soft: 'bg-[hsl(var(--info)/0.08)]',
      text: 'text-[hsl(var(--info))]',
      chipBg: 'bg-[hsl(var(--info)/0.16)]',
    },
    accent: {
      grad: 'from-[hsl(var(--accent))] to-[hsl(var(--primary))]',
      soft: 'bg-[hsl(var(--accent)/0.08)]',
      text: 'text-[hsl(var(--accent))]',
      chipBg: 'bg-[hsl(var(--accent)/0.16)]',
    },
    success: {
      grad: 'from-[hsl(var(--success))] to-[hsl(var(--primary))]',
      soft: 'bg-[hsl(var(--success)/0.08)]',
      text: 'text-[hsl(var(--success))]',
      chipBg: 'bg-[hsl(var(--success)/0.16)]',
    },
    warning: {
      grad: 'from-[hsl(var(--warning))] to-[hsl(var(--accent))]',
      soft: 'bg-[hsl(var(--warning)/0.08)]',
      text: 'text-[hsl(var(--warning))]',
      chipBg: 'bg-[hsl(var(--warning)/0.16)]',
    },
    secondary: {
      grad: 'from-[hsl(var(--secondary))] to-[hsl(var(--accent))]',
      soft: 'bg-[hsl(var(--secondary)/0.08)]',
      text: 'text-[hsl(var(--secondary))]',
      chipBg: 'bg-[hsl(var(--secondary)/0.16)]',
    },
    primary: {
      grad: 'from-[hsl(var(--primary))] to-[hsl(var(--accent))]',
      soft: 'bg-[hsl(var(--primary)/0.08)]',
      text: 'text-[hsl(var(--primary))]',
      chipBg: 'bg-[hsl(var(--primary)/0.16)]',
    },
  };

  return (
    <section className="py-24 bg-background" aria-labelledby="features-title">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass text-[hsl(var(--muted-foreground))] text-sm font-medium mb-6 gap-2">
            <i className="ri-rocket-line" aria-hidden="true"></i>
            <span>Complete Recruitment Ecosystem</span>
          </div>

          <h2
            id="features-title"
            className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight"
          >
            Everything You Need to <span className="gradient-text">Hire Excellence</span>
          </h2>

          <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
            From resume screening to final interviews, our comprehensive suite of AI-powered tools
            transforms every aspect of your hiring process.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {features.map((f, index) => {
            const tone = toneStyles[f.tone];
            return (
              <article
                key={index}
                className={`group relative glass rounded-2xl p-8 ring-1 ring-border shadow-soft transition-all duration-500 cursor-pointer overflow-hidden
                  hover:-translate-y-2 hover:shadow-xl ${hoveredIndex === index ? 'scale-[1.02]' : ''}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                aria-label={f.title}
              >
                {/* Hover background wash */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${tone.grad} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                  aria-hidden="true"
                />

                {/* Content */}
                <div className="relative z-10">
                  <div
                    className={`inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-6 shadow-soft bg-gradient-to-r ${tone.grad}
                                group-hover:scale-110 transition-transform duration-300`}
                    role="img"
                    aria-label={`${f.title} icon`}
                  >
                    <i className={`${f.icon} text-2xl text-white`} />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>

                  <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-6">
                    {f.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${tone.chipBg} ${tone.text}`}
                    >
                      {f.stats}
                    </span>
                    <i
                      className={`ri-arrow-right-line text-[hsl(var(--muted-foreground))] group-hover:${tone.text.replace(
                        'text-',
                        ''
                      )} group-hover:translate-x-1 transition-all duration-300`}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden rounded-3xl p-10 md:p-12 text-center text-white ring-1 ring-border shadow-soft">
          {/* Gradient BG + glow */}
          <div
            className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
            aria-hidden="true"
          />
          <div className="absolute -inset-8 -z-10 blur-3xl opacity-30 gradient-ink" aria-hidden="true" />

          <h3 className="text-3xl font-bold mb-3 tracking-tight">
            Ready to Transform Your Hiring Process?
          </h3>
          <p className="text-lg md:text-xl mb-8 text-white/90">
            Join thousands of companies already using SmartHirex to find exceptional talent.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn btn-primary">
              <i className="ri-rocket-line mr-2" aria-hidden="true"></i>
              Start Free Trial
            </Link>
            <button
              className="btn btn-outline text-white border-white hover:bg-white hover:text-[hsl(var(--primary))]"
              type="button"
            >
              <i className="ri-calendar-line mr-2" aria-hidden="true"></i>
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
