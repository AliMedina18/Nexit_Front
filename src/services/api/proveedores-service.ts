import { apiClient } from "@/lib/api-client";
import type { Proveedor, ProveedorInput, ProveedorPrioridad } from "@/types/api";

/** Conecta contra ProveedoresController real (Nexit_Back). DELETE requiere admin/super_admin. */
export const proveedoresApi = {
  list: () => apiClient.get<Proveedor[]>("/api/proveedores"),
  getById: (id: string) => apiClient.get<Proveedor>(`/api/proveedores/${id}`),
  /** Proveedores en los que el usuario actual está marcado como colaborador. */
  misProveedores: () => apiClient.get<Proveedor[]>("/api/proveedores/mios"),
  /** "A qué proveedor prestarle atención" (docs/21, docs/24). */
  prioridad: () => apiClient.get<ProveedorPrioridad[]>("/api/proveedores/prioridad"),
  create: (input: ProveedorInput) => apiClient.post<Proveedor>("/api/proveedores", input),
  update: (id: string, input: ProveedorInput) => apiClient.put<Proveedor>(`/api/proveedores/${id}`, { ...input, id }),
  remove: (id: string) => apiClient.delete<void>(`/api/proveedores/${id}`),
  /** "Estoy trabajando con este proveedor" (docs/19) -- cada quien se marca a sí mismo. */
  marcarColaborador: (id: string) => apiClient.post<void>(`/api/proveedores/${id}/colaboradores`),
  quitarColaborador: (id: string) => apiClient.delete<void>(`/api/proveedores/${id}/colaboradores`),
};
