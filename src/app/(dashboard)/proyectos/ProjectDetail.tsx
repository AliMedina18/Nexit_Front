"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Avatar, Badge, Button, Stars } from "@/components/ui/primitives";
import { Drawer, DrawerCloseButton, DrawerHeader, DrawerSection, KeyValue, NoteBox } from "@/components/ui/Drawer";
import { BRIEF_STATUS_COLORS, PROJECT_STATUS_COLORS, PROVIDER_STATUS_COLORS } from "@/lib/constants";
import { fmtDateLong } from "@/lib/format";
import type { Project, Provider } from "@/types/domain";

export function ProjectDetail({
  project,
  providers,
  onClose,
  onEdit,
  onDelete,
}: {
  project: Project | null;
  providers: Provider[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!project) return <Drawer open={false} onClose={onClose}><></></Drawer>;

  const st = PROJECT_STATUS_COLORS[project.estado];
  const bst = BRIEF_STATUS_COLORS[project.briefEstado];
  const assigned = project.proveedorIds
    .map((id) => providers.find((p) => p.id === id))
    .filter((p): p is Provider => Boolean(p));

  return (
    <Drawer open={Boolean(project)} onClose={onClose}>
      <DrawerHeader>
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold leading-tight">{project.nombre || "(Sin nombre)"}</div>
          <div className="mt-0.5 text-[13px] text-text-2">{project.cliente || "Sin cliente"}</div>
        </div>
        <DrawerCloseButton onClose={onClose} />
      </DrawerHeader>

      <div className="flex-1 p-5">
        <DrawerSection title="Estado" />
        <div className="flex flex-wrap gap-1.5">
          <Badge bg={st.bg} color={st.c}>
            {project.estado}
          </Badge>
          <Badge bg={bst.bg} color={bst.c}>
            {project.briefEstado}
          </Badge>
        </div>

        <DrawerSection title="Evento" />
        <KeyValue k="Fecha" v={fmtDateLong(project.fecha)} />
        <KeyValue k="Cliente" v={project.cliente || "—"} />
        <KeyValue k="Contacto" v={project.contacto || "—"} />

        <DrawerSection title="Equipo" />
        <KeyValue k="Ejecutivo" v={project.ejecutivo || "—"} />
        <KeyValue k="Diseñador 3D" v={project.disenador3d || "—"} />
        <KeyValue k="Diseñador gráfico" v={project.disenadorgrafico || "—"} />

        {project.notas && (
          <>
            <DrawerSection title="Notas" />
            <NoteBox>{project.notas}</NoteBox>
          </>
        )}

        <DrawerSection title={`Proveedores asignados (${assigned.length})`} />
        {assigned.length === 0 ? (
          <div className="py-2 text-xs text-text-3">Aún no hay proveedores asignados a este proyecto.</div>
        ) : (
          <div className="flex flex-col">
            {assigned.map((p) => {
              const idx = providers.indexOf(p);
              const sc = PROVIDER_STATUS_COLORS[p.status];
              return (
                <div key={p.id} className="flex items-center gap-2.5 border-b border-border py-2.5 last:border-b-0">
                  <Avatar nombre={p.nombre} idx={idx} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{p.nombre}</div>
                    <div className="truncate text-[11px] text-text-2">{p.cat}</div>
                  </div>
                  <Stars n={p.score} />
                  <Badge bg={sc.bg} color={sc.c} className="ml-1">
                    {p.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border p-4">
        <Button variant="primary" icon={Pencil} onClick={onEdit}>
          Editar
        </Button>
        <Button variant="danger" icon={Trash2} onClick={onDelete}>
          Eliminar
        </Button>
      </div>
    </Drawer>
  );
}
