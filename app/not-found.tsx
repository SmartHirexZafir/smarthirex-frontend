// app/not-found.tsx
'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <section className="container mx-auto py-24">
        <div
          className="mx-auto max-w-2xl card p-8 text-center"
          role="alert"
          aria-live="polite"
        >
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--muted)/.6)] ring-1 ring-border">
            <span className="text-xl font-semibold text-foreground">404</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold gradient-text">
            This page has not been generated
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Tell me what you would like on this page.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="btn btn-primary">
              Go home
            </Link>
          </div>
        </div>
      </section>
    </Suspense>
  );
}
