"use client";

import type { LucideIcon } from "lucide-react";
import { create } from "zustand";
import type { ImportExportTextos } from "@/components/ui/ImportExportBar";
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
  /** Solo si esta sección necesita cambiar los textos de la barra de Excel -- ver ImportExportBar. */
  textos?: ImportExportTextos;
  /**
   * Texto del botón negro, p. ej. "Nuevo cliente". Opcional desde 2026-09-08: Usuarios usa la barra
   * de Excel pero su acción principal ("Invitar") no vive arriba sino en el encabezado de la sección
   * de invitaciones pendientes, que es donde tiene sentido (Alicia: "el botón invitar arriba de
   * invitaciones pendientes"). Sin `addLabel`/`onAdd`, la barra superior solo muestra Excel.
   */
  addLabel?: string;
  /** Ícono del botón negro. Sin esto usa el "+" de siempre; Usuarios pasa uno de persona. */
  addIcon?: LucideIcon;
  onAdd?: () => void;
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
