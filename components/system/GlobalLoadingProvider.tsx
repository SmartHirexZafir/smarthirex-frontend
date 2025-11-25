"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import GlobalLoader from "./GlobalLoader";

/**
 * GlobalLoadingProvider
 * Tracks all loading states: route changes, data fetches, etc.
 * Shows a professional global loader when anything is loading
 */
type Ctx = {
  isLoading: boolean;
  trackPromise<T>(p: Promise<T>): Promise<T>;
};

const LoadingCtx = createContext<Ctx>({
  isLoading: false,
  trackPromise: <T,>(p: Promise<T>) => p,
});

export const useGlobalLoading = () => useContext(LoadingCtx);

export default function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const navInFlight = useRef(false);
  const navTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingPathname = useRef<string | null>(null);

  // Schedule updates to avoid React insertion phase issues
  // Always use setTimeout (never queueMicrotask) to ensure updates happen after React's insertion phase
  const schedule = (fn: () => void) => {
    setTimeout(() => {
      try {
        fn();
      } catch (e) {
        // Silently handle errors during scheduling
      }
    }, 0);
  };

  const inc = () => schedule(() => setCount((c) => c + 1));
  const dec = () => schedule(() => setCount((c) => Math.max(0, c - 1)));

  // Track route navigation
  useEffect(() => {
      if (pendingPathname.current !== pathname) {
        pendingPathname.current = pathname;

        if (navInFlight.current) {
          navInFlight.current = false;
          schedule(() => setIsNavigating(false)); // ✅ Defer state update
          if (navTimeout.current) {
            clearTimeout(navTimeout.current);
            navTimeout.current = null;
          }
          dec();
        }
      }
  }, [pathname]);

  // Capture internal link clicks
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      let el = e.target as HTMLElement | null;
      while (el && el.tagName !== "A") el = el.parentElement;
      const a = el as HTMLAnchorElement | null;
      if (!a) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;

      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      try {
        const url = new URL(href, location.href);
        if (url.origin !== location.origin) return;

        const samePath = url.pathname === location.pathname && url.search === location.search;
        if (samePath && url.hash) return;

        // Start navigation loader
        if (!navInFlight.current) {
          navInFlight.current = true;
          schedule(() => setIsNavigating(true)); // ✅ Defer state update
          inc();

          // Auto-clear after timeout
          if (navTimeout.current) clearTimeout(navTimeout.current);
          navTimeout.current = setTimeout(() => {
            if (navInFlight.current) {
              navInFlight.current = false;
              schedule(() => setIsNavigating(false)); // ✅ Defer state update
              dec();
            }
          }, 10000);
        }
      } catch {
        // Invalid URL, ignore
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Track programmatic navigation
  useEffect(() => {
    const push = history.pushState.bind(history);
    const replace = history.replaceState.bind(history);

    function wrap<T extends typeof history.pushState>(fn: T): T {
      return function (...args) {
        if (!navInFlight.current) {
          navInFlight.current = true;
          schedule(() => setIsNavigating(true)); // ✅ Defer state update
          inc();

          if (navTimeout.current) clearTimeout(navTimeout.current);
          navTimeout.current = setTimeout(() => {
            if (navInFlight.current) {
              navInFlight.current = false;
              schedule(() => setIsNavigating(false)); // ✅ Defer state update
              dec();
            }
          }, 10000);
        }
        return fn(...args);
      } as T;
    }

    history.pushState = wrap(push);
    history.replaceState = wrap(replace);

    return () => {
      history.pushState = push;
      history.replaceState = replace;
    };
  }, []);

  // Track fetch requests (exclude chatbot endpoints)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const EXCLUDE = [/\/api\/chat/i, /\/chatbot/i];
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = "";
      let shouldTrack = false;
      let didIncrement = false;

      try {
        // Safely extract URL
        try {
          if (typeof input === "string") {
            url = input;
          } else if (input instanceof URL) {
            url = input.toString();
          } else if ((input as Request)?.url) {
            url = String((input as Request).url);
          }
        } catch {
          url = "";
        }

        // Determine if should track (exclude chatbot)
        shouldTrack = Boolean(url && !EXCLUDE.some((rx) => rx.test(url)));

        if (shouldTrack) {
          try {
            inc();
            didIncrement = true;
          } catch {
            shouldTrack = false;
            didIncrement = false;
          }
        }

        const res = await originalFetch(input as any, init);
        return res;
      } catch (error) {
        throw error;
      } finally {
        if (didIncrement && shouldTrack) {
          try {
            dec();
          } catch {
            schedule(() => setCount(0));
          }
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Manual promise tracker
  const trackPromise = <T,>(p: Promise<T>): Promise<T> => {
    inc();
    return p.finally(() => dec());
  };

  const isLoading = count > 0;
  const value = useMemo(() => ({ isLoading, trackPromise }), [isLoading]);

  // ✅ Lock body scroll when loading, unlock when done
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (isLoading) {
      // Save current scroll position and lock scroll
      const scrollY = window.scrollY;
      const body = document.body;
      const html = document.documentElement;
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Save current styles
      const bodyOverflow = body.style.overflow;
      const bodyPosition = body.style.position;
      const bodyTop = body.style.top;
      const bodyWidth = body.style.width;
      const bodyPaddingRight = body.style.paddingRight;
      
      // Lock scroll - prevent body scrolling while maintaining scroll position
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";
      
      // Add padding to compensate for scrollbar if present
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      return () => {
        // Restore scroll
        body.style.overflow = bodyOverflow || "";
        body.style.position = bodyPosition || "";
        body.style.top = bodyTop || "";
        body.style.width = bodyWidth || "";
        body.style.paddingRight = bodyPaddingRight || "";
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLoading]);

  return (
    <LoadingCtx.Provider value={value}>
      {children}
      <GlobalLoader isLoading={isLoading} />
    </LoadingCtx.Provider>
  );
}
