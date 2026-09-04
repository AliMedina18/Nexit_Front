"use client";

import { Star } from "lucide-react";

/**
 * Selector de 1 a 5 estrellas -- ported del mockup aprobado (fmStars): fila
 * suelta de 46px (misma altura que los demás campos del formulario, sin caja
 * propia), estrellas verdes (#00A85A), y un clic sobre la estrella ya
 * marcada como tope vuelve la valoración a 0 en vez de quedarse pegada.
 * Antes usaba naranja (#EF9F27) -- el mismo color equivocado que ya se
 * corrigió en `Stars` (primitives.tsx), la versión de solo lectura.
 */
export function StarRatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex h-[46px] items-center gap-[3px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          className="flex cursor-pointer items-center rounded border-none bg-transparent p-0.5"
          aria-label={`${n} de 5`}
          title={`${n} de 5`}
        >
          <Star size={22} strokeWidth={1.5} fill={n <= value ? "#00A85A" : "none"} stroke={n <= value ? "#00A85A" : "#9C9992"} />
        </button>
      ))}
    </div>
  );
}
