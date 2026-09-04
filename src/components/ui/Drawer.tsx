"use client";

import { useRef, type ChangeEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Upload, X } from "lucide-react";
import styles from "@/styles/drawer.module.css";

/**
 * `size` separa los dos anchos del mockup aprobado: 520px para los drawers de
 * detalle (solo lectura) y 620px para los de formulario. Por defecto queda en
 * `form` porque es el ancho que ya tenían todos los drawers antes de esta
 * distinción.
 */
export function Drawer({
  open,
  onClose,
  size = "form",
  children,
}: {
  open: boolean;
  onClose: () => void;
  size?: "detail" | "form";
  children: ReactNode;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 transition-opacity"
      style={{ opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none" }}
      onClick={onClose}
    >
      <div
        className={`flex h-screen ${size === "detail" ? styles.panelDetail : styles.panel} flex-col overflow-y-auto border-l border-border bg-surface transition-transform`}
        style={{ transform: open ? "translateX(0)" : "translateX(20px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DrawerHeader({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-[1] flex items-start gap-[13px] border-b border-border bg-surface px-[22px] py-[18px]">
      {children}
    </div>
  );
}

/**
 * Botón de acción del encabezado del drawer -- 36x36 con borde, el mismo
 * cuadrado que en el mockup aprobado sostiene "editar" y "cerrar".
 */
export function DrawerIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-border bg-transparent text-text transition-colors hover:border-text hover:bg-text hover:text-green"
    >
      {children}
    </button>
  );
}

export function DrawerCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <DrawerIconButton label="Cerrar" onClick={onClose}>
      <X size={15} strokeWidth={1.9} />
    </DrawerIconButton>
  );
}

/** Pie fijo de los drawers de detalle (WhatsApp / Correo / eliminar). */
export function DrawerFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 mt-auto flex flex-wrap gap-2 border-t border-border bg-surface px-[22px] py-3.5">
      {children}
    </div>
  );
}

/**
 * Caja de sección del drawer de detalle -- el mockup aprobado agrupa los datos
 * en cajas crema (`#FBFAF7` sobre borde `#EFEDE7`) en vez de listarlos sueltos
 * bajo un título en mayúsculas. `tone="plain"` es la variante blanca que el
 * mismo mockup usa para adjuntos e historial.
 */
export function DetailBox({
  title,
  action,
  tone = "muted",
  children,
}: {
  title: string;
  action?: ReactNode;
  tone?: "muted" | "plain";
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border px-4 py-[15px] ${
        tone === "muted" ? "border-[#EFEDE7] bg-[#FBFAF7]" : "border-border bg-surface"
      }`}
    >
      <div className="mb-[11px] flex items-center justify-between gap-2 text-sm font-semibold">
        <span>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Fila clave/valor dentro de una DetailBox (columna de 96px, 14px). */
export function DetailRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-[9px] py-[4.5px] text-sm">
      <div className="text-text-3">{k}</div>
      <div className="min-w-0">{v}</div>
    </div>
  );
}

export function DrawerSection({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mt-4.5 mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-text-3 first:mt-0">
      <span>{title}</span>
      {action}
    </div>
  );
}

/** Caja de sección con fondo gris claro para agrupar contenido del drawer. */
export function DrawerBox({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-3 rounded-[var(--radius-md)] bg-gray-light p-3.5 first:mt-0">
      <div className="mb-2.5 flex items-center justify-between text-[13px] font-semibold text-text">
        <span>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

export function KeyValue({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="mb-1.5 grid grid-cols-[130px_1fr] gap-x-2.5 gap-y-0.5 text-[13px]">
      <div className="text-text-2">{k}</div>
      <div>{v}</div>
    </div>
  );
}

export function NoteBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 rounded-[var(--radius-md)] bg-gray-light px-3 py-2.5 text-[13px] leading-relaxed text-text-2">
      {children}
    </div>
  );
}

/**
 * Encabezado de los drawers de formulario ("Nuevo cliente/proyecto/proveedor" --
 * ver ClienteFormModal/ProjectFormModal/ProviderFormModal). Ported 2026-09-03 del
 * mockup aprobado (Claude Diseño): eyebrow en mayúsculas monoespaciado ("REGISTRAR
 * CLIENTE") sobre el título real ("Datos del nuevo cliente"), a diferencia de
 * DrawerHeader (usado en los drawers de detalle) que no lleva eyebrow.
 */
/**
 * `onImportFile` es opcional: cuando se pasa, aparece el botón "Importar
 * datos" (ícono de subir + borde) del mockup aprobado, que rellena el
 * formulario abierto desde la primera fila de un CSV -- no reemplaza el
 * "Excel" de la barra superior (eso importa muchos registros a la vez; esto
 * llena un solo formulario).
 */
export function FormDrawerHeader({
  eyebrow,
  title,
  onClose,
  onImportFile,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  onImportFile?: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file && onImportFile) onImportFile(file);
  }

  return (
    <div className="sticky top-0 z-[1] flex items-center justify-between gap-3.5 border-b border-border bg-surface px-6 py-[18px]">
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">{eyebrow}</div>
        <div className="mt-[5px] text-xl font-semibold leading-tight tracking-[-0.025em]">{title}</div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {onImportFile && (
          <>
            <button
              type="button"
              title="Rellena este formulario desde un archivo CSV"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 cursor-pointer items-center gap-[7px] whitespace-nowrap rounded-[var(--radius-md)] border border-border bg-transparent px-3 text-[13px] font-medium text-text transition-colors hover:border-text hover:bg-bg"
            >
              <Upload size={14} strokeWidth={1.8} />
              Importar datos
            </button>
            <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </>
        )}
        <DrawerCloseButton onClose={onClose} />
      </div>
    </div>
  );
}

/**
 * Cuerpo del drawer de formulario. Además del espaciado del mockup (24px de
 * margen, 26px entre secciones) sube el tamaño de los controles al del HTML
 * aprobado -- campos de 46px sobre fondo crema que se vuelven blancos al
 * enfocarlos, etiquetas de 14px -- sin tocar los estilos base de `Input`,
 * que /login necesita en su tamaño propio (48px sobre blanco).
 */
export function FormDrawerBody({ children }: { children: ReactNode }) {
  return (
    <div
      className={[
        "flex flex-1 flex-col gap-[26px] p-6",
        "[&_label]:text-sm [&_label]:font-medium [&_label]:text-text",
        "[&_input:not([type=checkbox]):not([type=range])]:h-[46px]",
        "[&_input:not([type=checkbox]):not([type=range])]:px-3.5",
        "[&_input:not([type=checkbox]):not([type=range])]:py-0",
        "[&_select]:h-[46px] [&_select]:px-3.5",
        "[&_textarea]:px-3.5 [&_textarea]:py-[13px] [&_textarea]:leading-[1.6]",
        "[&_input:not([type=checkbox]):not([type=range])]:text-[15px] [&_select]:text-[15px] [&_textarea]:text-[15px]",
        "[&_input:not([type=checkbox]):not([type=range])]:bg-bg [&_select]:bg-bg [&_textarea]:bg-bg",
        "[&_input:focus]:bg-surface [&_select:focus]:bg-surface [&_textarea:focus]:bg-surface",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/**
 * Título de sección numerada dentro de un drawer de formulario -- "01 Quién es",
 * "02 Dónde está", etc. en el mockup aprobado. El número va en verde monoespaciado,
 * el título en negro; separado de KeyValue/DrawerSection (esas son para drawers de
 * detalle, de solo lectura) porque este encabeza un grupo de campos editables.
 */
export function FormDrawerSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-baseline gap-2.5 border-b border-border pb-[11px]">
        <span className="font-mono text-xs text-[#00A85A]">{number}</span>
        <span className="text-[19px] font-semibold leading-tight tracking-[-0.025em]">{title}</span>
      </div>
      {children}
    </div>
  );
}

/** Pie fijo con acciones (Cancelar / Guardar…) para los drawers de formulario. */
export function FormDrawerFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 mt-auto flex items-center gap-2.5 border-t border-border bg-surface px-6 py-3.5">
      {children}
    </div>
  );
}
