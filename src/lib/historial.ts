import type { HistorialCambio } from "@/types/api";

/** "Se cambió {campo} de "X" a "Y"" -- una fila del historial (docs/19/20), mismo texto en
 * las 3 pantallas que lo muestran (Clientes/Proveedores/Proyectos). Antes vivía duplicada
 * solo en ClienteDetail.tsx -- la única de las tres que llegó a mostrar esta sección. */
// Alicia 2026-09-08: en las 3 pantallas que muestran esta fila (Clientes/
// Proveedores/Proyectos) siempre va precedida del nombre de quién hizo el
// cambio ("<b>{usuarioNombre}</b> {descripcionHistorial(h)}"), así que el
// texto tiene que quedar en voz activa como continuación de esa frase --
// "Super Administrador Se creó el registro" (con el "Se" del verbo
// reflejo/pasivo) queda mal escrito; "Super Administrador creó el
// registro" es la frase completa correcta.
export function descripcionHistorial(h: HistorialCambio): string {
  if (h.accion === "creacion") return "creó el registro";
  if (h.accion === "eliminacion") return "eliminó el registro";
  if (h.campo) {
    const antes = h.valorAnterior?.trim() ? `"${h.valorAnterior}"` : "vacío";
    const despues = h.valorNuevo?.trim() ? `"${h.valorNuevo}"` : "vacío";
    return `cambió ${h.campo}: ${antes} → ${despues}`;
  }
  return "editó el registro";
}

export function fmtFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
