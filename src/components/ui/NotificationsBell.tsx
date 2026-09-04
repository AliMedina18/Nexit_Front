"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Bell } from "lucide-react";
import { notificacionesApi } from "@/services/api/notificaciones-service";
import type { Notificacion } from "@/types/api";

/** A qué pantalla manda cada tipo de entidad -- "proyectos" ya sabe abrir el detalle directo
 * vía ?open=id (ver proyectos/page.tsx); clientes y proveedores todavía no leen ese query
 * param, así que ahí el clic solo lleva a la lista (mejor que no ir a ningún lado). */
const RUTA_POR_ENTIDAD: Record<string, string> = {
  cliente: "/clientes",
  proveedor: "/proveedores",
  proyecto: "/proyectos",
};

/**
 * Campana de notificaciones del topbar -- ported 2026-09-03 del panel del mockup aprobado
 * (borde negro, encabezado simple, filas separadas por línea, "No hay nada pendiente por
 * ahora."). El mockup agrupa ahí "Solicitudes de eliminación" y "A quién atender primero",
 * pero esas son vistas sintéticas del propio prototipo (recalculadas en el cliente sobre sus
 * datos de ejemplo) -- el backend real ya tiene su propio NotificacionesController con una
 * bandeja genérica (tipo/título/mensaje), así que se respeta esa fuente real en vez de
 * inventar la categorización de dos secciones sin saber si el `tipo` del backend distingue
 * eso. Si `tipoEntidad`+`entidadId` vienen en la notificación, el clic navega a la pantalla
 * de esa entidad (dato real, no estaba antes).
 */
export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    notificacionesApi
      .misNotificaciones()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((n) => !n.leida).length;

  async function markRead(n: Notificacion) {
    if (!n.leida) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
      try {
        await notificacionesApi.marcarLeida(n.id);
      } catch {
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: false } : x)));
      }
    }
    setOpen(false);
    const ruta = n.tipoEntidad ? RUTA_POR_ENTIDAD[n.tipoEntidad] : undefined;
    if (ruta) router.push(n.tipoEntidad === "proyecto" && n.entidadId ? `${ruta}?open=${n.entidadId}` : ruta);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-transparent text-text transition-colors hover:bg-gray-light"
      >
        <Bell size={17} strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red px-1 text-[10px] font-semibold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1.5 max-h-[70vh] w-[340px] overflow-y-auto rounded-[var(--radius-lg)] border border-text bg-surface shadow-[0_16px_44px_rgba(12,12,12,0.18)]"
        >
          <div className="border-b border-border px-4 py-3 text-[13px] font-semibold">Notificaciones</div>
          {loading ? (
            <div className="px-3.5 py-6 text-center text-[13px] text-text-3">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="px-3.5 py-6 text-center text-[13px] text-text-3">No hay nada pendiente por ahora.</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                role="menuitem"
                onClick={() => markRead(n)}
                className={clsx(
                  "flex w-full flex-col gap-0.5 border-b border-[#EFEDE7] px-3.5 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[#F4F3EF]",
                  !n.leida && "bg-teal-light/50",
                )}
              >
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-text">
                  {!n.leida && <span aria-hidden className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green" />}
                  {n.titulo}
                </span>
                <span className="text-[12px] leading-snug text-text-2">{n.mensaje}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
