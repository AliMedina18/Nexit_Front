"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import type { Provider } from "@/types/domain";

export function ProviderPicker({
  providers,
  selectedIds,
  onToggle,
}: {
  providers: Provider[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return providers.filter((p) => !s || [p.nombre, p.cat].some((v) => v?.toLowerCase().includes(s)));
  }, [providers, search]);

  return (
    <div>
      <div className="relative mb-2">
        <Search size={14} strokeWidth={2} className="pointer-events-none absolute left-[9px] top-1/2 -translate-y-1/2 text-text-3" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar proveedor por nombre o categoría…"
          className="w-full rounded-[var(--radius-md)] border border-border bg-bg py-1.5 pl-[30px] pr-2.5 text-[13px] outline-none focus:border-teal-mid"
        />
      </div>
      <div className="mb-1.5 text-xs text-text-2">{selectedIds.size} proveedores seleccionados</div>
      <div className="flex max-h-[220px] flex-col overflow-y-auto rounded-[var(--radius-md)] border border-border">
        {filtered.length === 0 && (
          <div className="py-3.5 text-center text-xs text-text-3">No se encontraron proveedores</div>
        )}
        {filtered.map((p) => {
          const idx = providers.indexOf(p);
          const checked = selectedIds.has(p.id);
          return (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-2.5 border-b border-border px-2.5 py-2 last:border-b-0 hover:bg-gray-light"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(p.id)}
                className="h-[15px] w-[15px] flex-shrink-0 cursor-pointer accent-teal-mid"
              />
              <Avatar nombre={p.nombre} idx={idx} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{p.nombre}</div>
                <div className="truncate text-[11px] text-text-2">{p.cat}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
