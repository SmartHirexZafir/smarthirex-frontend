"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function GlobalLoader({ isLoading }: { isLoading: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => setMounted(true), []);

  // Smooth fade in/out animation
  useEffect(() => {
    if (isLoading) {
      setVisible(true);
    } else {
      // Delay hiding to allow fade-out animation
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center transition-opacity duration-300 ${
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        // ✅ Ensure loader is always centered regardless of scroll position
        transform: "translateZ(0)",
        willChange: "opacity",
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="relative">
        {/* Outer spinning ring */}
        <div className="relative w-16 h-16">
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-[hsl(var(--primary))] border-r-[hsl(var(--primary))] animate-spin"
            style={{ animationDuration: "1s" }}
          />
          {/* Inner counter-rotating ring */}
          <div
            className="absolute inset-2 rounded-full border-3 border-transparent border-b-[hsl(var(--primary)/.6)] border-l-[hsl(var(--primary)/.6)] animate-spin"
            style={{ animationDuration: "0.8s", animationDirection: "reverse" }}
          />
          {/* Center pulsing dot */}
          <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
        </div>
      </div>
    </div>,
    document.body
  );
}

