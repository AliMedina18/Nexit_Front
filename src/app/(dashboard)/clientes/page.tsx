"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, Plus } from "lucide-react";
import { ActiveFilters, Button, EmptyState, StatCard, ViewToggle, type FilterChip } from "@/components/ui/primitives";
import { ImportExportBar } from "@/components/ui/ImportExportBar";
import { Select } from "@/components/ui/form";
import { Spinner } from "@/components/ui/Spinner";
import { useAuthStore } from "@/store/auth-store";
import { useClientesStore } from "@/store/clientes-store";
import { useProjectsStore } from "@/store/projects-store";
import { usePageToolbarStore } from "@/store/page-toolbar-store";
import { useUiStore } from "@/store/ui-store";
import { clientesApi } from "@/services/api/clientes-service";
import type { Cliente, ClienteInput } from "@/types/api";
import { ClienteCard } from "./ClienteCard";
import { ClienteFormModal } from "./ClienteFormModal";
import { ClienteDetail } from "./ClienteDetail";
import styles from "@/styles/dashboard.module.css";

export default function ClientesPage() {
  const { items: clientes, loading, error, fetchAll, refresh, addCliente, updateCliente, removeCliente } = useClientesStore();
  const { items: projects, fetchAll: fetchProjects } = useProjectsStore();
  const pushToast = useUiStore((s) => s.pushToast);
  const authUser = useAuthStore((s) => s.user);
  const esAdmin = authUser?.rol === "admin" || authUser?.rol === "super_admin";
  const setToolbar = usePageToolbarStore((s) => s.setToolbar);
  const clearToolbar = usePageToolbarStore((s) => s.clearToolbar);

  useEffect(() => {
    fetchAll();
    fetchProjects();
  }, [fetchAll, fetchProjects]);

  const [search, setSearch] = useState("");
  const [filtEstado, setFiltEstado] = useState("");
  const [filtSector, setFiltSector] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const onSearch = (event: Event) => setSearch((event as CustomEvent<string>).detail);
    window.addEventListener("nexit:search", onSearch);
    return () => window.removeEventListener("nexit:search", onSearch);
  }, []);

  // Registra las acciones de esta página (Excel + "Nuevo cliente") en la
  // barra superior compartida -- ver comentario en page-toolbar-store.ts.
  useEffect(() => {
    setToolbar({
      entidad: "clientes",
      searchPlaceholder: "Buscar cliente, contacto o ciudad…",
      puedeImportar: esAdmin,
      onExport: clientesApi.exportar,
      onImport: clientesApi.importar,
      onImported: refresh,
      addLabel: "Nuevo cliente",
      onAdd: () => {
        setEditing(null);
        setFormOpen(true);
      },
    });
    return () => clearToolbar();
  }, [setToolbar, clearToolbar, esAdmin, refresh]);

  const sectores = useMemo(
    () => [...new Set(clientes.map((c) => c.sector).filter((s): s is string => Boolean(s)))].sort(),
    [clientes],
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return clientes.filter((c) => {
      const matchesSearch =
        !s ||
        [c.nombre, c.sector, c.ciudad, c.contacto, c.email, ...c.telefonos.map((t) => t.telefono)].some((v) =>
          v?.toLowerCase().includes(s),
        );
      const matchesSector = !filtSector || c.sector === filtSector;
      const tieneProyecto = projects.some((project) => project.clienteId === c.id);
      const matchesEstado = !filtEstado || (filtEstado === "activo" ? tieneProyecto : !tieneProyecto);
      return matchesSearch && matchesSector && matchesEstado;
    });
  }, [clientes, projects, search, filtEstado, filtSector]);

  const stats = useMemo(() => {
    const total = clientes.length;
    const activos = projects.filter((project) => project.clienteId).length;
    const prospectos = clientes.filter((cliente) => !projects.some((project) => project.clienteId === cliente.id)).length;
    const conProyectoActivo = new Set(projects.map((project) => project.clienteId).filter(Boolean)).size;
    return { total, activos, prospectos, conProyectoActivo };
  }, [clientes, projects]);

  const chips: FilterChip[] = [
    search && { key: "search", label: `“${search}”` },
    filtEstado && { key: "estado", label: filtEstado === "activo" ? "Activos" : "Prospectos" },
    filtSector && { key: "sector", label: filtSector },
  ].filter(Boolean) as FilterChip[];

  function removeChip(key: string) {
    if (key === "search") setSearch("");
    if (key === "estado") setFiltEstado("");
    if (key === "sector") setFiltSector("");
  }

  function clearAll() {
    setSearch("");
    setFiltEstado("");
    setFiltSector("");
  }

  async function handleSave(input: ClienteInput) {
    try {
      if (editing) {
        await updateCliente(editing.id, input);
        pushToast("Cliente actualizado", "success");
      } else {
        await addCliente(input);
        pushToast("Cliente agregado", "success");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo guardar el cliente", "danger");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este cliente? Esta acción no se puede deshacer.")) return;
    try {
      await removeCliente(id);
      setDetailId(null);
      pushToast("Cliente eliminado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar el cliente", "danger");
    }
  }

  const detailCliente = detailId ? (clientes.find((c) => c.id === detailId) ?? null) : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Base de datos</div>
          <h1 className={styles.h1}>Gestión de clientes</h1>
          <p className="mt-1 text-[13px] text-text-2">Cada cliente con sus contactos, proyectos asociados y facturación.</p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className={`mb-5 ${styles.kpis}`}>
        <StatCard n={stats.total} label="Total de clientes" />
        <StatCard n={stats.activos} label="Activos" />
        <StatCard n={stats.prospectos} label="Prospectos" />
        <StatCard n={stats.conProyectoActivo} label="Con proyecto activo" />
      </div>

      {/* Mismas acciones que la barra superior ("Excel" / "Nuevo cliente"),
          pero solo visibles por debajo de los 1000px reales del diseño --
          en escritorio esas acciones viven arriba, junto al buscador (ver
          layout.tsx + page-toolbar-store.ts); ese header de escritorio no
          existe en móvil, así que se repiten acá para no perder la función. */}
      <div className="mb-4 flex flex-wrap items-center gap-2 min-[1000px]:hidden">
        <ImportExportBar
          entidad="clientes"
          puedeImportar={esAdmin}
          onExport={clientesApi.exportar}
          onImport={clientesApi.importar}
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
          Nuevo cliente
        </Button>
      </div>

      <div className={`mb-4 rounded-(--radius-md) border border-border bg-surface p-4 ${styles.filters2}`}>
        <Select value={filtEstado} onChange={(e) => setFiltEstado(e.target.value)}>
          <option value="">Cualquier estado</option>
          <option value="activo">Activos</option>
          <option value="prospecto">Prospectos</option>
        </Select>
        <Select value={filtSector} onChange={(e) => setFiltSector(e.target.value)}>
          <option value="">Toda industria</option>
          {sectores.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <ActiveFilters chips={chips} onRemove={removeChip} onClearAll={clearAll} />

      {loading && clientes.length === 0 ? (
        <div className="flex justify-center py-14 text-text-2">
          <Spinner label="Cargando clientes…" />
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title={error} tone="danger" action={{ label: "Reintentar", onClick: fetchAll }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No se encontraron clientes con estos filtros." />
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface">
          <table className="w-full min-w-[680px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-3">
                <th className="px-4 py-2.5 font-medium">Nombre</th>
                <th className="px-4 py-2.5 font-medium">Industria</th>
                <th className="px-4 py-2.5 font-medium">Ciudad</th>
                <th className="px-4 py-2.5 font-medium">Contacto</th>
                <th className="px-4 py-2.5 font-medium">Correo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailId(c.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setDetailId(c.id))}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-gray-light"
                >
                  <td className="px-4 py-2.5 font-medium text-text">{c.nombre}</td>
                  <td className="px-4 py-2.5 text-text-2">{c.sector || "—"}</td>
                  <td className="px-4 py-2.5 text-text-2">{c.ciudad || "—"}</td>
                  <td className="px-4 py-2.5 text-text-2">{c.contacto || "—"}</td>
                  <td className="px-4 py-2.5 text-text-2">{c.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[760px]:grid-cols-2">
          {filtered.map((c) => (
            <ClienteCard key={c.id} cliente={c} onOpen={() => setDetailId(c.id)} />
          ))}
        </div>
      )}

      <ClienteFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        editing={editing}
      />

      <ClienteDetail
        cliente={detailCliente}
        onClose={() => setDetailId(null)}
        onEdit={() => {
          setEditing(detailCliente);
          setFormOpen(true);
        }}
        onDelete={() => detailCliente && handleDelete(detailCliente.id)}
      />
    </div>
  );
}
