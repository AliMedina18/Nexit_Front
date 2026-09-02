"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { Field, FieldGroup, Input, Row, Select, Textarea } from "@/components/ui/form";
import { StarRatingInput } from "@/components/ui/StarRating";
import { PROVEEDOR_ESTADOS } from "@/lib/constants";
import { useCatalogosStore } from "@/store/catalogos-store";
import type { Proveedor, ProveedorInput, ProveedorTelefono } from "@/types/api";

interface FormState {
  nombre: string;
  paisId: string;
  regionId: string;
  ciudadId: string;
  categoriaId: string;
  estado: string;
  contacto: string;
  cargoContacto: string;
  email: string;
  web: string;
  direccion: string;
  aforo: string;
  costoReferencia: string;
  score: number;
  presupuesto: string;
  cobertura: string;
  notas: string;
  telefonos: ProveedorTelefono[];
  servicioIds: string[];
}

const emptyForm: FormState = {
  nombre: "",
  paisId: "",
  regionId: "",
  ciudadId: "",
  categoriaId: "",
  estado: PROVEEDOR_ESTADOS[0],
  contacto: "",
  cargoContacto: "",
  email: "",
  web: "",
  direccion: "",
  aforo: "",
  costoReferencia: "",
  score: 3,
  presupuesto: "",
  cobertura: "",
  notas: "",
  telefonos: [],
  servicioIds: [],
};

export function ProviderFormModal({
  open,
  onClose,
  onSave,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: ProveedorInput) => void;
  editing: Proveedor | null;
}) {
  const { paises, categoriasProveedor, servicios, regionesPorPais, ciudadesPorRegion, fetchBase, fetchRegiones, fetchCiudades } =
    useCatalogosStore();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) fetchBase();
  }, [open, fetchBase]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form to match whichever proveedor was opened for editing
      setForm({
        nombre: editing.nombre,
        paisId: editing.paisId,
        regionId: editing.regionId ?? "",
        ciudadId: editing.ciudadId ?? "",
        categoriaId: editing.categoriaId,
        estado: editing.estado,
        contacto: editing.contacto ?? "",
        cargoContacto: editing.cargoContacto ?? "",
        email: editing.email ?? "",
        web: editing.web ?? "",
        direccion: editing.direccion ?? "",
        aforo: editing.aforo != null ? String(editing.aforo) : "",
        costoReferencia: editing.costoReferencia ?? "",
        score: editing.score ?? 3,
        presupuesto: editing.presupuesto ?? "",
        cobertura: editing.cobertura ?? "",
        notas: editing.notas ?? "",
        telefonos: editing.telefonos,
        servicioIds: editing.servicioIds,
      });
      if (editing.paisId) fetchRegiones(editing.paisId);
      if (editing.regionId) fetchCiudades(editing.regionId);
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [open, editing, fetchRegiones, fetchCiudades]);

  const regionOptions = useMemo(() => regionesPorPais[form.paisId] ?? [], [regionesPorPais, form.paisId]);
  const cityOptions = useMemo(() => ciudadesPorRegion[form.regionId] ?? [], [ciudadesPorRegion, form.regionId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handlePaisChange(paisId: string) {
    set("paisId", paisId);
    set("regionId", "");
    set("ciudadId", "");
    if (paisId) fetchRegiones(paisId);
  }

  function handleRegionChange(regionId: string) {
    set("regionId", regionId);
    set("ciudadId", "");
    if (regionId) fetchCiudades(regionId);
  }

  function toggleServicio(id: string) {
    set("servicioIds", form.servicioIds.includes(id) ? form.servicioIds.filter((s) => s !== id) : [...form.servicioIds, id]);
  }

  function addTelefono() {
    set("telefonos", [...form.telefonos, { telefono: "", etiqueta: "" }]);
  }

  function updateTelefono(idx: number, patch: Partial<ProveedorTelefono>) {
    set(
      "telefonos",
      form.telefonos.map((t, i) => (i === idx ? { ...t, ...patch } : t)),
    );
  }

  function removeTelefono(idx: number) {
    set(
      "telefonos",
      form.telefonos.filter((_, i) => i !== idx),
    );
  }

  function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!form.nombre.trim()) nextErrors.nombre = "El nombre de la empresa es requerido";
    if (!form.paisId) nextErrors.paisId = "Selecciona el país";
    if (!form.categoriaId) nextErrors.categoriaId = "Selecciona la categoría";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: ProveedorInput = {
      nombre: form.nombre.trim(),
      paisId: form.paisId,
      regionId: form.regionId || null,
      ciudadId: form.ciudadId || null,
      categoriaId: form.categoriaId,
      estado: form.estado,
      contacto: form.contacto.trim() || null,
      cargoContacto: form.cargoContacto.trim() || null,
      email: form.email.trim() || null,
      web: form.web.trim() || null,
      direccion: form.direccion.trim() || null,
      aforo: form.aforo.trim() ? Number(form.aforo) : null,
      costoReferencia: form.costoReferencia.trim() || null,
      score: form.score,
      presupuesto: form.presupuesto.trim() || null,
      cobertura: form.cobertura.trim() || null,
      notas: form.notas.trim() || null,
      telefonos: form.telefonos.filter((t) => t.telefono.trim()),
      servicioIds: form.servicioIds,
    };
    onSave(input);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar proveedor" : "Nuevo proveedor"}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar proveedor
          </Button>
        </>
      }
    >
      <Field label="Nombre de la empresa" required error={errors.nombre}>
        <Input
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder="Ej. Luces & Escenarios S.A."
        />
      </Field>

      <FieldGroup
        title={
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={12} strokeWidth={2} /> Ubicación
          </span>
        }
      >
        <Row cols={3}>
          <Field label="País" required error={errors.paisId}>
            <Select value={form.paisId} onChange={(e) => handlePaisChange(e.target.value)}>
              <option value="">Seleccionar…</option>
              {paises.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={paises.find((p) => p.id === form.paisId)?.etiquetaRegion || "Departamento / Estado"}>
            <Select value={form.regionId} onChange={(e) => handleRegionChange(e.target.value)} disabled={!form.paisId}>
              <option value="">{form.paisId ? "Seleccionar…" : "— elige país primero —"}</option>
              {regionOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Ciudad / Municipio">
            <Select value={form.ciudadId} onChange={(e) => set("ciudadId", e.target.value)} disabled={!form.regionId}>
              <option value="">{form.regionId ? "Seleccionar…" : "— elige región primero —"}</option>
              {cityOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </Field>
        </Row>
      </FieldGroup>

      <Row cols={2}>
        <Field label="Categoría" required error={errors.categoriaId}>
          <Select value={form.categoriaId} onChange={(e) => set("categoriaId", e.target.value)}>
            <option value="">Seleccionar…</option>
            {categoriasProveedor.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={form.estado} onChange={(e) => set("estado", e.target.value)}>
            {PROVEEDOR_ESTADOS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Contacto principal">
          <Input value={form.contacto} onChange={(e) => set("contacto", e.target.value)} placeholder="Nombre" />
        </Field>
        <Field label="Cargo del contacto">
          <Input
            value={form.cargoContacto}
            onChange={(e) => set("cargoContacto", e.target.value)}
            placeholder="Ej. Gerente comercial"
          />
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="contacto@empresa.com"
          />
        </Field>
        <Field label="Score">
          <StarRatingInput value={form.score} onChange={(n) => set("score", n)} />
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Presupuesto de referencia">
          <Input value={form.presupuesto} onChange={(e) => set("presupuesto", e.target.value)} placeholder="Ej. $$ Medio (20k–100k)" />
        </Field>
        <Field label="Cobertura">
          <Input value={form.cobertura} onChange={(e) => set("cobertura", e.target.value)} placeholder="Ej. Nacional" />
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Aforo">
          <Input
            type="number"
            value={form.aforo}
            onChange={(e) => set("aforo", e.target.value)}
            placeholder="Ej. 300"
          />
        </Field>
        <Field label="Costo de referencia">
          <Input
            value={form.costoReferencia}
            onChange={(e) => set("costoReferencia", e.target.value)}
            placeholder="Ej. $2.500.000 / evento"
          />
        </Field>
      </Row>

      <Field label="Sitio web">
        <Input value={form.web} onChange={(e) => set("web", e.target.value)} placeholder="https://…" />
      </Field>
      <Field label="Dirección">
        <Input value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Dirección" />
      </Field>

      <Field label="Servicios">
        <div className="flex flex-wrap gap-1.5">
          {servicios.map((s) => {
            const active = form.servicioIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleServicio(s.id)}
                className={
                  active
                    ? "rounded-full bg-text px-2.5 py-1 text-[11px] font-medium text-green"
                    : "rounded-full bg-gray-light px-2.5 py-1 text-[11px] font-medium text-text-2 hover:bg-border"
                }
              >
                {s.nombre}
              </button>
            );
          })}
          {servicios.length === 0 && <span className="text-xs text-text-3">Sin servicios en el catálogo todavía.</span>}
        </div>
      </Field>

      <Field label="Teléfonos">
        <div className="flex flex-col gap-2">
          {form.telefonos.map((t, idx) => (
            <div key={t.id ?? idx} className="flex items-center gap-1.5">
              <Input
                value={t.telefono}
                onChange={(e) => updateTelefono(idx, { telefono: e.target.value })}
                placeholder="+57 300…"
                className="flex-1"
              />
              <Input
                value={t.etiqueta ?? ""}
                onChange={(e) => updateTelefono(idx, { etiqueta: e.target.value })}
                placeholder="Etiqueta (ej. oficina)"
                className="w-[160px]"
              />
              <button
                type="button"
                onClick={() => removeTelefono(idx)}
                aria-label="Quitar teléfono"
                className="flex cursor-pointer items-center rounded border-none bg-transparent p-1.5 text-text-2 hover:bg-gray-light hover:text-red"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          ))}
          <Button size="sm" icon={Plus} onClick={addTelefono} className="self-start">
            Agregar teléfono
          </Button>
        </div>
      </Field>

      <Field label="Notas internas">
        <Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Historial, condiciones, advertencias…" />
      </Field>
    </Modal>
  );
}
