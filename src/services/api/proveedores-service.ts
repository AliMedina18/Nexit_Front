import { apiClient } from "@/lib/api-client";
import type { ImportarResultado, Proveedor, ProveedorInput, ProveedorPrioridad } from "@/types/api";

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
  /** Descarga todos los proveedores como .xlsx (docs/31) -- úsalo con downloadBlob(). El mismo formato sirve como plantilla para importar. */
  exportar: () => apiClient.getFile("/api/proveedores/exportar", "proveedores.xlsx"),
  /** Carga masiva desde .xlsx (docs/31, requiere admin/super_admin) -- País/Ciudad/Categoría se resuelven por nombre contra Catálogos. */
  importar: (archivo: File) => {
    const form = new FormData();
    form.append("archivo", archivo);
    return apiClient.postForm<ImportarResultado>("/api/proveedores/importar", form);
  },
};
