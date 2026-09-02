"use client";

import { Heart, Pencil, Users2 } from "lucide-react";
import { Avatar, Badge, CountryBadge, Stars, Tag } from "@/components/ui/primitives";
import { PROVIDER_STATUS_COLORS, statusColor } from "@/lib/constants";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useProvidersStore } from "@/store/providers-store";
import type { Proveedor } from "@/types/api";

export function ProviderCard({ provider, onOpen }: { provider: Proveedor; onOpen: () => void }) {
  const { paises, categoriasProveedor, regionesPorPais } = useCatalogosStore();
  const authUser = useAuthStore((s) => s.user);
  const marcarColaborador = useProvidersStore((s) => s.marcarColaborador);
  const quitarColaborador = useProvidersStore((s) => s.quitarColaborador);
  const sc = statusColor(PROVIDER_STATUS_COLORS, provider.estado);
  const esMio = Boolean(authUser && provider.colaboradores.some((c) => c.usuarioId === authUser.id));
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
      className="min-h-[152px] cursor-pointer rounded-[var(--radius-md)] border border-border bg-surface p-4 transition-shadow hover:border-text hover:shadow-sm"
    >
      <div className="flex items-start gap-2.5">
        <Avatar nombre={provider.nombre} size="md" />
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
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void (esMio ? quitarColaborador(provider.id) : marcarColaborador(provider.id));
          }}
          aria-pressed={esMio}
          aria-label={esMio ? "Quitar de mis proveedores" : "Marcar como mi proveedor"}
          title={esMio ? "Estoy trabajando con este proveedor" : "Marcar que trabajo con este proveedor"}
          className="ml-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-text-3 transition-colors hover:bg-gray-light hover:text-red"
        >
          <Heart size={13} strokeWidth={2} fill={esMio ? "currentColor" : "none"} className={esMio ? "text-red" : undefined} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px] text-text-2">
        <span className="truncate">{provider.contacto || "Sin contacto"}</span>
        <div className="flex items-center gap-2">
          {provider.colaboradores.length > 0 && (
            <span
              className="flex flex-shrink-0 items-center gap-0.5"
              title="Colaboradores trabajando con este proveedor"
            >
              <Users2 size={11} strokeWidth={2} />
              {provider.colaboradores.length}
            </span>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            aria-label={`Abrir ${provider.nombre}`}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-text-2 hover:bg-gray-light hover:text-text"
          >
            <Pencil size={13} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
