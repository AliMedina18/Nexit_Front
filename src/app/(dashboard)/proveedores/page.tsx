"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FolderOpen, Heart, LayoutGrid, Pencil, Rows3 } from "lucide-react";
import {
  ActiveFilters,
  Avatar,
  Badge,
  CountryBadge,
  Dropdown,
  EmptyState,
  Pagination,
  StatCard,
  Stars,
  TabButton,
  TabsShell,
  Tag,
  type FilterChip,
} from "@/components/ui/primitives";
import { DeleteOrRequestButton } from "@/components/ui/DeleteAction";
import { Spinner } from "@/components/ui/Spinner";
import { RowAction, Table, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { PROVEEDOR_ESTADOS, PROVIDER_STATUS_COLORS, statusColor } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogosStore } from "@/store/catalogos-store";
import { usePageToolbarStore } from "@/store/page-toolbar-store";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
import { proveedoresApi } from "@/services/api/proveedores-service";
import type { Proveedor, ProveedorInput } from "@/types/api";
import { ProviderCard } from "./ProviderCard";
import { ProviderFormModal } from "./ProviderFormModal";
import { ProviderDetail } from "./ProviderDetail";
import styles from "@/styles/dashboard.module.css";

export default function ProveedoresPage() {
  const {
    items: providers,
    loading,
    error,
    fetchAll,
    refresh,
    addProvider,
    updateProvider,
    removeProvider,
  } = useProvidersStore();
  const { paises, categoriasProveedor, regionesPorPais, ciudadesPorRegion, fetchBase, fetchRegiones, fetchCiudades } =
    useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);
  const authUser = useAuthStore((s) => s.user);
  const setToolbar = usePageToolbarStore((s) => s.setToolbar);
  const clearToolbar = usePageToolbarStore((s) => s.clearToolbar);
  const esAdmin = authUser?.rol === "admin" || authUser?.rol === "super_admin";

  useEffect(() => {
    fetchAll();
    fetchBase();
  }, [fetchAll, fetchBase]);

  // Precarga región/ciudad de cada país/región presente en la lista -- así tarjetas y tabla
  // resuelven "Ciudad · Departamento · País" sin que cada una pida su propio fetch (igual que
  // en Clientes: fetchRegiones/fetchCiudades cachean por id, repetir la llamada no cuesta nada).
  useEffect(() => {
    const paisIds = [...new Set(providers.map((p) => p.paisId).filter((id): id is string => Boolean(id)))];
    paisIds.forEach((id) => fetchRegiones(id));
  }, [providers, fetchRegiones]);

  useEffect(() => {
    const regionIds = [...new Set(providers.map((p) => p.regionId).filter((id): id is string => Boolean(id)))];
    regionIds.forEach((id) => fetchCiudades(id));
  }, [providers, fetchCiudades]);

  const [search, setSearch] = useState("");
  const [filtPais, setFiltPais] = useState("");
  const [filtRegion, setFiltRegion] = useState("");
  const [filtCiudad, setFiltCiudad] = useState("");
  const [filtCat, setFiltCat] = useState("");
  const [filtEstado, setFiltEstado] = useState("");
  const [soloMios, setSoloMios] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
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
      entidad: "proveedores",
      searchPlaceholder: "Buscar proveedor, categoría, ciudad o contacto…",
      puedeImportar: esAdmin,
      onExport: proveedoresApi.exportar,
      onImport: proveedoresApi.importar,
      onImported: refresh,
      addLabel: "Nuevo proveedor",
      onAdd: () => {
        setEditing(null);
        setFormOpen(true);
      },
    });
    return clearToolbar;
  }, [clearToolbar, esAdmin, refresh, setToolbar]);

  const regionOptions = useMemo(() => regionesPorPais[filtPais] ?? [], [regionesPorPais, filtPais]);
  const cityOptions = useMemo(() => ciudadesPorRegion[filtRegion] ?? [], [ciudadesPorRegion, filtRegion]);

  function handleFiltPais(v: string) {
    setFiltPais(v);
    setFiltRegion("");
    setFiltCiudad("");
    if (v) fetchRegiones(v);
  }

  function handleFiltRegion(v: string) {
    setFiltRegion(v);
    setFiltCiudad("");
    if (v) fetchCiudades(v);
  }

  const misProveedoresCount = useMemo(
    () => (authUser ? providers.filter((p) => p.colaboradores.some((c) => c.usuarioId === authUser.id)).length : 0),
    [providers, authUser],
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return providers.filter((p) => {
      const matchesSearch =
        !s ||
        [p.nombre, p.contacto, p.email, ...p.telefonos.map((t) => t.telefono)].some((v) => v?.toLowerCase().includes(s));
      const matchesPais = !filtPais || p.paisId === filtPais;
      const matchesRegion = !filtRegion || p.regionId === filtRegion;
      const matchesCiudad = !filtCiudad || p.ciudadId === filtCiudad;
      const matchesCat = !filtCat || p.categoriaId === filtCat;
      const matchesEstado = !filtEstado || p.estado === filtEstado;
      const matchesMios = !soloMios || (authUser && p.colaboradores.some((c) => c.usuarioId === authUser.id));
      return matchesSearch && matchesPais && matchesRegion && matchesCiudad && matchesCat && matchesEstado && matchesMios;
    });
  }, [providers, search, filtPais, filtRegion, filtCiudad, filtCat, filtEstado, soloMios, authUser]);

  // Vuelve a la página 1 cada vez que cambia el resultado filtrado -- si no, quedarse en la
  // página 3 con un filtro que deja solo 1 resultado mostraría una lista vacía sin explicación.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset intencional al cambiar de filtro/vista, no una sincronización derivable sin efecto
    setPage(1);
  }, [search, filtPais, filtRegion, filtCiudad, filtCat, filtEstado, soloMios, view]);

  const per = perPage === 0 ? Math.max(filtered.length, 1) : perPage;
  const totalPages = Math.max(1, Math.ceil(filtered.length / per));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * per, (currentPage - 1) * per + per);

  const stats = useMemo(() => {
    const total = providers.length;
    const inactivos = providers.filter((p) => p.estado === "Bloqueado").length;
    const paisesCount = new Set(providers.map((p) => p.paisId).filter(Boolean)).size;
    const conScore = providers.filter((p) => typeof p.score === "number");
    const avg = conScore.length ? conScore.reduce((a, b) => a + (b.score ?? 0), 0) / conScore.length : 0;
    return { total, inactivos, paisesCount, avg };
  }, [providers]);

  const chips: FilterChip[] = [
    search && { key: "search", label: `“${search}”` },
    filtPais && { key: "pais", label: paises.find((p) => p.id === filtPais)?.nombre ?? filtPais },
    filtRegion && { key: "region", label: regionOptions.find((r) => r.id === filtRegion)?.nombre ?? filtRegion },
    filtCiudad && { key: "ciudad", label: cityOptions.find((c) => c.id === filtCiudad)?.nombre ?? filtCiudad },
    filtCat && { key: "cat", label: categoriasProveedor.find((c) => c.id === filtCat)?.nombre ?? filtCat },
    filtEstado && { key: "estado", label: filtEstado },
    soloMios && { key: "mios", label: "Mis proveedores" },
  ].filter(Boolean) as FilterChip[];

  function removeChip(key: string) {
    if (key === "search") setSearch("");
    if (key === "pais") handleFiltPais("");
    if (key === "region") handleFiltRegion("");
    if (key === "ciudad") setFiltCiudad("");
    if (key === "cat") setFiltCat("");
    if (key === "estado") setFiltEstado("");
    if (key === "mios") setSoloMios(false);
  }

  function clearAll() {
    setSearch("");
    setFiltPais("");
    setFiltRegion("");
    setFiltCiudad("");
    setFiltCat("");
    setFiltEstado("");
    setSoloMios(false);
  }

  async function handleSave(input: ProveedorInput) {
    try {
      if (editing) {
        await updateProvider(editing.id, input);
        pushToast("Proveedor actualizado", "success");
      } else {
        await addProvider(input);
        pushToast("Proveedor agregado", "success");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo guardar el proveedor", "danger");
    }
  }

  // El "¿Eliminar a X?" ya lo confirma el diálogo propio de DeleteOrRequestButton --
  // esto solo se llama después de que un admin confirma ahí.
  async function handleDelete(id: string) {
    try {
      await removeProvider(id);
      setDetailId(null);
      setFormOpen(false);
      setEditing(null);
      pushToast("Proveedor eliminado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar el proveedor", "danger");
    }
  }

  const detailProvider = detailId ? (providers.find((p) => p.id === detailId) ?? null) : null;

  return (
    <div>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Base de datos</div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={styles.h1}>Gestión de proveedores</h1>
          <p className="mb-5 text-[13px] text-text-2">Cada proveedor con su cobertura, servicios y valoración.</p>
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
        <StatCard n={stats.total} label="Total de proveedores" />
        <button
          type="button"
          onClick={() => setFiltEstado((v) => (v === "Bloqueado" ? "" : "Bloqueado"))}
          title="Ver solo los proveedores inactivos"
          className="min-h-[80px] cursor-pointer rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3.5 text-left transition-colors hover:border-text"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-3">Inactivos</div>
          <div className="mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em]" style={{ color: "#8A2525" }}>
            {stats.inactivos}
          </div>
        </button>
        <StatCard n={stats.paisesCount} label="Países donde trabajamos" />
        <div className="min-h-[80px] rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3.5">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-3">Valoración promedio</div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[28px] font-semibold leading-none tracking-[-0.03em]">{stats.avg.toFixed(1)}</span>
            <Stars n={Math.round(stats.avg)} size={14} />
          </div>
        </div>
      </div>

      <div className={`mb-4 ${styles.filtersPanel}`}>
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoloMios((v) => !v)}
            aria-pressed={soloMios}
            className={`flex h-8 items-center gap-[7px] rounded-[20px] border px-3 text-[13px] font-medium transition-colors ${
              soloMios ? "border-text bg-text text-white" : "border-border bg-surface text-text hover:border-text"
            }`}
          >
            <Heart size={13} strokeWidth={1.8} fill={soloMios ? "currentColor" : "none"} />
            Mis proveedores ({misProveedoresCount})
          </button>
        </div>

        <div className={styles.filterControls}>
          <Dropdown
            value={filtPais}
            onChange={handleFiltPais}
            placeholder="Todos los países"
            options={paises.map((p) => ({ value: p.id, label: p.nombre }))}
          />
          <Dropdown
            value={filtRegion}
            onChange={handleFiltRegion}
            placeholder="Todos los departamentos"
            disabled={!filtPais}
            disabledHint="— elige país primero —"
            options={regionOptions.map((r) => ({ value: r.id, label: r.nombre }))}
          />
          <Dropdown
            value={filtCiudad}
            onChange={setFiltCiudad}
            placeholder="Todas las ciudades"
            disabled={!filtRegion}
            disabledHint="— elige departamento primero —"
            options={cityOptions.map((c) => ({ value: c.id, label: c.nombre }))}
          />
          <Dropdown
            value={filtCat}
            onChange={setFiltCat}
            placeholder="Todas las categorías"
            options={categoriasProveedor.map((c) => ({ value: c.id, label: c.nombre }))}
          />
          <Dropdown
            value={filtEstado}
            onChange={setFiltEstado}
            placeholder="Cualquier estado"
            options={PROVEEDOR_ESTADOS.map((e) => ({ value: e, label: e }))}
          />
        </div>

        <ActiveFilters chips={chips} onRemove={removeChip} onClearAll={clearAll} variant="panel" />
      </div>

      {loading && providers.length === 0 ? (
        <div className="flex justify-center py-14 text-text-2">
          <Spinner label="Cargando proveedores…" />
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title={error} tone="danger" action={{ label: "Reintentar", onClick: fetchAll }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No se encontraron proveedores con estos filtros." />
      ) : view === "cards" ? (
        <div className="flex flex-col gap-3">
          <div className={styles.cardsGrid}>
            {pageRows.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                onOpen={() => setDetailId(p.id)}
                onEdit={() => {
                  setEditing(p);
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
            <Th>Proveedor</Th>
            <Th>Categoría</Th>
            <Th>Ubicación</Th>
            <Th>Estado</Th>
            <Th>Contacto</Th>
            <Th className="text-right">Acciones</Th>
          </Thead>
          <tbody>
            {pageRows.map((p) => {
              const sc = statusColor(PROVIDER_STATUS_COLORS, p.estado);
              const paisNombre = paises.find((x) => x.id === p.paisId)?.nombre;
              const regionNombre = regionesPorPais[p.paisId ?? ""]?.find((r) => r.id === p.regionId)?.nombre;
              const ciudadNombre = ciudadesPorRegion[p.regionId ?? ""]?.find((c) => c.id === p.ciudadId)?.nombre;
              const categoriaNombre = categoriasProveedor.find((c) => c.id === p.categoriaId)?.nombre;
              const ubicacion = [ciudadNombre, regionNombre, paisNombre].filter(Boolean).join(" · ");
              return (
                <Tr key={p.id} onClick={() => setDetailId(p.id)}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar nombre={p.nombre} size="sm" />
                      <span className="font-medium">{p.nombre}</span>
                    </div>
                  </Td>
                  <Td className="text-text-2">{categoriaNombre || "—"}</Td>
                  <Td className="text-text-2">
                    {ubicacion ? (
                      <span className="flex items-center gap-1.5">
                        <CountryBadge pais={paisNombre} /> {ubicacion}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    <Badge bg={sc.bg} color={sc.c}>
                      {p.estado}
                    </Badge>
                  </Td>
                  <Td className="text-text-2">
                    {p.contacto || "—"}
                    {p.contacto && p.cargoContacto && <Tag className="ml-1.5">{p.cargoContacto}</Tag>}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1.5">
                      <RowAction
                        label="Editar este proveedor"
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
                        tipoEntidad="proveedor"
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

      <ProviderFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        onDelete={() => editing && handleDelete(editing.id)}
        editing={editing}
      />

      <ProviderDetail
        provider={detailProvider}
        onClose={() => setDetailId(null)}
        onEdit={() => {
          setEditing(detailProvider);
          setFormOpen(true);
        }}
      />
    </div>
  );
}
