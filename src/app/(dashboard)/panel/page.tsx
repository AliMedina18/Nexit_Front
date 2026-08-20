"use client";

import { useEffect, useMemo, useState } from "react";
import { ActiveFilters, type FilterChip } from "@/components/ui/primitives";
import { Select } from "@/components/ui/form";
import { BRIEF_STATUSES, PROJECT_STATUS_GROUPS } from "@/types/domain";
import type { Project, ProjectInput } from "@/types/domain";
import { useProjectsStore } from "@/store/projects-store";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
import { ProjectDetail } from "../proyectos/ProjectDetail";
import { ProjectFormModal } from "../proyectos/ProjectFormModal";
import { MonthCard } from "./MonthCard";

export default function PanelPage() {
  const { items: projects, fetchAll, updateProject, removeProject } = useProjectsStore();
  const { items: providers, fetchAll: fetchProviders } = useProvidersStore();
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    fetchAll();
    fetchProviders();
  }, [fetchAll, fetchProviders]);

  const years = useMemo(() => {
    const set = new Set(projects.map((p) => p.fecha?.slice(0, 4)).filter(Boolean) as string[]);
    set.add(String(new Date().getFullYear()));
    return [...set].sort();
  }, [projects]);

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [filtEstado, setFiltEstado] = useState("");
  const [filtBrief, setFiltBrief] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep the selected year valid as the project list (and thus available years) loads/changes
    if (!years.includes(year) && years.length) setYear(years[years.length - 1]);
  }, [years, year]);

  const today = new Date().toISOString().slice(0, 10);

  const monthly = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mm = String(i + 1).padStart(2, "0");
      const prefix = `${year}-${mm}`;
      return projects.filter(
        (p) =>
          p.fecha?.startsWith(prefix) &&
          (!filtEstado || p.estado === filtEstado) &&
          (!filtBrief || p.briefEstado === filtBrief),
      );
    });
  }, [projects, year, filtEstado, filtBrief]);

  const chips: FilterChip[] = [
    filtEstado && { key: "estado", label: filtEstado },
    filtBrief && { key: "brief", label: filtBrief },
  ].filter(Boolean) as FilterChip[];

  const detailProject = detailId ? projects.find((p) => p.id === detailId) ?? null : null;

  async function handleSave(input: ProjectInput) {
    if (editing) {
      await updateProject(editing.id, input);
      pushToast("Proyecto actualizado", "✅");
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    await removeProject(id);
    setDetailId(null);
    pushToast("Proyecto eliminado", "🗑");
  }

  return (
    <div>
      <div className="mb-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <h3 className="text-sm font-semibold">📅 Proyectos a ejecutar por mes</h3>
          <Select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: "auto" }}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        <ActiveFilters
          chips={chips}
          onRemove={(key) => (key === "estado" ? setFiltEstado("") : setFiltBrief(""))}
          onClearAll={() => {
            setFiltEstado("");
            setFiltBrief("");
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
        {monthly.map((monthProjects, i) => (
          <MonthCard key={i} monthIndex={i} projects={monthProjects} today={today} onOpen={setDetailId} />
        ))}
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
