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
      className="cursor-pointer rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-shadow hover:border-border-strong hover:shadow-md"
    >
      <div className="text-sm font-semibold">{project.nombre || "(Sin nombre)"}</div>
      <div className="mt-0.5 text-xs text-text-2">{project.cliente || "Sin cliente"}</div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge bg={st.bg} color={st.c}>
          {project.estado}
        </Badge>
        <Badge bg={bst.bg} color={bst.c}>
          {project.briefEstado}
        </Badge>
        <span className="text-xs text-text-2">{fmtDateShort(project.fecha)}</span>
      </div>

      <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
        {assigned.length > 0 ? (
          <div className="flex">
            {assigned.slice(0, 5).map((p, i) => (
              <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                <Avatar nombre={p.nombre} idx={providers.indexOf(p)} size="sm" />
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs text-red">Sin proveedores asignados</span>
        )}
        {assigned.length > 0 && (
          <span className="text-xs text-text-2">
            {assigned.length} proveedor{assigned.length === 1 ? "" : "es"}
          </span>
        )}
      </div>
    </div>
  );
}
