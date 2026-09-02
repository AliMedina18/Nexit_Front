"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, FolderKanban, Plus } from "lucide-react";
import { ActiveFilters, Button, EmptyState, StatCard, ViewToggle, type FilterChip } from "@/components/ui/primitives";
import { ImportExportBar } from "@/components/ui/ImportExportBar";
import { Select } from "@/components/ui/form";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useClientesStore } from "@/store/clientes-store";
import { usePageToolbarStore } from "@/store/page-toolbar-store";
import { useProjectsStore } from "@/store/projects-store";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
import { proyectosApi } from "@/services/api/proyectos-service";
import type { Proyecto, ProyectoInput } from "@/types/api";
import { ProjectCard } from "./ProjectCard";
import { ProjectFormModal } from "./ProjectFormModal";
import { ProjectDetail } from "./ProjectDetail";
import styles from "@/styles/dashboard.module.css";

export default function ProyectosPage() {
  const { items: projects, loading, error, fetchAll, refresh, addProject, updateProject, removeProject } = useProjectsStore();
  const { items: providers, fetchAll: fetchProviders } = useProvidersStore();
  const { items: clientes, fetchAll: fetchClientes } = useClientesStore();
  const { estadosProyecto, fetchBase } = useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);
  const authUser = useAuthStore((s) => s.user);
  const esAdmin = authUser?.rol === "admin" || authUser?.rol === "super_admin";
  const setToolbar = usePageToolbarStore((s) => s.setToolbar);
  const clearToolbar = usePageToolbarStore((s) => s.clearToolbar);

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchAll();
    fetchProviders();
    fetchClientes();
    fetchBase();
  }, [fetchAll, fetchProviders, fetchClientes, fetchBase]);

  const [search, setSearch] = useState("");
  const [filtEstadoId, setFiltEstadoId] = useState("");
  const [filtClienteId, setFiltClienteId] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const onSearch = (event: Event) => setSearch((event as CustomEvent<string>).detail);
    window.addEventListener("nexit:search", onSearch);
    return () => window.removeEventListener("nexit:search", onSearch);
  }, []);

  useEffect(() => {
    const openId = searchParams.get("open");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep-link from Informe/Panel opening a project's detail drawer
    if (openId) setDetailId(openId);
  }, [searchParams]);

  // Registra las acciones de esta página (Excel + "Nuevo proyecto") en la
  // barra superior compartida -- ver comentario en page-toolbar-store.ts.
  useEffect(() => {
    setToolbar({
      entidad: "proyectos",
      searchPlaceholder: "Buscar proyecto, cliente o ejecutivo…",
      puedeImportar: esAdmin,
      onExport: proyectosApi.exportar,
      onImport: proyectosApi.importar,
      onImported: refresh,
      addLabel: "Nuevo proyecto",
      onAdd: () => {
        setEditing(null);
        setFormOpen(true);
      },
    });
    return () => clearToolbar();
  }, [setToolbar, clearToolbar, esAdmin, refresh]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return projects.filter((p) => {
      const clienteNombre = clientes.find((c) => c.id === p.clienteId)?.nombre ?? "";
      const matchesSearch = !s || [p.nombre, clienteNombre].some((v) => v?.toLowerCase().includes(s));
      const matchesEstado = !filtEstadoId || p.estadoId === filtEstadoId;
      const matchesCliente = !filtClienteId || p.clienteId === filtClienteId;
      return matchesSearch && matchesEstado && matchesCliente;
    });
  }, [projects, clientes, search, filtEstadoId, filtClienteId]);

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
    filtClienteId && { key: "cliente", label: clientes.find((c) => c.id === filtClienteId)?.nombre ?? "" },
  ].filter(Boolean) as FilterChip[];

  function removeChip(key: string) {
    if (key === "search") setSearch("");
    if (key === "estado") setFiltEstadoId("");
    if (key === "cliente") setFiltClienteId("");
  }

  function clearAll() {
    setSearch("");
    setFiltEstadoId("");
    setFiltClienteId("");
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

  const detailProject = detailId ? (projects.find((p) => p.id === detailId) ?? null) : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Operación</div>
          <h1 className={styles.h1}>Gestión de proyectos</h1>
          <p className="mt-1 text-[13px] text-text-2">Cada evento con su cliente, equipo asignado, estado y proveedores vinculados.</p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className={`mb-5 ${styles.kpis}`}>
        <StatCard n={stats.total} label="Proyectos totales" />
        <StatCard n={stats.enCurso} label="En curso" />
        <StatCard n={stats.provAsignados} label="Proveedores asignados" />
        <StatCard n={stats.sinProveedores} label="Sin proveedores" />
      </div>

      {/* Mismas acciones que la barra superior ("Excel" / "Nuevo proyecto"),
          pero solo visibles por debajo de los 1000px reales del diseño --
          en escritorio esas acciones viven arriba, junto al buscador (ver
          layout.tsx + page-toolbar-store.ts); ese header de escritorio no
          existe en móvil, así que se repiten acá para no perder la función. */}
      <div className="mb-4 flex flex-wrap items-center gap-2 min-[1000px]:hidden">
        <ImportExportBar
          entidad="proyectos"
          puedeImportar={esAdmin}
          onExport={proyectosApi.exportar}
          onImport={proyectosApi.importar}
          onImported={refresh}
        />
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

      <div className={`mb-4 ${styles.filters2}`}>
        <Select value={filtEstadoId} onChange={(e) => setFiltEstadoId(e.target.value)}>
          <option value="">Cualquier estado</option>
          {[...estadosProyecto]
            .sort((a, b) => a.fase - b.fase || a.orden - b.orden)
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
        </Select>
        <Select value={filtClienteId} onChange={(e) => setFiltClienteId(e.target.value)}>
          <option value="">Todo cliente</option>
          {[...clientes]
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
        </Select>
      </div>

      <ActiveFilters chips={chips} onRemove={removeChip} onClearAll={clearAll} />

      {loading && projects.length === 0 ? (
        <div className="flex justify-center py-14 text-text-2">
          <Spinner label="Cargando proyectos…" />
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title={error} tone="danger" action={{ label: "Reintentar", onClick: fetchAll }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No se encontraron proyectos con estos filtros." />
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface">
          <table className="w-full min-w-[680px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-3">
                <th className="px-4 py-2.5 font-medium">Nombre</th>
                <th className="px-4 py-2.5 font-medium">Cliente</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium">Proveedores</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const clienteNombre = clientes.find((c) => c.id === p.clienteId)?.nombre;
                const estadoNombre = estadosProyecto.find((e) => e.id === p.estadoId)?.nombre;
                return (
                  <tr
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailId(p.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setDetailId(p.id))}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-gray-light"
                  >
                    <td className="px-4 py-2.5 font-medium text-text">{p.nombre}</td>
                    <td className="px-4 py-2.5 text-text-2">{clienteNombre || "—"}</td>
                    <td className="px-4 py-2.5 text-text-2">{estadoNombre || "—"}</td>
                    <td className="px-4 py-2.5 text-text-2">{p.proveedorIds.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[760px]:grid-cols-2 min-[1100px]:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} onOpen={() => setDetailId(p.id)} />
          ))}
        </div>
      )}

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
