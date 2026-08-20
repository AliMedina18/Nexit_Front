"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Badge, Button, TabButton, TabsShell } from "@/components/ui/primitives";
import { PROJECT_STATUS_COLORS, BRIEF_STATUS_COLORS } from "@/lib/constants";
import { downloadCSV, toCSV } from "@/lib/csv";
import { fmtDay } from "@/lib/format";
import {
  computeMetrics,
  deltaLabel,
  miniDelta,
  periodRange,
  type InformeMode,
} from "@/lib/informe";
import { getPreviousSnapshot, saveSnapshot } from "@/lib/snapshot-storage";
import { useProjectsStore } from "@/store/projects-store";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
import type { Delta } from "@/lib/informe";

function DeltaTag({ delta }: { delta: Delta | null }) {
  if (!delta) return null;
  return (
    <div
      className={clsx(
        "mt-1.5 flex items-center gap-1 text-xs font-semibold",
        delta.cls === "up" && "text-teal",
        delta.cls === "down" && "text-red",
        delta.cls === "flat" && "text-text-3",
      )}
    >
      {delta.text}
    </div>
  );
}

export default function InformePage() {
  const router = useRouter();
  const { items: providers, fetchAll: fetchProviders } = useProvidersStore();
  const { items: projects, fetchAll: fetchProjects } = useProjectsStore();
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    fetchProviders();
    fetchProjects();
  }, [fetchProviders, fetchProjects]);

  const [mode, setMode] = useState<InformeMode>("semanal");
  const [, forceRerender] = useState(0);

  const periodWord = mode === "mensual" ? "el mes" : "la semana";
  const { start, end } = useMemo(() => periodRange(mode), [mode]);

  const periodoLabel =
    mode === "mensual"
      ? start
          .toLocaleDateString("es-CO", { month: "long", year: "numeric" })
          .replace(/^./, (c) => c.toUpperCase())
      : `${fmtDay(start)} – ${fmtDay(end)}, ${start.getFullYear()}`;

  const current = useMemo(() => computeMetrics(providers, projects), [providers, projects]);
  const prev = useMemo(() => getPreviousSnapshot(mode), [mode, providers, projects]); // eslint-disable-line react-hooks/exhaustive-deps

  const compLabel = prev
    ? `Comparado contra el snapshot guardado de ${mode === "mensual" ? "" : "la semana "}${prev.key.replace(
        mode === "mensual" ? "snapshot-month:" : "snapshot-week:",
        "",
      )}`
    : `Aún no hay ningún snapshot anterior guardado para comparar ${periodWord}.`;

  const rangeProjects = useMemo(
    () =>
      projects.filter((p) => {
        if (!p.fecha) return false;
        const f = new Date(`${p.fecha}T00:00:00`);
        return f >= start && f <= end;
      }),
    [projects, start, end],
  );

  const allStatuses = Object.keys(current.porEstado) as (keyof typeof PROJECT_STATUS_COLORS)[];
  const allBriefs = Object.keys(current.porBrief) as (keyof typeof BRIEF_STATUS_COLORS)[];

  function handleSaveSnapshot() {
    saveSnapshot(mode, current);
    pushToast(mode === "mensual" ? "Snapshot de este mes guardado" : "Snapshot de esta semana guardado", "📌");
    forceRerender((n) => n + 1);
  }

  function openProject(id: number) {
    router.push(`/proyectos?open=${id}`);
  }

  function exportInformeCSV() {
    const rows: (string | number)[][] = [
      [`Informe ${mode} Nexus`, ""],
      [mode === "mensual" ? "Mes" : "Semana", `${start.toISOString().slice(0, 10)} a ${end.toISOString().slice(0, 10)}`],
      ["", ""],
      ["Métrica", "Valor"],
      ["Proveedores totales", current.totalProveedores],
      ["Proyectos totales", current.totalProyectos],
      ["Proyectos sin proveedor asignado", current.sinProveedor],
      ["", ""],
      ["Proyecto", "Fecha", "Estado"],
      ...[...projects]
        .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))
        .map((p) => [p.nombre, p.fecha || "", p.estado]),
    ];
    const [titleRow, ...restRows] = rows;
    downloadCSV(`informe-${mode}.csv`, toCSV(titleRow.map(String), restRows));
  }

  const sortedAll = [...projects].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const sortedRange = [...rangeProjects].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));

  return (
    <div className="print-area">
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            📊 Informe <span>{mode}</span> · {periodoLabel}
          </h3>
          <div className="text-xs text-text-2">{compLabel}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TabsShell>
            <TabButton active={mode === "semanal"} onClick={() => setMode("semanal")}>
              Semanal
            </TabButton>
            <TabButton active={mode === "mensual"} onClick={() => setMode("mensual")}>
              Mensual
            </TabButton>
          </TabsShell>
          <Button onClick={exportInformeCSV}>⬇ Exportar CSV</Button>
          <Button onClick={() => window.print()}>🖨 Imprimir / PDF</Button>
          <Button variant="primary" onClick={handleSaveSnapshot}>
            📌 Guardar snapshot de {mode === "mensual" ? "este mes" : "esta semana"}
          </Button>
        </div>
      </div>

      <Section title={`Resumen general · ${periodoLabel}`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard n={current.totalProveedores} label="Proveedores totales" delta={deltaLabel(current.totalProveedores, prev?.data.totalProveedores, periodWord)} />
          <MetricCard n={current.totalProyectos} label="Proyectos totales" delta={deltaLabel(current.totalProyectos, prev?.data.totalProyectos, periodWord)} />
          <MetricCard n={rangeProjects.length} label={`Proyectos ${mode === "mensual" ? "este mes" : "esta semana"}`} />
          <MetricCard
            n={current.sinProveedor}
            label="Proyectos sin proveedor"
            danger={current.sinProveedor > 0}
            delta={deltaLabel(current.sinProveedor, prev?.data.sinProveedor, periodWord)}
          />
        </div>
      </Section>

      <Section title="Proyecto y estado">
        {sortedAll.length === 0 ? (
          <Empty text="No hay proyectos registrados." />
        ) : (
          sortedAll.map((p) => (
            <BreakdownRow key={p.id} onClick={() => openProject(p.id)}>
              <span className="flex-1 text-[13px]">
                {p.nombre} <span className="text-text-3">· 📅 {p.fecha ? fmtDay(new Date(`${p.fecha}T00:00:00`)) : "sin fecha"}</span>
              </span>
              <Badge bg={PROJECT_STATUS_COLORS[p.estado].bg} color={PROJECT_STATUS_COLORS[p.estado].c}>
                {p.estado}
              </Badge>
            </BreakdownRow>
          ))
        )}
      </Section>

      <Section title="Proyectos por estado (las 3 fases)">
        {allStatuses.map((k) => {
          const st = PROJECT_STATUS_COLORS[k as keyof typeof PROJECT_STATUS_COLORS];
          const cnt = current.porEstado[k] || 0;
          const delta = miniDelta(cnt, prev?.data.porEstado?.[k]);
          return (
            <BreakdownRow key={k}>
              <Badge bg={st.bg} color={st.c}>
                {k}
              </Badge>
              <span className="flex-1" />
              <span className="font-semibold">{cnt}</span>
              {delta && (
                <span className={clsx("min-w-[34px] text-right text-xs font-semibold", delta.cls === "up" && "text-teal", delta.cls === "down" && "text-red", delta.cls === "flat" && "text-text-3")}>
                  {delta.text}
                </span>
              )}
            </BreakdownRow>
          );
        })}
      </Section>

      <Section title="Estado de entrega de brief">
        {allBriefs.map((k) => {
          const st = BRIEF_STATUS_COLORS[k as keyof typeof BRIEF_STATUS_COLORS];
          const cnt = current.porBrief[k] || 0;
          const delta = miniDelta(cnt, prev?.data.porBrief?.[k]);
          return (
            <BreakdownRow key={k}>
              <Badge bg={st.bg} color={st.c}>
                📋 {k}
              </Badge>
              <span className="flex-1" />
              <span className="font-semibold">{cnt}</span>
              {delta && (
                <span className={clsx("min-w-[34px] text-right text-xs font-semibold", delta.cls === "up" && "text-teal", delta.cls === "down" && "text-red", delta.cls === "flat" && "text-text-3")}>
                  {delta.text}
                </span>
              )}
            </BreakdownRow>
          );
        })}
      </Section>

      <Section title={`Proyectos programados ${mode === "mensual" ? "este mes" : "esta semana"} (${fmtDay(start)} – ${fmtDay(end)})`}>
        {sortedRange.length === 0 ? (
          <Empty text={`No hay proyectos con fecha ${mode === "mensual" ? "este mes" : "esta semana"}.`} />
        ) : (
          sortedRange.map((p) => (
            <BreakdownRow key={p.id} onClick={() => openProject(p.id)}>
              <span className="flex-1 text-[13px]">
                📅 {fmtDay(new Date(`${p.fecha}T00:00:00`))} · {p.nombre}{" "}
                <span className="text-text-3">· {p.cliente || "—"}</span>
              </span>
              <Badge bg={PROJECT_STATUS_COLORS[p.estado].bg} color={PROJECT_STATUS_COLORS[p.estado].c}>
                {p.estado}
              </Badge>
            </BreakdownRow>
          ))
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5.5">
      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-text-3">{title}</h4>
      {children}
    </div>
  );
}

function MetricCard({ n, label, delta, danger }: { n: number; label: string; delta?: Delta; danger?: boolean }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3.5">
      <div className="text-2xl font-semibold leading-none" style={{ color: danger ? "var(--red)" : "inherit" }}>
        {n}
      </div>
      <div className="mt-1 text-xs text-text-2">{label}</div>
      {delta && <DeltaTag delta={delta} />}
    </div>
  );
}

function BreakdownRow({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2.5 border-b border-border py-1.5 text-[13px] last:border-b-0",
        onClick && "cursor-pointer hover:bg-gray-light",
      )}
    >
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="py-2.5 text-[13px] text-text-3">{text}</div>;
}
