"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 transition-opacity"
      style={{ opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none" }}
      onClick={onClose}
    >
      <div
        className="flex h-screen w-[460px] max-w-[95vw] flex-col overflow-y-auto border-l border-border bg-surface transition-transform"
        style={{ transform: open ? "translateX(0)" : "translateX(20px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DrawerHeader({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-[1] flex items-start gap-3.5 border-b border-border bg-surface p-5">
      {children}
    </div>
  );
}

export function DrawerCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="ml-auto cursor-pointer rounded-md border-none bg-transparent p-0.5 text-xl leading-none text-text-2 hover:bg-gray-light"
      aria-label="Cerrar"
    >
      ✕
    </button>
  );
}

export function DrawerSection({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mt-4.5 mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-text-3 first:mt-0">
      <span>{title}</span>
      {action}
    </div>
  );
}

export function KeyValue({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="mb-1.5 grid grid-cols-[130px_1fr] gap-x-2.5 gap-y-0.5 text-[13px]">
      <div className="text-text-2">{k}</div>
      <div>{v}</div>
    </div>
  );
}

export function NoteBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 rounded-[var(--radius-md)] bg-gray-light px-3 py-2.5 text-[13px] leading-relaxed text-text-2">
      {children}
    </div>
  );
}
