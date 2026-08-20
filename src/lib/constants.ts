import type { BriefStatus, ProjectStatus, ProviderStatus } from "@/types/domain";

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

export const PROVIDER_STATUS_COLORS: Record<ProviderStatus, { bg: string; c: string }> = {
  Activo: { bg: "#EAF3DE", c: "#27500A" },
  "En evaluación": { bg: "#FAEEDA", c: "#633806" },
  Pausado: { bg: "#F1EFE8", c: "#444441" },
  Bloqueado: { bg: "#FCEBEB", c: "#791F1F" },
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, { bg: string; c: string }> = {
  "Planeación interna": { bg: "#F1EFE8", c: "#444441" },
  Planeación: { bg: "#EEEDFE", c: "#26215C" },
  Confirmado: { bg: "#E6F1FB", c: "#0C447C" },
  "En curso": { bg: "#EAF3DE", c: "#27500A" },
  Finalizado: { bg: "#F1EFE8", c: "#444441" },
  Cancelado: { bg: "#FCEBEB", c: "#791F1F" },
  "Ejecutado, pendiente facturar": { bg: "#FAEEDA", c: "#633806" },
  Facturado: { bg: "#EAF3DE", c: "#173404" },
};

export const BRIEF_STATUS_COLORS: Record<BriefStatus, { bg: string; c: string }> = {
  "Pendiente por enviar": { bg: "#F1EFE8", c: "#444441" },
  "Entregado, a espera de respuesta": { bg: "#FAEEDA", c: "#633806" },
  "Requiere ajustes": { bg: "#FCEBEB", c: "#791F1F" },
  Aprobado: { bg: "#EAF3DE", c: "#27500A" },
};

export const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  doc: "📝",
  docx: "📝",
  xls: "📊",
  xlsx: "📊",
  ppt: "📋",
  pptx: "📋",
  jpg: "🖼",
  jpeg: "🖼",
  png: "🖼",
  gif: "🖼",
  mp4: "🎬",
  mov: "🎬",
  mp3: "🎵",
  zip: "🗜",
  rar: "🗜",
};
