"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export default function LoaderOverlay({
  fullscreen = false,
  label = "Loading…",
}: {
  fullscreen?: boolean;
  label?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mounted, fullscreen]);

  const overlay = useMemo(
    () => (
      <div className="fixed inset-0 z-[10000] grid place-items-center" role="status" aria-live="polite">
        <div className="absolute inset-0 bg-[hsl(var(--background)/.55)] backdrop-blur-md" />
        <div className="relative flex flex-col items-center">
          <div className="relative h-28 w-28">
            <span className="absolute inset-0 rounded-full animate-neon-spin"
              style={{background:"conic-gradient(from 0deg, hsl(var(--g1)) 0 120deg, transparent 120deg 180deg, hsl(var(--g2)) 180deg 300deg, transparent 300deg 360deg)",mask:"radial-gradient(farthest-side, transparent 68%, #000 69%)",WebkitMask:"radial-gradient(farthest-side, transparent 68%, #000 69%)"}}/>
            <span className="absolute inset-3 rounded-full animate-neon-spin-ccw"
              style={{background:"conic-gradient(from 90deg, transparent 0 40deg, hsl(var(--g3)) 40deg 160deg, transparent 160deg 220deg, hsl(var(--g2)) 220deg 340deg, transparent 340deg 360deg)",mask:"radial-gradient(farthest-side, transparent 62%, #000 63%)",WebkitMask:"radial-gradient(farthest-side, transparent 62%, #000 63%)"}}/>
            <span className="absolute inset-6 rounded-full animate-neon-spin"
              style={{background:"conic-gradient(from 210deg, hsl(var(--g2)/.8) 0 20deg, transparent 20deg 200deg, hsl(var(--g1)/.8) 200deg 240deg, transparent 240deg 360deg)",mask:"radial-gradient(farthest-side, transparent 56%, #000 57%)",WebkitMask:"radial-gradient(farthest-side, transparent 56%, #000 57%)"}}/>
            <span className="absolute inset-8 rounded-full bg-[hsl(var(--card)/.6)] ring-1 ring-[hsl(var(--border)/.6)] backdrop-blur-xl animate-neon-pulse" />
          </div>
          <div className="mt-5 text-sm tracking-wide text-[hsl(var(--muted-foreground))]">
            <span className="inline-block gradient-text">{label}</span>
          </div>
        </div>
        <style jsx>{`
          @keyframes neonSpin { to { transform: rotate(360deg); } }
          @keyframes neonSpinCcw { to { transform: rotate(-360deg); } }
          @keyframes neonPulse { 0%,100%{opacity:.92} 50%{opacity:1} }
        `}</style>
        <style jsx global>{`
          .animate-neon-spin { animation: neonSpin 1.15s linear infinite; }
          .animate-neon-spin-ccw { animation: neonSpinCcw 1.6s linear infinite; }
          .animate-neon-pulse { animation: neonPulse 1.8s ease-in-out infinite; }
        `}</style>
      </div>
    ),
    [label]
  );

  if (fullscreen) {
    if (!mounted) return null;
    return createPortal(overlay, document.body);
  }
  return overlay;
}
