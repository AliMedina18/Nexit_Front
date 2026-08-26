"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Project } from "@/types/domain";

const WEEKDAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface DayCell {
  date: Date;
  iso: string;
  inMonth: boolean;
  isToday: boolean;
}

function buildMonthMatrix(year: number, monthIndex: number, todayIso: string): DayCell[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const start = new Date(year, monthIndex, 1 - firstWeekday);

  return Array.from({ length: totalCells }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = date.toISOString().slice(0, 10);
    return { date, iso, inMonth: date.getMonth() === monthIndex, isToday: iso === todayIso };
  });
}

export function CalendarGrid({
  year,
  monthIndex,
  projects,
  today,
  onOpen,
}: {
  year: number;
  monthIndex: number;
  projects: Project[];
  today: string;
  onOpen: (id: number) => void;
}) {
  const cells = buildMonthMatrix(year, monthIndex, today);
  const byDay = new Map<string, Project[]>();
  projects.forEach((p) => {
    if (!p.fecha) return;
    const list = byDay.get(p.fecha) ?? [];
    list.push(p);
    byDay.set(p.fecha, list);
  });

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="grid grid-cols-7 border-b border-border bg-gray-light">
        {WEEKDAY_NAMES.map((d) => (
          <div key={d} className="px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-text-3">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const dayProjects = (byDay.get(cell.iso) ?? []).slice().sort((a, b) => a.nombre.localeCompare(b.nombre));
          return (
            <div
              key={cell.iso + i}
              className="flex min-h-[92px] flex-col gap-1 border-b border-r border-border p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0"
              style={{ background: cell.inMonth ? "var(--surface)" : "var(--bg)" }}
            >
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{
                  color: cell.isToday ? "#ffffff" : cell.inMonth ? "var(--text)" : "var(--text-3)",
                  background: cell.isToday ? "var(--teal-mid)" : "transparent",
                }}
              >
                {cell.date.getDate()}
              </span>
              <div className="flex flex-col gap-1">
                {dayProjects.map((p) => {
                  const ejecutado =
                    ["Finalizado", "Ejecutado, pendiente facturar", "Facturado"].includes(p.estado) ||
                    (p.fecha < today && p.estado !== "Cancelado");
                  const StatusIcon = p.estado === "Cancelado" ? XCircle : ejecutado ? CheckCircle2 : Clock;
                  const statusColor =
                    p.estado === "Cancelado" ? "var(--red)" : ejecutado ? "var(--teal-mid)" : "var(--text-3)";
                  return (
                    <button
                      key={p.id}
                      onClick={() => onOpen(p.id)}
                      title={p.nombre || "(Sin nombre)"}
                      className="flex cursor-pointer items-center gap-1 rounded-[6px] border-none bg-gray-light px-1.5 py-1 text-left hover:bg-border"
                    >
                      <StatusIcon size={10} strokeWidth={2.5} style={{ color: statusColor }} className="flex-shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight">
                        {p.nombre || "(Sin nombre)"}
                      </span>
                      {p.proveedorIds.length === 0 && (
                        <span
                          aria-label="Sin proveedor asignado"
                          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ background: "var(--red)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
