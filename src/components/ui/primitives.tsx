"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { Search, Star, X, type LucideIcon } from "lucide-react";
import { avatarColor, initials } from "@/lib/format";
import { COUNTRY_BADGE_COLORS } from "@/lib/constants";
import { countryCode } from "@/lib/geo";

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */
type ButtonVariant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  icon?: LucideIcon;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-teal-mid text-white hover:bg-teal",
  ghost: "bg-surface text-text border border-border hover:bg-gray-light hover:border-border-strong",
  danger: "bg-red-light text-red border border-transparent hover:opacity-85",
};

export function Button({ variant = "ghost", size = "md", icon: Icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        size === "md" ? "px-3.5 py-2 text-[13px]" : "px-2.5 py-1.5 text-xs",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={size === "md" ? 15 : 13} strokeWidth={2} />}
      {children}
    </button>
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
      className={clsx("inline-flex items-center rounded-full px-2 py-[3px] text-[11px] font-medium", className)}
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx("rounded-full px-2 py-[3px] text-[11px] font-medium bg-gray-light text-text-2", className)}
    >
      {children}
    </span>
  );
}

/** Small 2-letter country chip, replaces flag emoji. */
export function CountryBadge({ pais }: { pais: string | undefined }) {
  const code = countryCode(pais);
  const c = COUNTRY_BADGE_COLORS[code];
  return (
    <Badge bg={c.bg} color={c.c} className="font-semibold tracking-wide">
      {code === "OTHER" ? "—" : code}
    </Badge>
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
  const px = size === "lg" ? 48 : size === "sm" ? 22 : 34;
  const fontSize = size === "lg" ? 15 : size === "sm" ? 9 : 12;
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
/* Stars (SVG rating)                                                          */
/* -------------------------------------------------------------------------- */
export function Stars({ n, size = 13 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[1px]" aria-label={`${n} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={0}
          fill={i <= n ? "#EF9F27" : "var(--border-strong)"}
        />
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */
export function EmptyState({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-2 py-14 text-center text-text-2">
      <Icon size={28} strokeWidth={1.5} className="text-text-3" />
      <div className="text-[13px]">{title}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat card                                                                   */
/* -------------------------------------------------------------------------- */
export function StatCard({ n, label }: { n: ReactNode; label: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3">
      <div className="text-2xl font-semibold leading-none tracking-tight">{n}</div>
      <div className="mt-1 text-[11px] text-text-2">{label}</div>
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
    <div className="relative w-full max-w-[260px]">
      <Search
        size={13}
        strokeWidth={2}
        className="pointer-events-none absolute left-[9px] top-1/2 -translate-y-1/2 text-text-3"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-md)] border border-border bg-surface py-1.5 pl-[27px] pr-2.5 text-[13px] text-text outline-none transition-colors focus:border-teal-mid"
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
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
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
            className="flex cursor-pointer items-center rounded-full border-none bg-transparent p-0.5 text-teal hover:bg-black/10"
            aria-label={`Quitar filtro ${chip.label}`}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="cursor-pointer border-none bg-transparent px-0.5 text-xs text-text-2 underline hover:text-text"
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
  icon: Icon,
  children,
  ...props
}: { active: boolean; icon?: LucideIcon; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-transparent px-3.5 py-1.5 text-[13px] font-medium transition-colors",
        active ? "bg-surface text-text shadow-sm" : "text-text-2 hover:text-text",
      )}
      {...props}
    >
      {Icon && <Icon size={14} strokeWidth={2} />}
      {children}
    </button>
  );
}
