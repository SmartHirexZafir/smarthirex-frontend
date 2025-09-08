"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Lightweight route loader for App Router.
 * - Flashes a top progress bar on ANY route (pathname or query) change.
 * - No external libs, works with Suspense too.
 */
export default function RouteLoader() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [show, setShow] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // start on navigation
    setShow(true);
    // hide after a short delay (tweak if you want longer/shorter)
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShow(false), 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search?.toString()]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[10000] h-[3px]">
      {/* track */}
      <div className="absolute inset-0 opacity-20 bg-foreground" />
      {/* indeterminate bar */}
      <div
        className="absolute left-0 top-0 h-full w-1/3 animate-pulse bg-[hsl(var(--primary))]"
        style={{ transform: "translateX(200%)" }}
      />
    </div>
  );
}
