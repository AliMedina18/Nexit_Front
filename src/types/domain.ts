/**
 * Domain types shared across the app.
 *
 * These mirror the shape of the future .NET Web API DTOs as closely as
 * possible so that swapping the mock `services/*` implementations for real
 * HTTP calls later on doesn't require reshaping data in the UI layer.
 */

export type ProviderStatus = "Activo" | "En evaluación" | "Pausado" | "Bloqueado";

export const PROVIDER_STATUSES: ProviderStatus[] = [
  "Activo",
  "En evaluación",
  "Pausado",
  "Bloqueado",
];

export const PROVIDER_CATEGORIES = [
  "Producción audiovisual",
  "Escenografía y montaje",
  "Iluminación y sonido",
  "Producción técnica (rigging, generadores, carpas)",
  "Catering y F&B",
  "Logística y transporte",
  "Tecnología e interactividad",
  "Entretenimiento y artistas",
  "Fotografía y video",
  "Impresos y señalética",
  "Seguridad y protocolo",
  "Mobiliario y decoración",
  "Gastro bar",
  "Hotel",
  "Restaurante",
  "Rooftop",
  "Salón de eventos",
  "Club / Discoteca",
  "Terraza",
  "Finca / Hacienda",
  "Merchandising y regalos corporativos",
  "Personal BTL (impulsadoras, edecanes, meseros)",
  "Permisología y trámites",
  "Diseño gráfico y creatividad",
  "Flores y ambientación",
  "Otro",
] as const;

export const BUDGET_TIERS = [
  "$ Bajo (<20k)",
  "$$ Medio (20k–100k)",
  "$$$ Alto (100k–500k)",
  "$$$$ Premium (>500k)",
] as const;

export const COVERAGE_LEVELS = ["Solo ciudad", "Regional", "Nacional", "Internacional"] as const;

export interface Attachment {
  id: string;
  type: "file" | "link";
  name: string;
  /** data: URL for uploaded files, external URL for links */
  url: string;
  meta: string;
  date: string;
}

export interface Provider {
  id: number;
  nombre: string;
  pais: string;
  region: string;
  ciudad: string;
  cat: string;
  status: ProviderStatus;
  contacto: string;
  tel: string;
  email: string;
  score: number;
  budget: string;
  cobertura: string;
  servicios: string;
  notas: string;
  attachments: Attachment[];
}

export type ProviderInput = Omit<Provider, "id" | "attachments"> & {
  attachments?: Attachment[];
};

/** Fase 1 · Planeación interna */
export type ProjectStatusPhase1 = "Planeación interna";
/** Fase 2 · Con decisión del cliente */
export type ProjectStatusPhase2 =
  | "Confirmado"
  | "Planeación"
  | "En curso"
  | "Finalizado"
  | "Cancelado";
/** Fase 3 · Cierre y facturación */
export type ProjectStatusPhase3 = "Ejecutado, pendiente facturar" | "Facturado";

export type ProjectStatus = ProjectStatusPhase1 | ProjectStatusPhase2 | ProjectStatusPhase3;

export const PROJECT_STATUS_GROUPS: { label: string; options: ProjectStatus[] }[] = [
  { label: "Fase 1 · Planeación interna", options: ["Planeación interna"] },
  {
    label: "Fase 2 · Con decisión del cliente",
    options: ["Confirmado", "Planeación", "En curso", "Finalizado", "Cancelado"],
  },
  {
    label: "Fase 3 · Cierre y facturación",
    options: ["Ejecutado, pendiente facturar", "Facturado"],
  },
];

export type BriefStatus =
  | "Pendiente por enviar"
  | "Entregado, a espera de respuesta"
  | "Requiere ajustes"
  | "Aprobado";

export const BRIEF_STATUSES: BriefStatus[] = [
  "Pendiente por enviar",
  "Entregado, a espera de respuesta",
  "Requiere ajustes",
  "Aprobado",
];

export interface Project {
  id: number;
  nombre: string;
  cliente: string;
  contacto: string;
  ejecutivo: string;
  disenador3d: string;
  disenadorgrafico: string;
  fecha: string; // yyyy-mm-dd
  estado: ProjectStatus;
  briefEstado: BriefStatus;
  notas: string;
  proveedorIds: number[];
}

export type ProjectInput = Omit<Project, "id">;

export type Rol = "super_admin" | "admin" | "manager" | "miembro";

export interface AuthUser {
  /** UUID real de Supabase Auth (session.user.id). */
  id: string;
  email: string;
  displayName: string;
  initials: string;
  /**
   * Rol de negocio. Viene de GET /api/usuarios/me (agregado 2026-08-26, ver
   * auth-store.ts) apenas carga esa respuesta; mientras tanto, y si esa cuenta
   * todavía no tiene fila de negocio (recién invitada, o el super_admin sembrado
   * a mano), se usa el claim `user_role` del JWT (Auth Hook de Supabase -- ver
   * Nexit_Back/docs/schema/03_auth_hook_custom_claims.sql) y `displayName`/
   * `initials` se derivan del correo como aproximación.
   */
  rol: Rol;
}

export interface MetricSnapshot {
  key: string;
  savedAt: string;
  data: {
    totalProveedores: number;
    totalProyectos: number;
    sinProveedor: number;
    porEstado: Record<string, number>;
    porBrief: Record<string, number>;
  };
}
