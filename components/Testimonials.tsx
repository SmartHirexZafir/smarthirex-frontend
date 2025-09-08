// components/Testimonials.tsx
'use client';

import Link from 'next/link';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'HR Director',
      company: 'TechCorp Solutions',
      image:
        'https://readdy.ai/api/search-image?query=professional%20female%20HR%20director%20headshot%2C%20confident%20business%20woman%2C%20modern%20corporate%20portrait%2C%20professional%20headshot%20photography%2C%20business%20executive%20portrait%2C%20clean%20professional%20background%2C%20corporate%20leadership%20photography%2C%20modern%20workplace%20professional&width=400&height=400&seq=testimonial-001&orientation=squarish',
      quote:
        'SmartHirex reduced our hiring time by 60% and improved candidate quality significantly. The AI matching is incredibly accurate.',
    },
    {
      name: 'Michael Chen',
      role: 'Talent Acquisition Manager',
      company: 'Global Innovations Inc',
      image:
        'https://readdy.ai/api/search-image?query=professional%20male%20talent%20acquisition%20manager%20headshot%2C%20confident%20business%20man%2C%20modern%20corporate%20portrait%2C%20professional%20headshot%20photography%2C%20business%20executive%20portrait%2C%20clean%20professional%20background%2C%20corporate%20leadership%20photography%2C%20modern%20workplace%20professional&width=400&height=400&seq=testimonial-002&orientation=squarish',
      quote:
        'The automated resume screening saved us hundreds of hours. We can now focus on building relationships with top candidates.',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Recruitment Lead',
      company: 'StartupHub Ventures',
      image:
        'https://readdy.ai/api/search-image?query=professional%20female%20recruitment%20lead%20headshot%2C%20confident%20business%20woman%2C%20modern%20corporate%20portrait%2C%20professional%20headshot%20photography%2C%20business%20executive%20portrait%2C%20clean%20professional%20background%2C%20corporate%20leadership%20photography%2C%20modern%20workplace%20professional&width=400&height=400&seq=testimonial-003&orientation=squarish',
      quote:
        "SmartHirex's AI-powered matching helped us find perfect candidates we would have missed with traditional methods.",
    },
  ];

  const stats = [
    { number: '50+', label: 'Companies Trust Us' },
    { number: '10,000+', label: 'Resumes Processed' },
    { number: '60%', label: 'Faster Hiring' },
    { number: '95%', label: 'Accuracy Rate' },
  ];

  return (
    <section className="py-20 bg-background" aria-labelledby="testimonials-title">
      <div className="container">
        {/* Heading */}
        <div className="text-center mb-16">
          <h2 id="testimonials-title" className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Trusted by <span className="gradient-text">Leading Companies</span>
          </h2>
          <p className="text-lg md:text-xl text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
            Join thousands of HR professionals who have transformed their recruitment process with SmartHirex.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {testimonials.map((t, index) => (
            <figure
              key={index}
              className="glass rounded-2xl p-7 ring-1 ring-border shadow-soft h-full flex flex-col"
            >
              <figcaption className="flex items-center mb-6">
                <img
                  src={t.image}
                  alt={t.name}
                  className="w-16 h-16 rounded-full object-cover mr-4 ring-2 ring-border"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <h4 className="font-semibold text-foreground">{t.name}</h4>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.role}</p>
                  <p className="text-sm text-[hsl(var(--primary))]">{t.company}</p>
                </div>
              </figcaption>

              <blockquote className="text-[hsl(var(--muted-foreground))] italic leading-relaxed">
                “{t.quote}”
              </blockquote>
            </figure>
          ))}
        </div>

        {/* Stats + CTA banner */}
        <div className="rounded-2xl p-10 md:p-12 text-center relative overflow-hidden">
          {/* gradient background */}
          <div
            className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
            aria-hidden="true"
          />
          {/* soft glow */}
          <div className="absolute -inset-6 -z-10 blur-3xl opacity-30 gradient-ink" aria-hidden="true" />

          <h3 className="text-2xl md:text-3xl font-bold mb-8 tracking-tight text-primary-foreground">
            Join the Future of Recruitment
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            {stats.map((s, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-1 gradient-text">{s.number}</div>
                <div className="text-[hsl(var(--primary-foreground)/.8)]">{s.label}</div>
              </div>
            ))}
          </div>

          <Link href="/signup" className="btn btn-primary inline-flex">
            Get Started Today
          </Link>
        </div>
      </div>
    </section>
  );
}
