// components/system/LoaderOverlay.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "../../lib/util";

/**
 * Global loader overlay
 * - Uses unified Neon Eclipse tokens and global z-index scale
 * - Blocks interaction when fullscreen (pointer-events fix)
 * - Optional delay to avoid flash-of-loader on very fast resolves
 * - Honors reduced motion via global CSS
 */
type LoaderOverlayProps = {
  fullscreen?: boolean;
  /** Control visibility explicitly; defaults to true for Suspense fallbacks */
  active?: boolean;
  /** Delay before showing (ms) to prevent flicker on quick loads */
  delayMs?: number;
};

export default function LoaderOverlay({
  fullscreen = false,
  active = true,
  delayMs = 60,
}: LoaderOverlayProps) {
  const [visible, setVisible] = useState(false);

  // Show after a tiny delay to reduce flicker; hide immediately when inactive
  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), Math.max(0, delayMs));
    return () => window.clearTimeout(t);
  }, [active, delayMs]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        fullscreen ? "fixed inset-0 z-[var(--z-overlay)] pointer-events-auto" : "relative w-full h-32 pointer-events-none",
        "flex items-center justify-center select-none"
      )}
    >
      {/* Backdrop (blocks clicks when fullscreen) */}
      {fullscreen && (
        <div className="absolute inset-0 bg-[hsl(var(--background)/.75)] backdrop-blur-md" />
      )}

      {/* Orb loader */}
      <div className="relative z-10">
        <div
          className="h-14 w-14 rounded-full shadow-glow animate-spin-slow"
          style={{
            background:
              "conic-gradient(from 180deg, hsl(var(--g1)), hsl(var(--g2)), hsl(var(--g3)), hsl(var(--g1)))",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div className="h-8 w-8 rounded-full bg-background ring-2 ring-[hsl(var(--primary)/.5)]" />
        </div>
        {/* floating particles */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[hsl(var(--primary))] animate-pulse-float" aria-hidden="true" />
        <div className="absolute -bottom-2 left-3 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse-float-slow" aria-hidden="true" />
        <div className="absolute -right-2 top-5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--secondary))] animate-pulse-float-fast" aria-hidden="true" />
      </div>

      {/* Subtext */}
      {fullscreen && (
        <div className="relative z-10 mt-6 text-xs text-muted-foreground">
          Loading your experience…
        </div>
      )}
    </div>
  );
}
