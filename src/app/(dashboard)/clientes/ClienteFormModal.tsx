"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { Field, Input, Row, Textarea } from "@/components/ui/form";
import type { Cliente, ClienteInput, ClienteTelefono } from "@/types/api";

interface FormState {
  nombre: string;
  sector: string;
  ciudad: string;
  direccion: string;
  web: string;
  contacto: string;
  cargoContacto: string;
  email: string;
  valorReferencia: string;
  notas: string;
  telefonos: ClienteTelefono[];
}

const emptyForm: FormState = {
  nombre: "",
  sector: "",
  ciudad: "",
  direccion: "",
  web: "",
  contacto: "",
  cargoContacto: "",
  email: "",
  valorReferencia: "",
  notas: "",
  telefonos: [],
};

export function ClienteFormModal({
  open,
  onClose,
  onSave,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: ClienteInput) => void;
  editing: Cliente | null;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form to match whichever cliente was opened for editing
      setForm({
        nombre: editing.nombre,
        sector: editing.sector ?? "",
        ciudad: editing.ciudad ?? "",
        direccion: editing.direccion ?? "",
        web: editing.web ?? "",
        contacto: editing.contacto ?? "",
        cargoContacto: editing.cargoContacto ?? "",
        email: editing.email ?? "",
        valorReferencia: editing.valorReferencia ?? "",
        notas: editing.notas ?? "",
        telefonos: editing.telefonos.length > 0 ? editing.telefonos : [],
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [open, editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addTelefono() {
    set("telefonos", [...form.telefonos, { telefono: "", etiqueta: "" }]);
  }

  function updateTelefono(idx: number, patch: Partial<ClienteTelefono>) {
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
    if (!form.nombre.trim()) nextErrors.nombre = "El nombre del cliente es requerido";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: ClienteInput = {
      nombre: form.nombre.trim(),
      sector: form.sector.trim() || null,
      ciudad: form.ciudad.trim() || null,
      direccion: form.direccion.trim() || null,
      web: form.web.trim() || null,
      contacto: form.contacto.trim() || null,
      cargoContacto: form.cargoContacto.trim() || null,
      email: form.email.trim() || null,
      valorReferencia: form.valorReferencia.trim() || null,
      notas: form.notas.trim() || null,
      telefonos: form.telefonos.filter((t) => t.telefono.trim()),
    };
    onSave(input);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar cliente" : "Nuevo cliente"}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar cliente
          </Button>
        </>
      }
    >
      <Field label="Nombre del cliente" required error={errors.nombre}>
        <Input
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder="Ej. Cámara de Comercio Bogotá"
        />
      </Field>

      <Row cols={2}>
        <Field label="Sector / industria">
          <Input value={form.sector} onChange={(e) => set("sector", e.target.value)} placeholder="Ej. Finanzas" />
        </Field>
        <Field label="Ciudad">
          <Input value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} placeholder="Ej. Bogotá" />
        </Field>
      </Row>

      <Row cols={2}>
        <Field label="Dirección">
          <Input value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Dirección" />
        </Field>
        <Field label="Sitio web">
          <Input value={form.web} onChange={(e) => set("web", e.target.value)} placeholder="https://…" />
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
            placeholder="Ej. Directora de Mercadeo"
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
        <Field label="Valor de referencia">
          <Input
            value={form.valorReferencia}
            onChange={(e) => set("valorReferencia", e.target.value)}
            placeholder="Ej. $50.000.000 / año"
          />
        </Field>
      </Row>

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
        <Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Historial, condiciones…" />
      </Field>
    </Modal>
  );
}
