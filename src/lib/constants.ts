import type { Rol } from "@/types/api";
import {
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  type LucideIcon,
} from "lucide-react";

export const AVATAR_COLORS: { bg: string; text: string }[] = [
  { bg: "#E1F5EE", text: "#085041" },
  { bg: "#E6F1FB", text: "#0C447C" },
  { bg: "#EEEDFE", text: "#26215C" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#FAECE7", text: "#712B13" },
  { bg: "#FBEAF0", text: "#72243E" },
  { bg: "#EAF3DE", text: "#27500A" },
  { bg: "#F1EFE8", text: "#444441" },
];

/**
 * Los `estado` reales (proveedor.estado, EstadoProyecto.nombre, estadoBrief) son
 * `string` simples que vienen del backend -- catálogo dinámico en el caso de
 * proyecto, convención de texto libre en los otros dos -- no un union de TS
 * fijo como en la maqueta original. Por eso estos tres mapas quedan `Record<string, ...>`
 * con un color gris de respaldo (`statusColor`) para cualquier valor que no
 * esté explícitamente listado, en vez de forzar un enum que ya no es real.
 */
const FALLBACK_STATUS_COLOR = { bg: "var(--gray-light)", c: "var(--text-2)" };

export function statusColor(map: Record<string, { bg: string; c: string }>, key: string | undefined | null) {
  if (!key) return FALLBACK_STATUS_COLOR;
  return map[key] ?? FALLBACK_STATUS_COLOR;
}

export const PROVEEDOR_ESTADOS = ["Activo", "En evaluación", "Pausado", "Bloqueado"] as const;

export const PROVIDER_STATUS_COLORS: Record<string, { bg: string; c: string }> = {
  Activo: { bg: "#EAF3DE", c: "#27500A" },
  "En evaluación": { bg: "#FAEEDA", c: "#633806" },
  Pausado: { bg: "#F1EFE8", c: "#444441" },
  Bloqueado: { bg: "#FCEBEB", c: "#791F1F" },
};

export const CLIENTE_ESTADOS = ["Activo", "Prospecto", "Inactivo"] as const;

/** Valores literales de CLI_STATUS_COLORS del mockup aprobado (Claude Diseño). */
export const CLIENT_STATUS_COLORS: Record<string, { bg: string; c: string }> = {
  Activo: { bg: "#E4F9EE", c: "#036B3C" },
  Prospecto: { bg: "#FBF0DC", c: "#7A4E00" },
  Inactivo: { bg: "#F1EFE8", c: "#4A4845" },
};

export const PROJECT_STATUS_COLORS: Record<string, { bg: string; c: string }> = {
  "Planeación interna": { bg: "#F1EFE8", c: "#444441" },
  Planeación: { bg: "#EEEDFE", c: "#26215C" },
  Confirmado: { bg: "#E6F1FB", c: "#0C447C" },
  "En curso": { bg: "#EAF3DE", c: "#27500A" },
  Finalizado: { bg: "#F1EFE8", c: "#444441" },
  Cancelado: { bg: "#FCEBEB", c: "#791F1F" },
  "Ejecutado, pendiente facturar": { bg: "#FAEEDA", c: "#633806" },
  Facturado: { bg: "#EAF3DE", c: "#173404" },
};

export const BRIEF_STATUS_COLORS: Record<string, { bg: string; c: string }> = {
  "Pendiente por enviar": { bg: "#F1EFE8", c: "#444441" },
  "Entregado, a espera de respuesta": { bg: "#FAEEDA", c: "#633806" },
  "Requiere ajustes": { bg: "#FCEBEB", c: "#791F1F" },
  Aprobado: { bg: "#EAF3DE", c: "#27500A" },
};

/**
 * Los 4 roles de negocio (Nexit_Back/docs/06), de mayor a menor privilegio. Una sola fuente para la
 * tabla de usuarios, el panel de perfil, el modal de invitar y el de editar -- antes cada uno tenía
 * su propia copia del mismo Record y podían desincronizarse.
 */
export const ROLES: Rol[] = ["super_admin", "admin", "manager", "miembro"];

/**
 * Los roles que se pueden ASIGNAR desde la aplicación (Alicia 2026-09-08: "para poder colocar super
 * admin como rol, jamás"). `super_admin` queda fuera a propósito: es una sola persona, la dueña del
 * sistema, y su cuenta se sembró directamente en la base. Que la interfaz nunca lo ofrezca evita el
 * accidente de crear un segundo dueño sin querer -- el backend además lo rechaza (ver los
 * validadores de invitación/registro y ActualizarUsuarioUseCase).
 *
 * `ROLES` (los cuatro) se sigue usando donde solo se LEE: el filtro de la tabla, las etiquetas y los
 * conteos -- ahí sí hay que poder ver al super admin.
 */
export const ROLES_ASIGNABLES: Rol[] = ["admin", "manager", "miembro"];

export const ROL_LABELS: Record<Rol, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  manager: "Manager",
  miembro: "Miembro",
};

/** Qué puede hacer cada rol, en una línea -- se muestra junto al selector para no tener que adivinar. */
export const ROL_DESCRIPCIONES: Record<Rol, string> = {
  super_admin: "Manda en todo: es el único que crea, edita y elimina usuarios.",
  admin: "Administra el sistema y decide las solicitudes de eliminación. No toca usuarios.",
  manager: "Gerente de sus proyectos: endosa la eliminación de los que tiene a cargo.",
  miembro: "Trabaja en el sistema; para eliminar algo tiene que solicitarlo.",
};

export const ROL_COLORS: Record<Rol, { bg: string; c: string }> = {
  super_admin: { bg: "#EEEDFE", c: "#26215C" },
  admin: { bg: "#E6F1FB", c: "#0C447C" },
  manager: { bg: "#EAF3DE", c: "#27500A" },
  miembro: { bg: "#F1EFE8", c: "#444441" },
};

/** Estado de la cuenta -- distinto de estar conectado ahora mismo (eso es presencia, HU-12). */
export const CUENTA_ACTIVA_COLOR = { bg: "#E4F9EE", c: "#036B3C" };
export const CUENTA_INACTIVA_COLOR = { bg: "#FCEBEB", c: "#791F1F" };

/** Country badge colors (2-letter code chip), replacing flag emoji. */
export const COUNTRY_BADGE_COLORS: Record<string, { bg: string; c: string }> = {
  CO: { bg: "#FAEEDA", c: "#854F0B" },
  MX: { bg: "#E6F1FB", c: "#185FA5" },
  US: { bg: "#EAF3DE", c: "#27500A" },
  OTHER: { bg: "var(--gray-light)", c: "var(--text-2)" },
};

export const FILE_TYPE_ICONS: Record<string, LucideIcon> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  ppt: FileText,
  pptx: FileText,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  mp4: FileVideo,
  mov: FileVideo,
  mp3: FileAudio,
  zip: FileArchive,
  rar: FileArchive,
};
