"use client";

/**
 * Guarda/restaura los filtros de una pantalla de listado (Clientes,
 * Proveedores, Proyectos) durante la sesión del navegador (Alicia
 * 2026-09-07): "autoguardado también con lo que yo busco... cuando sí
 * estaban solo los prospectos, cosas así" -- si aplicás un filtro (buscar,
 * un estado, una vista de tabla/tarjetas) y salís de la pantalla o
 * recargás, al volver debería seguir aplicado en vez de resetearse.
 *
 * Usa sessionStorage (no localStorage): dura mientras la pestaña sigue
 * abierta, pero no se queda para siempre entre visitas de días distintos
 * -- así un filtro de hace una semana no sorprende a nadie mostrando una
 * lista "vacía" sin explicación.
 */

const PREFIX = "nexit:filtros:";

export function readFilterState<T>(key: string): Partial<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}

export function writeFilterState<T extends Record<string, unknown>>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // sessionStorage puede fallar (modo privado, cuota llena) -- no es crítico, se ignora.
  }
}
