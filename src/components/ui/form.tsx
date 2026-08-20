"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import clsx from "clsx";

const controlClass =
  "w-full rounded-[var(--radius-md)] border border-border bg-bg px-2.5 py-2 text-[13px] text-text outline-none transition-colors focus:border-teal-mid font-sans";

export function Field({
  label,
  error,
  required,
  children,
  hint,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-xs font-medium text-text-2">
        {label} {required && <span className="text-red">*</span>}
      </label>
      {children}
      {hint}
      {error && <div className="mt-1 text-xs text-red">{error}</div>}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(controlClass, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(controlClass, "cursor-pointer", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(controlClass, "min-h-[72px] resize-y", className)} {...props} />;
}

export function Row({ cols = 2, children }: { cols?: 2 | 3; children: ReactNode }) {
  return (
    <div className={clsx("grid gap-3", cols === 2 ? "grid-cols-2" : "grid-cols-3")}>{children}</div>
  );
}

export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3.5 rounded-[var(--radius-md)] bg-gray-light p-3.5 pb-1">
      <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-3">{title}</div>
      {children}
    </div>
  );
}
