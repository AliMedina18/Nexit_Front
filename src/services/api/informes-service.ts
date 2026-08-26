import { apiClient } from "@/lib/api-client";
import type { CrearInformeSnapshotInput, InformeResumen, InformeSnapshot } from "@/types/api";

/** Conecta contra InformesController real (Nexit_Back). TODO el módulo requiere admin/super_admin. */
export const informesApi = {
  resumen: () => apiClient.get<InformeResumen>("/api/informes/resumen"),
  /** Devuelve el .xlsx como Blob -- úsalo con downloadBlob() de src/lib/download-file.ts. */
  exportarResumen: () => apiClient.getFile("/api/informes/resumen/exportar", "informe-general.xlsx"),
  snapshot: (tipo: string, periodoKey: string) => apiClient.get<InformeSnapshot>(`/api/informes/snapshots/${tipo}/${periodoKey}`),
  exportarSnapshot: (tipo: string, periodoKey: string) =>
    apiClient.getFile(`/api/informes/snapshots/${tipo}/${periodoKey}/exportar`, `informe-${tipo}-${periodoKey}.xlsx`),
  crearSnapshot: (input: CrearInformeSnapshotInput) => apiClient.post<InformeSnapshot>("/api/informes/snapshots", input),
};
