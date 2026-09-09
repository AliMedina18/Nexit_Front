"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, FolderKanban, LayoutGrid, Pencil, Rows3 } from "lucide-react";
import {
  ActiveFilters,
  Badge,
  Dropdown,
  EmptyState,
  Pagination,
  StatCard,
  TabButton,
  TabsShell,
  type FilterChip,
} from "@/components/ui/primitives";
import { DeleteOrRequestButton } from "@/components/ui/DeleteAction";
import { Spinner } from "@/components/ui/Spinner";
import { RowAction, Table, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { PROJECT_STATUS_COLORS, statusColor } from "@/lib/constants";
import { fmtDateShort } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useClientesStore } from "@/store/clientes-store";
import { useProjectsStore } from "@/store/projects-store";
import { useProvidersStore } from "@/store/providers-store";
import { usePageToolbarStore } from "@/store/page-toolbar-store";
import { useUiStore } from "@/store/ui-store";
import { readFilterState, writeFilterState } from "@/lib/use-filter-state";
import { useGridColumns } from "@/lib/use-grid-columns";
import { proyectosApi } from "@/services/api/proyectos-service";
import type { Proyecto, ProyectoInput } from "@/types/api";
import { ProjectCard } from "./ProjectCard";
import { ProjectFormModal } from "./ProjectFormModal";
import { ProjectDetail } from "./ProjectDetail";
import styles from "@/styles/dashboard.module.css";

/** Miembro del equipo cuyo rol suena a "ejecutivo" -- ver ProjectCard.tsx para el porqué de
 * la búsqueda por coincidencia en vez de una posición fija. */
function ejecutivoDe(project: Proyecto): string {
  return project.equipo.find((m) => m.rol?.toLowerCase().includes("ejecutivo"))?.nombre ?? "—";
}

export default function ProyectosPage() {
  const { items: projects, loading, error, fetchAll, refresh, addProject, updateProject, removeProject } = useProjectsStore();
  const { items: providers, fetchAll: fetchProviders } = useProvidersStore();
  const { items: clientes, fetchAll: fetchClientes } = useClientesStore();
  const { estadosProyecto, fetchBase } = useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);
  const authUser = useAuthStore((s) => s.user);
  const setToolbar = usePageToolbarStore((s) => s.setToolbar);
  const clearToolbar = usePageToolbarStore((s) => s.clearToolbar);
  const esAdmin = authUser?.rol === "admin" || authUser?.rol === "super_admin";

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
  // Columnas de la grilla de tarjetas calculadas para llenar el ancho
  // disponible sin franja vacía, con o sin el riel expandido (Alicia
  // 2026-09-08) -- ver use-grid-columns.ts.
  const { ref: cardsGridRef, columns: cardsGridColumns } = useGridColumns();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Autoguardado de filtros (Alicia 2026-09-07): restaura lo que había
  // quedado filtrado/buscado la última vez en esta pantalla, en esta misma
  // sesión del navegador (ver src/lib/use-filter-state.ts) -- por ejemplo,
  // si se dejó el filtro de estado en "Prospecto".
  useEffect(() => {
    const saved = readFilterState<{
      search: string;
      filtEstadoId: string;
      filtClienteId: string;
      view: "cards" | "table";
    }>("proyectos");
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restaura filtros guardados una sola vez al montar, no es un ciclo de sincronizacion
    if (saved.search !== undefined) setSearch(saved.search);
    if (saved.filtEstadoId !== undefined) setFiltEstadoId(saved.filtEstadoId);
    if (saved.filtClienteId !== undefined) setFiltClienteId(saved.filtClienteId);
    // Alicia 2026-09-08: NO restauramos `view` (Tarjetas/Tabla) desde la sesion
    // guardada. Esto era la causa real de "me aparece una tarjeta supergrande":
    // cada pantalla (Clientes/Proveedores/Proyectos) recordaba su propia vista
    // por separado en sessionStorage, asi que si en algun momento quedaba en
    // "Tabla" en una pantalla y en "Tarjetas" en otra, al entrar se veian
    // distintas entre si -- y las filas de la vista Tabla (una por fila, ancho
    // completo) se confundian con una tarjeta gigante rota. Los demas filtros
    // (busqueda, estado, etc.) SI se siguen restaurando; la vista simplemente
    // siempre arranca en "Tarjetas" para que las tres pantallas se vean iguales.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr una vez, al montar
  }, []);

  useEffect(() => {
    writeFilterState("proyectos", { search, filtEstadoId, filtClienteId, view });
  }, [search, filtEstadoId, filtClienteId, view]);

  useEffect(() => {
    const openId = searchParams.get("open");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep-link from Informe/Panel opening a project's detail drawer
    if (openId) setDetailId(openId);
  }, [searchParams]);

  // El buscador de la barra superior es el único buscador de la app -- se vuelve "Buscador de
  // proyectos" en esta página (mismo patrón que Clientes/Proveedores), en vez de tener aquí
  // abajo un segundo buscador local duplicado.
  useEffect(() => {
    function onGlobalSearch(event: Event) {
      setSearch((event as CustomEvent<string>).detail);
    }
    window.addEventListener("nexit:search", onGlobalSearch);
    return () => window.removeEventListener("nexit:search", onGlobalSearch);
  }, []);

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
    return clearToolbar;
  }, [clearToolbar, esAdmin, refresh, setToolbar]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return projects.filter((p) => {
      const clienteNombre = clientes.find((c) => c.id === p.clienteId)?.nombre ?? "";
      const matchesSearch =
        !s || [p.nombre, clienteNombre, ejecutivoDe(p)].some((v) => v?.toLowerCase().includes(s));
      const matchesEstado = !filtEstadoId || p.estadoId === filtEstadoId;
      const matchesCliente = !filtClienteId || p.clienteId === filtClienteId;
      return matchesSearch && matchesEstado && matchesCliente;
    });
  }, [projects, clientes, search, filtEstadoId, filtClienteId]);

  // Vuelve a la página 1 cada vez que cambia el resultado filtrado.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset intencional al cambiar de filtro/vista, no una sincronización derivable sin efecto
    setPage(1);
  }, [search, filtEstadoId, filtClienteId, view]);

  const per = perPage === 0 ? Math.max(filtered.length, 1) : perPage;
  const totalPages = Math.max(1, Math.ceil(filtered.length / per));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * per, (currentPage - 1) * per + per);

  const stats = useMemo(() => {
    const total = projects.length;
    const estadosEnCurso = new Set(estadosProyecto.filter((e) => e.nombre === "En curso").map((e) => e.id));
    const enCurso = projects.filter((p) => estadosEnCurso.has(p.estadoId)).length;
    const sinProveedores = projects.filter((p) => p.proveedorIds.length === 0).length;
    const now = new Date();
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const proximos = projects.filter((p) => {
      if (!p.fechaEvento) return false;
      const d = new Date(p.fechaEvento);
      return d >= now && d <= in30;
    }).length;
    return { total, enCurso, sinProveedores, proximos };
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
        setFormOpen(false);
        setEditing(null);
      } else {
        const creado = await addProject(input);
        pushToast("Proyecto agregado", "success");
        setEditing(creado);
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo guardar el proyecto", "danger");
    }
  }

  // El "¿Eliminar a X?" ya lo confirma el diálogo propio de DeleteOrRequestButton.
  async function handleDelete(id: string) {
    try {
      await removeProject(id);
      setDetailId(null);
      setFormOpen(false);
      setEditing(null);
      pushToast("Proyecto eliminado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar el proyecto", "danger");
    }
  }

  const detailProject = detailId ? (projects.find((p) => p.id === detailId) ?? null) : null;

  const paginationBar = (
    <Pagination
      total={filtered.length}
      page={currentPage}
      perPage={perPage}
      onPageChange={setPage}
      onPerPageChange={(n) => {
        setPerPage(n);
        setPage(1);
      }}
    />
  );

  return (
    <div>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Operación</div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={styles.h1}>Gestión de proyectos</h1>
          <p className="mb-5 text-[13px] text-text-2">Cada evento con su cliente, equipo asignado, estado y proveedores vinculados.</p>
        </div>
        <TabsShell>
          <TabButton active={view === "cards"} icon={LayoutGrid} onClick={() => setView("cards")}>
            Tarjetas
          </TabButton>
          <TabButton active={view === "table"} icon={Rows3} onClick={() => setView("table")}>
            Tabla
          </TabButton>
        </TabsShell>
      </div>

      <div className={`mb-5 ${styles.kpis}`}>
        <StatCard n={stats.total} label="Total de proyectos" />
        <StatCard n={stats.enCurso} label="En curso" accent="#27500A" />
        <StatCard n={stats.proximos} label="Próximos 30 días" />
        <StatCard n={stats.sinProveedores} label="Sin proveedor asignado" accent="#8A2525" />
      </div>

      <div className={`mb-4 ${styles.filtersPanel}`}>
        <div className={styles.filterControls}>
          <Dropdown
            value={filtEstadoId}
            onChange={setFiltEstadoId}
            placeholder="Cualquier estado"
            options={[...estadosProyecto].sort((a, b) => a.fase - b.fase || a.orden - b.orden).map((e) => ({ value: e.id, label: e.nombre }))}
          />
          <Dropdown
            value={filtClienteId}
            onChange={setFiltClienteId}
            placeholder="Todo cliente"
            options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
          />
        </div>

        <ActiveFilters chips={chips} onRemove={removeChip} onClearAll={clearAll} variant="panel" />
      </div>

      {loading && projects.length === 0 ? (
        <div className="flex justify-center py-14 text-text-2">
          <Spinner label="Cargando proyectos…" />
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title={error} tone="danger" action={{ label: "Reintentar", onClick: fetchAll }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No se encontraron proyectos con estos filtros." />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Antes vivía debajo de las tarjetas/tabla -- Alicia pidió subirla arriba,
             junto a los filtros, porque abajo quedaba pegada a la izquierda con
             mucho espacio muerto al lado cuando había pocos resultados. */}
          <div className="border-b border-border pb-3">{paginationBar}</div>
          {view === "cards" ? (
            <div ref={cardsGridRef} className={styles.cardsGrid} style={{ gridTemplateColumns: `repeat(${cardsGridColumns}, minmax(0, 1fr))` }}>
              {pageRows.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onOpen={() => setDetailId(p.id)}
                  onEdit={() => {
                    setEditing(p);
                    setFormOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <Table>
              <Thead>
                <Th>Proyecto</Th>
                <Th>Cliente</Th>
                <Th>Fecha</Th>
                <Th>Estado</Th>
                <Th>Ejecutivo</Th>
                <Th className="text-right">Acciones</Th>
              </Thead>
              <tbody>
                {pageRows.map((p) => {
                  const estadoNombre = estadosProyecto.find((e) => e.id === p.estadoId)?.nombre ?? "—";
                  const clienteNombre = clientes.find((c) => c.id === p.clienteId)?.nombre;
                  const st = statusColor(PROJECT_STATUS_COLORS, estadoNombre);
                  return (
                    <Tr key={p.id} onClick={() => setDetailId(p.id)}>
                      <Td className="font-medium">{p.nombre || "(Sin nombre)"}</Td>
                      <Td className="text-text-2">{clienteNombre || "Sin cliente"}</Td>
                      <Td className="text-text-2">{fmtDateShort(p.fechaEvento?.slice(0, 10)) || "—"}</Td>
                      <Td>
                        <Badge bg={st.bg} color={st.c}>
                          {estadoNombre}
                        </Badge>
                      </Td>
                      <Td className="text-text-2">{ejecutivoDe(p)}</Td>
                      <Td>
                        <div className="flex justify-end gap-1.5">
                          <RowAction
                            label="Editar este proyecto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditing(p);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil size={14} strokeWidth={1.8} />
                          </RowAction>
                          <DeleteOrRequestButton
                            compact
                            tipoEntidad="proyecto"
                            entidadId={p.id}
                            nombre={p.nombre}
                            onDelete={() => handleDelete(p.id)}
                          />
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </div>
      )}

      <ProjectFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        onDelete={() => editing && handleDelete(editing.id)}
        editing={editing}
        providers={providers}
      />

      <ProjectDetail
        project={detailProject}
        providers={providers}
        onClose={() => setDetailId(null)}
        onEdit={() => {
          // Ver el comentario equivalente en clientes/page.tsx: cerrar el detalle
          // al abrir editar evita que los dos drawers queden montados a la vez.
          setDetailId(null);
          setEditing(detailProject);
          setFormOpen(true);
        }}
      />
    </div>
  );
}
