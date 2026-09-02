"use client";

import { Users2 } from "lucide-react";
import { Avatar, Badge, CountryBadge, Stars, Tag } from "@/components/ui/primitives";
import { PROVIDER_STATUS_COLORS, statusColor } from "@/lib/constants";
import { useCatalogosStore } from "@/store/catalogos-store";
import type { Proveedor } from "@/types/api";

export function ProviderCard({ provider, onOpen }: { provider: Proveedor; onOpen: () => void }) {
  const { paises, categoriasProveedor, regionesPorPais } = useCatalogosStore();
  const sc = statusColor(PROVIDER_STATUS_COLORS, provider.estado);
  const paisNombre = paises.find((p) => p.id === provider.paisId)?.nombre;
  const regionNombre = regionesPorPais[provider.paisId]?.find((r) => r.id === provider.regionId)?.nombre;
  const categoriaNombre = categoriasProveedor.find((c) => c.id === provider.categoriaId)?.nombre;
  const loc = [regionNombre].filter(Boolean).join(" · ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      className="cursor-pointer rounded-[var(--radius-md)] border border-border bg-surface p-3 transition-shadow hover:border-border-strong hover:shadow-sm"
    >
      <div className="flex items-start gap-2.5">
        <Avatar nombre={provider.nombre} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight">{provider.nombre}</div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-text-2">
            <CountryBadge pais={paisNombre} />
            <span className="truncate">{loc || paisNombre || "Sin ubicación"}</span>
          </div>
        </div>
        {typeof provider.score === "number" && <Stars n={provider.score} size={11} />}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge bg={sc.bg} color={sc.c}>
          {provider.estado}
        </Badge>
        {categoriaNombre && <Tag>{categoriaNombre}</Tag>}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[11px] text-text-2">
        <span className="truncate">{provider.contacto || "Sin contacto"}</span>
        {provider.colaboradores.length > 0 && (
          <span
            className="flex flex-shrink-0 items-center gap-0.5"
            title="Colaboradores trabajando con este proveedor"
          >
            <Users2 size={11} strokeWidth={2} />
            {provider.colaboradores.length}
          </span>
        )}
      </div>
    </div>
  );
}
