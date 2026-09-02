"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useUiStore, type ToastVariant } from "@/store/ui-store";

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  danger: AlertTriangle,
};

/** Color del ícono por variante -- el mockup solo mostraba el caso "success"
 * (palomita verde), acá se extiende el mismo criterio a las otras dos
 * variantes usando los tokens semánticos que ya existen (--blue/--red). */
const ICON_COLOR: Record<ToastVariant, string> = {
  success: "text-green",
  info: "text-blue",
  danger: "text-red",
};

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed bottom-[26px] left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2.5">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.variant];
        return (
          <div
            key={toast.id}
            className="flex items-center gap-2.5 rounded-[var(--radius-lg)] bg-text px-[18px] py-[13px] text-[14px] font-medium text-bg shadow-[0_14px_40px_rgba(12,12,12,0.3)]"
          >
            <Icon size={16} strokeWidth={2.2} className={ICON_COLOR[toast.variant]} />
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}
