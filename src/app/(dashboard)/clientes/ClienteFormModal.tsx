"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Drawer, DrawerCloseButton } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/primitives";
import { Field, FormSection, Input, Row, Textarea } from "@/components/ui/form";
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
    <Drawer open={open} onClose={onClose}>
      <div className="sticky top-0 z-[1] flex items-start justify-between gap-3.5 border-b border-border bg-surface p-5">
        <div className="min-w-0">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">
            {editing ? "EDITAR CLIENTE" : "REGISTRAR CLIENTE"}
          </div>
          <h2 className="truncate text-[19px] font-semibold leading-tight">
            {editing ? "Editar datos del cliente" : "Datos del nuevo cliente"}
          </h2>
        </div>
        <DrawerCloseButton onClose={onClose} />
      </div>

      <div className="flex-1 p-5">
        <FormSection n="01" title="Quién es" />
        <Field label="Nombre de la empresa" required error={errors.nombre}>
          <Input
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Ej. Grupo Vitalis"
          />
        </Field>
        <Field label="Industria">
          <Input value={form.sector} onChange={(e) => set("sector", e.target.value)} placeholder="Consumo masivo, tecnología, finanzas…" />
        </Field>

        <FormSection n="02" title="Dónde está" />
        <Row cols={2}>
          <Field label="Ciudad">
            <Input value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} placeholder="Ej. Bogotá" />
          </Field>
          <Field label="Dirección">
            <Input value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Dirección" />
          </Field>
        </Row>
        <Field label="Sitio web">
          <Input value={form.web} onChange={(e) => set("web", e.target.value)} placeholder="https://…" />
        </Field>

        <FormSection n="03" title="Con quién se habla" />
        <Row cols={2}>
          <Field label="Persona de contacto">
            <Input value={form.contacto} onChange={(e) => set("contacto", e.target.value)} placeholder="Nombre y apellido" />
          </Field>
          <Field label="Cargo">
            <Input
              value={form.cargoContacto}
              onChange={(e) => set("cargoContacto", e.target.value)}
              placeholder="Ej. Gerente de Marketing"
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
                  placeholder="+57 300 000 0000"
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
        <Field label="Correo">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="nombre@empresa.com"
          />
        </Field>

        <FormSection n="04" title="Qué recordar" />
        <Field label="Valor de referencia">
          <Input
            value={form.valorReferencia}
            onChange={(e) => set("valorReferencia", e.target.value)}
            placeholder="Ej. $50.000.000 / año"
          />
        </Field>
        <Field label="Notas internas">
          <Textarea value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Historial, condiciones…" />
        </Field>
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-surface p-4">
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave}>
          {editing ? "Guardar cambios" : "Registrar cliente"}
        </Button>
      </div>
    </Drawer>
  );
}
