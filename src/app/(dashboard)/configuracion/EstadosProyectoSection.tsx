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
import type { EstadoProyecto } from "@/types/api";

/**
 * Fases de proyecto (fijas -- solo se les cambia el nombre, no se crean/eliminan) y, dentro de
 * cada una, sus estados (estos sí se crean/editan/eliminan, con un "orden" que decide en qué
 * posición aparecen dentro de esa fase -- mismo `orden` que ya usa el Dropdown de "Estado del
 * proyecto" agrupado por fase en ProjectFormModal).
 */
export function EstadosProyectoSection() {
  const { fasesProyecto, estadosProyecto, updateFase, addEstadoProyecto, updateEstadoProyecto, removeCatalogo } = useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);

  const [editandoFase, setEditandoFase] = useState<number | null>(null);
  const [faseNombreDraft, setFaseNombreDraft] = useState("");

  const [nuevoNombrePorFase, setNuevoNombrePorFase] = useState<Record<number, string>>({});
  const [nuevoOrdenPorFase, setNuevoOrdenPorFase] = useState<Record<number, string>>({});

  const [editandoEstado, setEditandoEstado] = useState<EstadoProyecto | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editOrden, setEditOrden] = useState("");

  const [aEliminar, setAEliminar] = useState<EstadoProyecto | null>(null);

  async function saveFase(fase: number) {
    if (!faseNombreDraft.trim()) return;
    try {
      await updateFase(fase, faseNombreDraft.trim());
      setEditandoFase(null);
      pushToast("Fase actualizada", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo actualizar la fase", "danger");
    }
  }

  async function handleAdd(fase: number) {
    const nombre = (nuevoNombrePorFase[fase] ?? "").trim();
    const ordenTxt = nuevoOrdenPorFase[fase] ?? "";
    if (!nombre) return;
    const orden = ordenTxt.trim() ? Number(ordenTxt) : estadosProyecto.filter((e) => e.fase === fase).length + 1;
    try {
      await addEstadoProyecto({ nombre, fase, orden });
      setNuevoNombrePorFase((s) => ({ ...s, [fase]: "" }));
      setNuevoOrdenPorFase((s) => ({ ...s, [fase]: "" }));
      pushToast("Estado agregado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo agregar el estado", "danger");
    }
  }

  function startEditEstado(e: EstadoProyecto) {
    setEditandoEstado(e);
    setEditNombre(e.nombre);
    setEditOrden(String(e.orden));
  }

  async function saveEditEstado() {
    if (!editandoEstado || !editNombre.trim()) return;
    try {
      await updateEstadoProyecto(editandoEstado.id, { nombre: editNombre.trim(), fase: editandoEstado.fase, orden: Number(editOrden) || editandoEstado.orden });
      setEditandoEstado(null);
      pushToast("Estado actualizado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo actualizar el estado", "danger");
    }
  }

  async function confirmDelete() {
    if (!aEliminar) return;
    try {
      await removeCatalogo("estados-proyecto", aEliminar.id);
      pushToast("Estado eliminado", "success");
      setAEliminar(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar -- puede haber proyectos en ese estado", "danger");
    }
  }

  const fasesOrdenadas = [...fasesProyecto].sort((a, b) => a.fase - b.fase);

  return (
    <div className="flex flex-col gap-6">
      {fasesOrdenadas.map((f) => {
        const estados = estadosProyecto.filter((e) => e.fase === f.fase).sort((a, b) => a.orden - b.orden);
        return (
          <div key={f.fase}>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-xs text-[#00a85a]">Fase {f.fase}</span>
              {editandoFase === f.fase ? (
                <>
                  <Input autoFocus value={faseNombreDraft} onChange={(e) => setFaseNombreDraft(e.target.value)} className="h-8 max-w-[220px]" />
                  <RowAction label="Guardar" onClick={() => saveFase(f.fase)}><Check size={13} strokeWidth={2} /></RowAction>
                  <RowAction label="Cancelar" onClick={() => setEditandoFase(null)}><X size={13} strokeWidth={2} /></RowAction>
                </>
              ) : (
                <>
                  <span className="text-[15px] font-semibold text-text">{f.nombre}</span>
                  <RowAction label="Editar nombre de la fase" onClick={() => { setEditandoFase(f.fase); setFaseNombreDraft(f.nombre); }}>
                    <Pencil size={12} strokeWidth={1.8} />
                  </RowAction>
                </>
              )}
            </div>

            <div className="mb-2 flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
              {estados.length === 0 && <div className="px-4 py-3.5 text-sm text-text-3">Sin estados en esta fase todavía.</div>}
              {estados.map((e, idx) => (
                <div key={e.id} className={`flex items-center gap-2 px-4 py-2.5 ${idx !== estados.length - 1 ? "border-b border-[#EFEDE7]" : ""}`}>
                  {editandoEstado?.id === e.id ? (
                    <>
                      <Input value={editNombre} onChange={(ev) => setEditNombre(ev.target.value)} placeholder="Nombre" className="h-9 flex-1" />
                      <Input
                        type="number"
                        value={editOrden}
                        onChange={(ev) => setEditOrden(ev.target.value)}
                        placeholder="Orden"
                        className="h-9 w-[90px] flex-shrink-0"
                      />
                      <RowAction label="Guardar" onClick={saveEditEstado}><Check size={14} strokeWidth={2} /></RowAction>
                      <RowAction label="Cancelar" onClick={() => setEditandoEstado(null)}><X size={14} strokeWidth={2} /></RowAction>
                    </>
                  ) : (
                    <>
                      <span className="w-6 flex-shrink-0 font-mono text-xs text-text-3">{e.orden}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px]">{e.nombre}</span>
                      <RowAction label="Editar" onClick={() => startEditEstado(e)}><Pencil size={13} strokeWidth={1.8} /></RowAction>
                      <RowAction label="Eliminar" tone="danger" onClick={() => setAEliminar(e)}><Trash2 size={13} strokeWidth={1.8} /></RowAction>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.filtersPanel}>
              <Row cols={2}>
                <Input
                  value={nuevoNombrePorFase[f.fase] ?? ""}
                  onChange={(e) => setNuevoNombrePorFase((s) => ({ ...s, [f.fase]: e.target.value }))}
                  placeholder={`Nuevo estado en ${f.nombre}…`}
                  className="h-10"
                />
                <div className="flex min-w-0 gap-2">
                  <Input
                    type="number"
                    value={nuevoOrdenPorFase[f.fase] ?? ""}
                    onChange={(e) => setNuevoOrdenPorFase((s) => ({ ...s, [f.fase]: e.target.value }))}
                    placeholder="Orden (opcional)"
                    className="h-10 w-[140px] min-w-0 flex-1"
                  />
                  <Button
                    variant="primary"
                    icon={Plus}
                    onClick={() => handleAdd(f.fase)}
                    disabled={!(nuevoNombrePorFase[f.fase] ?? "").trim()}
                    className="flex-shrink-0"
                  >
                    Agregar
                  </Button>
                </div>
              </Row>
            </div>
          </div>
        );
      })}

      <ConfirmDialog
        open={!!aEliminar}
        title={`¿Eliminar "${aEliminar?.nombre}"?`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onClose={() => setAEliminar(null)}
      >
        Si algún proyecto está en este estado ahora mismo, el backend va a rechazar el borrado.
      </ConfirmDialog>
    </div>
  );
}
