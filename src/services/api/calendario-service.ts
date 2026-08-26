import { apiClient } from "@/lib/api-client";
import type { CalendarioAnio, ProyectoCalendarioItem } from "@/types/api";

/** Conecta contra CalendarioController real (Nexit_Back). Cualquier autenticado puede verlo. */
export const calendarioApi = {
  /** Años que tienen al menos un proyecto (para el selector de año). */
  anios: () => apiClient.get<number[]>("/api/calendario/anios"),
  /** Conteo por mes de un año -- para pintar la grilla sin cargar proyectos completos. */
  resumenAnio: (anio: number) => apiClient.get<CalendarioAnio>(`/api/calendario/${anio}`),
  /** Proyectos de un mes específico -- pedir solo cuando alguien entra a verlo. */
  proyectosDelMes: (anio: number, mes: number) =>
    apiClient.get<ProyectoCalendarioItem[]>(`/api/calendario/${anio}/${mes}`),
};
