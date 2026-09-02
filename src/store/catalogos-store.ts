"use client";

import { create } from "zustand";
import { catalogosApi } from "@/services/api/catalogos-service";
import type { Ciudad, EstadoProyecto, FaseProyecto, ItemCatalogo, Pais, Region } from "@/types/api";

/**
 * Catálogos compartidos (países, categorías de proveedor, servicios) --
 * construido 2026-08-28 junto con el rediseño de Proveedores/Proyectos, que
 * son los primeros módulos en usar los catálogos reales de Nexit_Back en vez
 * de la tabla estática GEO/PROVIDER_CATEGORIES de la maqueta. Regiones y
 * ciudades se piden bajo demanda (dependen de país/región) y se cachean acá
 * mismo para no repetir la llamada cada vez que se abre un formulario.
 */
interface CatalogosState {
  paises: Pais[];
  categoriasProveedor: ItemCatalogo[];
  servicios: ItemCatalogo[];
  estadosProyecto: EstadoProyecto[];
  fasesProyecto: FaseProyecto[];
  regionesPorPais: Record<string, Region[]>;
  ciudadesPorRegion: Record<string, Ciudad[]>;
  loaded: boolean;
  loading: boolean;
  /** Mensaje del último fetchBase que falló, o null. */
  error: string | null;
  fetchBase: () => Promise<void>;
  fetchRegiones: (paisId: string) => Promise<Region[]>;
  fetchCiudades: (regionId: string) => Promise<Ciudad[]>;
}

export const useCatalogosStore = create<CatalogosState>((set, get) => ({
  paises: [],
  categoriasProveedor: [],
  servicios: [],
  estadosProyecto: [],
  fasesProyecto: [],
  regionesPorPais: {},
  ciudadesPorRegion: {},
  loaded: false,
  loading: false,
  error: null,
  fetchBase: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      const [paises, categoriasProveedor, servicios, estadosProyecto, fasesProyecto] = await Promise.all([
        catalogosApi.paises.list(),
        catalogosApi.categoriasProveedor.list(),
        catalogosApi.servicios.list(),
        catalogosApi.estadosProyecto.list(),
        catalogosApi.fasesProyecto.list(),
      ]);
      set({ paises, categoriasProveedor, servicios, estadosProyecto, fasesProyecto, loading: false, loaded: true });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : "No se pudieron cargar los catálogos." });
    }
  },
  fetchRegiones: async (paisId) => {
    const cached = get().regionesPorPais[paisId];
    if (cached) return cached;
    const regiones = await catalogosApi.regiones.list(paisId);
    set((state) => ({ regionesPorPais: { ...state.regionesPorPais, [paisId]: regiones } }));
    return regiones;
  },
  fetchCiudades: async (regionId) => {
    const cached = get().ciudadesPorRegion[regionId];
    if (cached) return cached;
    const ciudades = await catalogosApi.ciudades.list(regionId);
    set((state) => ({ ciudadesPorRegion: { ...state.ciudadesPorRegion, [regionId]: ciudades } }));
    return ciudades;
  },
}));
