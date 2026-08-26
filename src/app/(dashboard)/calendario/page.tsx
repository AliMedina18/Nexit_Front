"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActiveFilters, Button, type FilterChip } from "@/components/ui/primitives";
import { Select } from "@/components/ui/form";
import { BRIEF_STATUSES, PROJECT_STATUS_GROUPS } from "@/types/domain";
import type { Project, ProjectInput } from "@/types/domain";
import { useProjectsStore } from "@/store/projects-store";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
import { ProjectDetail } from "../proyectos/ProjectDetail";
import { ProjectFormModal } from "../proyectos/ProjectFormModal";
import { CalendarGrid } from "./CalendarGrid";

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

export default function CalendarioPage() {
  const { items: projects, fetchAll, updateProject, removeProject } = useProjectsStore();
  const { items: providers, fetchAll: fetchProviders } = useProvidersStore();
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    fetchAll();
    fetchProviders();
  }, [fetchAll, fetchProviders]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [filtEstado, setFiltEstado] = useState("");
  const [filtBrief, setFiltBrief] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  function goToMonth(delta: number) {
    const d = new Date(year, monthIndex + delta, 1);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
  }

  function goToday() {
    setYear(now.getFullYear());
    setMonthIndex(now.getMonth());
  }

  const monthProjects = useMemo(() => {
    const mm = String(monthIndex + 1).padStart(2, "0");
    const prefix = `${year}-${mm}`;
    return projects.filter(
      (p) =>
        p.fecha?.startsWith(prefix) &&
        (!filtEstado || p.estado === filtEstado) &&
        (!filtBrief || p.briefEstado === filtBrief),
    );
  }, [projects, year, monthIndex, filtEstado, filtBrief]);

  const sinProveedor = monthProjects.filter((p) => p.proveedorIds.length === 0).length;

  const chips: FilterChip[] = [
    filtEstado && { key: "estado", label: filtEstado },
    filtBrief && { key: "brief", label: filtBrief },
  ].filter(Boolean) as FilterChip[];

  const detailProject = detailId ? projects.find((p) => p.id === detailId) ?? null : null;

  async function handleSave(input: ProjectInput) {
    if (editing) {
      await updateProject(editing.id, input);
      pushToast("Proyecto actualizado", "success");
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    await removeProject(id);
    setDetailId(null);
    pushToast("Proyecto eliminado", "success");
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToMonth(-1)}
            aria-label="Mes anterior"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-text-2 hover:bg-gray-light"
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
          <button
            onClick={() => goToMonth(1)}
            aria-label="Mes siguiente"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-text-2 hover:bg-gray-light"
          >
            <ChevronRight size={15} strokeWidth={2} />
          </button>
        </div>
        <h3 className="text-[15px] font-semibold">
          {MONTH_NAMES[monthIndex]} {year}
        </h3>
        <Button size="sm" onClick={goToday}>
          Hoy
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {sinProveedor > 0 && (
            <span className="rounded-full bg-red-light px-2 py-0.5 text-[11px] font-medium text-red">
              {sinProveedor} sin proveedor
            </span>
          )}
          <Select value={filtEstado} onChange={(e) => setFiltEstado(e.target.value)} style={{ width: "auto" }}>
            <option value="">Todos los estados</option>
            {PROJECT_STATUS_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </optgroup>
            ))}
          </Select>
          <Select value={filtBrief} onChange={(e) => setFiltBrief(e.target.value)} style={{ width: "auto" }}>
            <option value="">Todos los estados de brief</option>
            {BRIEF_STATUSES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </div>
      </div>

      <ActiveFilters
        chips={chips}
        onRemove={(key) => (key === "estado" ? setFiltEstado("") : setFiltBrief(""))}
        onClearAll={() => {
          setFiltEstado("");
          setFiltBrief("");
        }}
      />

      <div className="mt-1">
        <CalendarGrid year={year} monthIndex={monthIndex} projects={monthProjects} today={today} onOpen={setDetailId} />
      </div>

      <ProjectDetail
        project={detailProject}
        providers={providers}
        onClose={() => setDetailId(null)}
        onEdit={() => {
          setEditing(detailProject);
          setFormOpen(true);
        }}
        onDelete={() => detailProject && handleDelete(detailProject.id)}
      />

      <ProjectFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        editing={editing}
        providers={providers}
      />
    </div>
  );
}
