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
