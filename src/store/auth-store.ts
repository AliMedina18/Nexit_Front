"use client";

import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import { decodeJwtRole } from "@/lib/jwt";
import { usuariosApi } from "@/services/api/usuarios-service";
import { ApiError } from "@/lib/api-client";
import type { Rol } from "@/types/api";

/**
 * Perfil de sesión ya resuelto para el resto de la app (no es un DTO del
 * backend -- para eso está src/types/api.ts -- sino la forma que arma este
 * store combinando el JWT de Supabase con GET /api/usuarios/me, ver
 * buildUserFromSession/refreshProfile más abajo). Solo se usa acá, por eso
 * vive junto al store en vez de en un archivo de tipos aparte.
 */
export interface AuthUser {
  /** UUID real de Supabase Auth (session.user.id). */
  id: string;
  email: string;
  displayName: string;
  initials: string;
  /**
   * Rol de negocio. Viene de GET /api/usuarios/me apenas carga esa respuesta;
   * mientras tanto, y si esa cuenta todavía no tiene fila de negocio (recién
   * invitada, o el super_admin sembrado a mano), se usa el claim `user_role`
   * del JWT (Auth Hook de Supabase -- ver
   * Nexit_Back/docs/schema/03_auth_hook_custom_claims.sql) y
   * `displayName`/`initials` se derivan del correo como aproximación.
   */
  rol: Rol;
}

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  /** scope "local" (recomendado, docs/10 sección 2.3): solo cierra esta sesión/dispositivo. */
  logout: () => Promise<void>;
}

function buildDisplayName(email: string): { displayName: string; initials: string } {
  const namePart = email.split("@")[0]?.replace(/[._]/g, " ") ?? "Usuario";
  const displayName =
    namePart
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ") || "Usuario";
  const initials =
    displayName
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "U";
  return { displayName, initials };
}

/** Aproximación desde el correo -- se usa hasta que llegue (o si nunca llega) el perfil real de /api/usuarios/me. */
function buildUserFromSession(session: Session | null): AuthUser | null {
  const email = session?.user?.email;
  if (!session || !email) return null;
  const { displayName, initials } = buildDisplayName(email);
  const rol = (decodeJwtRole(session.access_token) ?? "miembro") as Rol;
  return { id: session.user.id, email, displayName, initials, rol };
}

/**
 * Se incrementa en cada cambio de sesión (login, logout, cambio de cuenta) para que la
 * respuesta de /api/usuarios/me de una sesión vieja no pise el estado de una más nueva si
 * llega tarde (ej. el usuario cierra sesión mientras ese fetch seguía en vuelo).
 */
let profileRequestId = 0;

/**
 * Completa el perfil aproximado (buildUserFromSession) con el nombre/apellido/iniciales/rol
 * reales de GET /api/usuarios/me (agregado 2026-08-26 -- antes UsuariosController era
 * exclusivo de super_admin y no había forma de que nadie más supiera su propio perfil).
 * Si la cuenta todavía no tiene fila de negocio (recién invitada, o el super_admin sembrado
 * a mano en Supabase) el backend responde 404 -- no es un error fatal, nos quedamos con la
 * aproximación del correo.
 */
async function refreshProfile(set: (partial: Partial<AuthState>) => void) {
  const requestId = profileRequestId;
  try {
    const perfil = await usuariosApi.me();
    if (requestId !== profileRequestId) return; // una sesión más nueva ya tomó su lugar
    const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`.trim();
    const initials =
      (perfil.iniciales && perfil.iniciales.trim()) ||
      `${perfil.nombre[0] ?? ""}${perfil.apellido[0] ?? ""}`.toUpperCase() ||
      "U";
    set({
      user: {
        id: perfil.id,
        email: perfil.email,
        displayName: nombreCompleto || perfil.email,
        initials,
        rol: perfil.rol,
      },
    });
  } catch (error) {
    if (!(error instanceof ApiError)) {
      console.error("No se pudo cargar /api/usuarios/me", error);
    }
    // 404 (sin fila de negocio todavía) u otro error de red: nos quedamos con la
    // aproximación derivada del correo que ya puso buildUserFromSession.
  }
}

/**
 * Sesión real de Supabase Auth (docs/10). El login en sí (OTP, contraseña, crear
 * contraseña) vive en src/app/login/page.tsx, hablando directo con `supabase` --
 * este store solo refleja el estado de la sesión, no la crea.
 */
export const useAuthStore = create<AuthState>((set) => {
  const handleSession = (session: Session | null) => {
    profileRequestId++;
    set({ user: buildUserFromSession(session), hydrated: true });
    if (session) void refreshProfile(set);
  };

  supabase.auth.getSession().then(({ data: { session } }) => handleSession(session));
  supabase.auth.onAuthStateChange((_event, session) => handleSession(session));

  return {
    user: null,
    hydrated: false,
    logout: async () => {
      profileRequestId++; // invalida cualquier /me en vuelo antes de que termine de cerrar sesión
      await supabase.auth.signOut({ scope: "local" });
      set({ user: null });
    },
  };
});
