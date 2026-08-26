import type { LucideIcon } from "lucide-react";
import { File as FileIconDefault, Link2 } from "lucide-react";
import { AVATAR_COLORS, FILE_TYPE_ICONS } from "./constants";

export function initials(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

export function fileIcon(name: string, type: "file" | "link"): LucideIcon {
  if (type === "link") return Link2;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return FILE_TYPE_ICONS[ext] ?? FileIconDefault;
}

export function fmtSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function fmtDateLong(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function fmtDateShort(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDay(date: Date): string {
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

export function fmtMonthYear(date: Date): string {
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}
