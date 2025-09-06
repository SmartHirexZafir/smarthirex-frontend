"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/util";

interface Props {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Global Modal (Neon Eclipse)
 * - Renders into #portal-root (or body fallback) to avoid z-index/stacking issues
 * - Locks scroll when open; restores on close
 * - A11y: aria-modal, focus trap, close on ESC, backdrop click
 * - Uses ONLY global UI classes: .modal, .modal-backdrop
 */
export default function Modal({
  open,
  onClose,
  labelledBy,
  className,
  children,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Mount flag for portal safety (avoids SSR mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus trap + ESC + restore focus on unmount
  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const trap = () => {
      if (!ref.current) return;
      if (!ref.current.contains(document.activeElement)) {
        const focusable = ref.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        (focusable || ref.current).focus();
      }
    };

    // Initial focus
    setTimeout(trap, 0);

    document.addEventListener("keydown", handleKey);
    document.addEventListener("focusin", trap);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("focusin", trap);
      prevActive?.focus?.();
    };
  }, [open, onClose]);

  // Scroll lock while modal is open
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    root.setAttribute("data-modal-open", "true");
    return () => {
      root.style.overflow = prevOverflow;
      root.removeAttribute("data-modal-open");
    };
  }, [open]);

  if (!open || !mounted) return null;

  const portalTarget =
    document.getElementById("portal-root") ?? (typeof document !== "undefined" ? document.body : null);
  if (!portalTarget) return null;

  const modalNode = (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn("modal", className)}
        ref={ref}
        tabIndex={-1}
      >
        {children}
      </div>
    </>
  );

  return createPortal(modalNode, portalTarget);
}
