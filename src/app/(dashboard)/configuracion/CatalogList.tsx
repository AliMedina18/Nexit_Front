"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/primitives";
import { RowAction } from "@/components/ui/Table";
import { Input } from "@/components/ui/form";
import { useUiStore } from "@/store/ui-store";
import styles from "@/styles/dashboard.module.css";
import type { ItemCatalogo } from "@/types/api";

/**
 * Lista editable genérica para un catálogo simple `{id, nombre}` -- categorías de proveedor y
 * servicios tienen exactamente esta forma, así que comparten este componente en vez de
 * duplicar la misma tabla dos veces (Alicia 2026-09-09, pantalla de Configuración).
 */
export function CatalogList({
  items,
  placeholder,
  emptyLabel,
  onAdd,
  onUpdate,
  onRemove,
}: {
  items: ItemCatalogo[];
  placeholder: string;
  emptyLabel: string;
  onAdd: (nombre: string) => Promise<unknown>;
  onUpdate: (id: string, nombre: string) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
}) {
  const pushToast = useUiStore((s) => s.pushToast);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [toDelete, setToDelete] = useState<ItemCatalogo | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleAdd() {
    if (!draft.trim()) return;
    setAdding(true);
    try {
      await onAdd(draft.trim());
      setDraft("");
      pushToast("Agregado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo agregar", "danger");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(item: ItemCatalogo) {
    setEditingId(item.id);
    setEditDraft(item.nombre);
  }

  async function saveEdit(id: string) {
    if (!editDraft.trim()) return;
    setSavingEdit(true);
    try {
      await onUpdate(id, editDraft.trim());
      setEditingId(null);
      pushToast("Actualizado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo actualizar", "danger");
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await onRemove(toDelete.id);
      pushToast("Eliminado", "success");
      setToDelete(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar -- puede estar en uso todavía", "danger");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        {items.length === 0 && <div className="px-4 py-3.5 text-sm text-text-3">{emptyLabel}</div>}
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center gap-2 px-4 py-2.5 ${idx !== items.length - 1 ? "border-b border-[#EFEDE7]" : ""}`}
          >
            {editingId === item.id ? (
              <>
                <Input
                  autoFocus
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); saveEdit(item.id); }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-9 flex-1"
                />
                <RowAction label="Guardar" onClick={() => saveEdit(item.id)} disabled={savingEdit}>
                  <Check size={14} strokeWidth={2} />
                </RowAction>
                <RowAction label="Cancelar" onClick={() => setEditingId(null)}>
                  <X size={14} strokeWidth={2} />
                </RowAction>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-[13px]">{item.nombre}</span>
                <RowAction label="Editar" onClick={() => startEdit(item)}>
                  <Pencil size={13} strokeWidth={1.8} />
                </RowAction>
                <RowAction label="Eliminar" tone="danger" onClick={() => setToDelete(item)}>
                  <Trash2 size={13} strokeWidth={1.8} />
                </RowAction>
              </>
            )}
          </div>
        ))}
      </div>

      <div className={styles.filtersPanel}>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
            }}
            placeholder={placeholder}
            className="h-10 flex-1"
          />
          <Button variant="primary" icon={Plus} onClick={handleAdd} disabled={adding || !draft.trim()}>
            Agregar
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={`¿Eliminar "${toDelete?.nombre}"?`}
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      >
        Si ya hay clientes/proveedores/proyectos usando esto, el backend va a rechazar el borrado.
      </ConfirmDialog>
    </div>
  );
}
