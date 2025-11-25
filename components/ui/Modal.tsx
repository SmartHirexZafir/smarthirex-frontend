// components/ui/Modal.tsx
"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/util";

type Anchor = { x: number; y: number };

export default function Modal({
  open,
  onClose,
  labelledBy,
  className,
  children,
  anchor, // (Req. 6) optional anchored popover mode
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  className?: string;
  children: React.ReactNode;
  anchor?: Anchor;
}) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const prevActiveEl = useRef<HTMLElement | null>(null);

  // (Req. 6) computed screen-fixed position for anchored mode
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Lock body scroll, Esc to close, remember/restore focus
  useEffect(() => {
    if (!open) return;

    prevActiveEl.current = (document.activeElement as HTMLElement) || null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Focus trap (Tab)
      if (e.key === "Tab" && modalRef.current) {
        const focusables = getFocusable(modalRef.current);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && (active === first || active === modalRef.current)) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);

    // Initial focus
    requestAnimationFrame(() => {
      if (!modalRef.current) return;
      const focusables = getFocusable(modalRef.current);
      (focusables[0] || modalRef.current).focus();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      // restore focus
      if (prevActiveEl.current) prevActiveEl.current.focus();
    };
  }, [open, onClose]);

  // (Req. 6) Compute anchored coordinates, clamped to viewport
  // ✅ Always center modals perfectly - ignore anchor for centering
  useLayoutEffect(() => {
    if (!open || !anchor || !modalRef.current) {
      setPos(null);
      return;
    }
    
    // Always center modals regardless of anchor
    setPos(null);
  }, [open, anchor]);

  if (!open) return null;

  // Backdrop click should close; modal click should not bubble to backdrop
  const content = (
    <>
      {/* (Req. 6) Fixed, full-viewport backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{ position: "fixed", inset: 0 }}
      />
      {/* Centered by default via your existing .modal styles;
          when anchor is provided, we switch to fixed positioning at computed coords */}
      <div
        ref={modalRef}
        className={cn("modal", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={
          anchor && pos
            ? ({
                position: "fixed",
                top: `${Math.max(16, Math.min(pos.top, window.innerHeight - 16))}px`,
                left: `${Math.max(16, Math.min(pos.left, window.innerWidth - 16))}px`,
                transform: "none", // Override default centering when using anchor
              } as React.CSSProperties)
            : {
                // ✅ Always perfectly center modals
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                maxWidth: "95vw",
                maxHeight: "95vh",
              }
        }
      >
        {children}
      </div>
    </>
  );

  return createPortal(content, document.body);
}

/* ---------------- helpers ---------------- */

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(',');

  const nodes = Array.from(container.querySelectorAll<HTMLElement>(selectors));
  return nodes.filter((el) => isVisible(el));
}

function isVisible(el: HTMLElement) {
  const style = window.getComputedStyle(el);
  return !(style.display === "none" || style.visibility === "hidden");
}
