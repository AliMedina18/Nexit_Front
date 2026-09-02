"use client";

import { useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "./primitives";
import { solicitudesEliminacionApi } from "@/services/api/solicitudes-eliminacion-service";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import type { TipoEntidadEliminable } from "@/types/api";

/**
 * Botón de eliminar de cliente/proveedor/proyecto -- construido 2026-08-28.
 * Un admin/super_admin sí puede eliminar directo (el backend igual lo exige,
 * ver *-service.ts de cada módulo). Cualquier otro rol nunca podía borrar
 * de verdad -- antes el botón "Eliminar" quedaba visible para todos y
 * simplemente fallaba con un 403 al hacer clic. Ahora, para ellos, el mismo
 * lugar dispara una solicitud real (SolicitudesEliminacionController, docs/23)
 * que un gerente (si aplica) y luego un admin revisan.
 */
export function DeleteOrRequestButton({
  tipoEntidad,
  entidadId,
  onDelete,
}: {
  tipoEntidad: TipoEntidadEliminable;
  entidadId: string;
  onDelete: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const pushToast = useUiStore((s) => s.pushToast);
  const [solicitando, setSolicitando] = useState(false);
  const [yaSolicitado, setYaSolicitado] = useState(false);
  const esAdmin = user?.rol === "admin" || user?.rol === "super_admin";

  if (esAdmin) {
    return (
      <Button variant="danger" icon={Trash2} onClick={onDelete}>
        Eliminar
      </Button>
    );
  }

  async function solicitar() {
    const motivo = window.prompt("¿Por qué quieres eliminar esto? (opcional)");
    setSolicitando(true);
    try {
      await solicitudesEliminacionApi.create({ tipoEntidad, entidadId, motivo: motivo || null });
      setYaSolicitado(true);
      pushToast("Solicitud de eliminación enviada", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo enviar la solicitud", "danger");
    } finally {
      setSolicitando(false);
    }
  }

  return (
    <Button variant="danger" icon={Send} onClick={solicitar} disabled={solicitando || yaSolicitado}>
      {yaSolicitado ? "Solicitud enviada" : solicitando ? "Enviando…" : "Solicitar eliminación"}
    </Button>
  );
}
