// app/candidate/[id]/ClientPage.tsx
"use client";

import Link from "next/link";
import CandidateDetail from "./CandidateDetail";

type Props = {
  candidateId: string;
};

export default function ClientPage({ candidateId }: Props) {
  if (!candidateId || typeof candidateId !== "string") {
    return (
      <div className="relative min-h-screen w-full bg-background text-foreground">
        {/* Ambient luxe background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-luxe-radial opacity-60" />
        </div>

        <div className="mx-auto flex max-w-3xl items-center justify-center px-6 py-20">
          <div className="w-full rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-elev-1">
            <div className="p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
                <i className="ri-user-line text-3xl text-muted-foreground" aria-hidden />
              </div>

              <h1 className="text-2xl font-bold tracking-tight">Candidate not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The candidate you’re looking for doesn’t exist or the link is invalid.
              </p>

              <div className="mt-6 flex items-center justify-center">
                <Link
                  href="/upload"
                  aria-label="Back to candidates"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <i className="ri-arrow-left-line text-base" aria-hidden />
                  Back to candidates
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Valid id — render the actual detail page (no UI changes here to avoid duplication)
  return <CandidateDetail candidateId={candidateId} />;
}
