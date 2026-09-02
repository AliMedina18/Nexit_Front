import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador. Se usa SOLO para lo que Supabase Auth
 * maneja directamente (login con código OTP, crear/recuperar contraseña) — ver
 * docs/10-correos-autenticacion-y-guia-frontend.md del backend. Todo lo demás
 * (clientes, proveedores, proyectos, etc.) se pide siempre a la API de Nexit_Back
 * a través de src/lib/api-client.ts, nunca directo a Supabase.
 *
 * Usa la anon/public key (segura para el navegador) -- NUNCA la Service Role Key,
 * esa se queda solo en el backend.
 *
 * `createBrowserClient` (de `@supabase/ssr`, no `createClient` de
 * `@supabase/supabase-js` a secas) guarda la sesión en cookies en vez de
 * `localStorage` -- mismo cliente, misma API (`auth.getSession()`,
 * `auth.onAuthStateChange()`, etc., nada más de este archivo cambia), pero
 * ahora el servidor también puede leerla. Eso es lo que permite que
 * `src/proxy.ts` (docs/31, "quién puede entrar a cada ruta") corra la
 * verificación de sesión ANTES de servir una página protegida, en vez de
 * confiar solo en un `if (!user) return null` del lado del navegador.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno. " +
      "Copia .env.example a .env.local y complétalas (ver el README del backend, docs/13).",
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
