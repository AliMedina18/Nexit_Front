"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Drawer, FormDrawerBody, FormDrawerFooter, FormDrawerHeader, FormDrawerSection } from "@/components/ui/Drawer";
import { DeleteOrRequestButton } from "@/components/ui/DeleteAction";
import { EntityAttachments } from "@/components/ui/EntityAttachments";
import { Dropdown, type DropdownGroup } from "@/components/ui/primitives";
import { Field, Input, Row, Textarea } from "@/components/ui/form";
import { parseCSVFirstRow } from "@/lib/csv";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useClientesStore } from "@/store/clientes-store";
import { useUiStore } from "@/store/ui-store";
import { proyectoAdjuntosApi } from "@/services/api/proyecto-adjuntos-service";
import { usuariosApi } from "@/services/api/usuarios-service";
import type { Proveedor, Proyecto, ProyectoEquipoMiembro, ProyectoInput, Usuario } from "@/types/api";
import { ProviderPicker } from "./ProviderPicker";

const BRIEF_ESTADOS = ["Pendiente por enviar", "Entregado, a espera de respuesta", "Requiere ajustes", "Aprobado"];
const PROPUESTA_ESTADOS = ["Pendiente", "Enviada", "Aprobada", "Rechazada"];
// Listas base del mockup aprobado -- el valor ya guardado en un proyecto viejo (si no está
// en esta lista) se agrega igual como opción extra, para no perderlo por venir de antes de
// que este campo se volviera un dropdown cerrado.
const TIPO_BASE = ["Corporativo", "Evento social"];
const PRIORIDAD_BASE = ["Alta", "Media", "Baja"];
const SEDE_BASE = ["Bogotá", "Ciudad de México"];

function withCurrent(base: string[], current: string): string[] {
  return current && !base.includes(current) ? [...base, current] : base;
}

interface FormState {
  nombre: string;
  clienteId: string;
  contactoProyecto: string;
  tipoProyecto: string;
  prioridad: string;
  ciudad: string;
  sedeNext: string;
  fechaSolicitud: string;
  fechaEvento: string;
  estadoId: string;
  porcentajeAvance: number;
  estadoBrief: string;
  propuestaEstado: string;
  numeroFactura: string;
  pagado: boolean;
  fechaPago: string;
  notas: string;
  gerenteId: string;
  equipo: ProyectoEquipoMiembro[];
}

const emptyForm: FormState = {
  nombre: "",
  clienteId: "",
  contactoProyecto: "",
  tipoProyecto: "",
  prioridad: "",
  ciudad: "",
  sedeNext: "",
  fechaSolicitud: "",
  fechaEvento: "",
  estadoId: "",
  porcentajeAvance: 0,
  estadoBrief: BRIEF_ESTADOS[0],
  propuestaEstado: PROPUESTA_ESTADOS[0],
  numeroFactura: "",
  pagado: false,
  fechaPago: "",
  notas: "",
  gerenteId: "",
  equipo: [],
};

export function ProjectFormModal({
  open,
  onClose,
  onSave,
  onDelete,
  editing,
  providers,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: ProyectoInput) => void;
  /** Solo se usa (y solo se muestra "Eliminar") cuando `editing` no es null. */
  onDelete?: () => void;
  editing: Proyecto | null;
  providers: Proveedor[];
}) {
  const user = useAuthStore((s) => s.user);
  const pushToast = useUiStore((s) => s.pushToast);
  const { estadosProyecto, fasesProyecto, fetchBase } = useCatalogosStore();
  const { items: clientes, fetchAll: fetchClientes } = useClientesStore();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [gerentes, setGerentes] = useState<Usuario[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [miembroRolDraft, setMiembroRolDraft] = useState("");
  const [miembroNombreDraft, setMiembroNombreDraft] = useState("");

  const puedeAsignarGerente = user?.rol === "admin" || user?.rol === "super_admin";

  useEffect(() => {
    if (!open) return;
    fetchBase();
    fetchClientes();
    if (puedeAsignarGerente) {
      usuariosApi.list().then(setGerentes).catch(() => setGerentes([]));
    }
  }, [open, fetchBase, fetchClientes, puedeAsignarGerente]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form to match whichever proyecto was opened for editing
      setForm({
        nombre: editing.nombre,
        clienteId: editing.clienteId ?? "",
        contactoProyecto: editing.contactoProyecto ?? "",
        tipoProyecto: editing.tipoProyecto ?? "",
        prioridad: editing.prioridad ?? "",
        ciudad: editing.ciudad ?? "",
        sedeNext: editing.sedeNext ?? "",
        fechaSolicitud: editing.fechaSolicitud?.slice(0, 10) ?? "",
        fechaEvento: editing.fechaEvento?.slice(0, 10) ?? "",
        estadoId: editing.estadoId,
        porcentajeAvance: editing.porcentajeAvance,
        estadoBrief: editing.estadoBrief,
        propuestaEstado: editing.propuestaEstado,
        numeroFactura: editing.numeroFactura ?? "",
        pagado: editing.pagado,
        fechaPago: editing.fechaPago?.slice(0, 10) ?? "",
        notas: editing.notas ?? "",
        gerenteId: editing.gerenteId ?? "",
        equipo: editing.equipo,
      });
      setSelectedIds(new Set(editing.proveedorIds));
    } else {
      setForm(emptyForm);
      setSelectedIds(new Set());
    }
    setErrors({});
    setMiembroRolDraft("");
    setMiembroNombreDraft("");
  }, [open, editing]);

  const estadosPorFase = useMemo(() => {
    const fases = [...fasesProyecto].sort((a, b) => a.fase - b.fase);
    return fases.map((f) => ({
      fase: f,
      estados: estadosProyecto.filter((e) => e.fase === f.fase).sort((a, b) => a.orden - b.orden),
    }));
  }, [fasesProyecto, estadosProyecto]);

  const estadoGroups: DropdownGroup[] = useMemo(
    () =>
      estadosPorFase.map(({ fase, estados }) => ({
        label: `Fase ${fase.fase} · ${fase.nombre}`,
        options: estados.map((e) => ({ value: e.id, label: e.nombre })),
      })),
    [estadosPorFase],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleProvider(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addMiembro() {
    if (!miembroNombreDraft.trim()) return;
    set("equipo", [...form.equipo, { rol: miembroRolDraft.trim(), nombre: miembroNombreDraft.trim() }]);
    setMiembroRolDraft("");
    setMiembroNombreDraft("");
  }

  function removeMiembro(idx: number) {
    set(
      "equipo",
      form.equipo.filter((_, i) => i !== idx),
    );
  }

  /** "Importar datos" -- rellena el formulario desde la primera fila de un CSV. Cliente y
   * estado se resuelven por nombre contra los catálogos ya cargados; si no hay coincidencia
   * exacta, el campo se deja tal como estaba (no se limpia). */
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
      const clienteNombre = pick("cliente", "empresa");
      const clienteMatch = clienteNombre
        ? clientes.find((c) => c.nombre.toLowerCase() === clienteNombre.toLowerCase())
        : undefined;
      const estadoNombre = pick("estado", "estadoproyecto");
      const estadoMatch = estadoNombre
        ? estadosProyecto.find((e) => e.nombre.toLowerCase() === estadoNombre.toLowerCase())
        : undefined;
      setForm((f) => ({
        ...f,
        nombre: pick("nombre", "proyecto") ?? f.nombre,
        clienteId: clienteMatch ? clienteMatch.id : f.clienteId,
        contactoProyecto: pick("contacto", "contactoproyecto") ?? f.contactoProyecto,
        tipoProyecto: pick("tipo", "tipoproyecto") ?? f.tipoProyecto,
        prioridad: pick("prioridad") ?? f.prioridad,
        ciudad: pick("ciudad") ?? f.ciudad,
        sedeNext: pick("sede", "sedenext") ?? f.sedeNext,
        fechaSolicitud: pick("fechasolicitud") ?? f.fechaSolicitud,
        fechaEvento: pick("fechaevento", "fecha") ?? f.fechaEvento,
        estadoId: estadoMatch ? estadoMatch.id : f.estadoId,
        numeroFactura: pick("factura", "numerofactura") ?? f.numeroFactura,
        notas: pick("notas") ?? f.notas,
      }));
      pushToast("Datos importados. Revisa los campos y guarda.", "info");
    };
    reader.readAsText(file);
  }

  function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!form.nombre.trim()) nextErrors.nombre = "El nombre del proyecto es requerido";
    if (!form.estadoId) nextErrors.estadoId = "Selecciona el estado";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: ProyectoInput = {
      nombre: form.nombre.trim(),
      clienteId: form.clienteId || null,
      contactoProyecto: form.contactoProyecto.trim() || null,
      tipoProyecto: form.tipoProyecto.trim() || null,
      prioridad: form.prioridad.trim() || null,
      ciudad: form.ciudad.trim() || null,
      sedeNext: form.sedeNext.trim() || null,
      fechaSolicitud: form.fechaSolicitud || null,
      fechaEvento: form.fechaEvento || null,
      estadoId: form.estadoId,
      porcentajeAvance: form.porcentajeAvance,
      estadoBrief: form.estadoBrief,
      propuestaEstado: form.propuestaEstado,
      numeroFactura: form.numeroFactura.trim() || null,
      pagado: form.pagado,
      fechaPago: form.fechaPago || null,
      notas: form.notas.trim() || null,
      gerenteId: puedeAsignarGerente ? form.gerenteId || null : undefined,
      equipo: form.equipo.filter((m) => m.nombre.trim()),
      proveedorIds: [...selectedIds],
    };
    onSave(input);
  }

  return (
    <Drawer open={open} onClose={onClose}>
      <FormDrawerHeader
        eyebrow={editing ? "Editar proyecto" : "Registrar proyecto"}
        title={editing ? editing.nombre || "Datos del proyecto" : "Datos del nuevo proyecto"}
        onClose={onClose}
        onImportFile={handleImportFile}
      />

      <FormDrawerBody>
        <FormDrawerSection number="01" title="Qué es">
          <Field label="Nombre del proyecto" required error={errors.nombre}>
            <Input
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej. Lanzamiento Marca X"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 min-[1001px]:grid-cols-[1.6fr_1fr]">
            <Field label="Cliente">
              <Dropdown
                value={form.clienteId}
                onChange={(v) => set("clienteId", v)}
                placeholder="Elige un cliente"
                options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
              />
            </Field>
            <Field label="Fecha del evento">
              <Input type="date" value={form.fechaEvento} onChange={(e) => set("fechaEvento", e.target.value)} />
            </Field>
          </div>

          <Row cols={2}>
            <Field label="Tipo de proyecto">
              <Dropdown
                value={form.tipoProyecto}
                onChange={(v) => set("tipoProyecto", v)}
                placeholder="Elige un tipo"
                options={withCurrent(TIPO_BASE, form.tipoProyecto).map((t) => ({ value: t, label: t }))}
              />
            </Field>
            <Field label="Prioridad">
              <Dropdown
                value={form.prioridad}
                onChange={(v) => set("prioridad", v)}
                placeholder="Elige prioridad"
                options={withCurrent(PRIORIDAD_BASE, form.prioridad).map((p) => ({ value: p, label: p }))}
              />
            </Field>
          </Row>

          <Row cols={2}>
            <Field label="Ciudad del evento">
              <Input value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} placeholder="Bogotá" />
            </Field>
            <Field label="Sede de Next a cargo">
              <Dropdown
                value={form.sedeNext}
                onChange={(v) => set("sedeNext", v)}
                placeholder="Elige sede"
                options={withCurrent(SEDE_BASE, form.sedeNext).map((s) => ({ value: s, label: s }))}
              />
            </Field>
          </Row>

          <Field label="Fecha de solicitud">
            <Input type="date" value={form.fechaSolicitud} onChange={(e) => set("fechaSolicitud", e.target.value)} />
          </Field>
          <Field label="Contacto en el cliente">
            <Input
              value={form.contactoProyecto}
              onChange={(e) => set("contactoProyecto", e.target.value)}
              placeholder="Nombre y apellido"
            />
          </Field>
        </FormDrawerSection>

        <FormDrawerSection number="02" title="Estado">
          <Row cols={2}>
            <Field label="Estado del proyecto" required error={errors.estadoId}>
              <Dropdown
                value={form.estadoId}
                onChange={(v) => set("estadoId", v)}
                placeholder="Elige un estado"
                groups={estadoGroups}
              />
            </Field>
            <Field label="Estado del brief">
              <Dropdown
                value={form.estadoBrief}
                onChange={(v) => set("estadoBrief", v || BRIEF_ESTADOS[0])}
                placeholder="Elige un estado"
                options={BRIEF_ESTADOS.map((b) => ({ value: b, label: b }))}
              />
            </Field>
          </Row>

          <div className="grid grid-cols-1 gap-3 min-[1001px]:grid-cols-2 min-[1001px]:items-end">
            <Field label="Estado de la propuesta">
              <Dropdown
                value={form.propuestaEstado}
                onChange={(v) => set("propuestaEstado", v || PROPUESTA_ESTADOS[0])}
                placeholder="Elige un estado"
                options={PROPUESTA_ESTADOS.map((p) => ({ value: p, label: p }))}
              />
            </Field>
            <Field label={`Avance (${form.porcentajeAvance}%)`}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.porcentajeAvance}
                onChange={(e) => set("porcentajeAvance", Number(e.target.value))}
                className="h-[46px] w-full cursor-pointer accent-teal-mid"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[1001px]:grid-cols-[1.6fr_auto] min-[1001px]:items-end">
            <Field label="N.º de factura">
              <Input value={form.numeroFactura} onChange={(e) => set("numeroFactura", e.target.value)} placeholder="Ej. FAC-2026-0000" />
            </Field>
            <label className="mb-3.5 flex h-[46px] cursor-pointer items-center gap-2 whitespace-nowrap px-1 text-sm font-medium text-text">
              <input
                type="checkbox"
                checked={form.pagado}
                onChange={(e) => set("pagado", e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-teal-mid"
              />
              Pagado
            </label>
          </div>
          <Field label="Fecha de pago">
            <Input type="date" value={form.fechaPago} onChange={(e) => set("fechaPago", e.target.value)} />
          </Field>
        </FormDrawerSection>

        <FormDrawerSection number="03" title="Equipo">
          <Field label="Miembros del equipo">
            <div className="flex flex-col gap-2">
              {form.equipo.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.equipo.map((m, idx) => (
                    <span
                      key={m.id ?? idx}
                      className="inline-flex items-center gap-1.5 rounded-[20px] bg-gray-light py-1.5 pl-3 pr-1.5 text-[13px]"
                    >
                      {m.rol ? `${m.rol}: ` : ""}
                      {m.nombre}
                      <button
                        type="button"
                        onClick={() => removeMiembro(idx)}
                        aria-label="Quitar miembro"
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
                  value={miembroRolDraft}
                  onChange={(e) => setMiembroRolDraft(e.target.value)}
                  placeholder="Rol (ej. Ejecutivo)"
                  className="w-[160px]"
                />
                <Input
                  value={miembroNombreDraft}
                  onChange={(e) => setMiembroNombreDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMiembro();
                    }
                  }}
                  placeholder="Nombre"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={addMiembro}
                  className="flex h-[46px] flex-shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] bg-teal-mid px-4 text-sm font-medium text-white transition-colors hover:bg-green hover:text-text"
                >
                  Agregar
                </button>
              </div>
            </div>
          </Field>

          {puedeAsignarGerente && (
            <Field label="Gerente responsable" hint={<div className="mt-1.5 text-xs text-text-3">Si lo dejas vacío, se te asigna a ti.</div>}>
              <Dropdown
                value={form.gerenteId}
                onChange={(v) => set("gerenteId", v)}
                placeholder="Auto-asignar"
                options={gerentes.map((g) => ({ value: g.id, label: `${g.nombre} ${g.apellido}` }))}
              />
            </Field>
          )}
        </FormDrawerSection>

        <FormDrawerSection number="04" title="Proveedores y notas">
          <Field label="Proveedores trabajando en este proyecto">
            <ProviderPicker providers={providers} selectedIds={selectedIds} onToggle={toggleProvider} />
          </Field>
          <Field label="Notas internas">
            <Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Detalles, alcance, condiciones…" />
          </Field>
        </FormDrawerSection>

        <FormDrawerSection number="05" title="Archivos y enlaces">
          {editing ? (
            <EntityAttachments entityId={editing.id} api={proyectoAdjuntosApi} />
          ) : (
            <p className="text-sm text-text-3">Guarda el proyecto primero para poder subir archivos o agregar enlaces.</p>
          )}
        </FormDrawerSection>
      </FormDrawerBody>

      <FormDrawerFooter>
        {editing && onDelete && (
          <div className="mr-auto">
            <DeleteOrRequestButton tipoEntidad="proyecto" entidadId={editing.id} nombre={editing.nombre} onDelete={onDelete} />
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
          {editing ? "Guardar cambios" : "Registrar proyecto"}
        </button>
      </FormDrawerFooter>
    </Drawer>
  );
}
