"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

/**
 * HeaderGate decides whether to render its children (App Header)
 * based on the current route.
 *
 * - Hides on pure marketing routes ("/", "/marketing/*", "/landing/*")
 * - ALWAYS shows on app routes like "/candidate/[id]", "/upload", "/client", etc.
 */
export default function HeaderGate({ children }: PropsWithChildren) {
  const pathname = usePathname() || "/";

  // Marketing-only pages where app header should be hidden
  const HIDE_ON: RegExp[] = [/^\/$/, /^\/marketing(\/.*)?$/, /^\/landing(\/.*)?$/];

  // App/product routes where header must always be visible
  const ALWAYS_SHOW_ON: RegExp[] = [
    /^\/candidate\/[^/]+(\/.*)?$/,
    /^\/upload(\/.*)?$/,
    /^\/client(\/.*)?$/,
    /^\/dashboard(\/.*)?$/,
    /^\/jobs(\/.*)?$/,
  ];

  const shouldAlwaysShow = ALWAYS_SHOW_ON.some((r) => r.test(pathname));
  const shouldHide = HIDE_ON.some((r) => r.test(pathname));

  if (!shouldAlwaysShow && shouldHide) return null;
  return <>{children}</>;
}
