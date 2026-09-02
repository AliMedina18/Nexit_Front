"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { BarChart3, Bookmark, CalendarDays, Download, Minus, Printer, TrendingDown, TrendingUp } from "lucide-react";
import { Badge, Button, TabButton, TabsShell } from "@/components/ui/primitives";
import { Spinner } from "@/components/ui/Spinner";
import { BRIEF_STATUS_COLORS, PROJECT_STATUS_COLORS, statusColor } from "@/lib/constants";
import { downloadBlob } from "@/lib/download-file";
import { fmtDay } from "@/lib/format";
import { deltaLabel, miniDelta, periodKey, periodRange, previousPeriodDate, type InformeMode } from "@/lib/informe";
import type { Delta } from "@/lib/informe";
import { informesApi } from "@/services/api/informes-service";
import { ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useClientesStore } from "@/store/clientes-store";
import { useProjectsStore } from "@/store/projects-store";
import { useUiStore } from "@/store/ui-store";
import type { InformeResumen, InformeSnapshot } from "@/types/api";
import styles from "@/styles/dashboard.module.css";

function DeltaTag({ delta }: { delta: Delta | null }) {
  if (!delta) return null;
  const Icon = delta.cls === "up" ? TrendingUp : delta.cls === "down" ? TrendingDown : Minus;
  return (
    <div
      className={clsx(
        "mt-1.5 flex items-center gap-1 text-xs font-semibold",
        delta.cls === "up" && "text-teal",
        delta.cls === "down" && "text-red",
        delta.cls === "flat" && "text-text-3",
      )}
    >
      <Icon size={12} strokeWidth={2.5} className="flex-shrink-0" />
      {delta.text}
    </div>
  );
}

export default function InformePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { items: projects, fetchAll: fetchProjects } = useProjectsStore();
  const { items: clientes, fetchAll: fetchClientes } = useClientesStore();
  const { estadosProyecto, fetchBase } = useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);

  const puedeVer = user?.rol === "admin" || user?.rol === "super_admin";

  const [mode, setMode] = useState<InformeMode>("semanal");
  const [current, setCurrent] = useState<InformeResumen | null>(null);
  const [prev, setPrev] = useState<InformeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadResumen = useCallback(async () => {
    setLoading(true);
    try {
      const resumen = await informesApi.resumen();
      setCurrent(resumen);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo cargar el informe", "danger");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  const loadPrev = useCallback(async () => {
    try {
      const key = periodKey(mode, previousPeriodDate(mode));
      const snap = await informesApi.snapshot(mode, key);
      setPrev(snap);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 404) {
        setPrev(null);
      } else {
        setPrev(null);
      }
    }
  }, [mode]);

  useEffect(() => {
    if (!puedeVer) return;
    fetchProjects();
    fetchClientes();
    fetchBase();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial resumen load on mount/mode change
    loadResumen();
  }, [puedeVer, fetchProjects, fetchClientes, fetchBase, loadResumen]);

  useEffect(() => {
    if (!puedeVer) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial previous-period snapshot load on mount/mode change
    loadPrev();
  }, [puedeVer, loadPrev]);

  const periodWord = mode === "mensual" ? "el mes" : "la semana";
  const { start, end } = useMemo(() => periodRange(mode), [mode]);

  const periodoLabel =
    mode === "mensual"
      ? start
          .toLocaleDateString("es-CO", { month: "long", year: "numeric" })
          .replace(/^./, (c) => c.toUpperCase())
      : `${fmtDay(start)} – ${fmtDay(end)}, ${start.getFullYear()}`;

  const compLabel = prev
    ? `Comparado contra el snapshot guardado de ${prev.periodoKey}`
    : `Aún no hay ningún snapshot anterior guardado para comparar ${periodWord}.`;

  const rangeProjects = useMemo(
    () =>
      projects.filter((p) => {
        const fecha = p.fechaEvento?.slice(0, 10);
        if (!fecha) return false;
        const f = new Date(`${fecha}T00:00:00`);
        return f >= start && f <= end;
      }),
    [projects, start, end],
  );

  const estadoNombrePorId = useMemo(
    () => Object.fromEntries(estadosProyecto.map((e) => [e.id, e.nombre])),
    [estadosProyecto],
  );
  const clienteNombrePorId = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c.nombre])), [clientes]);

  const allStatuses = current ? Object.keys(current.porEstado) : [];
  const allBriefs = current ? Object.keys(current.porBrief) : [];

  async function handleSaveSnapshot() {
    setSaving(true);
    try {
      const key = periodKey(mode);
      await informesApi.crearSnapshot({ tipo: mode, periodoKey: key });
      pushToast(mode === "mensual" ? "Snapshot de este mes guardado" : "Snapshot de esta semana guardado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo guardar el snapshot", "danger");
    } finally {
      setSaving(false);
    }
  }

  function openProject(id: string) {
    router.push(`/proyectos?open=${id}`);
  }

  async function exportarExcel() {
    setExporting(true);
    try {
      const { blob, fileName } = await informesApi.exportarResumen();
      downloadBlob(blob, fileName);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo exportar el informe", "danger");
    } finally {
      setExporting(false);
    }
  }

  if (!puedeVer) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center text-text-2">
        <BarChart3 size={28} strokeWidth={1.5} className="text-text-3" />
        <div className="text-[13px]">Los informes están disponibles solo para administradores.</div>
      </div>
    );
  }

  const sortedAll = [...projects].sort((a, b) => (a.fechaEvento || "").localeCompare(b.fechaEvento || ""));
  const sortedRange = [...rangeProjects].sort((a, b) => (a.fechaEvento || "").localeCompare(b.fechaEvento || ""));

  return (
    <div className="print-area">
      <div className="mb-5">
        <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Operación</div>
        <h1 className={styles.h1}>Informes</h1>
        <p className="text-[13px] text-text-2">
          Resumen de la operación, evolución del periodo y estado de los proyectos.
        </p>
      </div>
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="inline-flex items-center gap-1.5 text-base font-semibold">
            <BarChart3 size={16} strokeWidth={2} />
            Informe <span>{mode}</span> · {periodoLabel}
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
          <Button icon={exporting ? undefined : Download} onClick={exportarExcel} disabled={exporting}>
            {exporting ? <Spinner label="Exportando…" /> : "Exportar Excel"}
          </Button>
          <Button icon={Printer} onClick={() => window.print()}>
            Imprimir / PDF
          </Button>
          <Button variant="primary" icon={Bookmark} onClick={handleSaveSnapshot} disabled={saving}>
            {saving ? "Guardando…" : `Guardar snapshot de ${mode === "mensual" ? "este mes" : "esta semana"}`}
          </Button>
        </div>
      </div>

      {loading || !current ? (
        <div className="py-10 text-center text-[13px] text-text-3">Cargando informe…</div>
      ) : (
        <>
          <Section title={`Resumen general · ${periodoLabel}`}>
            <div className={styles.kpis5}>
              <MetricCard n={current.totalProveedores} label="Proveedores totales" delta={deltaLabel(current.totalProveedores, prev?.totalProveedores, periodWord)} />
              <MetricCard n={current.totalClientes} label="Clientes totales" delta={deltaLabel(current.totalClientes, prev?.totalClientes, periodWord)} />
              <MetricCard n={current.totalProyectos} label="Proyectos totales" delta={deltaLabel(current.totalProyectos, prev?.totalProyectos, periodWord)} />
              <MetricCard n={rangeProjects.length} label={`Proyectos ${mode === "mensual" ? "este mes" : "esta semana"}`} />
              <MetricCard
                n={current.proyectosSinProveedor}
                label="Proyectos sin proveedor"
                danger={current.proyectosSinProveedor > 0}
                delta={deltaLabel(current.proyectosSinProveedor, prev?.proyectosSinProveedor, periodWord)}
              />
            </div>
          </Section>

          <Section title="Proyecto y estado">
            {sortedAll.length === 0 ? (
              <Empty text="No hay proyectos registrados." />
            ) : (
              sortedAll.map((p) => {
                const estadoNombre = estadoNombrePorId[p.estadoId] ?? "—";
                const st = statusColor(PROJECT_STATUS_COLORS, estadoNombre);
                const fecha = p.fechaEvento?.slice(0, 10);
                return (
                  <BreakdownRow key={p.id} onClick={() => openProject(p.id)}>
                    <span className="flex-1 text-[13px]">
                      {p.nombre}{" "}
                      <span className="inline-flex items-center gap-1 text-text-3">
                        · <CalendarDays size={11} strokeWidth={2} />
                        {fecha ? fmtDay(new Date(`${fecha}T00:00:00`)) : "sin fecha"}
                      </span>
                    </span>
                    <Badge bg={st.bg} color={st.c}>
                      {estadoNombre}
                    </Badge>
                  </BreakdownRow>
                );
              })
            )}
          </Section>

          <Section title="Proyectos por estado (las 3 fases)">
            {allStatuses.map((k) => {
              const st = statusColor(PROJECT_STATUS_COLORS, k);
              const cnt = current.porEstado[k] || 0;
              const delta = miniDelta(cnt, prev?.porEstado?.[k]);
              return (
                <BreakdownRow key={k}>
                  <Badge bg={st.bg} color={st.c}>
                    {k}
                  </Badge>
                  <span className="flex-1" />
                  <span className="font-semibold">{cnt}</span>
                  {delta && (
                    <span
                      className={clsx(
                        "min-w-[34px] text-right text-xs font-semibold",
                        delta.cls === "up" && "text-teal",
                        delta.cls === "down" && "text-red",
                        delta.cls === "flat" && "text-text-3",
                      )}
                    >
                      {delta.text}
                    </span>
                  )}
                </BreakdownRow>
              );
            })}
          </Section>

          <Section title="Estado de entrega de brief">
            {allBriefs.map((k) => {
              const st = statusColor(BRIEF_STATUS_COLORS, k);
              const cnt = current.porBrief[k] || 0;
              const delta = miniDelta(cnt, prev?.porBrief?.[k]);
              return (
                <BreakdownRow key={k}>
                  <Badge bg={st.bg} color={st.c}>
                    {k}
                  </Badge>
                  <span className="flex-1" />
                  <span className="font-semibold">{cnt}</span>
                  {delta && (
                    <span
                      className={clsx(
                        "min-w-[34px] text-right text-xs font-semibold",
                        delta.cls === "up" && "text-teal",
                        delta.cls === "down" && "text-red",
                        delta.cls === "flat" && "text-text-3",
                      )}
                    >
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
              sortedRange.map((p) => {
                const estadoNombre = estadoNombrePorId[p.estadoId] ?? "—";
                const st = statusColor(PROJECT_STATUS_COLORS, estadoNombre);
                const fecha = p.fechaEvento?.slice(0, 10) ?? "";
                return (
                  <BreakdownRow key={p.id} onClick={() => openProject(p.id)}>
                    <span className="inline-flex flex-1 items-center gap-1 text-[13px]">
                      <CalendarDays size={11} strokeWidth={2} className="flex-shrink-0 text-text-3" />
                      {fecha ? fmtDay(new Date(`${fecha}T00:00:00`)) : "—"} · {p.nombre}{" "}
                      <span className="text-text-3">· {clienteNombrePorId[p.clienteId ?? ""] || "—"}</span>
                    </span>
                    <Badge bg={st.bg} color={st.c}>
                      {estadoNombre}
                    </Badge>
                  </BreakdownRow>
                );
              })
            )}
          </Section>
        </>
      )}
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
