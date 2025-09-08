// components/ui/Logo.tsx
"use client";

import Image from "next/image";

export default function Logo({ showName = true }: { showName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3 align-middle">
      <Image
        src="/web-logo.png"
        alt="Smart HireX logo"
        width={32}
        height={32}
        className="rounded-lg ring-1 ring-border object-cover"
        priority
      />
      {showName && (
        <span
          className="gradient-text leading-none"
          style={{ fontSize: "var(--step-3)" }}
        >
          Smart HireX
        </span>
      )}
    </span>
  );
}
