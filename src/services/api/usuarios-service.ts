import { apiClient } from "@/lib/api-client";
import type { Usuario, UsuarioCreateInput, UsuarioEquipo, UsuarioRegistrarInput, UsuarioUpdateInput } from "@/types/api";

/**
 * Conecta contra UsuariosController real (Nexit_Back). Actualizado 2026-08-26: ya no es un módulo
 * "todo o nada" de super_admin -- tres niveles de acceso (ver `docs/06`, sección 6, en Nexit_Back):
 *  - `list` (directorio completo): admin y super_admin.
 *  - `me`/`getById` (perfil individual, solo lectura): cualquier autenticado, sin importar el rol --
 *    como mirar el perfil de un compañero en Teams. El frontend NO debe ofrecer editar/eliminar desde
 *    ahí para nadie que no sea super_admin, aunque el backend igual lo bloquearía con 403.
 *  - `create`/`update`: exclusivo de super_admin. Eliminar ya no vive acá (ver abajo). Crear un usuario acá solo registra su
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
  /**
   * Miembros de equipo buscables (agregado 2026-09-09) -- cualquier autenticado, a diferencia de
   * `list`. Ya viene filtrada a rol miembro/manager (Director) activos: la usa el selector de
   * "miembros del equipo" al armar un proyecto, pantalla a la que cualquiera con acceso a Proyectos
   * puede entrar (no solo admin/super_admin), así que no podíamos reusar `list`.
   */
  equipo: () => apiClient.get<UsuarioEquipo[]>("/api/usuarios/equipo"),
  /** Exclusivo de super_admin. */
  create: (input: UsuarioCreateInput) => apiClient.post<Usuario>("/api/usuarios", input),
  /**
   * Exclusivo de super_admin. Da de alta a alguien sin esperar a que responda un correo: crea su
   * cuenta de Supabase Auth y su perfil de una vez. Alternativa a invitar, no reemplazo.
   */
  registrar: (input: UsuarioRegistrarInput) => apiClient.post<Usuario>("/api/usuarios/registrar", input),
  /** Exclusivo de super_admin. */
  update: (id: string, input: UsuarioUpdateInput) => apiClient.put<Usuario>(`/api/usuarios/${id}`, input),
  // `remove` desapareció el 2026-09-08: ya no existe DELETE /api/usuarios/{id}. Para dar de baja a
  // alguien se crea una solicitud de eliminación con solicitudesEliminacionApi.create({ tipoEntidad:
  // "usuario", ... }) y el borrado real lo ejecuta quien la apruebe (Nexit_Back/docs/40).
  /**
   * El equipo como .xlsx -- admin/super_admin, mismo permiso que `list`. No hay un `importar`
   * simétrico acá a propósito: importar usuarios es invitarlos, y eso vive en
   * `invitacionesApi.importar` (un usuario de Nexit no puede existir sin su cuenta de Supabase Auth,
   * así que no se puede crear uno desde una fila de Excel como con clientes).
   */
  exportar: () => apiClient.getFile("/api/usuarios/exportar", "usuarios.xlsx"),
};
