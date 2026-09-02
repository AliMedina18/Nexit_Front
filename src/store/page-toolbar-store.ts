"use client";

import { create } from "zustand";
import type { ImportarResultado } from "@/types/api";

/**
 * Acciones de la página activa que se muestran en la barra superior
 * compartida (search + notificaciones + Excel + "Nuevo X"), tal como el
 * HTML aprobado las dibuja: <header class="nx-topbar"> vive UNA sola vez en
 * el layout, y cambia lo que muestra según la pestaña activa (hasAdd/doAdd
 * en el prototipo). Antes cada página (Clientes/Proveedores/Proyectos)
 * dibujaba su propio botón "Excel" y su propio "+ Nuevo X" dentro del
 * contenido, debajo del título -- por eso no coincidía con el mockup, donde
 * esos botones viven arriba, junto al buscador. Cada página se registra acá
 * al montarse y se desregistra al desmontarse (ver el useEffect en
 * page.tsx de cada una).
 */
export interface PageToolbarConfig {
  /** Para los mensajes de ImportExportBar y el nombre del archivo ("clientes", "proveedores", "proyectos"). */
  entidad: string;
  searchPlaceholder: string;
  puedeImportar: boolean;
  onExport: () => Promise<{ blob: Blob; fileName: string }>;
  onImport: (archivo: File) => Promise<ImportarResultado>;
  onImported: () => void;
  /** Texto del botón negro, p. ej. "Nuevo cliente". */
  addLabel: string;
  onAdd: () => void;
}

interface PageToolbarState {
  config: PageToolbarConfig | null;
  setToolbar: (config: PageToolbarConfig) => void;
  clearToolbar: () => void;
}

export const usePageToolbarStore = create<PageToolbarState>((set) => ({
  config: null,
  setToolbar: (config) => set({ config }),
  clearToolbar: () => set({ config: null }),
}));
