"use client";

import { MapPin, Pencil } from "lucide-react";
import { Avatar, Badge, Tag } from "@/components/ui/primitives";
import type { Cliente } from "@/types/api";

export function ClienteCard({ cliente, onOpen }: { cliente: Cliente; onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      className="min-h-[152px] cursor-pointer rounded-[var(--radius-md)] border border-border bg-surface p-4 transition-shadow hover:border-text hover:shadow-sm"
    >
      <div className="flex items-start gap-2.5">
        <Avatar nombre={cliente.nombre} size="md" />
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

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px] text-text-2">
        <div className="flex min-w-0 items-center gap-2">
          <Badge bg="var(--success-light)" color="var(--success)">
            Activo
          </Badge>
          <span className="truncate">{cliente.contacto || "Sin contacto"}</span>
        </div>
        <div className="flex items-center gap-2">
          {cliente.contacto && cliente.cargoContacto && <Tag>{cliente.cargoContacto}</Tag>}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            aria-label={`Abrir ${cliente.nombre}`}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-text-2 hover:bg-gray-light hover:text-text"
          >
            <Pencil size={13} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
