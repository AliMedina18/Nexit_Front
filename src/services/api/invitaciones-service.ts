import { apiClient } from "@/lib/api-client";
import type {
  AceptarInvitacionInput,
  Invitacion,
  InvitacionInput,
  InvitacionLoteInput,
  InvitacionesLoteResultado,
  ImportarResultado,
  Usuario,
} from "@/types/api";

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
  /**
   * Solo super_admin. Invita a varios correos de una sola vez. Responde 200 aunque alguno
   * falle -- hay que mirar `fallidas`, no solo asumir que salió todo.
   */
  crearLote: (input: InvitacionLoteInput) => apiClient.post<InvitacionesLoteResultado>("/api/invitaciones/lote", input),
  /** La invitación pendiente para el correo de quien está autenticado. Lanza ApiError 404 si no hay ninguna. */
  mia: () => apiClient.get<Invitacion>("/api/invitaciones/mia"),
  /** Devuelve el `Usuario` recién creado (InvitacionesController.Aceptar -> UsuarioResponseDto), NO la invitación. */
  aceptar: (id: string, input: AceptarInvitacionInput) => apiClient.post<Usuario>(`/api/invitaciones/${id}/aceptar`, input),
  rechazar: (id: string) => apiClient.post<void>(`/api/invitaciones/${id}/rechazar`),
  /**
   * Solo super_admin. Cancela una invitación que sigue Pendiente (se equivocaron de correo, o la
   * persona ya no entra al equipo). Deja el correo libre para volver a invitarlo -- que es
   * justamente para lo que se cancela.
   */
  cancelar: (id: string) => apiClient.delete<void>(`/api/invitaciones/${id}`),
  /**
   * Solo super_admin. Invita a todos los correos de un .xlsx (columna "Correo", y "Rol" opcional).
   * Es lo que hace "Importar" en la pantalla de Usuarios: importar usuarios es invitarlos, no
   * crearlos. `creados` en la respuesta significa "invitaciones enviadas"; `actualizados` siempre
   * viene en 0.
   */
  importar: (archivo: File) => {
    const form = new FormData();
    form.append("archivo", archivo);
    return apiClient.postForm<ImportarResultado>("/api/invitaciones/importar", form);
  },
};
