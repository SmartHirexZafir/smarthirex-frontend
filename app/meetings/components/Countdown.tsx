// app/meetings/components/Countdown.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type CountdownProps = {
  /** Target time to count down to (Date, ISO string, or ms since epoch). */
  target: Date | string | number;
  /** Tick interval (ms). Defaults to 1000. */
  intervalMs?: number;
  /** Called once when countdown reaches zero. */
  onComplete?: () => void;
  /** Show small unit labels under each number. Defaults to true. */
  showLabels?: boolean;
  /** Always show the "days" segment, even when 0. Defaults to false. */
  alwaysShowDays?: boolean;
  /** Optional extra classes for the root container. */
  className?: string;
};

function toMillis(t: Date | string | number): number {
  if (t instanceof Date) return t.getTime();
  if (typeof t === "string") return new Date(t).getTime();
  return Number(t);
}

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function Countdown({
  target,
  intervalMs = 1000,
  onComplete,
  showLabels = true,
  alwaysShowDays = false,
  className = "",
}: CountdownProps) {
  const targetMs = useMemo(() => toMillis(target), [target]);
  const [now, setNow] = useState<number>(() => Date.now());
  const remaining = Math.max(0, targetMs - now);
  const { days, hours, minutes, seconds } = split(remaining);
  const firedRef = useRef(false);

  // tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  // fire onComplete once
  useEffect(() => {
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true;
      onComplete?.();
    }
  }, [remaining, onComplete]);

  const showDays = alwaysShowDays || days > 0;

  return (
    <div
      className={`flex items-center justify-center gap-2 text-foreground ${className}`}
      role="timer"
      aria-live="polite"
    >
      {showDays && (
        <TimeBox value={String(days)} label={showLabels ? "days" : undefined} />
      )}
      {showDays && <Separator />}
      <TimeBox value={pad(hours)} label={showLabels ? "hrs" : undefined} />
      <Separator />
      <TimeBox value={pad(minutes)} label={showLabels ? "min" : undefined} />
      <Separator />
      <TimeBox value={pad(seconds)} label={showLabels ? "sec" : undefined} />
    </div>
  );
}

function TimeBox({ value, label }: { value: string; label?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[3.5rem] rounded-xl bg-card px-3 py-2 text-center text-2xl font-semibold text-foreground shadow-sm border border-border">
        {value}
      </div>
      {label ? (
        <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      ) : null}
    </div>
  );
}

function Separator() {
  return <div className="text-xl font-semibold text-foreground/70">:</div>;
}
