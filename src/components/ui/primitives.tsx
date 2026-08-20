"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { avatarColor, initials, stars } from "@/lib/format";

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */
type ButtonVariant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "sm";
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-teal-mid text-white hover:bg-teal",
  ghost: "bg-surface text-text border border-border hover:bg-gray-light",
  danger: "bg-red-light text-red border border-transparent hover:opacity-85",
};

export function Button({ variant = "ghost", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        size === "md" ? "px-3.5 py-2 text-[13px]" : "px-2.5 py-1.5 text-xs",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Badge / Tag                                                                 */
/* -------------------------------------------------------------------------- */
export function Badge({
  children,
  bg,
  color,
  className,
}: {
  children: ReactNode;
  bg: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium", className)}
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx("rounded-full px-2 py-1 text-[11px] font-medium bg-gray-light text-text-2", className)}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                      */
/* -------------------------------------------------------------------------- */
export function Avatar({
  nombre,
  idx,
  size = "md",
}: {
  nombre: string;
  idx: number;
  size?: "md" | "lg" | "sm";
}) {
  const c = avatarColor(idx);
  const px = size === "lg" ? 52 : size === "sm" ? 24 : 42;
  const fontSize = size === "lg" ? 16 : size === "sm" ? 10 : 13;
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-semibold"
      style={{ background: c.bg, color: c.text, width: px, height: px, fontSize }}
    >
      {initials(nombre)}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stars                                                                       */
/* -------------------------------------------------------------------------- */
export function Stars({ n, size }: { n: number; size?: "sm" | "lg" }) {
  return (
    <span className={clsx("text-[#EF9F27]", size === "lg" ? "text-[22px]" : "text-[13px]")}>{stars(n)}</span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */
export function EmptyState({ icon = "🗂", title }: { icon?: string; title: string }) {
  return (
    <div className="col-span-full py-16 text-center text-text-2">
      <div className="mb-2 text-4xl">{icon}</div>
      <div>{title}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat card                                                                   */
/* -------------------------------------------------------------------------- */
export function StatCard({ n, label }: { n: ReactNode; label: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3.5">
      <div className="text-[26px] font-semibold leading-none">{n}</div>
      <div className="mt-1 text-xs text-text-2">{label}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Search input                                                                */
/* -------------------------------------------------------------------------- */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <svg
        className="pointer-events-none absolute left-[11px] top-1/2 -translate-y-1/2 text-text-3"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-md)] border border-border bg-surface py-2 pl-9 pr-3 text-[13px] text-text outline-none transition-colors focus:border-teal-mid"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Active filter chips                                                        */
/* -------------------------------------------------------------------------- */
export interface FilterChip {
  key: string;
  label: string;
}

export function ActiveFilters({
  chips,
  onRemove,
  onClearAll,
}: {
  chips: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="-mt-2 mb-4 flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-xs text-text-3">Filtros activos:</span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 rounded-full bg-teal-light py-1 pl-2.5 pr-1 text-xs font-medium text-teal"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="flex items-center rounded-full p-0.5 text-teal hover:bg-black/10"
            aria-label={`Quitar filtro ${chip.label}`}
          >
            ✕
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="cursor-pointer bg-transparent px-0.5 text-xs text-text-2 underline hover:text-text"
      >
        Limpiar todo
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tabs (header nav)                                                          */
/* -------------------------------------------------------------------------- */
export function TabsShell({ children }: { children: ReactNode }) {
  return <div className="flex gap-1 rounded-[var(--radius-md)] bg-gray-light p-[3px]">{children}</div>;
}

export function TabButton({
  active,
  children,
  ...props
}: { active: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "cursor-pointer rounded-lg border-none bg-transparent px-3.5 py-1.5 text-[13px] font-medium transition-colors",
        active ? "bg-surface text-text shadow-sm" : "text-text-2",
      )}
      {...props}
    >
      {children}
    </button>
  );
}
