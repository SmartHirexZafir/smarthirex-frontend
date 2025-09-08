// components/LiveStats.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

export default function LiveStats() {
  const [stats, setStats] = useState({
    resumesFiltered: 12485,
    interviewsScheduled: 1247,
    candidatesHired: 892,
    activePlatforms: 156,
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const interval = setInterval(() => {
      setStats((prev) => ({
        resumesFiltered: prev.resumesFiltered + Math.floor(Math.random() * 3) + 1,
        interviewsScheduled: prev.interviewsScheduled + Math.floor(Math.random() * 2),
        candidatesHired: prev.candidatesHired + Math.floor(Math.random() * 2),
        activePlatforms: prev.activePlatforms + Math.floor(Math.random() * 2) - 1,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
      let startTime: number | null = null;
      const startValue = count;
      const endValue = value;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const currentCount = Math.floor(startValue + (endValue - startValue) * progress);
        setCount(currentCount);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return <span>{count.toLocaleString()}</span>;
  };

  // Tone mapping to theme tokens
  const items = [
    {
      label: 'Resumes Filtered Today',
      value: stats.resumesFiltered,
      icon: 'ri-file-search-line',
      tone: 'info' as const,
      delay: '0.1s',
    },
    {
      label: 'Interviews Scheduled',
      value: stats.interviewsScheduled,
      icon: 'ri-calendar-check-line',
      tone: 'accent' as const,
      delay: '0.2s',
    },
    {
      label: 'Successful Hires',
      value: stats.candidatesHired,
      icon: 'ri-user-add-line',
      tone: 'success' as const,
      delay: '0.3s',
    },
    {
      label: 'Active Companies',
      value: stats.activePlatforms,
      icon: 'ri-building-line',
      tone: 'warning' as const,
      delay: '0.4s',
    },
  ] as const;

  const feed = [
    { action: 'Resume filtered', company: 'TechCorp', time: '2 seconds ago', icon: 'ri-file-search-line', tone: 'info' },
    { action: 'Interview scheduled', company: 'StartupXYZ', time: '5 seconds ago', icon: 'ri-calendar-check-line', tone: 'accent' },
    { action: 'Candidate hired', company: 'Global Inc', time: '12 seconds ago', icon: 'ri-user-add-line', tone: 'success' },
    { action: 'Test generated', company: 'DevCorp', time: '18 seconds ago', icon: 'ri-code-s-slash-line', tone: 'warning' },
    { action: 'Resume filtered', company: 'InnovateLab', time: '25 seconds ago', icon: 'ri-file-search-line', tone: 'info' },
    { action: 'Interview scheduled', company: 'FutureTech', time: '32 seconds ago', icon: 'ri-calendar-check-line', tone: 'accent' },
  ] as const;

  const toneBg: Record<string, string> = {
    info: 'bg-[hsl(var(--info)/0.16)]',
    accent: 'bg-[hsl(var(--accent)/0.16)]',
    success: 'bg-[hsl(var(--success)/0.16)]',
    warning: 'bg-[hsl(var(--warning)/0.16)]',
  };

  const toneFg: Record<string, string> = {
    info: 'text-[hsl(var(--info))]',
    accent: 'text-[hsl(var(--accent))]',
    success: 'text-[hsl(var(--success))]',
    warning: 'text-[hsl(var(--warning))]',
  };

  return (
    <section
      className="
        full-bleed relative overflow-hidden py-20
        bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--primary)/0.92)] to-[hsl(var(--accent))]
      "
      aria-label="Live activity and analytics"
    >
      {/* Ambient blobs (decorative) */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full blur-3xl opacity-25 animate-pulse bg-[hsl(var(--primary-foreground)/0.25)]" />
        <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full blur-3xl opacity-25 animate-pulse bg-[hsl(var(--accent)/0.25)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse bg-[hsl(var(--secondary)/0.25)]" />
      </div>

      <div className="relative z-10 container">
        {/* Heading */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full glass text-[hsl(var(--primary-foreground)/.9)] text-sm font-medium mb-6 gap-2">
            <i className="ri-pulse-line" aria-hidden="true"></i>
            <span>Live Activity Dashboard</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold text-primary-foreground mb-4 tracking-tight">
            Real-Time <span className="gradient-text">Hiring Analytics</span>
          </h2>

          <p className="text-lg md:text-xl text-[hsl(var(--primary-foreground)/.8)] max-w-3xl mx-auto">
            Watch our AI platform work in real time as companies worldwide discover their perfect candidates.
          </p>
        </div>

        {/* Stats Boxes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`
                glass-strong rounded-2xl p-7 text-center ring-1 ring-border shadow-soft
                transform transition-all duration-1000 hover:scale-[1.025] hover:bg-[hsl(var(--background)/.15)]
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
              `}
              style={{ transitionDelay: item.delay }}
              aria-label={item.label}
            >
              <div
                className={`w-16 h-16 rounded-2xl grid place-items-center mx-auto mb-5 gradient-border ${toneBg[item.tone]}`}
                role="img"
                aria-label={`${item.label} icon`}
              >
                <i className={`${item.icon} text-2xl ${toneFg[item.tone]}`} />
              </div>

              <div className="text-4xl font-bold text-primary-foreground mb-1" aria-live="polite">
                <AnimatedCounter value={item.value} />
              </div>
              <div className="text-[hsl(var(--primary-foreground)/.7)] text-xs uppercase tracking-wider">{item.label}</div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" aria-hidden="true" />
                <span className="text-[hsl(var(--primary-foreground)/.8)] text-xs">Live</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Feed */}
        <div
          className={`
            mt-16 glass-strong rounded-2xl p-6 md:p-8 ring-1 ring-border shadow-soft
            transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          `}
          style={{ transitionDelay: '0.5s' }}
          role="log"
          aria-label="Live activity feed"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-primary-foreground mb-1">Live Activity Feed</h3>
            <p className="text-[hsl(var(--primary-foreground)/.7)]">Real-time updates from the SmartHirex platform</p>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {feed.map((row, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-[hsl(var(--background)/.08)] hover:bg-[hsl(var(--background)/.16)] transition-colors"
              >
                <div className={`w-10 h-10 rounded-full grid place-items-center ${toneBg[row.tone]}`}>
                  <i className={`${row.icon} ${toneFg[row.tone]} text-lg`} aria-hidden="true" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-primary-foreground font-medium truncate">{row.action}</div>
                  <div className="text-[hsl(var(--primary-foreground)/.7)] text-sm truncate">{row.company}</div>
                </div>

                <div className="text-[hsl(var(--primary-foreground)/.7)] text-sm shrink-0">{row.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
