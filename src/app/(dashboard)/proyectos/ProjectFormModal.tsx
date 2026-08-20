"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { Field, FieldGroup, Input, Row, Select, Textarea } from "@/components/ui/form";
import { BRIEF_STATUSES, PROJECT_STATUS_GROUPS } from "@/types/domain";
import type { BriefStatus, Project, ProjectInput, ProjectStatus, Provider } from "@/types/domain";
import { ProviderPicker } from "./ProviderPicker";

const emptyForm = {
  nombre: "",
  cliente: "",
  contacto: "",
  ejecutivo: "",
  disenador3d: "",
  disenadorgrafico: "",
  fecha: "",
  estado: "Planeación interna" as ProjectStatus,
  briefEstado: "Pendiente por enviar" as BriefStatus,
  notas: "",
};

type FormState = typeof emptyForm;

export function ProjectFormModal({
  open,
  onClose,
  onSave,
  editing,
  providers,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: ProjectInput) => void;
  editing: Project | null;
  providers: Provider[];
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form to match whichever project was opened for editing
      setForm({
        nombre: editing.nombre,
        cliente: editing.cliente,
        contacto: editing.contacto,
        ejecutivo: editing.ejecutivo,
        disenador3d: editing.disenador3d,
        disenadorgrafico: editing.disenadorgrafico,
        fecha: editing.fecha,
        estado: editing.estado,
        briefEstado: editing.briefEstado,
        notas: editing.notas,
      });
      setSelectedIds(new Set(editing.proveedorIds));
    } else {
      setForm(emptyForm);
      setSelectedIds(new Set());
    }
    setErrors({});
  }, [open, editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleProvider(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!form.nombre.trim()) nextErrors.nombre = "El nombre del proyecto es requerido";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: ProjectInput = { ...form, proveedorIds: [...selectedIds] };
    onSave(input);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar proyecto" : "Nuevo proyecto"}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar proyecto
          </Button>
        </>
      }
    >
      <Field label="Nombre del proyecto" required error={errors.nombre}>
        <Input
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder="Lanzamiento Marca X, Activación Ciudad Y…"
        />
      </Field>

      <Row cols={2}>
        <Field label="Nombre del cliente">
          <Input value={form.cliente} onChange={(e) => set("cliente", e.target.value)} placeholder="Nombre del cliente" />
        </Field>
        <Field label="Contacto">
          <Input
            value={form.contacto}
            onChange={(e) => set("contacto", e.target.value)}
            placeholder="Nombre del contacto en el cliente"
          />
        </Field>
      </Row>

      <Field label="Fecha del evento">
        <Input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} />
      </Field>

      <FieldGroup title="👥 Equipo del proyecto">
        <Field label="Ejecutivo encargado">
          <Input
            value={form.ejecutivo}
            onChange={(e) => set("ejecutivo", e.target.value)}
            placeholder="Nombre de quien lidera el proyecto"
          />
        </Field>
        <Field label="Diseñador 3D encargado">
          <Input
            value={form.disenador3d}
            onChange={(e) => set("disenador3d", e.target.value)}
            placeholder="Nombre del diseñador 3D"
          />
        </Field>
        <Field label="Diseñador gráfico encargado">
          <Input
            value={form.disenadorgrafico}
            onChange={(e) => set("disenadorgrafico", e.target.value)}
            placeholder="Nombre del diseñador gráfico"
          />
        </Field>
      </FieldGroup>

      <Row cols={2}>
        <Field label="Estado">
          <Select value={form.estado} onChange={(e) => set("estado", e.target.value as ProjectStatus)}>
            {PROJECT_STATUS_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Field label="Estado de entrega de brief">
          <Select value={form.briefEstado} onChange={(e) => set("briefEstado", e.target.value as BriefStatus)}>
            {BRIEF_STATUSES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Select>
        </Field>
      </Row>

      <Field label="Notas">
        <Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Detalles, alcance, condiciones…" />
      </Field>

      <Field label="Proveedores trabajando en este proyecto">
        <ProviderPicker providers={providers} selectedIds={selectedIds} onToggle={toggleProvider} />
      </Field>
    </Modal>
  );
}
