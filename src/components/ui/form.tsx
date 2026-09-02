"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

/** bg-surface (blanco), no bg-bg -- ported 2026-08-28: en el mockup los campos
 * son blancos sobre el fondo crema de la página, no del mismo tono que la página. */
const controlClass =
  "w-full rounded-[var(--radius-md)] border border-border bg-surface px-2.5 py-2 text-[13px] text-text outline-none transition-colors focus:border-teal-mid font-sans";

/** Borde rojo cuando el campo quedó marcado inválido (ported 2026-09-01 del
 * mockup: el patrón real es un borde que cambia a --red en vez de solo un
 * texto de error debajo -- ver p.ej. `nombreBorder` en el HTML aprobado,
 * usado ya en ClienteFormModal/ProjectFormModal; antes /login solo mostraba
 * el texto y dejaba el borde del input sin cambiar). */
const invalidClass = "border-red focus:border-red";

export function Field({
  label,
  error,
  required,
  children,
  hint,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-xs font-medium text-text-2">
        {label} {required && <span className="text-red">*</span>}
      </label>
      {children}
      {hint}
      {error && <div className="mt-1 text-xs text-red">{error}</div>}
    </div>
  );
}

export function Input({
  className,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={clsx(controlClass, invalid && invalidClass, className)} {...props} />;
}

/** Input tipo contraseña con botón de mostrar/ocultar (ojo) -- ported 2026-08-28 del
 * mockup. Usado solo en /login (a diferencia de Input/Field, que se comparten con el
 * resto de la app), así que aquí sí puede llevar el tamaño exacto del mockup (48px de
 * alto, texto 16px) en vez del tamaño compacto de los formularios internos. */
export function PasswordInput({
  className,
  style,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={clsx(controlClass, invalid && invalidClass, className)}
        style={{ height: 48, paddingLeft: 14, paddingRight: 48, fontSize: 16, ...style }}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-[5px] top-[5px] flex h-[38px] w-[38px] items-center justify-center rounded-[3px] border border-border bg-bg text-text transition-colors hover:border-text hover:bg-text hover:text-green"
      >
        {visible ? <EyeOff size={17} strokeWidth={1.7} /> : <Eye size={17} strokeWidth={1.7} />}
      </button>
    </div>
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx(controlClass, "cursor-pointer", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(controlClass, "min-h-[72px] resize-y", className)} {...props} />;
}

export function Row({ cols = 2, children }: { cols?: 2 | 3; children: ReactNode }) {
  return (
    <div className={clsx("grid gap-3", cols === 2 ? "grid-cols-2" : "grid-cols-3")}>{children}</div>
  );
}

export function FieldGroup({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-3.5 rounded-[var(--radius-md)] bg-gray-light p-3.5 pb-1">
      <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-3">{title}</div>
      {children}
    </div>
  );
}
