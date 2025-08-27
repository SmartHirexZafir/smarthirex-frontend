"use client";

import { useEffect, useRef } from "react";
import { cn } from "../../lib/util";

interface Props {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  className?: string;
  children: React.ReactNode;
}

/** A11y: aria-modal, focus trap, close on ESC, backdrop click */
export default function Modal({ open, onClose, labelledBy, className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const trap = () => {
      if (!ref.current) return;
      if (!ref.current.contains(document.activeElement)) {
        const focusable = ref.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("focusin", trap);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("focusin", trap);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn("modal", className)}
        ref={ref}
      >
        {children}
      </div>
    </>
  );
}
