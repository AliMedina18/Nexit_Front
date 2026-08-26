import { apiClient } from "@/lib/api-client";
import type { HistorialCambio, TipoEntidadHistorial } from "@/types/api";

/** Conecta contra HistorialController real (Nexit_Back). Cualquier autenticado puede consultarlo. */
export const historialApi = {
  porEntidad: (tipoEntidad: TipoEntidadHistorial, entidadId: string) =>
    apiClient.get<HistorialCambio[]>(`/api/historial/${tipoEntidad}/${entidadId}`),
};
