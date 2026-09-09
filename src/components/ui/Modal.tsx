"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  description,
  children,
  footer,
  maxWidth = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Etiqueta monoespaciada encima del título -- el mismo recurso que encabeza cada pantalla. */
  eyebrow?: string;
  /** Una línea bajo el título: qué hace este formulario, para no tener que deducirlo de los campos. */
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Mismo lock compartido que usan los Drawer (ver src/lib/use-body-scroll-lock.ts)
  // -- sin esto la página de atrás se podía seguir desplazando con el modal abierto.
  useBodyScrollLock(open);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity"
      style={{ opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none" }}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-surface transition-transform"
        style={{ maxWidth, transform: open ? "translateY(0)" : "translateY(8px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado sobre el papel crema, no sobre el blanco del cuerpo: separa de un vistazo
            "de qué se trata esto" de "qué tengo que llenar", sin necesidad de una línea divisoria
            más gruesa ni de un color nuevo. */}
        <div className="flex items-start gap-4 border-b border-border bg-bg px-5 py-4">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">{eyebrow}</div>
            )}
            <h2 className="text-base font-semibold leading-tight tracking-[-0.01em]">{title}</h2>
            {description && <p className="mt-1 text-[12.5px] leading-[1.45] text-text-2">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-transparent bg-transparent text-text-2 transition-colors hover:border-border hover:bg-surface hover:text-text active:bg-gray-light"
            aria-label="Cerrar"
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
