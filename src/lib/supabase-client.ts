import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el navegador. Se usa SOLO para lo que Supabase Auth
 * maneja directamente (login con código OTP, crear/recuperar contraseña) — ver
 * docs/10-correos-autenticacion-y-guia-frontend.md del backend. Todo lo demás
 * (clientes, proveedores, proyectos, etc.) se pide siempre a la API de Nexit_Back
 * a través de src/lib/api-client.ts, nunca directo a Supabase.
 *
 * Usa la anon/public key (segura para el navegador) -- NUNCA la Service Role Key,
 * esa se queda solo en el backend.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno. " +
      "Copia .env.example a .env.local y complétalas (ver el README del backend, docs/13).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
