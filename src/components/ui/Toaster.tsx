"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useUiStore, type ToastVariant } from "@/store/ui-store";

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  danger: AlertTriangle,
};

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.variant];
        return (
          <div
            key={toast.id}
            className="flex items-center gap-2 rounded-[var(--radius-md)] bg-text px-4 py-2.5 text-[13px] font-medium text-bg shadow-lg"
          >
            <Icon size={15} strokeWidth={2} />
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}
