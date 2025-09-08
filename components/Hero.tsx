'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import image from "../public/Hero_section.png"

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => setIsVisible(true), []);

  return (
    <section
      aria-label="SmartHirex Hero"
      className="
        full-bleed relative min-h-[90svh] flex items-center overflow-hidden
        bg-transparent
      "
    >
      {/* Ambient animated blobs (decorative) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full mix-blend-screen blur-3xl opacity-30 animate-pulse bg-[hsl(var(--primary)/0.35)]" />
        <div className="absolute top-40 right-20 w-72 h-72 rounded-full mix-blend-screen blur-3xl opacity-30 animate-pulse bg-[hsl(var(--accent)/0.30)]" />
        <div className="absolute bottom-20 left-40 w-72 h-72 rounded-full mix-blend-screen blur-3xl opacity-30 animate-pulse bg-[hsl(var(--secondary)/0.30)]" />
      </div>

      <div className="container max-w-[1600px] py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
          {/* Content */}
          <div
            className={`transform transition-all duration-1000 ease-lux ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <h1 className="text-[clamp(2.2rem,3.8vw,4.5rem)] font-extrabold leading-tight text-foreground mb-6 tracking-tight">
              Hire <span className="gradient-text">Smarter</span>,<br />
              Not <span className="gradient-text">Harder</span>
            </h1>

            <p className="text-[var(--step-1)] text-[hsl(var(--muted-foreground))] mb-10 leading-relaxed max-w-2xl">
              Transform your recruitment process with AI that screens thousands of resumes in seconds,
              scores candidates intelligently, and finds your perfect match.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12">
              <Link href="/signup" className="btn btn-primary px-8 py-4 text-base sm:text-lg">
                <span className="flex items-center justify-center">
                  <i className="ri-rocket-line mr-2 text-xl" />
                  Start Free Trial
                </span>
              </Link>

              <Link href="/signup?next=/upload" className="btn btn-outline px-8 py-4 text-base sm:text-lg">
                <span className="flex items-center justify-center">
                  <i className="ri-upload-cloud-line mr-2 text-xl" />
                  Upload Resume
                </span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text mb-1">500K+</div>
                <div className="text-[hsl(var(--muted-foreground))] text-xs sm:text-sm">Resumes Processed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text mb-1">95%</div>
                <div className="text-[hsl(var(--muted-foreground))] text-xs sm:text-sm">Match Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text mb-1">10x</div>
                <div className="text-[hsl(var(--muted-foreground))] text-xs sm:text-sm">Faster Hiring</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div
            className={`relative transform transition-all duration-1000 ease-lux delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <div className="relative overflow-hidden rounded-3xl">
              {/* Soft glow + gradient edge */}
              <div className="absolute -inset-4 rounded-3xl blur-2xl opacity-25 gradient-ink glow" aria-hidden="true" />

              <div className="relative rounded-3xl overflow-hidden gradient-border glass shadow-soft">
                <img
                  src="\Hero_section.png"
                  alt="SmartHirex AI Platform"
                  className="relative w-full h-auto rounded-3xl"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>

              {/* Floating Cards (glass + tokens) */}
              <div
                className="absolute -top-8 -left-8 rounded-2xl p-5 glass shadow-soft ring-1 ring-border"
                aria-hidden="true"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full grid place-items-center bg-[hsl(var(--success)/0.16)]">
                    <i className="ri-check-line text-[hsl(var(--success))]" />
                  </div>
                  
                </div>
              </div>

              <div
                className="absolute -bottom-8 -right-8 rounded-2xl p-5 glass shadow-soft ring-1 ring-border"
                aria-hidden="true"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full grid place-items-center bg-[hsl(var(--info)/0.16)]">
                    <i className="ri-time-line text-[hsl(var(--info))]" />
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
          {/* /Image */}
        </div>
      </div>
    </section>
  );
}
