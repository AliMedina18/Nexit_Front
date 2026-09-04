"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Drawer, FormDrawerBody, FormDrawerFooter, FormDrawerHeader, FormDrawerSection } from "@/components/ui/Drawer";
import { Dropdown } from "@/components/ui/primitives";
import { DeleteOrRequestButton } from "@/components/ui/DeleteAction";
import { EntityAttachments } from "@/components/ui/EntityAttachments";
import { Field, Input, Row, Textarea } from "@/components/ui/form";
import { StarRatingInput } from "@/components/ui/StarRating";
import { PROVEEDOR_ESTADOS } from "@/lib/constants";
import { parseCSVFirstRow } from "@/lib/csv";
import { proveedorAdjuntosApi } from "@/services/api/proveedor-adjuntos-service";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useUiStore } from "@/store/ui-store";
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

const ESTADO_OPTIONS = PROVEEDOR_ESTADOS.map((e) => ({ value: e, label: e }));

/** Niveles habituales de "Presupuesto habitual" (mkDD del mockup aprobado toma esta lista de
 * los valores ya usados por otros proveedores -- acá se fija una base razonable y se le suma
 * el valor actual si no está, para no perder presupuestos ya guardados como texto libre antes
 * de que este campo fuera un Dropdown). */
const PRESUPUESTO_BASE = ["$ Bajo (< 20k)", "$$ Medio (20k–100k)", "$$$ Alto (100k–500k)", "$$$$ Premium (> 500k)"];

function withCurrent(base: string[], current: string): string[] {
  return current && !base.includes(current) ? [...base, current] : base;
}

export function ProviderFormModal({
  open,
  onClose,
  onSave,
  onDelete,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: ProveedorInput) => void;
  /** Solo se usa (y solo se muestra "Eliminar") cuando `editing` no es null: un proveedor
   * nuevo, todavía sin guardar, no tiene nada que eliminar. */
  onDelete?: () => void;
  editing: Proveedor | null;
}) {
  const { paises, categoriasProveedor, servicios, regionesPorPais, ciudadesPorRegion, fetchBase, fetchRegiones, fetchCiudades } =
    useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [telDraft, setTelDraft] = useState("");

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
    setTelDraft("");
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
    const value = telDraft.trim();
    if (!value) return;
    set("telefonos", [...form.telefonos, { telefono: value, etiqueta: "" }]);
    setTelDraft("");
  }

  function removeTelefono(idx: number) {
    set(
      "telefonos",
      form.telefonos.filter((_, i) => i !== idx),
    );
  }

  /**
   * "Importar datos" (header del drawer) -- rellena el formulario abierto desde la
   * primera fila de un CSV, igual que en ClienteFormModal/ProjectFormModal. País/
   * departamento/ciudad/categoría no se rellenan porque el CSV trae nombres, no
   * los ids del catálogo -- esos se siguen eligiendo a mano.
   */
  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const row = parseCSVFirstRow(String(reader.result));
      if (!row) {
        pushToast("El archivo no tiene una fila de datos para importar", "danger");
        return;
      }
      const pick = (...keys: string[]) => {
        for (const key of keys) {
          const found = Object.keys(row).find((h) => h.trim().toLowerCase() === key);
          if (found && row[found]) return row[found];
        }
        return undefined;
      };
      setForm((f) => ({
        ...f,
        nombre: pick("nombre", "empresa", "proveedor") ?? f.nombre,
        estado: pick("estado") ?? f.estado,
        contacto: pick("contacto", "persona", "personadecontacto") ?? f.contacto,
        cargoContacto: pick("cargo", "cargocontacto") ?? f.cargoContacto,
        email: pick("email", "correo") ?? f.email,
        web: pick("web", "sitioweb", "sitio web") ?? f.web,
        direccion: pick("direccion", "dirección") ?? f.direccion,
        aforo: pick("aforo") ?? f.aforo,
        costoReferencia: pick("costoreferencia", "costo de referencia", "costo") ?? f.costoReferencia,
        presupuesto: pick("presupuesto") ?? f.presupuesto,
        cobertura: pick("cobertura") ?? f.cobertura,
        notas: pick("notas") ?? f.notas,
      }));
      const tel = pick("telefono", "teléfono", "telefonos", "teléfonos");
      if (tel) setTelDraft(tel);
      pushToast("Datos importados. Revisa los campos y guarda.", "info");
    };
    reader.readAsText(file);
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
    <Drawer open={open} onClose={onClose}>
      <FormDrawerHeader
        eyebrow={editing ? "Editar proveedor" : "Registrar proveedor"}
        title={editing ? editing.nombre || "Datos del proveedor" : "Datos del nuevo proveedor"}
        onClose={onClose}
        onImportFile={handleImportFile}
      />

      <FormDrawerBody>
        <FormDrawerSection number="01" title="Quién es">
          <div className="grid grid-cols-1 gap-3 min-[1001px]:grid-cols-[1.6fr_1fr]">
            <Field label="Nombre del proveedor" required error={errors.nombre}>
              <Input
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Ej. Flash Studios"
              />
            </Field>
            <Field label="Categoría" required error={errors.categoriaId}>
              <Dropdown
                value={form.categoriaId}
                onChange={(v) => set("categoriaId", v)}
                placeholder="Seleccionar…"
                options={categoriasProveedor.map((c) => ({ value: c.id, label: c.nombre }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 min-[1001px]:grid-cols-[1.6fr_1fr]">
            <Field label="Estado">
              <Dropdown
                value={form.estado}
                onChange={(v) => set("estado", v || PROVEEDOR_ESTADOS[0])}
                placeholder="Elige un estado"
                options={ESTADO_OPTIONS}
              />
            </Field>
            <Field label="Valoración">
              <StarRatingInput value={form.score} onChange={(n) => set("score", n)} />
            </Field>
          </div>
        </FormDrawerSection>

        <FormDrawerSection number="02" title="Dónde está">
          <Row cols={3}>
            <Field label="País" required error={errors.paisId}>
              <Dropdown
                value={form.paisId}
                onChange={handlePaisChange}
                placeholder="Seleccionar…"
                options={paises.map((p) => ({ value: p.id, label: p.nombre }))}
              />
            </Field>
            <Field label={paises.find((p) => p.id === form.paisId)?.etiquetaRegion || "Departamento"}>
              <Dropdown
                value={form.regionId}
                onChange={handleRegionChange}
                placeholder="Seleccionar…"
                disabled={!form.paisId}
                disabledHint="— elige país primero —"
                options={regionOptions.map((r) => ({ value: r.id, label: r.nombre }))}
              />
            </Field>
            <Field label="Ciudad">
              <Dropdown
                value={form.ciudadId}
                onChange={(v) => set("ciudadId", v)}
                placeholder="Seleccionar…"
                disabled={!form.regionId}
                disabledHint="— elige departamento primero —"
                options={cityOptions.map((c) => ({ value: c.id, label: c.nombre }))}
              />
            </Field>
          </Row>
          <Row cols={2}>
            <Field label="Hasta dónde viaja">
              <Input
                value={form.cobertura}
                onChange={(e) => set("cobertura", e.target.value)}
                placeholder="Nacional, regional, solo su ciudad…"
              />
            </Field>
            <Field label="Presupuesto habitual">
              <Dropdown
                value={form.presupuesto}
                onChange={(v) => set("presupuesto", v)}
                placeholder="Sin definir"
                options={withCurrent(PRESUPUESTO_BASE, form.presupuesto).map((p) => ({ value: p, label: p }))}
              />
            </Field>
          </Row>
          {/* Dirección y sitio web: campos reales del proveedor que el mockup no modela en su
              formulario (ahí solo hay país/departamento/ciudad/cobertura), pero sí existen en el
              backend -- se agregan al final de la sección en vez de quitarlos. */}
          <Row cols={2}>
            <Field label="Dirección">
              <Input value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Dirección" />
            </Field>
            <Field label="Sitio web">
              <Input value={form.web} onChange={(e) => set("web", e.target.value)} placeholder="https://…" />
            </Field>
          </Row>
        </FormDrawerSection>

        <FormDrawerSection number="03" title="Con quién se habla">
          <Row cols={2}>
            <Field label="Persona de contacto">
              <Input value={form.contacto} onChange={(e) => set("contacto", e.target.value)} placeholder="Nombre y apellido" />
            </Field>
            <Field label="Cargo del contacto">
              <Input
                value={form.cargoContacto}
                onChange={(e) => set("cargoContacto", e.target.value)}
                placeholder="Ej. Gerente comercial"
              />
            </Field>
          </Row>

          <Field label="Teléfono">
            <div className="flex flex-col gap-2">
              {form.telefonos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.telefonos.map((t, idx) => (
                    <span
                      key={t.id ?? idx}
                      className="inline-flex items-center gap-1.5 rounded-[20px] bg-gray-light py-1.5 pl-3 pr-1.5 text-[13px]"
                    >
                      {t.telefono}
                      {t.etiqueta ? ` · ${t.etiqueta}` : ""}
                      <button
                        type="button"
                        onClick={() => removeTelefono(idx)}
                        aria-label="Quitar teléfono"
                        className="flex h-[18px] w-[18px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-text-2 hover:bg-black/10 hover:text-red"
                      >
                        <X size={11} strokeWidth={2.4} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={telDraft}
                  onChange={(e) => setTelDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTelefono();
                    }
                  }}
                  placeholder="+57 300 000 0000"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={addTelefono}
                  className="flex h-[46px] flex-shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] bg-teal-mid px-4 text-sm font-medium text-white transition-colors hover:bg-green hover:text-text"
                >
                  Agregar
                </button>
              </div>
            </div>
          </Field>

          <Field label="Correo">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="nombre@empresa.com"
            />
          </Field>
        </FormDrawerSection>

        <FormDrawerSection number="04" title="Qué hace y qué recordar">
          {/* Chips de catálogo en vez del textarea de texto libre del mockup ("Sepáralos con
              comas…"): `servicioIds` es una relación real contra el catálogo de servicios, no
              texto suelto -- convertirlo a un textarea perdería esa relación (y filtrar/mostrar
              el nombre del servicio en otras pantallas dejaría de funcionar). */}
          <Field label="Servicios que presta">
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
                        ? "rounded-[20px] bg-text px-[9px] py-[3px] text-[11px] font-medium text-green"
                        : "rounded-[20px] bg-gray-light px-[9px] py-[3px] text-[11px] font-medium text-text-2 hover:bg-border"
                    }
                  >
                    {s.nombre}
                  </button>
                );
              })}
              {servicios.length === 0 && <span className="text-xs text-text-3">Sin servicios en el catálogo todavía.</span>}
            </div>
          </Field>
          {/* Aforo y costo de referencia: reales, sin equivalente en el mockup -- van al final
              de la sección en vez de perderse. */}
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
          <Field
            label="Notas internas"
            hint={
              <div className="mt-1.5 text-xs text-text-3">
                Lo que el equipo debe saber antes de contratarlo: anticipos, tiempos, descuentos.
              </div>
            }
          >
            <Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Escribe aquí lo importante" />
          </Field>
        </FormDrawerSection>

        <FormDrawerSection number="05" title="Archivos y enlaces">
          {editing ? (
            <EntityAttachments entityId={editing.id} api={proveedorAdjuntosApi} />
          ) : (
            <p className="text-sm text-text-3">Guarda el proveedor primero para poder subir archivos o agregar enlaces.</p>
          )}
        </FormDrawerSection>
      </FormDrawerBody>

      <FormDrawerFooter>
        {editing && onDelete && (
          <div className="mr-auto">
            <DeleteOrRequestButton tipoEntidad="proveedor" entidadId={editing.id} nombre={editing.nombre} onDelete={onDelete} />
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="h-11 cursor-pointer rounded-[var(--radius-md)] border border-border bg-transparent px-4 text-sm font-medium text-text transition-colors hover:border-text hover:bg-bg"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="h-11 cursor-pointer rounded-[var(--radius-md)] bg-teal-mid px-5 text-sm font-medium text-white transition-colors hover:bg-green hover:text-text"
        >
          {editing ? "Guardar cambios" : "Registrar proveedor"}
        </button>
      </FormDrawerFooter>
    </Drawer>
  );
}
