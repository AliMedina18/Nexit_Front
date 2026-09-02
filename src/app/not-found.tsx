"use client";

import { FileQuestion } from "lucide-react";
import { NexitWordmark } from "@/components/ui/Logo";
import { ErrorState } from "@/components/ui/ErrorState";

/**
 * 404 -- cualquier ruta que no coincida con ninguna página (o una llamada
 * explícita a notFound() desde next/navigation). No es un "error" real, por
 * eso usa tone="neutral" en vez del rojo de error.tsx/global-error.tsx.
 * "Volver al inicio" apunta a "/", que ya decide a dónde mandar según haya
 * o no sesión (ver src/app/page.tsx).
 *
 * Client component a propósito (no el default de not-found.tsx): ErrorState
 * también lo es (usa onClick en los botones para los otros 3 casos de error
 * que la comparten), y un ícono de lucide-react (FileQuestion) es una
 * referencia a función -- no se puede pasar de un Server Component a un
 * Client Component como prop, solo JSX ya renderizado. Esta página es pura
 * presentación estática, así que el costo de marcarla "use client" es nulo.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      <div className="mb-10">
        <NexitWordmark height={22} />
      </div>

      <ErrorState
        tone="neutral"
        icon={FileQuestion}
        eyebrow="Error 404"
        title="Esta página no existe"
        description="Revisa el enlace o vuelve al inicio -- desde ahí puedes navegar al resto de la plataforma."
        primaryAction={{ label: "Volver al inicio", href: "/" }}
      />
    </div>
  );
}
