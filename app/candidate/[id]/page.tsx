// app/candidate/[id]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ClientPage from "./ClientPage";

// Ensure fresh data per request (no static caching for dynamic profiles)
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Supports both Next 14 (object) and Next 15/canary (Promise)
type PageProps = {
  params: { id?: string } | Promise<{ id?: string }>;
};

export default async function CandidatePage({ params }: PageProps) {
  // Handle both object and promise shapes for `params`
  const resolvedParams =
    (params as any)?.then ? await (params as Promise<{ id?: string }>) : (params as { id?: string });

  const { id } = resolvedParams || {};

  if (!id || typeof id !== "string") {
    // If route param missing/invalid, show 404
    notFound();
  }

  return (
    <Suspense
      fallback={
        <section className="relative min-h-screen w-full flex items-center justify-center">
          {/* Ambient background is already provided by RootLayout; add a subtle local surface */}
          <div className="container">
            <div className="mx-auto max-w-md">
              <div className="panel glass gradient-border p-8 text-center animate-rise-in">
                <div className="mx-auto mb-5 h-16 w-16 rounded-full border-4 border-primary/70 border-t-transparent animate-spin glow" />
                <p className="text-muted-foreground">Loading candidate profile...</p>
              </div>
            </div>
          </div>
        </section>
      }
    >
      {/* 👇 Correct prop name expected by ClientPage */}
      <ClientPage candidateId={id} />
    </Suspense>
  );
}
