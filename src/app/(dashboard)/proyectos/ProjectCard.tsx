"use client";

import { Badge } from "@/components/ui/primitives";
import { BRIEF_STATUS_COLORS, PROJECT_STATUS_COLORS, statusColor } from "@/lib/constants";
import { fmtDateShort } from "@/lib/format";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useClientesStore } from "@/store/clientes-store";
import type { Proyecto } from "@/types/api";

export function ProjectCard({ project, onOpen }: { project: Proyecto; onOpen: () => void }) {
  const { estadosProyecto } = useCatalogosStore();
  const { items: clientes } = useClientesStore();
  const estadoNombre = estadosProyecto.find((e) => e.id === project.estadoId)?.nombre ?? "—";
  const clienteNombre = clientes.find((c) => c.id === project.clienteId)?.nombre;
  const st = statusColor(PROJECT_STATUS_COLORS, estadoNombre);
  const bst = statusColor(BRIEF_STATUS_COLORS, project.estadoBrief);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      className="cursor-pointer rounded-[var(--radius-md)] border border-border bg-surface p-3 transition-shadow hover:border-border-strong hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold leading-tight">{project.nombre || "(Sin nombre)"}</div>
          <div className="mt-0.5 truncate text-[11px] text-text-2">{clienteNombre || "Sin cliente"}</div>
        </div>
        <span className="flex-shrink-0 text-[11px] text-text-2">{fmtDateShort(project.fechaEvento?.slice(0, 10))}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge bg={st.bg} color={st.c}>
          {estadoNombre}
        </Badge>
        <Badge bg={bst.bg} color={bst.c}>
          {project.estadoBrief}
        </Badge>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[11px] text-text-2">
        {project.proveedorIds.length > 0 ? (
          <span>
            {project.proveedorIds.length} proveedor{project.proveedorIds.length === 1 ? "" : "es"}
          </span>
        ) : (
          <span className="font-medium text-red">Sin proveedores asignados</span>
        )}
        <span>{project.porcentajeAvance}%</span>
      </div>
    </div>
  );
}
