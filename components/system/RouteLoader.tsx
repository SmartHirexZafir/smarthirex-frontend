"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Lightweight route loader for App Router.
 * - Shows an indeterminate top progress bar on ANY route (pathname or query) change.
 * - Unified with global Neon Eclipse theme (uses CSS vars).
 * - Honors reduced motion.
 * - Sits above the sticky nav, below modals/toasts (uses global z-index scale).
 */
export default function RouteLoader() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [show, setShow] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Start on navigation
    setShow(true);

    // Clear any previous hide timer and schedule a new one
    if (hideTimer.current) clearTimeout(hideTimer.current);

    // Keep visible briefly to avoid flicker; adjust as needed
    hideTimer.current = setTimeout(() => setShow(false), 700);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search?.toString()]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 h-[3px] pointer-events-none"
      // Above nav (50) and overlays (60), below modal (70) & toast (80)
      style={{ zIndex: (typeof window !== "undefined" && getComputedStyle(document.documentElement).getPropertyValue("--z-overlay")) ? undefined : 65 }}
    >
      {/* Track */}
      <div className="absolute inset-0 bg-[hsl(var(--foreground)/.18)]" />

      {/* Indeterminate bar (animated) */}
      <div
        role="progressbar"
        aria-label="Page loading"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext="Loading"
        className="absolute top-0 left-0 h-full w-1/3 motion-reduce:w-full"
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--g1)), hsl(var(--g2)), hsl(var(--g3)))",
          animation: "loading-bar 1.1s linear infinite",
        }}
      />
      <style jsx>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div[role='progressbar'] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
