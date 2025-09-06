// components/system/ErrorBoundary.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { copyToClipboard, uid } from "../../lib/util";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  /** Optional: label that appears in the fallback to help triage logs */
  boundaryName?: string;
  /** Optional: reset the boundary when any key changes (e.g., pathname) */
  resetKeys?: unknown[];
  /** Called when an error is caught */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** Called when user clicks "Try again" */
  onReset?: () => void;
  /** Optional: mailto address for “Report issue” */
  reportTo?: string; // e.g. "support@yourdomain.com"
  /** Optional: custom title/description */
  title?: string;
  description?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  info: React.ErrorInfo | null;
  expanded: boolean;
  copied: boolean;
  focusId: string;
};

function arraysChanged(a?: unknown[], b?: unknown[]) {
  if (a === b) return false;
  if (!a || !b) return true;
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return true;
  }
  return false;
}

class ErrorBoundaryInner extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      info: null,
      expanded: false,
      copied: false,
      focusId: uid("err-title"),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep it noisy in dev, quiet in prod consoles.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", this.props.boundaryName || "boundary", error, info);
    }
    this.setState({ error, info });
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (
      this.state.hasError &&
      arraysChanged(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      info: null,
      expanded: false,
      copied: false,
      focusId: uid("err-title"),
    });
    this.props.onReset?.();
  };

  toggleExpanded = () => this.setState((s) => ({ expanded: !s.expanded }));
  markCopied = () =>
    this.setState({ copied: true }, () =>
      window.setTimeout(() => this.setState({ copied: false }), 1500)
    );

  async copyDetails() {
    const { error, info } = this.state;
    const payload = [
      `Boundary: ${this.props.boundaryName || "Unnamed"}`,
      `User agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "n/a"}`,
      `Time: ${new Date().toISOString()}`,
      "",
      error ? `Error: ${String(error?.message || error)}` : "Error: n/a",
      error?.stack ? `Stack:\n${error.stack}` : "Stack: n/a",
      "",
      info?.componentStack
        ? `Component stack:\n${info.componentStack}`
        : "Component stack: n/a",
    ].join("\n");
    const ok = await copyToClipboard(payload);
    if (ok) this.markCopied();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { boundaryName, reportTo, title, description } = this.props;
    const { error, info, expanded, copied, focusId } = this.state;

    const mailSubject = encodeURIComponent(
      `[${boundaryName || "App"}] Error report (${new Date().toISOString()})`
    );
    const mailBody = encodeURIComponent(
      [
        `Boundary: ${boundaryName || "Unnamed"}`,
        `Time: ${new Date().toISOString()}`,
        `User agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "n/a"}`,
        "",
        `Error: ${error?.message || String(error)}`,
        error?.stack ? `\nStack:\n${error.stack}` : "",
        info?.componentStack ? `\nComponent stack:\n${info.componentStack}` : "",
      ].join("\n")
    );
    const mailHref = reportTo ? `mailto:${reportTo}?subject=${mailSubject}&body=${mailBody}` : undefined;

    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full max-w-3xl bg-card text-foreground border border-border rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/30">
              <i className="ri-alert-line text-destructive text-2xl" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2
                id={focusId}
                tabIndex={-1}
                className="text-xl md:text-2xl font-bold"
              >
                {title || "Something went wrong"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {description ||
                  "An unexpected error occurred. You can try again, reload the page, or go back to the dashboard."}
              </p>
              {boundaryName && (
                <div className="mt-2 inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  <i className="ri-shield-line mr-2" /> Boundary: {boundaryName}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <i className="ri-refresh-line mr-2" />
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <i className="ri-loop-right-line mr-2" />
              Reload
            </button>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <i className="ri-home-5-line mr-2" />
              Home
            </Link>
            <button
              type="button"
              onClick={() => this.copyDetails()}
              className="px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Copy error details"
            >
              <i className={`mr-2 ${copied ? "ri-check-line" : "ri-clipboard-line"}`} />
              {copied ? "Copied" : "Copy details"}
            </button>
            {mailHref && (
              <a
                href={mailHref}
                className="px-4 py-2 rounded-lg border border-input text-foreground hover:bg-muted/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <i className="ri-mail-line mr-2" />
                Report issue
              </a>
            )}
            <button
              type="button"
              onClick={this.toggleExpanded}
              className="ml-auto px-4 py-2 rounded-lg bg-muted text-foreground border border-border hover:bg-muted/70 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={expanded}
              aria-controls="error-details"
            >
              <i className={`mr-2 ${expanded ? "ri-eye-off-line" : "ri-eye-line"}`} />
              {expanded ? "Hide details" : "Show details"}
            </button>
          </div>

          {/* Technical details (collapsed by default) */}
          {expanded && (
            <div
              id="error-details"
              className="mt-5 rounded-xl border border-border bg-muted/50 p-4"
            >
              <div className="text-sm">
                <div className="mb-2">
                  <span className="text-muted-foreground">Message:</span>{" "}
                  <span className="font-medium break-words">
                    {error?.message || String(error) || "—"}
                  </span>
                </div>
                {error?.stack && (
                  <div className="mt-2">
                    <div className="text-muted-foreground text-xs mb-1">Stack</div>
                    <pre className="max-h-64 overflow-auto rounded-md bg-background/80 border border-border p-3 text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {info?.componentStack && (
                  <div className="mt-3">
                    <div className="text-muted-foreground text-xs mb-1">Component stack</div>
                    <pre className="max-h-64 overflow-auto rounded-md bg-background/80 border border-border p-3 text-xs">
                      {info.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

/** Public wrapper: resets on route change automatically (so navigation recovers the boundary). */
export function RouteAwareErrorBoundary(props: Omit<ErrorBoundaryProps, "resetKeys">) {
  const pathname = usePathname();
  // Focus the title when the fallback renders (accessibility)
  React.useEffect(() => {
    // Try to focus the heading after render
    const idPrefix = "err-title";
    const el = document.querySelector<HTMLElement>(`[id^="${idPrefix}"]`);
    if (el) {
      // preventScroll keeps the page stable
      el.focus({ preventScroll: true });
    }
  }, [pathname]);
  return <ErrorBoundaryInner {...props} resetKeys={[pathname]} />;
}

/** Default export: a plain error boundary (no route reset). */
export default function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryInner {...props} />;
}
