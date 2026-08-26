import { apiClient } from "@/lib/api-client";
import type { ProveedorAdjunto, ProveedorAdjuntoInput } from "@/types/api";

/**
 * Conecta contra ProveedorAdjuntosController real (docs/28, HU-13): adjuntos
 * tipo "link" (POST normal) o archivo real subido a Supabase Storage
 * (POST multipart, PDF/Excel, máximo 20 MB). DELETE requiere admin/super_admin.
 */
export const proveedorAdjuntosApi = {
  list: (proveedorId: string) => apiClient.get<ProveedorAdjunto[]>(`/api/proveedores/${proveedorId}/adjuntos`),

  /** Adjunto tipo "link" (URL externa) -- no sube ningún archivo. */
  crearLink: (proveedorId: string, input: ProveedorAdjuntoInput) =>
    apiClient.post<ProveedorAdjunto>(`/api/proveedores/${proveedorId}/adjuntos`, input),

  /** Sube un archivo real (.pdf/.xlsx/.xls, máx. 20 MB) a Supabase Storage. */
  subirArchivo: (proveedorId: string, archivo: File) => {
    const form = new FormData();
    form.append("archivo", archivo);
    return apiClient.postForm<ProveedorAdjunto>(`/api/proveedores/${proveedorId}/adjuntos/subir`, form);
  },

  /** Devuelve la URL para descargar (firmada y temporal si es un archivo real) -- ábrela directo, no la guardes. */
  obtenerUrlDescarga: (proveedorId: string, adjuntoId: string) =>
    apiClient.get<{ url: string }>(`/api/proveedores/${proveedorId}/adjuntos/${adjuntoId}/descargar`),

  remove: (proveedorId: string, adjuntoId: string) =>
    apiClient.delete<void>(`/api/proveedores/${proveedorId}/adjuntos/${adjuntoId}`),
};
