import type { LucideIcon } from "lucide-react";
import { File as FileIconDefault, Link2 } from "lucide-react";
import { AVATAR_COLORS, FILE_TYPE_ICONS } from "./constants";

/**
 * Iniciales de una PERSONA, a partir de sus dos campos (Alicia 2026-09-08): la primera letra de su
 * primer nombre y la primera de su primer apellido. "Ana María Ruiz Gómez" da AR, no AM -- por eso
 * no sirve `initials()` de aquí abajo, que parte una cadena sola por espacios y tomaría las dos
 * primeras palabras.
 *
 * Si solo hay uno de los dos (a veces alguien queda registrado con nombre y sin apellido, o al
 * revés), se toman las dos primeras letras de ese único campo -- "Anthony" da AN. Nunca devuelve
 * vacío: sin nada que usar, devuelve "?".
 */
export function inicialesPersona(nombre?: string | null, apellido?: string | null): string {
  const primeraPalabra = (v?: string | null) => (v ?? "").trim().split(/\s+/).filter(Boolean)[0] ?? "";
  const n = primeraPalabra(nombre);
  const a = primeraPalabra(apellido);
  if (n && a) return (n[0] + a[0]).toUpperCase();
  const unico = n || a;
  if (!unico) return "?";
  return unico.slice(0, 2).toUpperCase();
}

/** Iniciales de una ENTIDAD con un solo nombre (cliente, proveedor, proyecto) -- para personas usa `inicialesPersona`. */
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

/**
 * "hace 3 días" -- para listas donde lo que importa es cuánto lleva algo esperando, no la fecha
 * exacta (invitaciones sin responder, notificaciones, solicitudes). La fecha completa se deja en el
 * `title` del elemento, para quien la necesite.
 */
export function haceCuanto(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutos = Math.floor(ms / 60_000);
  if (minutos < 1) return "hace un momento";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? "hace 1 hora" : `hace ${horas} horas`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "hace un mes" : `hace ${meses} meses`;
}
