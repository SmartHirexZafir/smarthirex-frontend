"use client";

import { useEffect, useState } from "react";

/**
 * Sun/Moon toggle with SSR-safe initial state.
 * - Reads <html class="light"> set by themeScript in app/layout.tsx
 * - Uses Remix Icon (global import is already in layout)
 */
export default function ThemeToggle() {
  // Helper to check current theme safely (SSR-safe)
  const getIsLight = () =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("light");

  // Initialize from document (no flicker after themeScript runs)
  const [isLight, setIsLight] = useState<boolean>(() => getIsLight());

  // Sync on mount in case class was changed before hydration
  useEffect(() => {
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
      className="icon-btn relative"
      aria-pressed={isLight}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      {/* We keep both icons mounted and just cross-fade to avoid layout shift */}
      <span
        aria-hidden="true"
        className={`pointer-events-none transition-opacity duration-200 ${
          isLight ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Sun (light mode) */}
        <i className="ri-sun-line text-[18px] leading-none" />
      </span>

      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          isLight ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Moon (dark mode) */}
        <i className="ri-moon-line text-[18px] leading-none" />
      </span>
    </button>
  );
}
