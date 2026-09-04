import { apiClient } from "@/lib/api-client";
import type { ClienteAdjunto, ClienteAdjuntoInput } from "@/types/api";

/**
 * Adjuntos de cliente -- mismo contrato que ProveedorAdjuntosController (docs/28, HU-13),
 * espejado a /api/clientes/{id}/adjuntos. El backend todavía no lo expone (2026-09-03);
 * esto queda listo para conectar en cuanto exista el endpoint del lado del servidor.
 */
export const clienteAdjuntosApi = {
  list: (clienteId: string) => apiClient.get<ClienteAdjunto[]>(`/api/clientes/${clienteId}/adjuntos`),

  /** Adjunto tipo "link" (URL externa) -- no sube ningún archivo. */
  crearLink: (clienteId: string, input: ClienteAdjuntoInput) =>
    apiClient.post<ClienteAdjunto>(`/api/clientes/${clienteId}/adjuntos`, input),

  /** Sube un archivo real (.pdf/.xlsx/.xls, máx. 20 MB) a Supabase Storage. */
  subirArchivo: (clienteId: string, archivo: File) => {
    const form = new FormData();
    form.append("archivo", archivo);
    return apiClient.postForm<ClienteAdjunto>(`/api/clientes/${clienteId}/adjuntos/subir`, form);
  },

  /** Devuelve la URL para descargar (firmada y temporal si es un archivo real) -- ábrela directo, no la guardes. */
  obtenerUrlDescarga: (clienteId: string, adjuntoId: string) =>
    apiClient.get<{ url: string }>(`/api/clientes/${clienteId}/adjuntos/${adjuntoId}/descargar`),

  remove: (clienteId: string, adjuntoId: string) =>
    apiClient.delete<void>(`/api/clientes/${clienteId}/adjuntos/${adjuntoId}`),
};
