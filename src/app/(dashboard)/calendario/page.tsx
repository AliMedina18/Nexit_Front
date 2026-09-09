"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActiveFilters, Button, type FilterChip } from "@/components/ui/primitives";
import { Select } from "@/components/ui/form";
import { calendarioApi } from "@/services/api/calendario-service";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useProjectsStore } from "@/store/projects-store";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
import type { Proyecto, ProyectoCalendarioItem, ProyectoInput } from "@/types/api";
import { ProjectDetail } from "../proyectos/ProjectDetail";
import { ProjectFormModal } from "../proyectos/ProjectFormModal";
import { CalendarGrid, type CalendarEntry } from "./CalendarGrid";
import styles from "@/styles/dashboard.module.css";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const BRIEF_ESTADOS = ["Pendiente por enviar", "Entregado, a espera de respuesta", "Requiere ajustes", "Aprobado"];

export default function CalendarioPage() {
  const { items: projects, error: projectsError, fetchAll, updateProject, removeProject } = useProjectsStore();
  const { items: providers, fetchAll: fetchProviders } = useProvidersStore();
  const { estadosProyecto, fasesProyecto, fetchBase } = useCatalogosStore();
  const pushToast = useUiStore((s) => s.pushToast);

  useEffect(() => {
    fetchAll();
    fetchProviders();
    fetchBase();
  }, [fetchAll, fetchProviders, fetchBase]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [filtEstadoId, setFiltEstadoId] = useState("");
  const [filtBrief, setFiltBrief] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [monthItems, setMonthItems] = useState<ProyectoCalendarioItem[]>([]);
  const [monthError, setMonthError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const estadoNombrePorId = useMemo(
    () => Object.fromEntries(estadosProyecto.map((e) => [e.id, e.nombre])),
    [estadosProyecto],
  );

  // Fuente de verdad de "qué proyectos van en este mes y en qué día" -- GET /api/calendario/{anio}/{mes}
  // (docs/07, docs/18): el backend decide el mes/día según la hora LOCAL de la sede de cada proyecto
  // (`fechaEventoLocal`), no según UTC. Antes esto se recalculaba acá cortando `fechaEvento` (UTC) del
  // store de proyectos, lo que corría un proyecto de sede al día/mes siguiente cerca de medianoche.
  useEffect(() => {
    let cancelled = false;
    // Limpiar el error del mes anterior antes de pedir el nuevo; si no, se queda un mensaje viejo
    // visible mientras carga.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMonthError(null);
    calendarioApi
      .proyectosDelMes(year, monthIndex + 1)
      .then((items) => {
        if (!cancelled) setMonthItems(items);
      })
      .catch((err) => {
        if (!cancelled) setMonthError(err instanceof Error ? err.message : "No se pudo cargar el calendario de este mes");
      });
    return () => {
      cancelled = true;
    };
  }, [year, monthIndex]);

  function goToMonth(delta: number) {
    const d = new Date(year, monthIndex + delta, 1);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
  }

  function goToday() {
    setYear(now.getFullYear());
    setMonthIndex(now.getMonth());
  }

  // Cruce entre lo que trajo el calendario para este mes (`monthItems`, ya bucketed por día local
  // de sede) y el `Proyecto` completo del store -- ahí viven `estadoId`/`estadoBrief` (para filtrar
  // igual que antes) y `proveedorIds` (para el badge "sin proveedor"), que la proyección liviana del
  // calendario no trae a propósito (docs/07). Si un proyecto todavía no está en el store (carrera con
  // `fetchAll`), se muestra igual sin poder aplicarle los filtros de estado/brief.
  const monthProjects: CalendarEntry[] = useMemo(() => {
    const porId = new Map(projects.map((p) => [p.id, p]));
    return monthItems
      .filter((item) => {
        const full = porId.get(item.id);
        if (!full) return true;
        return (!filtEstadoId || full.estadoId === filtEstadoId) && (!filtBrief || full.estadoBrief === filtBrief);
      })
      .map((item) => {
        const full = porId.get(item.id);
        return {
          id: item.id,
          nombre: item.nombre,
          fechaEventoLocal: item.fechaEventoLocal,
          estadoNombre: item.estadoNombre,
          sinProveedor: (full?.proveedorIds.length ?? 0) === 0,
        };
      });
  }, [monthItems, projects, filtEstadoId, filtBrief]);

  const sinProveedor = monthProjects.filter((p) => p.sinProveedor).length;

  const chips: FilterChip[] = [
    filtEstadoId && { key: "estado", label: estadoNombrePorId[filtEstadoId] ?? "" },
    filtBrief && { key: "brief", label: filtBrief },
  ].filter(Boolean) as FilterChip[];

  const detailProject = detailId ? (projects.find((p) => p.id === detailId) ?? null) : null;

  async function handleSave(input: ProyectoInput) {
    try {
      if (editing) {
        await updateProject(editing.id, input);
        pushToast("Proyecto actualizado", "success");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo guardar el proyecto", "danger");
    }
  }

  // El "¿Eliminar a X?" ya lo confirma el diálogo propio de DeleteOrRequestButton (dentro de
  // ProjectFormModal) -- esto solo se llama después de que un admin confirma ahí.
  async function handleDelete(id: string) {
    try {
      await removeProject(id);
      setDetailId(null);
      setFormOpen(false);
      setEditing(null);
      pushToast("Proyecto eliminado", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar el proyecto", "danger");
    }
  }

  return (
    <div>
      <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Operación</div>
      <h1 className={styles.h1}>Calendario</h1>
      <p className="mb-5 text-[13px] text-text-2">Qué eventos hay cada mes, según la fecha del evento.</p>

      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToMonth(-1)}
            aria-label="Mes anterior"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-(--radius-md) border border-border bg-surface text-text-2 hover:bg-gray-light"
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
          <button
            onClick={() => goToMonth(1)}
            aria-label="Mes siguiente"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-(--radius-md) border border-border bg-surface text-text-2 hover:bg-gray-light"
          >
            <ChevronRight size={15} strokeWidth={2} />
          </button>
        </div>
        <h3 className="text-[15px] font-semibold">
          {MONTH_NAMES[monthIndex]} {year}
        </h3>
        <Button size="sm" onClick={goToday}>
          Hoy
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {sinProveedor > 0 && (
            <span className="rounded-(--radius-md) bg-red-light px-2 py-0.5 text-[11px] font-medium text-red">
              {sinProveedor} sin proveedor
            </span>
          )}
          <div className={styles.filters2}>
            <Select value={filtEstadoId} onChange={(e) => setFiltEstadoId(e.target.value)}>
              <option value="">Todos los estados</option>
              {[...fasesProyecto]
                .sort((a, b) => a.fase - b.fase)
                .map((fase) => (
                  <optgroup key={fase.fase} label={`Fase ${fase.fase} · ${fase.nombre}`}>
                    {estadosProyecto
                      .filter((e) => e.fase === fase.fase)
                      .sort((a, b) => a.orden - b.orden)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre}
                        </option>
                      ))}
                  </optgroup>
                ))}
            </Select>
            <Select value={filtBrief} onChange={(e) => setFiltBrief(e.target.value)}>
              <option value="">Todos los estados de brief</option>
              {BRIEF_ESTADOS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <ActiveFilters
        chips={chips}
        onRemove={(key) => (key === "estado" ? setFiltEstadoId("") : setFiltBrief(""))}
        onClearAll={() => {
          setFiltEstadoId("");
          setFiltBrief("");
        }}
      />

      {(projectsError || monthError) && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-(--radius-md) bg-red-light px-3.5 py-2.5 text-[13px] text-red">
          <span>{projectsError || monthError}</span>
          <Button
            size="sm"
            onClick={() => {
              fetchAll();
              calendarioApi
                .proyectosDelMes(year, monthIndex + 1)
                .then(setMonthItems)
                .then(() => setMonthError(null))
                .catch((err) => setMonthError(err instanceof Error ? err.message : "No se pudo cargar el calendario de este mes"));
            }}
          >
            Reintentar
          </Button>
        </div>
      )}

      <div className="mt-1">
        <CalendarGrid year={year} monthIndex={monthIndex} entries={monthProjects} today={today} onOpen={setDetailId} />
      </div>

      <ProjectDetail
        project={detailProject}
        providers={providers}
        onClose={() => setDetailId(null)}
        onEdit={() => {
          setEditing(detailProject);
          setFormOpen(true);
        }}
      />

      <ProjectFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        onDelete={() => editing && handleDelete(editing.id)}
        editing={editing}
        providers={providers}
      />
    </div>
  );
}
