// components/system/Toaster.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn, uid } from "../../lib/util";

/**
 * Global Toaster (Neon Eclipse)
 * - Auto-dismiss is robust (fixes "toast doesn’t disappear until refresh"):
 *    • precise timers with pause/resume
 *    • visibilitychange reconciliation when tab returns
 *    • watchdog to recover from throttled/cleared timers
 * - Unified global UI: card, buttons, progress, z-index tokens
 */

type ToastType = "success" | "error" | "info";
type Toast = {
  id: string;
  title?: string;
  message?: string;
  type: ToastType;
  duration?: number; // ms
};

type Ctx = {
  show: (input: Omit<Toast, "id">) => void;
  success: (msg: string, title?: string, duration?: number) => void;
  error: (msg: string, title?: string, duration?: number) => void;
  info: (msg: string, title?: string, duration?: number) => void;
};

const MAX_TOASTS = 5; // prevent infinite stacks; drop oldest when exceeded
const DEFAULT_DURATION = 3200;

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <Toaster/>");
  return ctx;
}

type TimerState = {
  timeoutId: number | null;
  start: number; // ms timestamp when the current run started
  remaining: number; // ms remaining until auto-dismiss
  duration: number; // initial duration (for progress)
  createdAt: number; // for watchdog / reconciliation
};

export default function Toaster({ children }: { children?: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const timers = useRef<Record<string, TimerState>>({});
  const [pausedIds, setPausedIds] = useState<Set<string>>(new Set());

  // ---------- Timer helpers ----------
  const clearTimer = useCallback((id: string) => {
    const t = timers.current[id];
    if (t?.timeoutId) {
      window.clearTimeout(t.timeoutId);
      t.timeoutId = null;
    }
  }, []);

  const remove = useCallback(
    (id: string) => {
      setList((prev) => prev.filter((t) => t.id !== id));
      clearTimer(id);
      delete timers.current[id];
      setPausedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [clearTimer]
  );

  const startTimer = useCallback(
    (id: string) => {
      const t = timers.current[id];
      if (!t) return;
      // if already expired, remove immediately
      if (t.remaining <= 0) {
        remove(id);
        return;
      }
      t.start = Date.now();
      clearTimer(id);
      t.timeoutId = window.setTimeout(() => remove(id), t.remaining);
    },
    [remove, clearTimer]
  );

  const pause = useCallback(
    (id: string) => {
      const t = timers.current[id];
      if (!t || pausedIds.has(id)) return;
      const elapsed = Date.now() - t.start;
      t.remaining = Math.max(0, t.remaining - elapsed);
      clearTimer(id);
      setPausedIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    },
    [clearTimer, pausedIds]
  );

  const resume = useCallback(
    (id: string) => {
      if (!pausedIds.has(id)) return;
      setPausedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      startTimer(id);
    },
    [pausedIds, startTimer]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(({ timeoutId }) =>
        window.clearTimeout(timeoutId || undefined)
      );
      timers.current = {};
    };
  }, []);

  // ---------- Show API (dedupe + cap) ----------
  const show = useCallback(
    (input: Omit<Toast, "id">) => {
      const id = uid("toast");
      const duration = input.duration ?? DEFAULT_DURATION;

      setList((prev) => {
        // de-duplicate exact same (type+title+message): replace instead of stacking
        const dupIdx = prev.findIndex(
          (t) =>
            t.type === input.type &&
            (t.title || "") === (input.title || "") &&
            (t.message || "") === (input.message || "")
        );

        let next = prev;
        if (dupIdx >= 0) {
          const existing = prev[dupIdx];
          clearTimer(existing.id);
          delete timers.current[existing.id];
          next = [...prev.slice(0, dupIdx), ...prev.slice(dupIdx + 1)];
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

      // initialize timer state then start (microtask lets DOM paint first)
      timers.current[id] = {
        timeoutId: null,
        start: Date.now(),
        remaining: duration,
        duration,
        createdAt: Date.now(),
      };
      Promise.resolve().then(() => startTimer(id));
    },
    [clearTimer, startTimer]
  );

  const api: Ctx = useMemo(
    () => ({
      show,
      success: (message, title = "Success", duration) =>
        show({ type: "success", message, title, duration }),
      error: (message, title = "Something went wrong", duration) =>
        show({ type: "error", message, title, duration }),
      info: (message, title = "Notice", duration) =>
        show({ type: "info", message, title, duration }),
    }),
    [show]
  );

  // ---------- Robustness: reconcile on tab visibility change ----------
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      for (const [id, t] of Object.entries(timers.current)) {
        if (pausedIds.has(id)) continue; // respect paused
        // recalc remaining from last start timestamp
        const elapsed = Math.max(0, now - t.start);
        const rem = Math.max(0, t.remaining - elapsed);
        t.remaining = rem;
        if (rem <= 0) remove(id);
        else startTimer(id);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [pausedIds, remove, startTimer]);

  // ---------- Watchdog: recover if a timer is lost/throttled ----------
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      for (const [id, t] of Object.entries(timers.current)) {
        if (pausedIds.has(id)) continue;
        // If no active timeout but time has passed, reconcile
        if (!t.timeoutId) {
          const elapsed = now - t.start;
          t.remaining = Math.max(0, t.remaining - elapsed);
          if (t.remaining <= 0) remove(id);
          else startTimer(id);
        }
        // Hard ceiling: if somehow around beyond original duration + small buffer
        if (now - t.createdAt > t.duration + 5000) {
          remove(id);
        }
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [pausedIds, remove, startTimer]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {/* Live region anchored bottom-right; uses global z-index token */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed right-3 bottom-3 sm:right-6 sm:bottom-6 flex flex-col gap-3 z-[var(--z-toast)]"
      >
        {list.map((t) => {
          const timer = timers.current[t.id];
          const paused = pausedIds.has(t.id);

          // Compute remaining for progress bar (restart animation on resume with new duration)
          let remainingMs = t.duration ?? DEFAULT_DURATION;
          if (timer) {
            if (paused) {
              remainingMs = Math.max(0, timer.remaining);
            } else {
              const elapsed = Math.max(0, Date.now() - timer.start);
              remainingMs = Math.max(0, timer.remaining - elapsed);
            }
          }
          const barMs = Math.max(0, remainingMs);
          const animPlayState = paused ? ("paused" as const) : ("running" as const);

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
                  {t.title && (
                    <div className="text-sm font-semibold">{t.title}</div>
                  )}
                  {t.message && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.message}
                    </p>
                  )}
                </div>
                <button
                  aria-label="Dismiss"
                  className="icon-btn h-8 w-8"
                  onClick={() => remove(t.id)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-3 h-1 rounded-full overflow-hidden bg-[hsl(var(--muted)/.6)]">
                <div
                  className={cn(
                    "h-full animate-toast-progress",
                    t.type === "success" && "bg-[hsl(var(--success))]",
                    t.type === "error" && "bg-[hsl(var(--destructive))]",
                    t.type === "info" && "bg-[hsl(var(--info))]"
                  )}
                  // Sync the progress bar animation with the remaining duration
                  style={{
                    animationDuration: `${barMs}ms`,
                    animationPlayState: animPlayState,
                  }}
                  aria-hidden="true"
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
        <path
          d="M20 7L9 18l-5-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === "error") {
    return (
      <svg className={common} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M13 16h-1v-4h-1m1-4h.01M12 19a7 7 0 110-14 7 7 0 010 14z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
