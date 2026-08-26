/**
 * Decodifica (sin verificar firma -- no hace falta, el navegador no puede falsificar
 * un JWT que ya firmó Supabase y que se está usando tal cual en el Authorization header)
 * el payload de un JWT para leer el claim `user_role` que agrega el Auth Hook de
 * Supabase (ver Nexit_Back/docs/schema/03_auth_hook_custom_claims.sql).
 */
export function decodeJwtRole(accessToken: string): string | null {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { user_role?: string; app_role?: string };
    return claims.user_role ?? claims.app_role ?? null;
  } catch {
    return null;
  }
}
