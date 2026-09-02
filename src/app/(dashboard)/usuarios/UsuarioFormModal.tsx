"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { Field, Input, Select } from "@/components/ui/form";
import type { Rol, Usuario, UsuarioUpdateInput } from "@/types/api";

const ROLES: Rol[] = ["miembro", "manager", "admin", "super_admin"];
const ROL_LABELS: Record<Rol, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  manager: "Manager",
  miembro: "Miembro",
};

export function UsuarioFormModal({
  open,
  onClose,
  onSave,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (id: string, input: UsuarioUpdateInput) => void;
  editing: Usuario | null;
}) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [rol, setRol] = useState<Rol>("miembro");
  const [iniciales, setIniciales] = useState("");
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !editing) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the form to match whichever usuario was opened for editing
    setNombre(editing.nombre);
    setApellido(editing.apellido);
    setRol(editing.rol);
    setIniciales(editing.iniciales ?? "");
    setActivo(editing.activo);
    setError(null);
  }, [open, editing]);

  function handleSave() {
    if (!editing) return;
    if (!nombre.trim() || !apellido.trim()) {
      setError("Nombre y apellido son requeridos.");
      return;
    }
    onSave(editing.id, {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rol,
      iniciales: iniciales.trim() || null,
      activo,
    });
  }

  if (!editing) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Editar a ${editing.nombre}`}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <Field label="Nombre" required error={error ?? undefined}>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </Field>
      <Field label="Apellido" required>
        <Input value={apellido} onChange={(e) => setApellido(e.target.value)} />
      </Field>
      <Field label="Iniciales">
        <Input value={iniciales} onChange={(e) => setIniciales(e.target.value)} placeholder="Ej. LR" maxLength={3} />
      </Field>
      <Field label="Rol">
        <Select value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROL_LABELS[r]}
            </option>
          ))}
        </Select>
      </Field>
      <label className="flex cursor-pointer items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="h-[15px] w-[15px] cursor-pointer accent-teal-mid"
        />
        Cuenta activa
      </label>
    </Modal>
  );
}
