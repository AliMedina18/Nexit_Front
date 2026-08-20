/**
 * Minimal CSV export helper (kept dependency-free, mirrors the export logic
 * from the design mockup). Works entirely client-side for now; once the
 * .NET backend is live this can be replaced by a server-generated export.
 */
export function toCSV(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (value: string | number) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(escapeCell), ...rows.map((row) => row.map(escapeCell))];
  return lines.map((line) => line.join(",")).join("\n");
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
