"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FolderOpen, Plus } from "lucide-react";
import { ActiveFilters, Button, EmptyState, SearchInput, StatCard, type FilterChip } from "@/components/ui/primitives";
import { Select } from "@/components/ui/form";
import { downloadCSV, toCSV } from "@/lib/csv";
import { allCountries, citiesForRegion, regionsForCountry } from "@/lib/geo-helpers";
import { PROVIDER_CATEGORIES } from "@/types/domain";
import type { Attachment, Provider, ProviderInput } from "@/types/domain";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
import { ProviderCard } from "./ProviderCard";
import { ProviderFormModal } from "./ProviderFormModal";
import { ProviderDetail } from "./ProviderDetail";

export default function ProveedoresPage() {
  const { items: providers, fetchAll, addProvider, updateProvider, removeProvider } = useProvidersStore();
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const [search, setSearch] = useState("");
  const [filtPais, setFiltPais] = useState("");
  const [filtRegion, setFiltRegion] = useState("");
  const [filtCiudad, setFiltCiudad] = useState("");
  const [filtCat, setFiltCat] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const countries = useMemo(() => allCountries(providers), [providers]);
  const regionOptions = useMemo(
    () => (filtPais ? regionsForCountry(filtPais, providers) : []),
    [filtPais, providers],
  );
  const cityOptions = useMemo(
    () => (filtPais && filtRegion ? citiesForRegion(filtPais, filtRegion, providers) : []),
    [filtPais, filtRegion, providers],
  );
  const categories = useMemo(
    () => [...new Set([...PROVIDER_CATEGORIES, ...providers.map((p) => p.cat)])],
    [providers],
  );

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return providers.filter((p) => {
      const matchesSearch =
        !s ||
        [p.nombre, p.contacto, p.servicios, p.cat, p.ciudad, p.region, p.pais, p.email].some((v) =>
          v?.toLowerCase().includes(s),
        );
      const matchesPais = !filtPais || p.pais === filtPais;
      const matchesRegion = !filtRegion || p.region === filtRegion;
      const matchesCiudad = !filtCiudad || p.ciudad === filtCiudad;
      const matchesCat = !filtCat || p.cat === filtCat;
      return matchesSearch && matchesPais && matchesRegion && matchesCiudad && matchesCat;
    });
  }, [providers, search, filtPais, filtRegion, filtCiudad, filtCat]);

  const stats = useMemo(() => {
    const total = providers.length;
    const activos = providers.filter((p) => p.status === "Activo").length;
    const avg = total ? (providers.reduce((a, b) => a + b.score, 0) / total).toFixed(1) : "—";
    const paises = [...new Set(providers.map((p) => p.pais).filter(Boolean))];
    return { total, activos, avg, paisesCount: paises.length };
  }, [providers]);

  const chips: FilterChip[] = [
    search && { key: "search", label: `“${search}”` },
    filtPais && { key: "pais", label: filtPais },
    filtRegion && { key: "region", label: filtRegion },
    filtCiudad && { key: "ciudad", label: filtCiudad },
    filtCat && { key: "cat", label: filtCat },
  ].filter(Boolean) as FilterChip[];

  function removeChip(key: string) {
    if (key === "search") setSearch("");
    if (key === "pais") {
      setFiltPais("");
      setFiltRegion("");
      setFiltCiudad("");
    }
    if (key === "region") {
      setFiltRegion("");
      setFiltCiudad("");
    }
    if (key === "ciudad") setFiltCiudad("");
    if (key === "cat") setFiltCat("");
  }

  function clearAll() {
    setSearch("");
    setFiltPais("");
    setFiltRegion("");
    setFiltCiudad("");
    setFiltCat("");
  }

  async function handleSave(input: ProviderInput) {
    if (editing) {
      await updateProvider(editing.id, input);
      pushToast("Proveedor actualizado", "success");
    } else {
      await addProvider(input);
      pushToast("Proveedor agregado", "success");
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("¿Eliminar este proveedor? Esta acción no se puede deshacer.")) return;
    await removeProvider(id);
    setDetailId(null);
    pushToast("Proveedor eliminado", "success");
  }

  async function handleAttachmentsChange(provider: Provider, attachments: Attachment[]) {
    await updateProvider(provider.id, { ...provider, attachments });
  }

  function exportCSV() {
    const headers = [
      "Empresa",
      "País",
      "Departamento/Estado",
      "Ciudad",
      "Categoría",
      "Estado",
      "Contacto",
      "Teléfono",
      "Email",
      "Score",
      "Presupuesto",
      "Cobertura",
      "Servicios",
      "Notas",
    ];
    const rows = providers.map((p) => [
      p.nombre,
      p.pais,
      p.region,
      p.ciudad,
      p.cat,
      p.status,
      p.contacto,
      p.tel,
      p.email,
      p.score,
      p.budget,
      p.cobertura,
      p.servicios,
      p.notas,
    ]);
    downloadCSV("proveedores.csv", toCSV(headers, rows));
  }

  const detailIdx = detailId ? providers.findIndex((p) => p.id === detailId) : -1;
  const detailProvider = detailIdx >= 0 ? providers[detailIdx] : null;

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard n={stats.total} label="Proveedores totales" />
        <StatCard n={stats.activos} label="Activos" />
        <StatCard n={stats.avg} label="Score promedio" />
        <StatCard n={stats.paisesCount} label="Países" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar proveedor, servicio, ciudad…" />
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
        <Select
          value={filtPais}
          onChange={(e) => {
            setFiltPais(e.target.value);
            setFiltRegion("");
            setFiltCiudad("");
          }}
          style={{ width: "auto" }}
        >
          <option value="">Todos los países</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          value={filtRegion}
          onChange={(e) => {
            setFiltRegion(e.target.value);
            setFiltCiudad("");
          }}
          style={{ width: "auto" }}
        >
          <option value="">Todos los departamentos/estados</option>
          {regionOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Select value={filtCiudad} onChange={(e) => setFiltCiudad(e.target.value)} style={{ width: "auto" }}>
          <option value="">Todas las ciudades</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={filtCat} onChange={(e) => setFiltCat(e.target.value)} style={{ width: "auto" }}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <ActiveFilters chips={chips} onRemove={removeChip} onClearAll={clearAll} />

      <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
        {filtered.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No se encontraron proveedores con estos filtros." />
        ) : (
          filtered.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              idx={providers.indexOf(p)}
              onOpen={() => setDetailId(p.id)}
            />
          ))
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
        allProviders={providers}
      />

      <ProviderDetail
        provider={detailProvider}
        idx={detailIdx}
        onClose={() => setDetailId(null)}
        onEdit={() => {
          setEditing(detailProvider);
          setFormOpen(true);
        }}
        onDelete={() => detailProvider && handleDelete(detailProvider.id)}
        onAttachmentsChange={(attachments) => detailProvider && handleAttachmentsChange(detailProvider, attachments)}
      />
    </div>
  );
}
