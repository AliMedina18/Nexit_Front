import { apiClient } from "@/lib/api-client";
import type { ProyectoAdjunto, ProyectoAdjuntoInput } from "@/types/api";

/**
 * Adjuntos de proyecto -- mismo contrato que ProveedorAdjuntosController (docs/28, HU-13),
 * espejado a /api/proyectos/{id}/adjuntos. El backend todavía no lo expone (2026-09-03);
 * esto queda listo para conectar en cuanto exista el endpoint del lado del servidor.
 */
export const proyectoAdjuntosApi = {
  list: (proyectoId: string) => apiClient.get<ProyectoAdjunto[]>(`/api/proyectos/${proyectoId}/adjuntos`),

  /** Adjunto tipo "link" (URL externa) -- no sube ningún archivo. */
  crearLink: (proyectoId: string, input: ProyectoAdjuntoInput) =>
    apiClient.post<ProyectoAdjunto>(`/api/proyectos/${proyectoId}/adjuntos`, input),

  /** Sube un archivo real (.pdf/.xlsx/.xls, máx. 20 MB) a Supabase Storage. */
  subirArchivo: (proyectoId: string, archivo: File) => {
    const form = new FormData();
    form.append("archivo", archivo);
    return apiClient.postForm<ProyectoAdjunto>(`/api/proyectos/${proyectoId}/adjuntos/subir`, form);
  },

  /** Devuelve la URL para descargar (firmada y temporal si es un archivo real) -- ábrela directo, no la guardes. */
  obtenerUrlDescarga: (proyectoId: string, adjuntoId: string) =>
    apiClient.get<{ url: string }>(`/api/proyectos/${proyectoId}/adjuntos/${adjuntoId}/descargar`),

  remove: (proyectoId: string, adjuntoId: string) =>
    apiClient.delete<void>(`/api/proyectos/${proyectoId}/adjuntos/${adjuntoId}`),
};
