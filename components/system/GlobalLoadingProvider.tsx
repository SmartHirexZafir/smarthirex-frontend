// components/system/GlobalLoadingProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LoaderOverlay from "@/components/system/LoaderOverlay";

/**
 * Shows loader:
 * - on EVERY client fetch (hides as soon as the FIRST response arrives)
 * - immediately on navigation start (click/push/replace), hides when new pathname commits
 * Excludes chatbot endpoints.
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

  const navInFlight = useRef(false);
  const navTimeout = useRef<NodeJS.Timeout | null>(null);

  // 🔧 Avoid scheduling state updates during React's insertion phase
  const schedule = (fn: () => void) => {
    if (typeof queueMicrotask === "function") queueMicrotask(fn);
    else setTimeout(fn, 0);
  };

  const inc = () => schedule(() => setCount((c) => c + 1));
  const dec = () => schedule(() => setCount((c) => Math.max(0, c - 1)));

  // Start a navigation overlay that auto-clears if something goes wrong
  const startNav = () => {
    if (navInFlight.current) return;
    navInFlight.current = true;
    inc();
    if (navTimeout.current) clearTimeout(navTimeout.current);
    navTimeout.current = setTimeout(() => {
      if (navInFlight.current) {
        navInFlight.current = false;
        dec();
      }
    }, 6000);
  };

  const endNav = () => {
    if (!navInFlight.current) return;
    navInFlight.current = false;
    if (navTimeout.current) {
      clearTimeout(navTimeout.current);
      navTimeout.current = null;
    }
    dec();
  };

  // Capture internal link clicks early to start nav loader instantly
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

      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;

      const samePath = url.pathname === location.pathname && url.search === location.search;
      if (samePath && url.hash) return;

      startNav();
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Programmatic navigations
  useEffect(() => {
    const push = history.pushState.bind(history);
    const replace = history.replaceState.bind(history);

    function wrap<T extends typeof history.pushState>(fn: T): T {
      // @ts-expect-error variadic passthrough
      return function (...args) {
        startNav();
        return fn(...args);
      };
    }

    history.pushState = wrap(push);
    history.replaceState = wrap(replace);

    return () => {
      history.pushState = push;
      history.replaceState = replace;
    };
  }, []);

  // End nav loader when new route commits
  useEffect(() => {
    endNav();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Patch fetch: show on every request, hide when headers available
  useEffect(() => {
    if (typeof window === "undefined") return;

    const EXCLUDE = [/\/api\/chat/i, /\/chatbot/i];
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = "";
      if (typeof input === "string") url = input;
      else if (input instanceof URL) url = input.toString();
      else if ((input as any)?.url) url = String((input as any).url);

      const shouldTrack = !EXCLUDE.some((rx) => rx.test(url));

      if (shouldTrack) inc();
      try {
        const res = await originalFetch(input as any, init);
        return res; // first response reached => overlay can go
      } finally {
        if (shouldTrack) dec();
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Optional manual promise tracker
  const trackPromise = <T,>(p: Promise<T>) => {
    inc();
    return p.finally(() => dec());
  };

  const value = useMemo(() => ({ isLoading: count > 0, trackPromise }), [count]);

  return (
    <LoadingCtx.Provider value={value}>
      {children}
      {count > 0 && <LoaderOverlay fullscreen />}
    </LoadingCtx.Provider>
  );
}
