"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/util";

export default function Modal({ open, onClose, labelledBy, className, children }:{
  open:boolean; onClose:()=>void; labelledBy?:string; className?:string; children:React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey=(e:KeyboardEvent)=> e.key==="Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className={cn("modal", className)} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </>,
    document.body
  );
}
