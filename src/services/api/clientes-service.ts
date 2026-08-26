import { apiClient } from "@/lib/api-client";
import type { Cliente, ClienteInput, ClientePrioridad } from "@/types/api";

/**
 * Conecta contra ClientesController real (Nexit_Back). GET/POST no requieren
 * rol especial (cualquier autenticado); DELETE requiere admin/super_admin
 * (el backend lo rechaza con 403 si no -- no se replica esa regla acá).
 */
export const clientesApi = {
  list: () => apiClient.get<Cliente[]>("/api/clientes"),
  getById: (id: string) => apiClient.get<Cliente>(`/api/clientes/${id}`),
  /** "A qué cliente prestarle atención" (docs/21, docs/24) -- puntuado, con las razones de cada puntaje. */
  prioridad: () => apiClient.get<ClientePrioridad[]>("/api/clientes/prioridad"),
  create: (input: ClienteInput) => apiClient.post<Cliente>("/api/clientes", input),
  update: (id: string, input: ClienteInput) => apiClient.put<Cliente>(`/api/clientes/${id}`, { ...input, id }),
  remove: (id: string) => apiClient.delete<void>(`/api/clientes/${id}`),
};
