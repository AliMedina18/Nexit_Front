"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { invitacionesApi } from "@/services/api/invitaciones-service";
import { useUiStore } from "@/store/ui-store";
import type { Rol } from "@/types/api";

const ROLES: Rol[] = ["miembro", "manager", "admin", "super_admin"];
const ROL_LABELS: Record<Rol, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  manager: "Manager",
  miembro: "Miembro",
};

export function InviteModal({ open, onClose, onInvited }: { open: boolean; onClose: () => void; onInvited: () => void }) {
  const pushToast = useUiStore((s) => s.pushToast);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<Rol>("miembro");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function reset() {
    setEmail("");
    setRol("miembro");
    setMensaje("");
    setError(null);
  }

  async function handleSend() {
    if (!email.trim()) {
      setError("Escribe el correo de la persona a invitar.");
      return;
    }
    setSending(true);
    try {
      await invitacionesApi.create({ email: email.trim(), rol, mensaje: mensaje.trim() || null });
      pushToast("Invitación enviada", "success");
      reset();
      onInvited();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la invitación");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Invitar a alguien al equipo"
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSend} disabled={sending}>
            {sending ? "Enviando…" : "Enviar invitación"}
          </Button>
        </>
      }
    >
      <Field label="Correo" required error={error ?? undefined}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@agencianextmkt.com"
        />
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
      <Field label="Mensaje (opcional)">
        <Textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Un saludo para quien invitas…" />
      </Field>
    </Modal>
  );
}
