"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FolderOpen, Plus } from "lucide-react";
import { ActiveFilters, Button, EmptyState, SearchInput, StatCard, type FilterChip } from "@/components/ui/primitives";
import { Select } from "@/components/ui/form";
import { Spinner } from "@/components/ui/Spinner";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
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
    addProvider,
    updateProvider,
    removeProvider,
  } = useProvidersStore();
  const { paises, categoriasProveedor, fetchBase } = useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    fetchAll();
    fetchBase();
  }, [fetchAll, fetchBase]);

  const [search, setSearch] = useState("");
  const [filtPais, setFiltPais] = useState("");
  const [filtCat, setFiltCat] = useState("");
  const [filtEstado, setFiltEstado] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const estados = useMemo(() => [...new Set(providers.map((p) => p.estado))].sort(), [providers]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return providers.filter((p) => {
      const matchesSearch =
        !s ||
        [p.nombre, p.contacto, p.email, ...p.telefonos.map((t) => t.telefono)].some((v) => v?.toLowerCase().includes(s));
      const matchesPais = !filtPais || p.paisId === filtPais;
      const matchesCat = !filtCat || p.categoriaId === filtCat;
      const matchesEstado = !filtEstado || p.estado === filtEstado;
      return matchesSearch && matchesPais && matchesCat && matchesEstado;
    });
  }, [providers, search, filtPais, filtCat, filtEstado]);

  const stats = useMemo(() => {
    const total = providers.length;
    const activos = providers.filter((p) => p.estado === "Activo").length;
    const conScore = providers.filter((p) => typeof p.score === "number");
    const avg = conScore.length
      ? (conScore.reduce((a, b) => a + (b.score ?? 0), 0) / conScore.length).toFixed(1)
      : "—";
    const paisesCount = new Set(providers.map((p) => p.paisId).filter(Boolean)).size;
    return { total, activos, avg, paisesCount };
  }, [providers]);

  const chips: FilterChip[] = [
    search && { key: "search", label: `“${search}”` },
    filtPais && { key: "pais", label: paises.find((p) => p.id === filtPais)?.nombre ?? filtPais },
    filtCat && { key: "cat", label: categoriasProveedor.find((c) => c.id === filtCat)?.nombre ?? filtCat },
    filtEstado && { key: "estado", label: filtEstado },
  ].filter(Boolean) as FilterChip[];

  function removeChip(key: string) {
    if (key === "search") setSearch("");
    if (key === "pais") setFiltPais("");
    if (key === "cat") setFiltCat("");
    if (key === "estado") setFiltEstado("");
  }

  function clearAll() {
    setSearch("");
    setFiltPais("");
    setFiltCat("");
    setFiltEstado("");
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
      <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Base de datos</div>
      <h1 className={styles.h1}>Gestión de proveedores</h1>
      <p className="mb-5 text-[13px] text-text-2">Busca arriba o filtra por país, categoría y estado.</p>

      <div className={`mb-5 ${styles.kpis}`}>
        <StatCard n={stats.total} label="Proveedores totales" />
        <StatCard n={stats.activos} label="Activos" />
        <StatCard n={stats.avg} label="Score promedio" />
        <StatCard n={stats.paisesCount} label="Países" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar proveedor, contacto…" />
        <Button
          variant="primary"
          icon={Plus}
          className="ml-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Nuevo proveedor
        </Button>
      </div>

      <div className={`mb-4 ${styles.filters}`}>
        <Select value={filtPais} onChange={(e) => setFiltPais(e.target.value)}>
          <option value="">Todos los países</option>
          {paises.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
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

      <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
        {loading && providers.length === 0 ? (
          <div className="col-span-full flex justify-center py-14 text-text-2">
            <Spinner label="Cargando proveedores…" />
          </div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title={error} tone="danger" action={{ label: "Reintentar", onClick: fetchAll }} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No se encontraron proveedores con estos filtros." />
        ) : (
          filtered.map((p) => <ProviderCard key={p.id} provider={p} onOpen={() => setDetailId(p.id)} />)
        )}
      </div>

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
