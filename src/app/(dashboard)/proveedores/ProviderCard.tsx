"use client";

import { Avatar, Badge, Stars, Tag } from "@/components/ui/primitives";
import { PROVIDER_STATUS_COLORS } from "@/lib/constants";
import { countryFlag } from "@/lib/geo";
import type { Provider } from "@/types/domain";

export function ProviderCard({
  provider,
  idx,
  onOpen,
}: {
  provider: Provider;
  idx: number;
  onOpen: () => void;
}) {
  const sc = PROVIDER_STATUS_COLORS[provider.status];
  const svcs = provider.servicios
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
  const loc = [provider.region, provider.ciudad].filter(Boolean).join(" · ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      className="cursor-pointer rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-shadow hover:border-border-strong hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar nombre={provider.nombre} idx={idx} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{provider.nombre}</div>
          <div className="mt-0.5 truncate text-xs text-text-2">
            {countryFlag(provider.pais)} {loc || provider.pais}
          </div>
        </div>
        <div className="ml-auto whitespace-nowrap">
          <Stars n={provider.score} />
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <Badge bg={sc.bg} color={sc.c}>
          {provider.status}
        </Badge>
        <Tag>{provider.cat}</Tag>
        {svcs.map((s) => (
          <Tag key={s}>{s}</Tag>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-3.5 border-t border-border pt-2.5 text-xs text-text-2">
        <span>{provider.contacto || "Sin contacto"}</span>
        {provider.attachments.length > 0 && <span>📎 {provider.attachments.length}</span>}
      </div>
    </div>
  );
}
