"use client";

import { create } from "zustand";
import { proyectosApi } from "@/services/api/proyectos-service";
import type { Proyecto, ProyectoInput } from "@/types/api";

/** Store de Proyectos, contra proyectosApi (Nexit_Back real). */
interface ProjectsState {
  items: Proyecto[];
  loading: boolean;
  loaded: boolean;
  /** Mensaje del último fetchAll que falló, o null. La pantalla lo usa para mostrar un estado de error con botón "Reintentar" en vez de una lista vacía engañosa. */
  error: string | null;
  fetchAll: () => Promise<void>;
  /** Fuerza un fetchAll nuevo aunque ya esté `loaded` -- para después de una importación masiva (docs/31), que crea filas por fuera de add/update/remove. */
  refresh: () => Promise<void>;
  addProject: (input: ProyectoInput) => Promise<Proyecto>;
  updateProject: (id: string, input: ProyectoInput) => Promise<Proyecto>;
  removeProject: (id: string) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,
  fetchAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      const items = await proyectosApi.list();
      set({ items, loading: false, loaded: true });
    } catch (err) {
      // `loaded` se queda en false a propósito: sin esto, un fetchAll que
      // falla (backend caído, red, token vencido) deja loading en true para
      // siempre -- la guarda de arriba nunca vuelve a intentar y la pantalla
      // queda pegada en "cargando" sin aviso ni forma de reintentar.
      set({ loading: false, error: err instanceof Error ? err.message : "No se pudieron cargar los proyectos." });
    }
  },
  refresh: async () => {
    set({ loaded: false });
    await get().fetchAll();
  },
  addProject: async (input) => {
    const created = await proyectosApi.create(input);
    set((state) => ({ items: [...state.items, created] }));
    return created;
  },
  updateProject: async (id, input) => {
    const updated = await proyectosApi.update(id, input);
    set((state) => ({ items: state.items.map((p) => (p.id === id ? updated : p)) }));
    return updated;
  },
  removeProject: async (id) => {
    await proyectosApi.remove(id);
    set((state) => ({ items: state.items.filter((p) => p.id !== id) }));
  },
}));
