import { apiClient } from "@/lib/api-client";
import type { PresenciaUsuario } from "@/types/api";

/**
 * Conecta contra PresenciaController real (HU-12, docs/29). `ping` lo llama cualquier autenticado
 * cada 45-60s mientras haya una sesión abierta (idealmente con la Page Visibility API, para no
 * pingear con la pestaña en segundo plano); `directorio` (el listado completo) es solo admin/super_admin.
 */
export const presenciaApi = {
  ping: () => apiClient.post<void>("/api/presencia/ping"),
  directorio: () => apiClient.get<PresenciaUsuario[]>("/api/presencia"),
};
