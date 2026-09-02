"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Download, FolderKanban, Plus } from "lucide-react";
import { ActiveFilters, Button, EmptyState, SearchInput, StatCard, type FilterChip } from "@/components/ui/primitives";
import { Select } from "@/components/ui/form";
import { Spinner } from "@/components/ui/Spinner";
import { downloadCSV, toCSV } from "@/lib/csv";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useClientesStore } from "@/store/clientes-store";
import { useProjectsStore } from "@/store/projects-store";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
import type { Proyecto, ProyectoInput } from "@/types/api";
import { ProjectCard } from "./ProjectCard";
import { ProjectFormModal } from "./ProjectFormModal";
import { ProjectDetail } from "./ProjectDetail";
import styles from "@/styles/dashboard.module.css";

export default function ProyectosPage() {
  const { items: projects, loading, error, fetchAll, addProject, updateProject, removeProject } = useProjectsStore();
  const { items: providers, fetchAll: fetchProviders } = useProvidersStore();
  const { items: clientes, fetchAll: fetchClientes } = useClientesStore();
  const { estadosProyecto, fetchBase } = useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchAll();
    fetchProviders();
    fetchClientes();
    fetchBase();
  }, [fetchAll, fetchProviders, fetchClientes, fetchBase]);

  const [search, setSearch] = useState("");
  const [filtEstadoId, setFiltEstadoId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const openId = searchParams.get("open");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep-link from Informe/Panel opening a project's detail drawer
    if (openId) setDetailId(openId);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return projects.filter((p) => {
      const clienteNombre = clientes.find((c) => c.id === p.clienteId)?.nombre ?? "";
      const matchesSearch = !s || [p.nombre, clienteNombre].some((v) => v?.toLowerCase().includes(s));
      const matchesEstado = !filtEstadoId || p.estadoId === filtEstadoId;
      return matchesSearch && matchesEstado;
    });
  }, [projects, clientes, search, filtEstadoId]);

  const stats = useMemo(() => {
    const total = projects.length;
    const estadosEnCurso = new Set(estadosProyecto.filter((e) => e.nombre === "En curso").map((e) => e.id));
    const enCurso = projects.filter((p) => estadosEnCurso.has(p.estadoId)).length;
    const sinProveedores = projects.filter((p) => p.proveedorIds.length === 0).length;
    const provAsignados = new Set(projects.flatMap((p) => p.proveedorIds)).size;
    return { total, enCurso, sinProveedores, provAsignados };
  }, [projects, estadosProyecto]);

  const chips: FilterChip[] = [
    search && { key: "search", label: `“${search}”` },
    filtEstadoId && { key: "estado", label: estadosProyecto.find((e) => e.id === filtEstadoId)?.nombre ?? "" },
  ].filter(Boolean) as FilterChip[];

  function removeChip(key: string) {
    if (key === "search") setSearch("");
    if (key === "estado") setFiltEstadoId("");
  }

  function clearAll() {
    setSearch("");
    setFiltEstadoId("");
  }

  async function handleSave(input: ProyectoInput) {
    try {
      if (editing) {
        await updateProject(editing.id, input);
        pushToast("Proyecto actualizado", "success");
      } else {
        await addProject(input);
        pushToast("Proyecto agregado", "success");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo guardar el proyecto", "danger");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    try {
      await removeProject(id);
      setDetailId(null);
      pushToast("Proyecto eliminado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar el proyecto", "danger");
    }
  }

  function exportCSV() {
    const headers = [
      "Proyecto",
      "Cliente",
      "Contacto",
      "Fecha de solicitud",
      "Fecha del evento",
      "Estado",
      "Estado del brief",
      "% de avance",
      "Notas",
      "Proveedores asignados",
    ];
    const rows = projects.map((p) => [
      p.nombre,
      clientes.find((c) => c.id === p.clienteId)?.nombre ?? "",
      p.contactoProyecto ?? "",
      p.fechaSolicitud?.slice(0, 10) ?? "",
      p.fechaEvento?.slice(0, 10) ?? "",
      estadosProyecto.find((e) => e.id === p.estadoId)?.nombre ?? "",
      p.estadoBrief,
      p.porcentajeAvance,
      p.notas ?? "",
      p.proveedorIds.map((id) => providers.find((prov) => prov.id === id)?.nombre).filter(Boolean).join("; "),
    ]);
    downloadCSV("proyectos.csv", toCSV(headers, rows));
  }

  const detailProject = detailId ? (projects.find((p) => p.id === detailId) ?? null) : null;

  return (
    <div>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Operación</div>
      <h1 className={styles.h1}>Gestión de proyectos</h1>
      <p className="mb-5 text-[13px] text-text-2">Cada evento con su cliente, equipo asignado, estado y proveedores vinculados.</p>

      <div className={`mb-5 ${styles.kpis}`}>
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
            Nuevo proyecto
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={filtEstadoId} onChange={(e) => setFiltEstadoId(e.target.value)} style={{ width: "auto" }}>
          <option value="">Cualquier estado</option>
          {[...estadosProyecto]
            .sort((a, b) => a.fase - b.fase || a.orden - b.orden)
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
        </Select>
      </div>

      <ActiveFilters chips={chips} onRemove={removeChip} onClearAll={clearAll} />

      <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        {loading && projects.length === 0 ? (
          <div className="col-span-full flex justify-center py-14 text-text-2">
            <Spinner label="Cargando proyectos…" />
          </div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title={error} tone="danger" action={{ label: "Reintentar", onClick: fetchAll }} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No se encontraron proyectos con estos filtros." />
        ) : (
          filtered.map((p) => <ProjectCard key={p.id} project={p} onOpen={() => setDetailId(p.id)} />)
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
