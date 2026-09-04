"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, LayoutGrid, Pencil, Rows3 } from "lucide-react";
import {
  ActiveFilters,
  Avatar,
  Badge,
  Dropdown,
  EmptyState,
  Pagination,
  StatCard,
  TabButton,
  TabsShell,
  Tag,
  type FilterChip,
} from "@/components/ui/primitives";
import { DeleteOrRequestButton } from "@/components/ui/DeleteAction";
import { Spinner } from "@/components/ui/Spinner";
import { RowAction, Table, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { CLIENTE_ESTADOS, CLIENT_STATUS_COLORS, statusColor } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogosStore } from "@/store/catalogos-store";
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
  const { items: proyectos, fetchAll: fetchProyectos } = useProjectsStore();
  const { paises, regionesPorPais, ciudadesPorRegion, fetchBase, fetchRegiones, fetchCiudades } = useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);
  const authUser = useAuthStore((s) => s.user);
  const setToolbar = usePageToolbarStore((s) => s.setToolbar);
  const clearToolbar = usePageToolbarStore((s) => s.clearToolbar);
  const esAdmin = authUser?.rol === "admin" || authUser?.rol === "super_admin";

  useEffect(() => {
    fetchAll();
    fetchProyectos();
    fetchBase();
  }, [fetchAll, fetchProyectos, fetchBase]);

  // Precarga región/ciudad para cada país/región presente en la lista, así las tarjetas y la
  // tabla pueden resolver "Ciudad · Departamento · País" sin que cada una pida su propio fetch
  // (fetchRegiones/fetchCiudades cachean por id, así que repetir la llamada no cuesta nada).
  useEffect(() => {
    const paisIds = [...new Set(clientes.map((c) => c.paisId).filter((id): id is string => Boolean(id)))];
    paisIds.forEach((id) => fetchRegiones(id));
  }, [clientes, fetchRegiones]);

  useEffect(() => {
    const regionIds = [...new Set(clientes.map((c) => c.regionId).filter((id): id is string => Boolean(id)))];
    regionIds.forEach((id) => fetchCiudades(id));
  }, [clientes, fetchCiudades]);

  const [search, setSearch] = useState("");
  const [filtSector, setFiltSector] = useState("");
  const [filtEstado, setFiltEstado] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    function onGlobalSearch(event: Event) {
      setSearch((event as CustomEvent<string>).detail);
    }
    window.addEventListener("nexit:search", onGlobalSearch);
    return () => window.removeEventListener("nexit:search", onGlobalSearch);
  }, []);

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
    return clearToolbar;
  }, [clearToolbar, esAdmin, refresh, setToolbar]);

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
      const matchesEstado = !filtEstado || c.estado === filtEstado;
      return matchesSearch && matchesSector && matchesEstado;
    });
  }, [clientes, search, filtSector, filtEstado]);

  // Vuelve a la página 1 cada vez que cambia el resultado filtrado -- si no, quedarse en la
  // página 3 con un filtro que deja solo 1 resultado mostraría una lista vacía sin explicación.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset intencional al cambiar de filtro/vista, no una sincronización derivable sin efecto
    setPage(1);
  }, [search, filtSector, filtEstado, view]);

  const per = perPage === 0 ? Math.max(filtered.length, 1) : perPage;
  const totalPages = Math.max(1, Math.ceil(filtered.length / per));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * per, (currentPage - 1) * per + per);

  const stats = useMemo(() => {
    const total = clientes.length;
    const activos = clientes.filter((c) => c.estado === "Activo").length;
    const prospectos = clientes.filter((c) => c.estado === "Prospecto").length;
    const clienteIdsConProyecto = new Set(proyectos.filter((p) => p.clienteId).map((p) => p.clienteId));
    const conProyectoActivo = clientes.filter((c) => clienteIdsConProyecto.has(c.id)).length;
    return { total, activos, prospectos, conProyectoActivo };
  }, [clientes, proyectos]);

  const chips: FilterChip[] = [
    search && { key: "search", label: `“${search}”` },
    filtSector && { key: "sector", label: filtSector },
    filtEstado && { key: "estado", label: filtEstado },
  ].filter(Boolean) as FilterChip[];

  function removeChip(key: string) {
    if (key === "search") setSearch("");
    if (key === "sector") setFiltSector("");
    if (key === "estado") setFiltEstado("");
  }

  function clearAll() {
    setSearch("");
    setFiltSector("");
    setFiltEstado("");
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

  // El "¿Eliminar a X?" ya lo confirma el diálogo propio de DeleteOrRequestButton --
  // esto solo se llama después de que un admin confirma ahí, así que no hace falta
  // (ni conviene) otro window.confirm nativo encima.
  async function handleDelete(id: string) {
    try {
      await removeCliente(id);
      setDetailId(null);
      setFormOpen(false);
      setEditing(null);
      pushToast("Cliente eliminado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar el cliente", "danger");
    }
  }

  const detailCliente = detailId ? (clientes.find((c) => c.id === detailId) ?? null) : null;

  return (
    <div>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Base de datos</div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={styles.h1}>Gestión de clientes</h1>
          <p className="mb-5 text-[13px] text-text-2">Cada cliente con sus contactos, proyectos asociados y facturación.</p>
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
        <StatCard n={stats.total} label="Total de clientes" />
        <StatCard n={stats.activos} label="Activos" accent="#036B3C" />
        <StatCard n={stats.prospectos} label="Prospectos" accent="#7A4E00" />
        <StatCard n={stats.conProyectoActivo} label="Con proyecto activo" />
      </div>

      <div className={`mb-4 ${styles.filtersPanel}`}>
        <div className={styles.filterControls}>
          <Dropdown
            value={filtEstado}
            onChange={setFiltEstado}
            placeholder="Cualquier estado"
            options={CLIENTE_ESTADOS.map((e) => ({ value: e, label: e }))}
          />
          <Dropdown
            value={filtSector}
            onChange={setFiltSector}
            placeholder="Toda industria"
            options={sectores.map((s) => ({ value: s, label: s }))}
          />
        </div>

        <ActiveFilters chips={chips} onRemove={removeChip} onClearAll={clearAll} variant="panel" />
      </div>

      {loading && clientes.length === 0 ? (
        <div className="flex justify-center py-14 text-text-2">
          <Spinner label="Cargando clientes…" />
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title={error} tone="danger" action={{ label: "Reintentar", onClick: fetchAll }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No se encontraron clientes con estos filtros." />
      ) : view === "cards" ? (
        <div className="flex flex-col gap-3">
          <div className={styles.cardsGrid}>
            {pageRows.map((c) => (
              <ClienteCard
                key={c.id}
                cliente={c}
                onOpen={() => setDetailId(c.id)}
                onEdit={() => {
                  setEditing(c);
                  setFormOpen(true);
                }}
              />
            ))}
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3">
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
          </div>
        </div>
      ) : (
        <Table
          footer={
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
          }
        >
          <Thead>
            <Th>Cliente</Th>
            <Th>Industria</Th>
            <Th>Ubicación</Th>
            <Th>Estado</Th>
            <Th>Contacto</Th>
            <Th className="text-right">Acciones</Th>
          </Thead>
          <tbody>
            {pageRows.map((c) => {
              const sc = statusColor(CLIENT_STATUS_COLORS, c.estado);
              const paisNombre = paises.find((p) => p.id === c.paisId)?.nombre;
              const regionNombre = regionesPorPais[c.paisId ?? ""]?.find((r) => r.id === c.regionId)?.nombre;
              const ciudadNombre = ciudadesPorRegion[c.regionId ?? ""]?.find((x) => x.id === c.ciudadId)?.nombre;
              const ubicacion = [ciudadNombre, regionNombre, paisNombre].filter(Boolean).join(" · ") || c.ciudad;
              return (
              <Tr key={c.id} onClick={() => setDetailId(c.id)}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar nombre={c.nombre} size="sm" />
                    <span className="font-medium">{c.nombre}</span>
                  </div>
                </Td>
                <Td className="text-text-2">{c.sector || "—"}</Td>
                <Td className="text-text-2">{ubicacion || "—"}</Td>
                <Td>
                  <Badge bg={sc.bg} color={sc.c}>
                    {c.estado}
                  </Badge>
                </Td>
                <Td className="text-text-2">
                  {c.contacto || "—"}
                  {c.contacto && c.cargoContacto && <Tag className="ml-1.5">{c.cargoContacto}</Tag>}
                </Td>
                <Td>
                  <div className="flex justify-end gap-1.5">
                    <RowAction
                      label="Editar este cliente"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(c);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil size={14} strokeWidth={1.8} />
                    </RowAction>
                    <DeleteOrRequestButton
                      compact
                      tipoEntidad="cliente"
                      entidadId={c.id}
                      nombre={c.nombre}
                      onDelete={() => handleDelete(c.id)}
                    />
                  </div>
                </Td>
              </Tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <ClienteFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        onDelete={() => editing && handleDelete(editing.id)}
        editing={editing}
      />

      <ClienteDetail
        cliente={detailCliente}
        proyectos={proyectos}
        onClose={() => setDetailId(null)}
        onEdit={() => {
          setEditing(detailCliente);
          setFormOpen(true);
        }}
      />
    </div>
  );
}
