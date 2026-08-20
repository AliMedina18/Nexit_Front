import { PROJECT_STATUS_GROUPS, BRIEF_STATUSES } from "@/types/domain";
import type { MetricSnapshot, Project, Provider } from "@/types/domain";

export type InformeMode = "semanal" | "mensual";

export function isoWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function weekRange(d: Date = new Date()): { start: Date; end: Date } {
  const day = (d.getDay() + 6) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(d: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function periodRange(mode: InformeMode, d: Date = new Date()) {
  return mode === "mensual" ? monthRange(d) : weekRange(d);
}
export function periodKey(mode: InformeMode, d: Date = new Date()) {
  return mode === "mensual" ? monthKey(d) : isoWeekKey(d);
}
export function snapshotPrefix(mode: InformeMode) {
  return mode === "mensual" ? "snapshot-month:" : "snapshot-week:";
}

const ALL_PROJECT_STATUSES = PROJECT_STATUS_GROUPS.flatMap((g) => g.options);

export function computeMetrics(providers: Provider[], projects: Project[]): MetricSnapshot["data"] {
  const porEstado: Record<string, number> = {};
  ALL_PROJECT_STATUSES.forEach((k) => (porEstado[k] = 0));
  projects.forEach((p) => {
    const k = p.estado || "Planeación interna";
    porEstado[k] = (porEstado[k] || 0) + 1;
  });

  const porBrief: Record<string, number> = {};
  BRIEF_STATUSES.forEach((k) => (porBrief[k] = 0));
  projects.forEach((p) => {
    const k = p.briefEstado || "Pendiente por enviar";
    porBrief[k] = (porBrief[k] || 0) + 1;
  });

  return {
    totalProveedores: providers.length,
    totalProyectos: projects.length,
    sinProveedor: projects.filter((p) => p.proveedorIds.length === 0).length,
    porEstado,
    porBrief,
  };
}

export interface Delta {
  text: string;
  cls: "up" | "down" | "flat";
}

export function deltaLabel(current: number, previous: number | null | undefined, periodWord: string): Delta {
  if (previous === null || previous === undefined) return { text: "— sin dato previo", cls: "flat" };
  const diff = current - previous;
  const suffix = periodWord === "el mes" ? "o" : "a";
  if (diff === 0) return { text: `— igual que ${periodWord} pasad${suffix}`, cls: "flat" };
  return {
    text: `${diff > 0 ? "▲" : "▼"} ${diff > 0 ? "+" : ""}${diff} vs. ${periodWord} pasad${suffix}`,
    cls: diff > 0 ? "up" : "down",
  };
}

export function miniDelta(current: number, previous: number | null | undefined): Delta | null {
  if (previous === null || previous === undefined) return null;
  const diff = current - previous;
  if (diff === 0) return { text: "=", cls: "flat" };
  return { text: `${diff > 0 ? "+" : ""}${diff}`, cls: diff > 0 ? "up" : "down" };
}
