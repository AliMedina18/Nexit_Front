"use client";

import { Badge } from "@/components/ui/primitives";
import { BRIEF_STATUS_COLORS, PROJECT_STATUS_COLORS } from "@/lib/constants";
import type { Project } from "@/types/domain";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function MonthCard({
  monthIndex,
  projects,
  today,
  onOpen,
}: {
  monthIndex: number;
  projects: Project[];
  today: string;
  onOpen: (id: number) => void;
}) {
  const sinProveedor = projects.filter((p) => p.proveedorIds.length === 0).length;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-sm font-semibold">{MONTH_NAMES[monthIndex]}</div>
        <div className="flex items-center gap-1.5">
          {sinProveedor > 0 && (
            <span className="rounded-full bg-red-light px-2 py-0.5 text-[11px] font-medium text-red">
              {sinProveedor} sin proveedor
            </span>
          )}
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              background: projects.length ? "var(--teal-light)" : "var(--gray-light)",
              color: projects.length ? "var(--teal)" : "var(--text-2)",
            }}
          >
            {projects.length}
          </span>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="py-1.5 text-xs text-text-3">Sin proyectos este mes</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {projects
            .slice()
            .sort((a, b) => a.fecha.localeCompare(b.fecha))
            .map((p) => {
              const st = PROJECT_STATUS_COLORS[p.estado];
              const bst = BRIEF_STATUS_COLORS[p.briefEstado];
              const day = p.fecha.slice(8, 10);
              const ejecutado =
                ["Finalizado", "Ejecutado, pendiente facturar", "Facturado"].includes(p.estado) ||
                (p.fecha < today && p.estado !== "Cancelado");
              const icon = p.estado === "Cancelado" ? "✕" : ejecutado ? "✅" : "🕒";
              return (
                <button
                  key={p.id}
                  onClick={() => onOpen(p.id)}
                  className="flex cursor-pointer flex-wrap items-center gap-2.5 rounded-[var(--radius-md)] border-none bg-gray-light px-2.5 py-2 text-left hover:bg-border"
                >
                  <span className="w-[30px] flex-shrink-0 text-xs font-semibold text-text-2">{day}</span>
                  <span>{icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{p.nombre || "(Sin nombre)"}</div>
                    <div className="truncate text-[11px] text-text-2">{p.cliente || "Sin cliente"}</div>
                  </div>
                  <Badge bg={st.bg} color={st.c}>
                    {p.estado}
                  </Badge>
                  <Badge bg={bst.bg} color={bst.c}>
                    {p.briefEstado}
                  </Badge>
                  {p.proveedorIds.length === 0 && (
                    <span className="text-[11px] font-medium text-red">Sin proveedor</span>
                  )}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
