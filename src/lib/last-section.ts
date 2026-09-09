"use client";

/**
 * Recuerda la última sección del dashboard que se visitó (Alicia
 * 2026-09-07): antes, tanto al entrar a "/" como justo después de iniciar
 * sesión, la app siempre mandaba a Proveedores sin importar cuál se usa
 * más -- "yo siempre voy primero a Clientes, no a Proveedores". Ahora se
 * guarda la última sección visitada (dashboard/layout.tsx la actualiza en
 * cada cambio de pantalla) y se usa como destino; si todavía no hay
 * ninguna guardada (primera vez), el destino por default es Clientes.
 */

const KEY = "nexit:lastSection";
const DEFAULT_SECTION = "/clientes";

export function rememberSection(pathname: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, pathname);
  } catch {
    // localStorage puede fallar (modo privado, cuota llena) -- no es crítico, se ignora.
  }
}

export function getLastSection(): string {
  if (typeof window === "undefined") return DEFAULT_SECTION;
  try {
    return window.localStorage.getItem(KEY) || DEFAULT_SECTION;
  } catch {
    return DEFAULT_SECTION;
  }
}
