"use client";

import { useEffect, useState } from "react";
import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/primitives";
import { RowAction } from "@/components/ui/Table";
import { Input, Row } from "@/components/ui/form";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useUiStore } from "@/store/ui-store";
import styles from "@/styles/dashboard.module.css";
import { CatalogList } from "./CatalogList";
import type { Pais } from "@/types/api";

/**
 * Países -> regiones (departamentos/estados) -> ciudades, en cascada -- cada país trae su propia
 * "etiquetaRegion" (Alicia: Colombia usa "Departamento", México usa "Estado"), así que el segundo
 * nivel se rotula dinámicamente con eso en vez de un genérico "Región".
 */
export function UbicacionesSection() {
  const { paises, regionesPorPais, ciudadesPorRegion, fetchRegiones, fetchCiudades, addPais, updatePais, addRegion, updateRegion, addCiudad, updateCiudad, removeCatalogo } =
    useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);

  const [paisId, setPaisId] = useState("");
  const [regionId, setRegionId] = useState("");

  const [nuevoPaisNombre, setNuevoPaisNombre] = useState("");
  const [nuevoPaisEtiqueta, setNuevoPaisEtiqueta] = useState("");
  const [editandoPais, setEditandoPais] = useState<Pais | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEtiqueta, setEditEtiqueta] = useState("");
  const [paisAEliminar, setPaisAEliminar] = useState<Pais | null>(null);

  useEffect(() => {
    if (paisId) fetchRegiones(paisId);
  }, [paisId, fetchRegiones]);

  useEffect(() => {
    if (regionId) fetchCiudades(regionId);
  }, [regionId, fetchCiudades]);

  const paisActual = paises.find((p) => p.id === paisId) ?? null;
  const regiones = paisId ? (regionesPorPais[paisId] ?? []) : [];
  const ciudades = regionId ? (ciudadesPorRegion[regionId] ?? []) : [];

  async function handleAddPais() {
    if (!nuevoPaisNombre.trim() || !nuevoPaisEtiqueta.trim()) return;
    try {
      const creado = await addPais({ nombre: nuevoPaisNombre.trim(), etiquetaRegion: nuevoPaisEtiqueta.trim() });
      setNuevoPaisNombre("");
      setNuevoPaisEtiqueta("");
      setPaisId(creado.id);
      pushToast("País agregado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo agregar el país", "danger");
    }
  }

  function startEditPais(p: Pais) {
    setEditandoPais(p);
    setEditNombre(p.nombre);
    setEditEtiqueta(p.etiquetaRegion);
  }

  async function saveEditPais() {
    if (!editandoPais || !editNombre.trim() || !editEtiqueta.trim()) return;
    try {
      await updatePais(editandoPais.id, { nombre: editNombre.trim(), etiquetaRegion: editEtiqueta.trim() });
      setEditandoPais(null);
      pushToast("País actualizado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo actualizar el país", "danger");
    }
  }

  async function confirmDeletePais() {
    if (!paisAEliminar) return;
    try {
      await removeCatalogo("paises", paisAEliminar.id);
      if (paisId === paisAEliminar.id) { setPaisId(""); setRegionId(""); }
      pushToast("País eliminado", "success");
      setPaisAEliminar(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar -- puede tener ciudades o registros que dependen de él", "danger");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 text-[13px] font-semibold text-text">Países</div>
        <div className="mb-2 flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          {paises.length === 0 && <div className="px-4 py-3.5 text-sm text-text-3">Sin países todavía.</div>}
          {paises.map((p, idx) => (
            <div key={p.id} className={`flex items-center gap-2 px-4 py-2.5 ${idx !== paises.length - 1 ? "border-b border-[#EFEDE7]" : ""}`}>
              {editandoPais?.id === p.id ? (
                <>
                  <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} placeholder="País" className="h-9 flex-1" />
                  <Input value={editEtiqueta} onChange={(e) => setEditEtiqueta(e.target.value)} placeholder='Etiqueta (ej. "Departamento")' className="h-9 w-[180px] flex-shrink-0" />
                  <RowAction label="Guardar" onClick={saveEditPais}><Check size={14} strokeWidth={2} /></RowAction>
                  <RowAction label="Cancelar" onClick={() => setEditandoPais(null)}><X size={14} strokeWidth={2} /></RowAction>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => { setPaisId(p.id); setRegionId(""); }} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left">
                    <MapPin size={13} strokeWidth={1.8} className={paisId === p.id ? "text-teal-mid" : "text-text-3"} />
                    <span className={`truncate text-[13px] ${paisId === p.id ? "font-semibold text-text" : ""}`}>{p.nombre}</span>
                    <span className="flex-shrink-0 text-xs text-text-3">({p.etiquetaRegion})</span>
                  </button>
                  <RowAction label="Editar" onClick={() => startEditPais(p)}><Pencil size={13} strokeWidth={1.8} /></RowAction>
                  <RowAction label="Eliminar" tone="danger" onClick={() => setPaisAEliminar(p)}><Trash2 size={13} strokeWidth={1.8} /></RowAction>
                </>
              )}
            </div>
          ))}
        </div>
        <div className={styles.filtersPanel}>
          <Row cols={2}>
            <Input value={nuevoPaisNombre} onChange={(e) => setNuevoPaisNombre(e.target.value)} placeholder="Nombre del país" className="h-10" />
            <div className="flex min-w-0 gap-2">
              <Input
                value={nuevoPaisEtiqueta}
                onChange={(e) => setNuevoPaisEtiqueta(e.target.value)}
                placeholder='Cómo se llama la región ahí (ej. "Departamento", "Estado")'
                className="h-10 min-w-0 flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddPais(); } }}
              />
              <Button variant="primary" icon={Plus} onClick={handleAddPais} disabled={!nuevoPaisNombre.trim() || !nuevoPaisEtiqueta.trim()} className="flex-shrink-0">
                Agregar
              </Button>
            </div>
          </Row>
        </div>
      </div>

      {paisId && (
        <div>
          <div className="mb-2 text-[13px] font-semibold text-text">{paisActual?.etiquetaRegion ?? "Regiones"} de {paisActual?.nombre}</div>
          <CatalogList
            items={regiones.map((r) => ({ id: r.id, nombre: r.nombre }))}
            placeholder={`Nuevo/a ${paisActual?.etiquetaRegion?.toLowerCase() ?? "región"}…`}
            emptyLabel={`Sin ${paisActual?.etiquetaRegion?.toLowerCase() ?? "regiones"} todavía.`}
            onAdd={(nombre) => addRegion({ paisId, nombre })}
            onUpdate={(id, nombre) => updateRegion(id, { paisId, nombre })}
            onRemove={(id) => removeCatalogo("regiones", id)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {regiones.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRegionId(r.id)}
                className={`rounded-[20px] px-[9px] py-[3px] text-[11px] font-medium ${
                  regionId === r.id ? "bg-text text-green" : "bg-gray-light text-text-2 hover:bg-border"
                }`}
              >
                Ver ciudades de {r.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {regionId && (
        <div>
          <div className="mb-2 text-[13px] font-semibold text-text">Ciudades de {regiones.find((r) => r.id === regionId)?.nombre}</div>
          <CatalogList
            items={ciudades.map((c) => ({ id: c.id, nombre: c.nombre }))}
            placeholder="Nueva ciudad…"
            emptyLabel="Sin ciudades todavía."
            onAdd={(nombre) => addCiudad({ regionId, nombre })}
            onUpdate={(id, nombre) => updateCiudad(id, { regionId, nombre })}
            onRemove={(id) => removeCatalogo("ciudades", id)}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!paisAEliminar}
        title={`¿Eliminar "${paisAEliminar?.nombre}"?`}
        confirmLabel="Eliminar"
        onConfirm={confirmDeletePais}
        onClose={() => setPaisAEliminar(null)}
      >
        Si tiene regiones o ciudades, o clientes/proveedores lo están usando, el backend va a rechazar el borrado.
      </ConfirmDialog>
    </div>
  );
}
