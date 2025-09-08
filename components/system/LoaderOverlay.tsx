// components/system/LoaderOverlay.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

/**
 * NEON ECLIPSE LOADER (professional, no emoji/cartoon)
 * - Triple neon arcs + inner glass core, scanline sheen
 * - Uses your theme tokens (--g1/--g2/--g3, --background, --border, etc.)
 * - Fullscreen via portal so it stays fixed on scroll
 * - API unchanged: { fullscreen?: boolean; label?: string }
 */
export default function LoaderOverlay({
  fullscreen = false,
  label = "Loading…",
}: {
  fullscreen?: boolean;
  label?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Lock scroll while fullscreen overlay is visible
  useEffect(() => {
    if (!mounted || !fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, fullscreen]);

  const overlay = useMemo(
    () => (
      <div className="fixed inset-0 z-[10000] grid place-items-center" role="status" aria-live="polite">
        {/* Dim + blur backdrop */}
        <div className="absolute inset-0 bg-[hsl(var(--background)/.55)] backdrop-blur-md" />

        {/* Loader core */}
        <div className="relative flex flex-col items-center">
          <div className="relative h-28 w-28">
            {/* Outer arc (CW) */}
            <span
              className="absolute inset-0 rounded-full animate-neon-spin"
              style={{
                background:
                  "conic-gradient(from 0deg, hsl(var(--g1)) 0 120deg, transparent 120deg 180deg, hsl(var(--g2)) 180deg 300deg, transparent 300deg 360deg)",
                mask: "radial-gradient(farthest-side, transparent 68%, #000 69%)",
                WebkitMask: "radial-gradient(farthest-side, transparent 68%, #000 69%)",
                filter: "drop-shadow(0 0 18px hsl(var(--g1)/.55)) drop-shadow(0 0 28px hsl(var(--g3)/.35))",
              }}
            />
            {/* Middle arc (CCW) */}
            <span
              className="absolute inset-3 rounded-full animate-neon-spin-ccw"
              style={{
                background:
                  "conic-gradient(from 90deg, transparent 0 40deg, hsl(var(--g3)) 40deg 160deg, transparent 160deg 220deg, hsl(var(--g2)) 220deg 340deg, transparent 340deg 360deg)",
                mask: "radial-gradient(farthest-side, transparent 62%, #000 63%)",
                WebkitMask: "radial-gradient(farthest-side, transparent 62%, #000 63%)",
                filter: "drop-shadow(0 0 12px hsl(var(--g2)/.55))",
              }}
            />
            {/* Inner arc (CW, subtle) */}
            <span
              className="absolute inset-6 rounded-full animate-neon-spin"
              style={{
                background:
                  "conic-gradient(from 210deg, hsl(var(--g2)/.8) 0 20deg, transparent 20deg 200deg, hsl(var(--g1)/.8) 200deg 240deg, transparent 240deg 360deg)",
                mask: "radial-gradient(farthest-side, transparent 56%, #000 57%)",
                WebkitMask: "radial-gradient(farthest-side, transparent 56%, #000 57%)",
                filter: "drop-shadow(0 0 10px hsl(var(--g1)/.45))",
              }}
            />
            {/* Glass core pulse */}
            <span
              className="absolute inset-8 rounded-full bg-[hsl(var(--card)/.6)] ring-1 ring-[hsl(var(--border)/.6)] backdrop-blur-xl animate-neon-pulse"
              style={{
                boxShadow: "inset 0 0 18px hsl(var(--primary)/.22), 0 0 26px hsl(var(--primary)/.18)",
              }}
            />
            {/* Sheen sweep */}
            <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <span
                className="absolute -inset-10 rotate-12 animate-sheen"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, hsl(var(--foreground)/.07) 50%, transparent 100%)",
                }}
              />
            </span>
          </div>

          {/* Label */}
          <div className="mt-5 text-sm tracking-wide text-[hsl(var(--muted-foreground))]">
            <span className="inline-block gradient-text">{label}</span>
            <span className="sr-only">Please wait</span>
          </div>
        </div>

        {/* Animations */}
        <style jsx>{`
          @keyframes neonSpin { to { transform: rotate(360deg); } }
          @keyframes neonSpinCcw { to { transform: rotate(-360deg); } }
          @keyframes neonPulse {
            0%, 100% { opacity: .92; }
            50% { opacity: 1; box-shadow: 0 0 30px hsl(var(--primary)/.35), inset 0 0 24px hsl(var(--g2)/.20); }
          }
          @keyframes sheen {
            0% { transform: translateX(-120%) translateY(-20%); }
            100% { transform: translateX(120%) translateY(20%); }
          }
        `}</style>
        <style jsx global>{`
          .animate-neon-spin { animation: neonSpin 1.15s linear infinite; }
          .animate-neon-spin-ccw { animation: neonSpinCcw 1.6s linear infinite; }
          .animate-neon-pulse { animation: neonPulse 1.8s ease-in-out infinite; }
          .animate-sheen { animation: sheen 1.6s ease-in-out infinite; }
        `}</style>
      </div>
    ),
    [label]
  );

  if (fullscreen) {
    if (!mounted) return null;
    return createPortal(overlay, document.body);
  }

  // Compact inline variant (for local spinners if you use it anywhere)
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <span
        className="relative h-6 w-6 inline-block align-middle rounded-full animate-neon-spin"
        style={{
          background:
            "conic-gradient(hsl(var(--g1)) 0 40%, transparent 40% 50%, hsl(var(--g2)) 50% 90%, transparent 90% 100%, hsl(var(--g3)) 100% 140%, transparent 140% 360%)",
          mask: "radial-gradient(farthest-side, transparent 58%, #000 59%)",
          WebkitMask: "radial-gradient(farthest-side, transparent 58%, #000 59%)",
          boxShadow: "0 0 0 1px hsl(var(--border)/.6), 0 0 12px hsl(var(--primary)/.35)",
        }}
      />
      <span className="text-xs text-[hsl(var(--muted-foreground))]">{label}</span>
      <style jsx global>{`@keyframes neonSpin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
