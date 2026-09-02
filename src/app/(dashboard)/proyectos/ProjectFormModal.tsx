"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Users, X } from "lucide-react";
import { Drawer, DrawerCloseButton } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/primitives";
import { Field, FieldGroup, Input, Row, Select, Textarea } from "@/components/ui/form";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useClientesStore } from "@/store/clientes-store";
import { usuariosApi } from "@/services/api/usuarios-service";
import type { Proveedor, Proyecto, ProyectoEquipoMiembro, ProyectoInput, Usuario } from "@/types/api";
import { ProviderPicker } from "./ProviderPicker";

const BRIEF_ESTADOS = ["Pendiente por enviar", "Entregado, a espera de respuesta", "Requiere ajustes", "Aprobado"];
const PROPUESTA_ESTADOS = ["Pendiente", "Enviada", "Aprobada", "Rechazada"];

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
  editing,
  providers,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: ProyectoInput) => void;
  editing: Proyecto | null;
  providers: Proveedor[];
}) {
  const user = useAuthStore((s) => s.user);
  const { estadosProyecto, fasesProyecto, fetchBase } = useCatalogosStore();
  const { items: clientes, fetchAll: fetchClientes } = useClientesStore();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [gerentes, setGerentes] = useState<Usuario[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
  }, [open, editing]);

  const estadosPorFase = useMemo(() => {
    const fases = [...fasesProyecto].sort((a, b) => a.fase - b.fase);
    return fases.map((f) => ({
      fase: f,
      estados: estadosProyecto.filter((e) => e.fase === f.fase).sort((a, b) => a.orden - b.orden),
    }));
  }, [fasesProyecto, estadosProyecto]);

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
    set("equipo", [...form.equipo, { rol: "", nombre: "" }]);
  }

  function updateMiembro(idx: number, patch: Partial<ProyectoEquipoMiembro>) {
    set(
      "equipo",
      form.equipo.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    );
  }

  function removeMiembro(idx: number) {
    set(
      "equipo",
      form.equipo.filter((_, i) => i !== idx),
    );
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
      <div className="sticky top-0 z-[1] flex items-start justify-between gap-3.5 border-b border-border bg-surface p-5">
        <div className="min-w-0">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">
            {editing ? "EDITAR PROYECTO" : "REGISTRAR PROYECTO"}
          </div>
          <h2 className="truncate text-[19px] font-semibold leading-tight">
            {editing ? "Editar datos del proyecto" : "Datos del nuevo proyecto"}
          </h2>
        </div>
        <DrawerCloseButton onClose={onClose} />
      </div>

      <div className="flex-1 p-5">
      <Field label="Nombre del proyecto" required error={errors.nombre}>
        <Input
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder="Lanzamiento Marca X, Activación Ciudad Y…"
        />
      </Field>

      <Row cols={2}>
        <Field label="Cliente">
          <Select value={form.clienteId} onChange={(e) => set("clienteId", e.target.value)}>
            <option value="">Sin cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contacto del proyecto">
          <Input
            value={form.contactoProyecto}
            onChange={(e) => set("contactoProyecto", e.target.value)}
            placeholder="Nombre del contacto en el cliente"
          />
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Fecha de solicitud">
          <Input type="date" value={form.fechaSolicitud} onChange={(e) => set("fechaSolicitud", e.target.value)} />
        </Field>
        <Field label="Fecha del evento">
          <Input type="date" value={form.fechaEvento} onChange={(e) => set("fechaEvento", e.target.value)} />
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Tipo de proyecto">
          <Input value={form.tipoProyecto} onChange={(e) => set("tipoProyecto", e.target.value)} placeholder="Ej. Activación BTL" />
        </Field>
        <Field label="Prioridad">
          <Input value={form.prioridad} onChange={(e) => set("prioridad", e.target.value)} placeholder="Ej. Alta" />
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Ciudad">
          <Input value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} placeholder="Ciudad del evento" />
        </Field>
        <Field label="Sede Next">
          <Input value={form.sedeNext} onChange={(e) => set("sedeNext", e.target.value)} placeholder="Sede que lo maneja" />
        </Field>
      </Row>

      <FieldGroup
        title={
          <span className="inline-flex items-center gap-1.5">
            <Users size={12} strokeWidth={2} /> Equipo del proyecto
          </span>
        }
      >
        <div className="flex flex-col gap-2">
          {form.equipo.map((m, idx) => (
            <div key={m.id ?? idx} className="flex items-center gap-1.5">
              <Input
                value={m.rol}
                onChange={(e) => updateMiembro(idx, { rol: e.target.value })}
                placeholder="Rol (ej. Ejecutivo)"
                className="w-[160px]"
              />
              <Input
                value={m.nombre}
                onChange={(e) => updateMiembro(idx, { nombre: e.target.value })}
                placeholder="Nombre"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => removeMiembro(idx)}
                aria-label="Quitar miembro"
                className="flex cursor-pointer items-center rounded border-none bg-transparent p-1.5 text-text-2 hover:bg-border hover:text-red"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          ))}
          <Button size="sm" icon={Plus} onClick={addMiembro} className="self-start">
            Agregar miembro
          </Button>
        </div>
      </FieldGroup>

      {puedeAsignarGerente && (
        <Field label="Gerente responsable" hint={<div className="mt-1 text-[11px] text-text-3">Si lo dejas vacío, se te asigna a ti.</div>}>
          <Select value={form.gerenteId} onChange={(e) => set("gerenteId", e.target.value)}>
            <option value="">Auto-asignar</option>
            {gerentes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre} {g.apellido}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Row cols={2}>
        <Field label="Estado" required error={errors.estadoId}>
          <Select value={form.estadoId} onChange={(e) => set("estadoId", e.target.value)}>
            <option value="">Seleccionar…</option>
            {estadosPorFase.map(({ fase, estados }) => (
              <optgroup key={fase.fase} label={`Fase ${fase.fase} · ${fase.nombre}`}>
                {estados.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Field label="% de avance">
          <Input
            type="number"
            min={0}
            max={100}
            value={form.porcentajeAvance}
            onChange={(e) => set("porcentajeAvance", Number(e.target.value))}
          />
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Estado del brief">
          <Select value={form.estadoBrief} onChange={(e) => set("estadoBrief", e.target.value)}>
            {BRIEF_ESTADOS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </Field>
        <Field label="Estado de la propuesta">
          <Select value={form.propuestaEstado} onChange={(e) => set("propuestaEstado", e.target.value)}>
            {PROPUESTA_ESTADOS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>
      </Row>

      <FieldGroup title="Facturación">
        <Row cols={2}>
          <Field label="N.º de factura">
            <Input value={form.numeroFactura} onChange={(e) => set("numeroFactura", e.target.value)} placeholder="Ej. FAC-0001" />
          </Field>
          <Field label="Fecha de pago">
            <Input type="date" value={form.fechaPago} onChange={(e) => set("fechaPago", e.target.value)} />
          </Field>
        </Row>
        <label className="flex cursor-pointer items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={form.pagado}
            onChange={(e) => set("pagado", e.target.checked)}
            className="h-[15px] w-[15px] cursor-pointer accent-teal-mid"
          />
          Pagado
        </label>
      </FieldGroup>

      <Field label="Notas">
        <Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Detalles, alcance, condiciones…" />
      </Field>

      <Field label="Proveedores trabajando en este proyecto">
        <ProviderPicker providers={providers} selectedIds={selectedIds} onToggle={toggleProvider} />
      </Field>
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-surface p-4">
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave}>
          {editing ? "Guardar cambios" : "Registrar proyecto"}
        </Button>
      </div>
    </Drawer>
  );
}
