"use client";

import { Avatar, Badge } from "@/components/ui/primitives";
import { BRIEF_STATUS_COLORS, PROJECT_STATUS_COLORS } from "@/lib/constants";
import { fmtDateShort } from "@/lib/format";
import type { Project, Provider } from "@/types/domain";

export function ProjectCard({
  project,
  providers,
  onOpen,
}: {
  project: Project;
  providers: Provider[];
  onOpen: () => void;
}) {
  const st = PROJECT_STATUS_COLORS[project.estado];
  const bst = BRIEF_STATUS_COLORS[project.briefEstado];
  const assigned = project.proveedorIds.map((id) => providers.find((p) => p.id === id)).filter((p): p is Provider => Boolean(p));

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
          <div className="mt-0.5 truncate text-[11px] text-text-2">{project.cliente || "Sin cliente"}</div>
        </div>
        <span className="flex-shrink-0 text-[11px] text-text-2">{fmtDateShort(project.fecha)}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge bg={st.bg} color={st.c}>
          {project.estado}
        </Badge>
        <Badge bg={bst.bg} color={bst.c}>
          {project.briefEstado}
        </Badge>
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
        {assigned.length > 0 ? (
          <>
            <div className="flex">
              {assigned.slice(0, 4).map((p, i) => (
                <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -6 }} className="rounded-full ring-2 ring-surface">
                  <Avatar nombre={p.nombre} idx={providers.indexOf(p)} size="sm" />
                </div>
              ))}
            </div>
            <span className="text-[11px] text-text-2">
              {assigned.length} proveedor{assigned.length === 1 ? "" : "es"}
            </span>
          </>
        ) : (
          <span className="text-[11px] font-medium text-red">Sin proveedores asignados</span>
        )}
      </div>
    </div>
  );
}
