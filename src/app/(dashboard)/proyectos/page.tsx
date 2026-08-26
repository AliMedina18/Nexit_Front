"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, FolderKanban, Plus } from "lucide-react";
import { ActiveFilters, Button, EmptyState, SearchInput, StatCard, type FilterChip } from "@/components/ui/primitives";
import { Select } from "@/components/ui/form";
import { downloadCSV, toCSV } from "@/lib/csv";
import { PROJECT_STATUS_GROUPS } from "@/types/domain";
import type { Project, ProjectInput } from "@/types/domain";
import { useProjectsStore } from "@/store/projects-store";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
import { ProjectCard } from "./ProjectCard";
import { ProjectFormModal } from "./ProjectFormModal";
import { ProjectDetail } from "./ProjectDetail";

export default function ProyectosPage() {
  const { items: projects, fetchAll, addProject, updateProject, removeProject } = useProjectsStore();
  const { items: providers, fetchAll: fetchProviders } = useProvidersStore();
  const pushToast = useUiStore((s) => s.pushToast);

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchAll();
    fetchProviders();
  }, [fetchAll, fetchProviders]);

  const [search, setSearch] = useState("");
  const [filtEstado, setFiltEstado] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => {
    const openId = searchParams.get("open");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep-link from Informe/Panel opening a project's detail drawer
    if (openId) setDetailId(Number(openId));
  }, [searchParams]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return projects.filter((p) => {
      const matchesSearch = !s || [p.nombre, p.cliente].some((v) => v?.toLowerCase().includes(s));
      const matchesEstado = !filtEstado || p.estado === filtEstado;
      return matchesSearch && matchesEstado;
    });
  }, [projects, search, filtEstado]);

  const stats = useMemo(() => {
    const total = projects.length;
    const enCurso = projects.filter((p) => p.estado === "En curso").length;
    const sinProveedores = projects.filter((p) => p.proveedorIds.length === 0).length;
    const provAsignados = new Set(projects.flatMap((p) => p.proveedorIds)).size;
    return { total, enCurso, sinProveedores, provAsignados };
  }, [projects]);

  const chips: FilterChip[] = [
    search && { key: "search", label: `“${search}”` },
    filtEstado && { key: "estado", label: filtEstado },
  ].filter(Boolean) as FilterChip[];

  function removeChip(key: string) {
    if (key === "search") setSearch("");
    if (key === "estado") setFiltEstado("");
  }

  function clearAll() {
    setSearch("");
    setFiltEstado("");
  }

  async function handleSave(input: ProjectInput) {
    if (editing) {
      await updateProject(editing.id, input);
      pushToast("Proyecto actualizado", "success");
    } else {
      await addProject(input);
      pushToast("Proyecto agregado", "success");
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

  function exportCSV() {
    const headers = [
      "Proyecto",
      "Cliente",
      "Contacto",
      "Ejecutivo encargado",
      "Diseñador 3D encargado",
      "Diseñador gráfico encargado",
      "Fecha",
      "Estado",
      "Estado de entrega de brief",
      "Notas",
      "Proveedores asignados",
    ];
    const rows = projects.map((p) => [
      p.nombre,
      p.cliente,
      p.contacto,
      p.ejecutivo,
      p.disenador3d,
      p.disenadorgrafico,
      p.fecha,
      p.estado,
      p.briefEstado,
      p.notas,
      p.proveedorIds.map((id) => providers.find((prov) => prov.id === id)?.nombre).filter(Boolean).join("; "),
    ]);
    downloadCSV("proyectos.csv", toCSV(headers, rows));
  }

  const detailProject = detailId ? projects.find((p) => p.id === detailId) ?? null : null;

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard n={stats.total} label="Proyectos totales" />
        <StatCard n={stats.enCurso} label="En curso" />
        <StatCard n={stats.provAsignados} label="Proveedores asignados" />
        <StatCard n={stats.sinProveedores} label="Sin proveedores" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar proyecto o cliente…" />
        <div className="ml-auto flex items-center gap-2">
          <Button icon={Download} onClick={exportCSV}>
            Exportar
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Agregar
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
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
      </div>

      <ActiveFilters chips={chips} onRemove={removeChip} onClearAll={clearAll} />

      <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        {filtered.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No se encontraron proyectos con estos filtros." />
        ) : (
          filtered.map((p) => (
            <ProjectCard key={p.id} project={p} providers={providers} onOpen={() => setDetailId(p.id)} />
          ))
        )}
      </div>

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
    </div>
  );
}
