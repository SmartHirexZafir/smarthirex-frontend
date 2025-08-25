// components/system/LoaderOverlay.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "../../lib/util";

export default function LoaderOverlay({ fullscreen = false }: { fullscreen?: boolean }) {
  const [show, setShow] = useState(true);

  // Safety: auto-hide after long stalls (optional)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "pointer-events-none select-none",
        fullscreen ? "fixed inset-0 z-[1000]" : "relative w-full h-32",
        "flex items-center justify-center"
      )}
    >
      {/* Backdrop */}
      {fullscreen && (
        <div className="absolute inset-0 bg-[hsl(var(--background)/.75)] backdrop-blur-md"></div>
      )}

      {/* Orb loader */}
      <div className="relative z-10">
        <div className="h-14 w-14 rounded-full shadow-glow animate-spin-slow"
             style={{ background: "conic-gradient(from 180deg, hsl(var(--g1)), hsl(var(--g2)), hsl(var(--g3)), hsl(var(--g1)))" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-background ring-2 ring-[hsl(var(--primary)/.5)]"></div>
        </div>
        {/* floating particles */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[hsl(var(--primary))] animate-pulse-float" />
        <div className="absolute -bottom-2 left-3 h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse-float-slow" />
        <div className="absolute -right-2 top-5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--secondary))] animate-pulse-float-fast" />
      </div>

      {/* Subtext */}
      {fullscreen && (
        <div className="relative z-10 mt-6 text-xs text-muted-foreground">Loading your experience…</div>
      )}
    </div>
  );
}
