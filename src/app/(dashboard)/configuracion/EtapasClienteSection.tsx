"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Row } from "@/components/ui/form";
import { Button } from "@/components/ui/primitives";
import { RowAction } from "@/components/ui/Table";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useUiStore } from "@/store/ui-store";
import styles from "@/styles/dashboard.module.css";
import type { EtapaCliente } from "@/types/api";

/**
 * Etapas del proceso comercial del cliente (E1-E6, docs/33) -- distinta de los estados de
 * proyecto: esta vive en el Cliente y cubre las etapas previas a que exista un brief. Cada etapa
 * tiene un `orden` (posición) y un `porcentajeProceso` (0-100, cuánto del proceso comercial
 * representa esa etapa -- lo que alimenta cualquier indicador de avance comercial).
 */
export function EtapasClienteSection() {
  const { etapasCliente, addEtapaCliente, updateEtapaCliente, removeCatalogo } = useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);

  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [adding, setAdding] = useState(false);

  const [editando, setEditando] = useState<EtapaCliente | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editOrden, setEditOrden] = useState("");
  const [editPorcentaje, setEditPorcentaje] = useState("");

  const [aEliminar, setAEliminar] = useState<EtapaCliente | null>(null);

  const ordenadas = [...etapasCliente].sort((a, b) => a.orden - b.orden);

  async function handleAdd() {
    if (!nombre.trim()) return;
    setAdding(true);
    try {
      await addEtapaCliente({
        nombre: nombre.trim(),
        orden: orden.trim() ? Number(orden) : etapasCliente.length + 1,
        porcentajeProceso: porcentaje.trim() ? Number(porcentaje) : 0,
      });
      setNombre("");
      setOrden("");
      setPorcentaje("");
      pushToast("Etapa agregada", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo agregar la etapa", "danger");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(e: EtapaCliente) {
    setEditando(e);
    setEditNombre(e.nombre);
    setEditOrden(String(e.orden));
    setEditPorcentaje(String(e.porcentajeProceso));
  }

  async function saveEdit() {
    if (!editando || !editNombre.trim()) return;
    try {
      await updateEtapaCliente(editando.id, {
        nombre: editNombre.trim(),
        orden: Number(editOrden) || editando.orden,
        porcentajeProceso: editPorcentaje.trim() ? Number(editPorcentaje) : editando.porcentajeProceso,
      });
      setEditando(null);
      pushToast("Etapa actualizada", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo actualizar la etapa", "danger");
    }
  }

  async function confirmDelete() {
    if (!aEliminar) return;
    try {
      await removeCatalogo("etapas-cliente", aEliminar.id);
      pushToast("Etapa eliminada", "success");
      setAEliminar(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar -- puede haber clientes en esa etapa", "danger");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        {ordenadas.length === 0 && <div className="px-4 py-3.5 text-sm text-text-3">Sin etapas todavía.</div>}
        {ordenadas.map((e, idx) => (
          <div key={e.id} className={`flex items-center gap-2 px-4 py-2.5 ${idx !== ordenadas.length - 1 ? "border-b border-[#EFEDE7]" : ""}`}>
            {editando?.id === e.id ? (
              <>
                <Input value={editNombre} onChange={(ev) => setEditNombre(ev.target.value)} placeholder="Nombre" className="h-9 flex-1" />
                <Input type="number" value={editOrden} onChange={(ev) => setEditOrden(ev.target.value)} placeholder="Orden" className="h-9 w-[80px] flex-shrink-0" />
                <Input type="number" value={editPorcentaje} onChange={(ev) => setEditPorcentaje(ev.target.value)} placeholder="%" className="h-9 w-[80px] flex-shrink-0" />
                <RowAction label="Guardar" onClick={saveEdit}><Check size={14} strokeWidth={2} /></RowAction>
                <RowAction label="Cancelar" onClick={() => setEditando(null)}><X size={14} strokeWidth={2} /></RowAction>
              </>
            ) : (
              <>
                <span className="w-6 flex-shrink-0 font-mono text-xs text-text-3">{e.orden}</span>
                <span className="min-w-0 flex-1 truncate text-[13px]">{e.nombre}</span>
                <span className="flex-shrink-0 text-xs text-text-3">{e.porcentajeProceso}%</span>
                <RowAction label="Editar" onClick={() => startEdit(e)}><Pencil size={13} strokeWidth={1.8} /></RowAction>
                <RowAction label="Eliminar" tone="danger" onClick={() => setAEliminar(e)}><Trash2 size={13} strokeWidth={1.8} /></RowAction>
              </>
            )}
          </div>
        ))}
      </div>

      <div className={styles.filtersPanel}>
        <Row cols={3}>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nueva etapa…" className="h-10" />
          <Input type="number" value={orden} onChange={(e) => setOrden(e.target.value)} placeholder="Orden (opcional)" className="h-10" />
          <div className="flex min-w-0 gap-2">
            <Input type="number" value={porcentaje} onChange={(e) => setPorcentaje(e.target.value)} placeholder="% del proceso" className="h-10 min-w-0 flex-1" />
            <Button variant="primary" icon={Plus} onClick={handleAdd} disabled={adding || !nombre.trim()} className="flex-shrink-0">
              Agregar
            </Button>
          </div>
        </Row>
      </div>

      <ConfirmDialog
        open={!!aEliminar}
        title={`¿Eliminar "${aEliminar?.nombre}"?`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onClose={() => setAEliminar(null)}
      >
        Si algún cliente está en esta etapa ahora mismo, el backend va a rechazar el borrado.
      </ConfirmDialog>
    </div>
  );
}
