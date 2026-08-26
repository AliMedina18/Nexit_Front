import { apiClient } from "@/lib/api-client";
import type { RevisionSolicitudInput, SolicitudEliminacion, SolicitudEliminacionInput } from "@/types/api";

/**
 * Conecta contra SolicitudesEliminacionController real (Nexit_Back). Un gerente/miembro nunca
 * elimina directo un cliente/proveedor/proyecto -- lo solicita acá. Si es un proyecto con gerente
 * responsable distinto de quien solicita, ese gerente la endosa primero; de ahí (o directo) pasa
 * a un admin/super_admin para la decisión final, que sí ejecuta el borrado real.
 */
export const solicitudesEliminacionApi = {
  create: (input: SolicitudEliminacionInput) => apiClient.post<SolicitudEliminacion>("/api/solicitudeseliminacion", input),
  /** Todas las solicitudes -- solo admin/super_admin. */
  list: () => apiClient.get<SolicitudEliminacion[]>("/api/solicitudeseliminacion"),
  /** Solicitudes de proyecto donde el usuario actual es el gerente responsable y falta su endoso. */
  pendientesParaMi: () => apiClient.get<SolicitudEliminacion[]>("/api/solicitudeseliminacion/pendientes-para-mi"),
  getById: (id: string) => apiClient.get<SolicitudEliminacion>(`/api/solicitudeseliminacion/${id}`),
  aprobarComoGerente: (id: string) => apiClient.put<SolicitudEliminacion>(`/api/solicitudeseliminacion/${id}/aprobar-gerente`),
  rechazarComoGerente: (id: string, input: RevisionSolicitudInput) =>
    apiClient.put<SolicitudEliminacion>(`/api/solicitudeseliminacion/${id}/rechazar-gerente`, input),
  /** Decisión final -- solo admin/super_admin. Aprobar SÍ borra la entidad de verdad. */
  aprobarComoAdmin: (id: string, input: RevisionSolicitudInput) =>
    apiClient.put<SolicitudEliminacion>(`/api/solicitudeseliminacion/${id}/aprobar`, input),
  rechazarComoAdmin: (id: string, input: RevisionSolicitudInput) =>
    apiClient.put<SolicitudEliminacion>(`/api/solicitudeseliminacion/${id}/rechazar`, input),
};
