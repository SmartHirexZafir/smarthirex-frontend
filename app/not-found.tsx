// app/not-found.tsx

import Link from "next/link";

export default function NotFound() {
  return (
    <section className="app-container min-h-[70vh] flex items-center">
      <div className="w-full">
        <div className="mx-auto max-w-2xl card p-8 md:p-10 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full px-3 py-1 badge">
            <i className="ri-error-warning-line mr-1" aria-hidden="true" />
            Page not found
          </div>

          <h1 className="gradient-text text-6xl md:text-7xl font-extrabold tracking-tight">
            404
          </h1>

          <h2 className="mt-6 text-2xl md:text-3xl font-semibold text-foreground">
            This page has not been generated
          </h2>

          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Tell me what you would like on this page.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/" className="btn btn-primary" aria-label="Go to Home">
              <i className="ri-home-5-line" aria-hidden="true" />
              Go to Home
            </Link>
            <Link href="/docs" className="btn btn-outline" aria-label="Open Docs">
              <i className="ri-book-open-line" aria-hidden="true" />
              Open Docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
