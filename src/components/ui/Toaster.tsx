"use client";

import { useUiStore } from "@/store/ui-store";

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-2 rounded-[var(--radius-md)] bg-text px-4 py-2.5 text-[13px] font-medium text-bg shadow-lg"
        >
          {toast.icon && <span>{toast.icon}</span>}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
