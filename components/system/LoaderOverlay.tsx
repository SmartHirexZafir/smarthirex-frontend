"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export default function LoaderOverlay({
  fullscreen = false,
  label = "Loading…",
  lockScroll = true,
}: {
  fullscreen?: boolean;
  label?: string;
  lockScroll?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ✅ Only lock scroll if explicitly requested (not for chatbot filtering)
  useEffect(() => {
    if (!mounted || !fullscreen || !lockScroll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mounted, fullscreen, lockScroll]);

  const overlay = useMemo(
    () => (
      <div 
        className="fixed inset-0 z-[99999] grid place-items-center" 
        role="status" 
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
        }}
      >
        <div 
          className="absolute inset-0 bg-[hsl(var(--background)/.75)] backdrop-blur-sm transition-opacity duration-300" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
        />
        <div className="relative flex flex-col items-center gap-4 z-10">
          {/* ✅ Modern, clean spinner design */}
          <div className="relative h-16 w-16">
            {/* Outer ring - smooth rotation */}
            <div 
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-[hsl(var(--primary))] border-r-[hsl(var(--primary))] animate-spin"
              style={{ animationDuration: '1s' }}
            />
            {/* Inner ring - counter rotation */}
            <div 
              className="absolute inset-2 rounded-full border-3 border-transparent border-b-[hsl(var(--primary)/.6)] border-l-[hsl(var(--primary)/.6)] animate-spin"
              style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}
            />
            {/* Center dot - pulse */}
            <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
          </div>
          <div className="text-sm font-medium text-[hsl(var(--foreground))] tracking-wide">
            {label}
          </div>
        </div>
      </div>
    ),
    [label]
  );

  if (fullscreen) {
    if (!mounted) return null;
    // ✅ Always portal to body to ensure it covers entire viewport regardless of scroll
    return createPortal(overlay, document.body);
  }
  return overlay;
}
