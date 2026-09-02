"use client";

import { Mail, MapPin } from "lucide-react";
import { Avatar, Tag } from "@/components/ui/primitives";
import type { Cliente } from "@/types/api";

export function ClienteCard({ cliente, onOpen }: { cliente: Cliente; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      className="cursor-pointer rounded-[var(--radius-md)] border border-border bg-surface p-3 transition-shadow hover:border-border-strong hover:shadow-sm"
    >
      <div className="flex items-start gap-2.5">
        <Avatar nombre={cliente.nombre} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-tight">{cliente.nombre}</div>
          <div className="mt-0.5 truncate text-[11px] text-text-2">{cliente.sector || "Sin sector"}</div>
        </div>
      </div>

      {cliente.ciudad && (
        <div className="mt-2 flex items-center gap-1 truncate text-[11px] text-text-2">
          <MapPin size={11} strokeWidth={2} className="flex-shrink-0 text-text-3" />
          <span className="truncate">{cliente.ciudad}</span>
        </div>
      )}

      {cliente.email && (
        <div className="mt-1 flex items-center gap-1 truncate text-[11px] text-text-2">
          <Mail size={11} strokeWidth={2} className="flex-shrink-0 text-text-3" />
          <span className="truncate">{cliente.email}</span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[11px] text-text-2">
        <span className="truncate">{cliente.contacto || "Sin contacto"}</span>
        {cliente.contacto && cliente.cargoContacto && <Tag>{cliente.cargoContacto}</Tag>}
      </div>
    </div>
  );
}
