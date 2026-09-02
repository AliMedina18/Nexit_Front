import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase-proxy";

/**
 * Proxy -- nombre que le da Next.js 16 a lo que en versiones anteriores era
 * `middleware.ts` (misma función, ver
 * node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md: "Starting
 * with Next.js 16, Middleware is now called Proxy to better reflect its
 * purpose. The functionality remains the same."). Corre en cada request,
 * antes de que se sirva cualquier página -- ver supabase-proxy.ts para toda
 * la lógica real de qué rutas exigen sesión.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // No corre sobre los archivos internos de Next ni sobre archivos
  // estáticos (logo.png, favicon.ico, etc.) -- si esos quedaran adentro del
  // matcher, alguien sin sesión ni siquiera podría cargar el logo de la
  // pantalla de login. Sí corre, a propósito, sobre todo lo demás.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
