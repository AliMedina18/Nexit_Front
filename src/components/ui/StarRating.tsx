"use client";

import { Star } from "lucide-react";

/** Interactive 1–5 star picker (replaces the old emoji-star <select>). */
export function StarRatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg px-2.5 py-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="flex cursor-pointer items-center rounded border-none bg-transparent p-0.5"
            aria-label={`${n} de 5`}
          >
            <Star
              size={18}
              strokeWidth={1.5}
              fill={n <= value ? "#EF9F27" : "none"}
              stroke={n <= value ? "#EF9F27" : "var(--border-strong)"}
            />
          </button>
        ))}
      </div>
      <span className="text-xs text-text-2">{value} de 5</span>
    </div>
  );
}
