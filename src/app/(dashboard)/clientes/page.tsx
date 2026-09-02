"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, Plus } from "lucide-react";
import { ActiveFilters, Button, EmptyState, SearchInput, StatCard, type FilterChip } from "@/components/ui/primitives";
import { Select } from "@/components/ui/form";
import { Spinner } from "@/components/ui/Spinner";
import { useClientesStore } from "@/store/clientes-store";
import { useUiStore } from "@/store/ui-store";
import type { Cliente, ClienteInput } from "@/types/api";
import { ClienteCard } from "./ClienteCard";
import { ClienteFormModal } from "./ClienteFormModal";
import { ClienteDetail } from "./ClienteDetail";
import styles from "@/styles/dashboard.module.css";

export default function ClientesPage() {
  const { items: clientes, loading, error, fetchAll, addCliente, updateCliente, removeCliente } = useClientesStore();
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const [search, setSearch] = useState("");
  const [filtSector, setFiltSector] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

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
      return matchesSearch && matchesSector;
    });
  }, [clientes, search, filtSector]);

  const stats = useMemo(() => {
    const total = clientes.length;
    const sectoresCount = sectores.length;
    const conWeb = clientes.filter((c) => c.web).length;
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const nuevosEsteMes = clientes.filter((c) => new Date(c.createdAt) >= inicioMes).length;
    return { total, sectoresCount, conWeb, nuevosEsteMes };
  }, [clientes, sectores]);

  const chips: FilterChip[] = [
    search && { key: "search", label: `“${search}”` },
    filtSector && { key: "sector", label: filtSector },
  ].filter(Boolean) as FilterChip[];

  function removeChip(key: string) {
    if (key === "search") setSearch("");
    if (key === "sector") setFiltSector("");
  }

  function clearAll() {
    setSearch("");
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
      <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Base de datos</div>
      <h1 className={styles.h1}>Gestión de clientes</h1>
      <p className="mb-5 text-[13px] text-text-2">Cada cliente con sus contactos, proyectos asociados y facturación.</p>

      <div className={`mb-5 ${styles.kpis}`}>
        <StatCard n={stats.total} label="Total de clientes" />
        <StatCard n={stats.sectoresCount} label="Sectores" />
        <StatCard n={stats.conWeb} label="Con sitio web" />
        <StatCard n={stats.nuevosEsteMes} label="Nuevos este mes" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente, contacto o ciudad…" />
        <Select value={filtSector} onChange={(e) => setFiltSector(e.target.value)} style={{ width: "auto" }}>
          <option value="">Todos los sectores</option>
          {sectores.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button
          variant="primary"
          icon={Plus}
          className="ml-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Nuevo cliente
        </Button>
      </div>

      <ActiveFilters chips={chips} onRemove={removeChip} onClearAll={clearAll} />

      <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
        {loading && clientes.length === 0 ? (
          <div className="col-span-full flex justify-center py-14 text-text-2">
            <Spinner label="Cargando clientes…" />
          </div>
        ) : error ? (
          <EmptyState icon={AlertTriangle} title={error} tone="danger" action={{ label: "Reintentar", onClick: fetchAll }} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Building2} title="No se encontraron clientes con estos filtros." />
        ) : (
          filtered.map((c) => <ClienteCard key={c.id} cliente={c} onOpen={() => setDetailId(c.id)} />)
        )}
      </div>

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
