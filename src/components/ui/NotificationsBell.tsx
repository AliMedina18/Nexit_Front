"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Bell } from "lucide-react";
import { notificacionesApi } from "@/services/api/notificaciones-service";
import type { Notificacion } from "@/types/api";

/**
 * Campana de notificaciones del topbar -- faltaba por completo (no había
 * ningún botón de notificaciones antes de este cambio). Conecta contra
 * NotificacionesController real (Nexit_Back): GET /api/notificaciones al
 * montar, PUT .../marcar-leida al hacer clic en una. El HTML aprobado
 * también le agrega un número de prioridad a cada fila -- ese dato no
 * existe en el backend (`Notificacion` no lo trae), así que no se inventa:
 * se muestra título + mensaje, con las no leídas resaltadas.
 */
export function NotificationsBell() {
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
    if (n.leida) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
    try {
      await notificacionesApi.marcarLeida(n.id);
    } catch {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, leida: false } : x)));
    }
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
          className="absolute right-0 z-40 mt-1.5 max-h-[70vh] w-[320px] overflow-y-auto rounded-[var(--radius-lg)] border border-text bg-surface p-1.5 shadow-[0_12px_34px_rgba(12,12,12,0.16)]"
        >
          <div className="px-2.5 py-2 font-mono text-[11px] uppercase tracking-wide text-text-3">Notificaciones</div>
          {loading ? (
            <div className="px-2.5 py-6 text-center text-[13px] text-text-3">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="px-2.5 py-6 text-center text-[13px] text-text-3">No tienes notificaciones.</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                role="menuitem"
                onClick={() => markRead(n)}
                className={clsx(
                  "flex w-full flex-col gap-0.5 rounded-[3px] px-2.5 py-2 text-left hover:bg-gray-light",
                  !n.leida && "bg-teal-light/60",
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
