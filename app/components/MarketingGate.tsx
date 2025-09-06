"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

/**
 * MarketingGate renders children ONLY on landing/marketing routes.
 * - Shows on:
 *   "/", "/marketing/*", "/landing/*",
 *   and common marketing pages: /features, /components, /pricing, /docs, /about, /careers, /press,
 *   /guides, /support, /privacy, /terms, /status, /blog, /news, /investors, /help, /contact,
 *   /documentation, /community, /cookies, /security, /roadmap, /changelog
 * - Hides on: app routes (candidate, upload, dashboard, etc.)
 */
export default function MarketingGate({ children }: PropsWithChildren) {
  const rawPath = usePathname() || "/";
  const pathname = rawPath.toLowerCase();

  // Inclusive patterns for "marketing" areas of the site.
  // Keep these fast + readable; prefer anchored, prefix-based regex.
  const SHOW_ON: RegExp[] = [
    /^\/$/,                         // root landing
    /^\/marketing(\/.*)?$/,         // /marketing/*
    /^\/landing(\/.*)?$/,           // /landing/*

    // Top-level marketing sections linked across header/footer
    /^\/features(\/.*)?$/,
    /^\/components(\/.*)?$/,
    /^\/pricing(\/.*)?$/,
    /^\/docs(\/.*)?$/,

    /^\/about(\/.*)?$/,
    /^\/careers(\/.*)?$/,
    /^\/press(\/.*)?$/,

    /^\/guides(\/.*)?$/,
    /^\/support(\/.*)?$/,
    /^\/help(\/.*)?$/,
    /^\/contact(\/.*)?$/,
    /^\/documentation(\/.*)?$/,
    /^\/community(\/.*)?$/,

    /^\/privacy(\/.*)?$/,
    /^\/terms(\/.*)?$/,
    /^\/cookies(\/.*)?$/,
    /^\/security(\/.*)?$/,
    /^\/status(\/.*)?$/,

    /^\/blog(\/.*)?$/,
    /^\/news(\/.*)?$/,
    /^\/investors(\/.*)?$/,

    /^\/roadmap(\/.*)?$/,
    /^\/changelog(\/.*)?$/,
  ];

  const shouldShow = SHOW_ON.some((r) => r.test(pathname));
  if (!shouldShow) return null;

  return <>{children}</>;
}
