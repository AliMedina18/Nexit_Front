"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FolderOpen, Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { ActiveFilters, Badge, Button, EmptyState, Stars, StatCard, ViewToggle, type FilterChip } from "@/components/ui/primitives";
import { PROVIDER_STATUS_COLORS, statusColor } from "@/lib/constants";
import { ImportExportBar } from "@/components/ui/ImportExportBar";
import { Select } from "@/components/ui/form";
import { Spinner } from "@/components/ui/Spinner";
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
  const esAdmin = authUser?.rol === "admin" || authUser?.rol === "super_admin";
  const setToolbar = usePageToolbarStore((s) => s.setToolbar);
  const clearToolbar = usePageToolbarStore((s) => s.clearToolbar);

  useEffect(() => {
    fetchAll();
    fetchBase();
  }, [fetchAll, fetchBase]);

  const [search, setSearch] = useState("");
  const [filtPais, setFiltPais] = useState("");
  const [filtRegion, setFiltRegion] = useState("");
  const [filtCiudad, setFiltCiudad] = useState("");
  const [filtCat, setFiltCat] = useState("");
  const [filtEstado, setFiltEstado] = useState("");
  const [soloMios, setSoloMios] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const onSearch = (event: Event) => setSearch((event as CustomEvent<string>).detail);
    window.addEventListener("nexit:search", onSearch);
    return () => window.removeEventListener("nexit:search", onSearch);
  }, []);

  // Registra las acciones de esta página (Excel + "Nuevo proveedor") en la
  // barra superior compartida -- ver comentario en page-toolbar-store.ts.
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
    return () => clearToolbar();
  }, [setToolbar, clearToolbar, esAdmin, refresh]);

  function handleFiltPais(paisId: string) {
    setFiltPais(paisId);
    setFiltRegion("");
    setFiltCiudad("");
    if (paisId) fetchRegiones(paisId);
  }

  function handleFiltRegion(regionId: string) {
    setFiltRegion(regionId);
    setFiltCiudad("");
    if (regionId) fetchCiudades(regionId);
  }

  const regionOptions = useMemo(() => regionesPorPais[filtPais] ?? [], [regionesPorPais, filtPais]);
  const cityOptions = useMemo(() => ciudadesPorRegion[filtRegion] ?? [], [ciudadesPorRegion, filtRegion]);

  const estados = useMemo(() => [...new Set(providers.map((p) => p.estado))].sort(), [providers]);

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

  const stats = useMemo(() => {
    const total = providers.length;
    const inactivos = providers.filter((p) => p.estado !== "Activo").length;
    const conScore = providers.filter((p) => typeof p.score === "number");
    const avg = conScore.length ? conScore.reduce((a, b) => a + (b.score ?? 0), 0) / conScore.length : 0;
    const paisesCount = new Set(providers.map((p) => p.paisId).filter(Boolean)).size;
    return { total, inactivos, avg, paisesCount };
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
    handleFiltPais("");
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

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este proveedor? Esta acción no se puede deshacer.")) return;
    try {
      await removeProvider(id);
      setDetailId(null);
      pushToast("Proveedor eliminado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar el proveedor", "danger");
    }
  }

  const detailProvider = detailId ? (providers.find((p) => p.id === detailId) ?? null) : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Base de datos</div>
          <h1 className={styles.h1}>Gestión de proveedores</h1>
          <p className="mt-1 text-[13px] text-text-2">Busca arriba o filtra por país, departamento, ciudad, categoría y estado.</p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className={`mb-5 ${styles.kpis}`}>
        <StatCard n={stats.total} label="Total de proveedores" />
        <StatCard n={stats.inactivos} label="Inactivos" />
        <StatCard n={stats.paisesCount} label="Países donde trabajamos" />
        <StatCard
          n={
            <span className="inline-flex items-center gap-1.5">
              {stats.avg.toLocaleString("es-CO", { maximumFractionDigits: 1, minimumFractionDigits: stats.avg % 1 ? 1 : 0 }) || "—"}
              <Stars n={Math.round(stats.avg)} size={16} />
            </span>
          }
          label="Valoración promedio"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSoloMios((v) => !v)}
          aria-pressed={soloMios}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
            soloMios ? "border-text bg-text text-white" : "border-border bg-surface text-text hover:bg-gray-light"
          }`}
        >
          <Heart size={13} strokeWidth={2} fill={soloMios ? "currentColor" : "none"} />
          Mis proveedores ({misProveedoresCount})
        </button>
      </div>

      {/* Mismas acciones que la barra superior ("Excel" / "Nuevo proveedor"),
          pero solo visibles por debajo de los 1000px reales del diseño --
          en escritorio esas acciones viven arriba, junto al buscador (ver
          layout.tsx + page-toolbar-store.ts); ese header de escritorio no
          existe en móvil, así que se repiten acá para no perder la función. */}
      <div className="mb-4 flex flex-wrap items-center gap-2 min-[1000px]:hidden">
        <ImportExportBar
          entidad="proveedores"
          puedeImportar={esAdmin}
          onExport={proveedoresApi.exportar}
          onImport={proveedoresApi.importar}
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
          Nuevo proveedor
        </Button>
      </div>

      <div className={`mb-4 ${styles.filters}`}>
        <Select value={filtPais} onChange={(e) => handleFiltPais(e.target.value)}>
          <option value="">Todos los países</option>
          {paises.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
        <Select value={filtRegion} onChange={(e) => handleFiltRegion(e.target.value)} disabled={!filtPais}>
          <option value="">Todos los departamentos</option>
          {regionOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </Select>
        <Select value={filtCiudad} onChange={(e) => setFiltCiudad(e.target.value)} disabled={!filtRegion}>
          <option value="">Todas las ciudades</option>
          {cityOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
        <Select value={filtCat} onChange={(e) => setFiltCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categoriasProveedor.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
        <Select value={filtEstado} onChange={(e) => setFiltEstado(e.target.value)}>
          <option value="">Cualquier estado</option>
          {estados.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
      </div>

      <ActiveFilters chips={chips} onRemove={removeChip} onClearAll={clearAll} />

      {loading && providers.length === 0 ? (
        <div className="flex justify-center py-14 text-text-2">
          <Spinner label="Cargando proveedores…" />
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title={error} tone="danger" action={{ label: "Reintentar", onClick: fetchAll }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No se encontraron proveedores con estos filtros." />
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-3">
                <th className="px-4 py-2.5 font-medium">Proveedor</th>
                <th className="px-4 py-2.5 font-medium">Categoría</th>
                <th className="px-4 py-2.5 font-medium">Ubicación</th>
                <th className="px-4 py-2.5 font-medium">Valoración</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
                <th className="px-4 py-2.5 font-medium">Contacto</th>
                <th className="px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const paisNombre = paises.find((x) => x.id === p.paisId)?.nombre;
                const catNombre = categoriasProveedor.find((x) => x.id === p.categoriaId)?.nombre;
                const sc = statusColor(PROVIDER_STATUS_COLORS, p.estado);
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
                    <td className="px-4 py-2.5 text-text-2">{catNombre || "—"}</td>
                    <td className="px-4 py-2.5 text-text-2">{paisNombre || "—"}</td>
                    <td className="px-4 py-2.5">{typeof p.score === "number" ? <Stars n={p.score} size={12} /> : "—"}</td>
                    <td className="px-4 py-2.5">
                      <Badge bg={sc.bg} color={sc.c}>
                        {p.estado}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-text-2">{p.contacto || "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditing(p);
                            setFormOpen(true);
                          }}
                          aria-label={`Editar ${p.nombre}`}
                          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-text-2 hover:bg-gray-light hover:text-text"
                        >
                          <Pencil size={13} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(p.id);
                          }}
                          aria-label={`Eliminar ${p.nombre}`}
                          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-text-2 hover:bg-gray-light hover:text-red"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[760px]:grid-cols-2 min-[1100px]:grid-cols-3">
          {filtered.map((p) => (
            <ProviderCard key={p.id} provider={p} onOpen={() => setDetailId(p.id)} />
          ))}
        </div>
      )}

      <ProviderFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        editing={editing}
      />

      <ProviderDetail
        provider={detailProvider}
        onClose={() => setDetailId(null)}
        onEdit={() => {
          setEditing(detailProvider);
          setFormOpen(true);
        }}
        onDelete={() => detailProvider && handleDelete(detailProvider.id)}
      />
    </div>
  );
}
