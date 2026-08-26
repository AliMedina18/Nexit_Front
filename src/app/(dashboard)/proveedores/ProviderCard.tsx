"use client";

import { Paperclip } from "lucide-react";
import { Avatar, Badge, CountryBadge, Stars, Tag } from "@/components/ui/primitives";
import { PROVIDER_STATUS_COLORS } from "@/lib/constants";
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
    .slice(0, 1);
  const loc = [provider.region, provider.ciudad].filter(Boolean).join(" · ");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      className="cursor-pointer rounded-[var(--radius-md)] border border-border bg-surface p-3 transition-shadow hover:border-border-strong hover:shadow-sm"
    >
      <div className="flex items-start gap-2.5">
        <Avatar nombre={provider.nombre} idx={idx} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight">{provider.nombre}</div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-text-2">
            <CountryBadge pais={provider.pais} />
            <span className="truncate">{loc || provider.pais || "Sin ubicación"}</span>
          </div>
        </div>
        <Stars n={provider.score} size={11} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge bg={sc.bg} color={sc.c}>
          {provider.status}
        </Badge>
        <Tag>{provider.cat}</Tag>
        {svcs.map((s) => (
          <Tag key={s}>{s}</Tag>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[11px] text-text-2">
        <span className="truncate">{provider.contacto || "Sin contacto"}</span>
        {provider.attachments.length > 0 && (
          <span className="flex flex-shrink-0 items-center gap-0.5">
            <Paperclip size={11} strokeWidth={2} />
            {provider.attachments.length}
          </span>
        )}
      </div>
    </div>
  );
}
