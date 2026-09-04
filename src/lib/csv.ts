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

/** Separa una línea de CSV respetando comillas dobles (incluyendo "" como comilla escapada). */
function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Lee solo la primera fila de datos de un CSV como un objeto { encabezado: valor } --
 * usado por "Importar datos" en los drawers de formulario (rellena el formulario
 * abierto desde un archivo de una fila, a diferencia del "Excel" de la barra
 * superior que crea muchos registros de una vez). `null` si el archivo no tiene
 * al menos encabezado + una fila.
 */
export function parseCSVFirstRow(text: string): Record<string, string> | null {
  const lines = text
    .replace(/^﻿/, "")
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;
  const headers = splitCSVLine(lines[0]).map((h) => h.trim());
  const values = splitCSVLine(lines[1]);
  const row: Record<string, string> = {};
  headers.forEach((h, i) => {
    row[h] = (values[i] ?? "").trim();
  });
  return row;
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
