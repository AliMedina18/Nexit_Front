import { apiClient } from "@/lib/api-client";
import type { Usuario, UsuarioCreateInput, UsuarioUpdateInput } from "@/types/api";

/**
 * Conecta contra UsuariosController real (Nexit_Back). Actualizado 2026-08-26: ya no es un módulo
 * "todo o nada" de super_admin -- tres niveles de acceso (ver `docs/06`, sección 6, en Nexit_Back):
 *  - `list` (directorio completo): admin y super_admin.
 *  - `me`/`getById` (perfil individual, solo lectura): cualquier autenticado, sin importar el rol --
 *    como mirar el perfil de un compañero en Teams. El frontend NO debe ofrecer editar/eliminar desde
 *    ahí para nadie que no sea super_admin, aunque el backend igual lo bloquearía con 403.
 *  - `create`/`update`/`remove`: exclusivo de super_admin. Crear un usuario acá solo registra su
 *    perfil de negocio: la cuenta de acceso (correo/contraseña) se invita antes desde Supabase Auth,
 *    y el `id` que se manda es el UUID que Supabase ya le asignó a esa cuenta.
 */
export const usuariosApi = {
  /** Perfil propio -- cualquier autenticado (agregado 2026-08-26). */
  me: () => apiClient.get<Usuario>("/api/usuarios/me"),
  /** Directorio completo -- admin/super_admin (agregado a esta política 2026-08-26; antes era solo super_admin). */
  list: () => apiClient.get<Usuario[]>("/api/usuarios"),
  /** Perfil de otra persona, solo lectura -- cualquier autenticado (agregado 2026-08-26). */
  getById: (id: string) => apiClient.get<Usuario>(`/api/usuarios/${id}`),
  /** Exclusivo de super_admin. */
  create: (input: UsuarioCreateInput) => apiClient.post<Usuario>("/api/usuarios", input),
  /** Exclusivo de super_admin. */
  update: (id: string, input: UsuarioUpdateInput) => apiClient.put<Usuario>(`/api/usuarios/${id}`, input),
  /** Exclusivo de super_admin. */
  remove: (id: string) => apiClient.delete<void>(`/api/usuarios/${id}`),
};
