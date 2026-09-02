/**
 * Helpers de período (semana ISO / mes) y de comparación (deltas) usados por
 * Informes. `computeMetrics`/`snapshotPrefix` (que calculaban todo esto en el
 * cliente sobre los mocks) se retiraron 2026-08-28: el backend real ya expone
 * los totales (`informesApi.resumen()`) y guarda snapshots compartidos por
 * equipo (`informesApi.crearSnapshot`/`snapshot`), así que ya no hace falta
 * ni recalcular nada aquí ni guardar snapshots en localStorage por navegador.
 */

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

/** La fecha "representativa" del período anterior (7 días atrás, o el 1.º del mes anterior). */
export function previousPeriodDate(mode: InformeMode, d: Date = new Date()): Date {
  if (mode === "mensual") return new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const prev = new Date(d);
  prev.setDate(d.getDate() - 7);
  return prev;
}

export interface Delta {
  text: string;
  cls: "up" | "down" | "flat";
}

export function deltaLabel(current: number, previous: number | null | undefined, periodWord: string): Delta {
  if (previous === null || previous === undefined) return { text: "Sin dato previo", cls: "flat" };
  const diff = current - previous;
  const suffix = periodWord === "el mes" ? "o" : "a";
  if (diff === 0) return { text: `Igual que ${periodWord} pasad${suffix}`, cls: "flat" };
  return {
    text: `${diff > 0 ? "+" : ""}${diff} vs. ${periodWord} pasad${suffix}`,
    cls: diff > 0 ? "up" : "down",
  };
}

export function miniDelta(current: number, previous: number | null | undefined): Delta | null {
  if (previous === null || previous === undefined) return null;
  const diff = current - previous;
  if (diff === 0) return { text: "=", cls: "flat" };
  return { text: `${diff > 0 ? "+" : ""}${diff}`, cls: diff > 0 ? "up" : "down" };
}
