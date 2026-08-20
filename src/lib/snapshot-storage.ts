import type { MetricSnapshot } from "@/types/domain";
import { periodKey, snapshotPrefix, type InformeMode } from "./informe";

/**
 * Snapshot persistence lives in localStorage for now (client-only, per
 * browser). Once the .NET backend exposes a reports endpoint this should
 * move server-side so snapshots are shared across the team.
 */
export function saveSnapshot(mode: InformeMode, data: MetricSnapshot["data"]): void {
  if (typeof window === "undefined") return;
  const key = snapshotPrefix(mode) + periodKey(mode);
  const snapshot: MetricSnapshot = { key, savedAt: new Date().toISOString(), data };
  window.localStorage.setItem(key, JSON.stringify(snapshot));
}

export function getPreviousSnapshot(mode: InformeMode): MetricSnapshot | null {
  if (typeof window === "undefined") return null;
  const prefix = snapshotPrefix(mode);
  const thisKey = prefix + periodKey(mode);
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(prefix) && k !== thisKey) keys.push(k);
  }
  keys.sort();
  if (!keys.length) return null;
  const lastKey = keys[keys.length - 1];
  const raw = window.localStorage.getItem(lastKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MetricSnapshot;
  } catch {
    return null;
  }
}
