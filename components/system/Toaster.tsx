// components/system/Toaster.tsx
"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn, uid } from "../../lib/util";

type ToastType = "success" | "error" | "info";
type Toast = { id: string; title?: string; message?: string; type: ToastType; duration?: number };

type Ctx = {
  show: (input: Omit<Toast, "id">) => void;
  success: (msg: string, title?: string, duration?: number) => void;
  error: (msg: string, title?: string, duration?: number) => void;
  info: (msg: string, title?: string, duration?: number) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <Toaster/>");
  return ctx;
}

export default function Toaster({ children }: { children?: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const timers = useRef<Record<string, any>>({});

  const remove = useCallback((id: string) => {
    setList((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current[id];
    if (t) { clearTimeout(t); delete timers.current[id]; }
  }, []);

  const show = useCallback((input: Omit<Toast, "id">) => {
    const id = uid("toast");
    const duration = input.duration ?? 3200;
    const t: Toast = { id, ...input };
    setList((prev) => [...prev, t]);
    timers.current[id] = setTimeout(() => remove(id), duration);
  }, [remove]);

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
        className="fixed z-[1100] right-3 bottom-3 sm:right-6 sm:bottom-6 flex flex-col gap-3"
      >
        {list.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "card max-w-xs sm:max-w-sm w-[92vw] sm:w-[28rem] p-4 animate-rise-in shadow-glow",
              t.type === "success" && "border-[hsl(var(--success))]/40",
              t.type === "error" && "border-[hsl(var(--destructive))]/40",
              t.type === "info" && "border-[hsl(var(--info))]/40"
            )}
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
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className={cn("mt-3 h-1 rounded-full overflow-hidden bg-[hsl(var(--muted)/.6)]")}>
              <div className={cn(
                "h-full animate-toast-progress",
                t.type === "success" && "bg-[hsl(var(--success))]",
                t.type === "error" && "bg-[hsl(var(--destructive))]",
                t.type === "info" && "bg-[hsl(var(--info))]"
              )}/>
            </div>
          </div>
        ))}
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
