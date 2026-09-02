"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/primitives";
import styles from "@/styles/error-state.module.css";

interface ErrorAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

/**
 * Vista compartida para los 4 casos de error de Next.js App Router
 * (not-found.tsx, error.tsx del segmento raíz, error.tsx de (dashboard) y
 * global-error.tsx) -- mismo lenguaje visual que el resto de la app: eyebrow
 * en IBM Plex Mono, ícono en un aro de color semántico, botón primario negro.
 * "danger" (rojo, --red) para errores reales; "neutral" (gris, --text-3)
 * para el 404, que no es realmente un error sino una ruta que no existe.
 */
export function ErrorState({
  icon: Icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  tone = "danger",
  digest,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: ErrorAction;
  secondaryAction?: ErrorAction;
  tone?: "danger" | "neutral";
  digest?: string;
}) {
  const ringClass = tone === "danger" ? "bg-red-light text-red" : "bg-gray-light text-text-3";
  const eyebrowClass = tone === "danger" ? "text-red" : "text-text-3";

  return (
    <div className={`${styles.wrap} flex flex-col items-center px-6 text-center`}>
      <div
        className={`${styles.iconRing} mb-5 flex h-14 w-14 items-center justify-center rounded-full ${ringClass}`}
        aria-hidden
      >
        <Icon size={24} strokeWidth={1.75} />
      </div>

      <div className={`font-mono text-[11px] font-medium uppercase tracking-[0.16em] ${eyebrowClass}`}>
        {eyebrow}
      </div>

      <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-text">{title}</h1>

      <p className="mt-2.5 max-w-[380px] text-[14px] leading-relaxed text-text-2">{description}</p>

      <div className="mt-7 flex items-center gap-2.5">
        {primaryAction.href ? (
          <Link href={primaryAction.href}>
            <Button variant="primary">{primaryAction.label}</Button>
          </Link>
        ) : (
          <Button variant="primary" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </Button>
        )}

        {secondaryAction &&
          (secondaryAction.href ? (
            <Link href={secondaryAction.href}>
              <Button variant="ghost">{secondaryAction.label}</Button>
            </Link>
          ) : (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ))}
      </div>

      {digest && <p className="mt-6 font-mono text-[11px] text-text-3">Código de referencia: {digest}</p>}
    </div>
  );
}
