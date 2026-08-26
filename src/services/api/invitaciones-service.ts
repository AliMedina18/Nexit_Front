import { apiClient } from "@/lib/api-client";
import type { AceptarInvitacionInput, Invitacion, InvitacionInput } from "@/types/api";

/**
 * Conecta contra InvitacionesController real (Nexit_Back). Crear/listar todas es exclusivo de
 * super_admin. Ver/aceptar/rechazar "la mía" es de cualquier autenticado -- incluso alguien que
 * todavía no tiene fila en `usuarios` (por eso se identifica por correo del JWT, no por rol).
 */
export const invitacionesApi = {
  /** Solo super_admin. */
  list: () => apiClient.get<Invitacion[]>("/api/invitaciones"),
  /** Solo super_admin. Dispara la invitación real por Supabase y la registra en un solo paso. */
  create: (input: InvitacionInput) => apiClient.post<Invitacion>("/api/invitaciones", input),
  /** La invitación pendiente para el correo de quien está autenticado. Lanza ApiError 404 si no hay ninguna. */
  mia: () => apiClient.get<Invitacion>("/api/invitaciones/mia"),
  aceptar: (id: string, input: AceptarInvitacionInput) => apiClient.post<Invitacion>(`/api/invitaciones/${id}/aceptar`, input),
  rechazar: (id: string) => apiClient.post<void>(`/api/invitaciones/${id}/rechazar`),
};
