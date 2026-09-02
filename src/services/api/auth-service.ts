import { apiClient } from "@/lib/api-client";
import type { EstadoCuentaResponse } from "@/types/api";

/**
 * Conecta contra AuthController (Nexit_Back, docs/30). `estadoCuenta` es el
 * único endpoint público de toda la API (sin sesión) -- se usa en el login,
 * antes de que exista un token, para decidir si mostrar el paso de código
 * (primera vez) o el de contraseña (recurrente) sin que la persona tenga que
 * elegirlo a mano. Nunca revela si el correo existe: un correo inexistente y
 * uno que existe pero sin contraseña dan la misma respuesta.
 *
 * `confirmarContrasena` es best-effort: se llama justo después de que
 * Supabase confirma que la contraseña quedó guardada (crear o recuperar), y
 * si falla no debe bloquear el login -- por eso los llamadores la envuelven
 * en un try/catch silencioso.
 */
export const authApi = {
  estadoCuenta: (email: string) =>
    apiClient.get<EstadoCuentaResponse>(`/api/auth/estado-cuenta?email=${encodeURIComponent(email)}`),
  confirmarContrasena: () => apiClient.post<void>("/api/auth/confirmar-contrasena"),
};
