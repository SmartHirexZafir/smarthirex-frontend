// components/system/Toaster.tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn, uid } from "../../lib/util";

type ToastType = "success" | "error" | "info";
type Toast = { id: string; title?: string; message?: string; type: ToastType; duration?: number };

type Ctx = {
  show: (input: Omit<Toast, "id">) => void;
  success: (msg: string, title?: string, duration?: number) => void;
  error: (msg: string, title?: string, duration?: number) => void;
  info: (msg: string, title?: string, duration?: number) => void;
};

const MAX_TOASTS = 5; // prevent infinite stacks; drop oldest when exceeded

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <Toaster/>");
  return ctx;
}

type TimerState = {
  timeoutId: any;
  start: number;      // ms timestamp when current timer started
  remaining: number;  // ms remaining until auto-dismiss
  duration: number;   // total ms for this toast (used for progress)
};

export default function Toaster({ children }: { children?: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const timers = useRef<Record<string, TimerState>>({});
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(({ timeoutId }) => clearTimeout(timeoutId));
      timers.current = {};
    };
  }, []);

  const clearTimer = useCallback((id: string) => {
    const t = timers.current[id];
    if (t?.timeoutId) clearTimeout(t.timeoutId);
    if (t) t.timeoutId = null;
  }, []);

  const remove = useCallback((id: string) => {
    setList((prev) => prev.filter((t) => t.id !== id));
    clearTimer(id);
    delete timers.current[id];
    setPausedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [clearTimer]);

  const startTimer = useCallback((id: string) => {
    const t = timers.current[id];
    if (!t) return;
    t.start = Date.now();
    t.timeoutId = setTimeout(() => remove(id), t.remaining);
  }, [remove]);

  const pause = useCallback((id: string) => {
    const t = timers.current[id];
    if (!t) return;
    // compute remaining time & stop timer
    const elapsed = Date.now() - t.start;
    t.remaining = Math.max(0, t.remaining - elapsed);
    clearTimer(id);
    setPausedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [clearTimer]);

  const resume = useCallback((id: string) => {
    const t = timers.current[id];
    if (!t) return;
    setPausedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    startTimer(id);
  }, [startTimer]);

  const show = useCallback((input: Omit<Toast, "id">) => {
    const id = uid("toast");
    const duration = input.duration ?? 3200;

    // de-duplicate exact same (type+title+message): replace existing instead of stacking
    setList((prev) => {
      const dupIdx = prev.findIndex(
        (t) => t.type === input.type && (t.title || "") === (input.title || "") && (t.message || "") === (input.message || "")
      );
      let next = prev;
      if (dupIdx >= 0) {
        const existing = prev[dupIdx];
        // clear its timer
        clearTimer(existing.id);
        // remove old entry
        next = [...prev.slice(0, dupIdx), ...prev.slice(dupIdx + 1)];
        delete timers.current[existing.id];
      }
      // enforce cap
      if (next.length >= MAX_TOASTS) {
        const oldest = next[0];
        clearTimer(oldest.id);
        delete timers.current[oldest.id];
        next = next.slice(1);
      }
      const t: Toast = { id, ...input, duration };
      return [...next, t];
    });

    // create timer state and start
    timers.current[id] = {
      timeoutId: null,
      start: Date.now(),
      remaining: duration,
      duration
    };
    // start timer after state enqueued (small microtask delay ensures DOM paints)
    setTimeout(() => startTimer(id), 0);
  }, [clearTimer, startTimer]);

  const api: Ctx = useMemo(() => ({
    show,
    success: (message, title = "Success", duration) => show({ type: "success", message, title, duration }),
    error:   (message, title = "Something went wrong", duration) => show({ type: "error", message, title, duration }),
    info:    (message, title = "Notice", duration) => show({ type: "info", message, title, duration }),
  }), [show]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed z-[1100] right-3 bottom-3 sm:right-6 sm:bottom-6 flex flex-col gap-3"
      >
        {list.map((t) => {
          const timer = timers.current[t.id];
          const paused = pausedIds.has(t.id);
          const animDuration = (timer?.duration ?? t.duration ?? 3200);
          const animPlayState = paused ? "paused" as const : "running" as const;

          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "card max-w-xs sm:max-w-sm w-[92vw] sm:w-[28rem] p-4 animate-rise-in shadow-glow",
                t.type === "success" && "border-[hsl(var(--success))]/40",
                t.type === "error" && "border-[hsl(var(--destructive))]/40",
                t.type === "info" && "border-[hsl(var(--info))]/40"
              )}
              onMouseEnter={() => pause(t.id)}
              onMouseLeave={() => resume(t.id)}
            >
              <div className="flex items-start gap-3">
                <Icon type={t.type} />
                <div className="flex-1">
                  {t.title && <div className="text-sm font-semibold">{t.title}</div>}
                  {t.message && <p className="mt-0.5 text-xs text-muted-foreground">{t.message}</p>}
                </div>
                <button
                  aria-label="Dismiss"
                  className="icon-btn h-8 w-8"
                  onClick={() => remove(t.id)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className={cn("mt-3 h-1 rounded-full overflow-hidden bg-[hsl(var(--muted)/.6)]")}>
                <div
                  className={cn(
                    "h-full animate-toast-progress",
                    t.type === "success" && "bg-[hsl(var(--success))]",
                    t.type === "error" && "bg-[hsl(var(--destructive))]",
                    t.type === "info" && "bg-[hsl(var(--info))]"
                  )}
                  // Sync the progress bar animation with the toast duration
                  style={{ animationDuration: `${animDuration}ms`, animationPlayState: animPlayState }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

function Icon({ type }: { type: ToastType }) {
  const common = "h-5 w-5 mt-0.5";
  if (type === "success") {
    return (
      <svg className={common} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 7L9 18l-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg className={common} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 16h-1v-4h-1m1-4h.01M12 19a7 7 0 110-14 7 7 0 010 14z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
