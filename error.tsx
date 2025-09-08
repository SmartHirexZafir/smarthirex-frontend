// app/error.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optional: log to your monitoring service
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <section className="container mx-auto py-24">
      <div
        className="mx-auto max-w-2xl card p-8 text-center"
        role="alert"
        aria-live="polite"
      >
        {/* On-brand illustration (pure CSS) */}
        <div className="relative mx-auto mb-6 h-24 w-24">
          {/* Soft glow */}
          <div
            className="absolute -inset-2 rounded-2xl blur-2xl opacity-30 gradient-ink"
            aria-hidden="true"
          />
          {/* Cube */}
          <div className="relative h-full w-full rounded-2xl ring-1 ring-border overflow-hidden bg-gradient-to-br from-[hsl(var(--primary)/0.18)] via-[hsl(var(--accent)/0.14)] to-[hsl(var(--secondary)/0.18)]">
            {/* decorative lines */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-px bg-[hsl(var(--border))]/60" />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 h-px w-full bg-[hsl(var(--border))]/60" />
            {/* "spark" */}
            <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-[hsl(var(--primary))]" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold gradient-text">
          Something went wrong
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          An unexpected error occurred. You can retry the last action or go back home.
        </p>

        {/* Optional technical hint */}
        {(error?.message || error?.digest) && (
          <details className="mt-4 text-sm text-muted-foreground">
            <summary className="cursor-pointer">Technical details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-[hsl(var(--muted))/0.35] p-3 ring-1 ring-border text-foreground/90 text-xs font-mono">
              {error?.message}
              {error?.digest ? `\nDigest: ${error.digest}` : ''}
            </pre>
          </details>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button onClick={reset} className="btn btn-primary">
            Retry
          </button>
          <Link href="/" className="btn btn-outline">
            Go Home
          </Link>
        </div>
      </div>
    </section>
  );
}
