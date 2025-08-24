"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

/**
 * MarketingGate renders children ONLY on landing/marketing routes.
 * - Shows on: "/", "/marketing/*", "/landing/*"
 * - Hides on: app routes (candidate, upload, dashboard, etc.)
 */
export default function MarketingGate({ children }: PropsWithChildren) {
  const pathname = usePathname() || "/";

  const SHOW_ON: RegExp[] = [
    /^\/$/,                 // root landing
    /^\/marketing(\/.*)?$/, // marketing pages
    /^\/landing(\/.*)?$/,   // any landing pages
  ];

  const shouldShow = SHOW_ON.some((r) => r.test(pathname));
  if (!shouldShow) return null;

  return <>{children}</>;
}
