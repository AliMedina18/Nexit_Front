"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { Badge, Button, StatCard, Tag } from "@/components/ui/primitives";
import { invitacionesApi } from "@/services/api/invitaciones-service";
import { presenciaApi } from "@/services/api/presencia-service";
import { solicitudesEliminacionApi } from "@/services/api/solicitudes-eliminacion-service";
import { usuariosApi } from "@/services/api/usuarios-service";
import { useAuthStore } from "@/store/auth-store";
import { useClientesStore } from "@/store/clientes-store";
import { useProjectsStore } from "@/store/projects-store";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
import type {
  Invitacion,
  PresenciaUsuario,
  Rol,
  SolicitudEliminacion,
  TipoEntidadEliminable,
  Usuario,
  UsuarioUpdateInput,
} from "@/types/api";
import { InviteModal } from "./InviteModal";
import { UsuarioFormModal } from "./UsuarioFormModal";
import styles from "@/styles/dashboard.module.css";

const ROL_LABELS: Record<Rol, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  manager: "Manager",
  miembro: "Miembro",
};

const ENTIDAD_LABELS: Record<TipoEntidadEliminable, string> = {
  cliente: "Cliente",
  proveedor: "Proveedor",
  proyecto: "Proyecto",
};

export default function UsuariosPage() {
  const authUser = useAuthStore((s) => s.user);
  const pushToast = useUiStore((s) => s.pushToast);
  const { items: clientes, fetchAll: fetchClientes } = useClientesStore();
  const { items: providers, fetchAll: fetchProviders } = useProvidersStore();
  const { items: projects, fetchAll: fetchProjects } = useProjectsStore();

  const esAdmin = authUser?.rol === "admin" || authUser?.rol === "super_admin";
  const esSuperAdmin = authUser?.rol === "super_admin";

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [presencia, setPresencia] = useState<PresenciaUsuario[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudEliminacion[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    if (!esAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [usuariosRes, presenciaRes] = await Promise.all([usuariosApi.list(), presenciaApi.directorio()]);
      setUsuarios(usuariosRes);
      setPresencia(presenciaRes);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo cargar el equipo", "danger");
    }
    try {
      setSolicitudes(await solicitudesEliminacionApi.list());
    } catch {
      setSolicitudes([]);
    }
    if (esSuperAdmin) {
      try {
        setInvitaciones(await invitacionesApi.list());
      } catch {
        setInvitaciones([]);
      }
    }
    setLoading(false);
  }, [esAdmin, esSuperAdmin, pushToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount (equipo/presencia/solicitudes/invitaciones)
    load();
    fetchClientes();
    fetchProviders();
    fetchProjects();
  }, [load, fetchClientes, fetchProviders, fetchProjects]);

  const enLineaPorId = useMemo(() => Object.fromEntries(presencia.map((p) => [p.id, p.enLinea])), [presencia]);

  const stats = useMemo(() => {
    const miembros = usuarios.length;
    const conectados = presencia.filter((p) => p.enLinea).length;
    const administradores = usuarios.filter((u) => u.rol === "admin" || u.rol === "super_admin").length;
    const pendientes = invitaciones.filter((i) => !i.fechaRespuesta).length;
    return { miembros, conectados, administradores, pendientes };
  }, [usuarios, presencia, invitaciones]);

  function entidadNombre(tipo: TipoEntidadEliminable, id: string): string {
    if (tipo === "cliente") return clientes.find((c) => c.id === id)?.nombre ?? "(eliminado)";
    if (tipo === "proveedor") return providers.find((p) => p.id === id)?.nombre ?? "(eliminado)";
    return projects.find((p) => p.id === id)?.nombre ?? "(eliminado)";
  }

  function usuarioNombre(id: string): string {
    const u = usuarios.find((x) => x.id === id);
    return u ? `${u.nombre} ${u.apellido}` : "—";
  }

  async function handleSaveUsuario(id: string, input: UsuarioUpdateInput) {
    try {
      const updated = await usuariosApi.update(id, input);
      setUsuarios((prev) => prev.map((u) => (u.id === id ? updated : u)));
      pushToast("Usuario actualizado", "success");
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo actualizar el usuario", "danger");
    }
  }

  async function handleDeleteUsuario(u: Usuario) {
    if (u.id === authUser?.id) {
      pushToast("No puedes eliminar tu propia cuenta desde aquí", "danger");
      return;
    }
    if (!window.confirm(`¿Eliminar a ${u.nombre} ${u.apellido}? Esta acción no se puede deshacer.`)) return;
    try {
      await usuariosApi.remove(u.id);
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id));
      pushToast("Usuario eliminado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar el usuario", "danger");
    }
  }

  async function handleAprobar(s: SolicitudEliminacion) {
    try {
      const updated = await solicitudesEliminacionApi.aprobarComoAdmin(s.id, {});
      setSolicitudes((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
      pushToast("Solicitud aprobada", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo aprobar la solicitud", "danger");
    }
  }

  async function handleRechazar(s: SolicitudEliminacion) {
    const comentario = window.prompt("Comentario para quien la solicitó (opcional)");
    try {
      const updated = await solicitudesEliminacionApi.rechazarComoAdmin(s.id, { comentario: comentario || null });
      setSolicitudes((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
      pushToast("Solicitud rechazada", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo rechazar la solicitud", "danger");
    }
  }

  if (!esAdmin) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center text-text-2">
        <UserPlus size={28} strokeWidth={1.5} className="text-text-3" />
        <div className="text-[13px]">El directorio de usuarios está disponible solo para administradores.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Equipo</div>
      <h1 className={styles.h1}>Usuarios</h1>
      <p className="mb-5 text-[13px] text-text-2">Quién tiene acceso, su rol, quién está conectado ahora, e invitaciones pendientes.</p>

      <div className={`mb-5 ${styles.kpis}`}>
        <StatCard n={stats.miembros} label="Miembros" />
        <StatCard n={stats.conectados} label="Conectados ahora" />
        <StatCard n={stats.administradores} label="Administradores" />
        <StatCard n={stats.pendientes} label="Invitaciones pendientes" />
      </div>

      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Equipo</h2>
        {esSuperAdmin && (
          <Button variant="primary" icon={UserPlus} onClick={() => setInviteOpen(true)}>
            Invitar
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-[13px] text-text-3">Cargando…</div>
      ) : (
        <div className="mb-8 overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border bg-gray-light text-left text-[11px] font-semibold uppercase tracking-wide text-text-3">
                <th className="px-3.5 py-2.5">Nombre</th>
                <th className="px-3.5 py-2.5">Rol</th>
                <th className="px-3.5 py-2.5">Estado</th>
                <th className="px-3.5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const enLinea = enLineaPorId[u.id];
                return (
                  <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-gray-light/60">
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-text text-[11px] font-semibold text-green">
                          {u.iniciales || `${u.nombre[0] ?? ""}${u.apellido[0] ?? ""}`.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">
                            {u.nombre} {u.apellido}
                          </div>
                          <div className="text-[11px] text-text-3">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">{ROL_LABELS[u.rol]}</td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: enLinea ? "var(--success)" : "var(--text-3)" }}
                        />
                        {enLinea ? "Disponible" : "Desconectado"}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      {esSuperAdmin && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditing(u);
                              setFormOpen(true);
                            }}
                            aria-label="Editar"
                            className="flex cursor-pointer items-center rounded border border-border bg-surface p-1.5 text-text-2 hover:bg-gray-light"
                          >
                            <Pencil size={13} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleDeleteUsuario(u)}
                            aria-label="Eliminar"
                            className="flex cursor-pointer items-center rounded border border-border bg-surface p-1.5 text-text-2 hover:bg-red-light hover:text-red"
                          >
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3.5 py-6 text-center text-text-3">
                    Sin usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-2.5 text-[15px] font-semibold">Solicitudes de eliminación</div>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-surface">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border bg-gray-light text-left text-[11px] font-semibold uppercase tracking-wide text-text-3">
              <th className="px-3.5 py-2.5">Entidad</th>
              <th className="px-3.5 py-2.5">Solicitado por</th>
              <th className="px-3.5 py-2.5">Motivo</th>
              <th className="px-3.5 py-2.5">Estado</th>
              <th className="px-3.5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-b-0">
                <td className="px-3.5 py-2.5">
                  <Tag>{ENTIDAD_LABELS[s.tipoEntidad]}</Tag> {entidadNombre(s.tipoEntidad, s.entidadId)}
                </td>
                <td className="px-3.5 py-2.5">{usuarioNombre(s.solicitadoPorId)}</td>
                <td className="max-w-[220px] truncate px-3.5 py-2.5 text-text-2">{s.motivo || "—"}</td>
                <td className="px-3.5 py-2.5">
                  <Badge bg="var(--gray-light)" color="var(--text-2)">
                    {s.estado}
                  </Badge>
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => handleAprobar(s)}
                      aria-label="Aprobar"
                      title="Aprobar y eliminar"
                      className="flex cursor-pointer items-center rounded border border-border bg-surface p-1.5 text-text-2 hover:bg-gray-light hover:text-success"
                    >
                      <Check size={13} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleRechazar(s)}
                      aria-label="Rechazar"
                      className="flex cursor-pointer items-center rounded border border-border bg-surface p-1.5 text-text-2 hover:bg-red-light hover:text-red"
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {solicitudes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3.5 py-6 text-center text-text-3">
                  Sin solicitudes de eliminación.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={load} />
      <UsuarioFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSaveUsuario}
        editing={editing}
      />
    </div>
  );
}
