"use client";

import { useEffect, useState } from "react";

/**
 * Sun/Moon toggle with SSR-safe initial state.
 * - Reads <html class="light"> set by themeScript in app/layout.tsx
 * - Avoids hydration mismatches by deferring dynamic attrs until mount
 */
export default function ThemeToggle() {
  const getIsLight = () =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("light");

  // Default to LIGHT on the server so SSR markup is stable
  const [isLight, setIsLight] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLight(getIsLight());
  }, []);

  const toggle = () => {
    const el = document.documentElement;
    const next = !el.classList.contains("light");
    el.classList.toggle("light", next);
    try {
      localStorage.setItem("theme", next ? "light" : "dark");
    } catch {}
    setIsLight(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="icon-btn relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      // Defer ARIA values until after mount to avoid hydration mismatch
      aria-pressed={mounted ? isLight : undefined}
      aria-label={
        mounted ? (isLight ? "Switch to dark mode" : "Switch to light mode") : "Toggle theme"
      }
      title={mounted ? (isLight ? "Switch to dark mode" : "Switch to light mode") : "Toggle theme"}
      suppressHydrationWarning
    >
      {/* Keep both icons mounted and just cross-fade */}
      <span
        aria-hidden="true"
        className={`pointer-events-none transition-opacity duration-200 ${
          mounted ? (isLight ? "opacity-100" : "opacity-0") : "opacity-100"
        }`}
      >
        <i className="ri-sun-line text-[18px] leading-none" />
      </span>

      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          mounted ? (isLight ? "opacity-0" : "opacity-100") : "opacity-0"
        }`}
      >
        <i className="ri-moon-line text-[18px] leading-none" />
      </span>
    </button>
  );
}
