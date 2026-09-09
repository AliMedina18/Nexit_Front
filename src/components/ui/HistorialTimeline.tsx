"use client";

import clsx from "clsx";
import { FilePlus2, Pencil, Trash2 } from "lucide-react";
import { descripcionHistorial, fmtFechaHora } from "@/lib/historial";
import type { HistorialCambio } from "@/types/api";

function iconoPara(h: HistorialCambio) {
  if (h.accion === "creacion") return { Icon: FilePlus2, bg: "var(--success-light)", c: "var(--success)" };
  if (h.accion === "eliminacion") return { Icon: Trash2, bg: "var(--red-light)", c: "var(--red)" };
  return { Icon: Pencil, bg: "var(--gray-light)", c: "var(--text-2)" };
}

/**
 * Línea de tiempo del historial de cambios -- compartida entre Clientes/Proveedores/Proyectos
 * (antes cada Detail tenía su propia copia idéntica de este bloque, solo texto con un borde
 * plano a la izquierda). Alicia 2026-09-09: "el diseño historial de cambios sea un poquito más
 * bonito" -- ahora cada fila lleva un ícono según el tipo de cambio (creación/edición/
 * eliminación) dentro de una placa redondeada, con una línea que conecta las filas entre sí,
 * como un timeline real.
 */
export function HistorialTimeline({ cargando, historial }: { cargando: boolean; historial: HistorialCambio[] }) {
  if (cargando) return <div className="py-1 text-sm text-text-3">Cargando…</div>;
  if (historial.length === 0) return <div className="py-1 text-sm text-text-3">Todavía no hay cambios registrados.</div>;

  return (
    <div className="flex flex-col">
      {historial.map((h, i) => {
        const { Icon, bg, c } = iconoPara(h);
        const esUltimo = i === historial.length - 1;
        return (
          <div key={h.id} className="flex gap-3">
            <div className="flex flex-shrink-0 flex-col items-center">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ background: bg }}>
                <Icon size={12} strokeWidth={2} style={{ color: c }} />
              </div>
              {!esUltimo && <div className="w-px flex-1" style={{ background: "var(--border)" }} />}
            </div>
            <div className={clsx("min-w-0 text-[13px]", esUltimo ? "pb-0.5" : "pb-3")}>
              <div>
                <b className="font-semibold">{h.usuarioNombre || "Alguien"}</b> {descripcionHistorial(h)}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-text-3">{fmtFechaHora(h.fecha)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
