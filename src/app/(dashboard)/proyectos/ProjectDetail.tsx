"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Avatar, Badge, Button, Stars } from "@/components/ui/primitives";
import { DeleteOrRequestButton } from "@/components/ui/DeleteAction";
import { Drawer, DrawerCloseButton, DrawerHeader, DrawerSection, KeyValue, NoteBox } from "@/components/ui/Drawer";
import { Select, Textarea } from "@/components/ui/form";
import { BRIEF_STATUS_COLORS, PROJECT_STATUS_COLORS, PROVIDER_STATUS_COLORS, statusColor } from "@/lib/constants";
import { fmtDateLong } from "@/lib/format";
import { proyectosApi } from "@/services/api/proyectos-service";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useClientesStore } from "@/store/clientes-store";
import { useUiStore } from "@/store/ui-store";
import type { Proveedor, Proyecto, SeguimientoProyecto } from "@/types/api";

const AREAS_SEGUIMIENTO = ["General", "Comercial", "Producción", "Diseño", "Logística", "Facturación"];

export function ProjectDetail({
  project,
  providers,
  onClose,
  onEdit,
  onDelete,
}: {
  project: Proyecto | null;
  providers: Proveedor[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { estadosProyecto, categoriasProveedor, fetchBase } = useCatalogosStore();
  const { items: clientes, fetchAll: fetchClientes } = useClientesStore();

  useEffect(() => {
    fetchBase();
    fetchClientes();
  }, [fetchBase, fetchClientes]);

  if (!project) return <Drawer open={false} onClose={onClose}><></></Drawer>;

  const estadoNombre = estadosProyecto.find((e) => e.id === project.estadoId)?.nombre ?? "—";
  const clienteNombre = clientes.find((c) => c.id === project.clienteId)?.nombre;
  const st = statusColor(PROJECT_STATUS_COLORS, estadoNombre);
  const bst = statusColor(BRIEF_STATUS_COLORS, project.estadoBrief);
  const assigned = project.proveedorIds.map((id) => providers.find((p) => p.id === id)).filter((p): p is Proveedor => Boolean(p));

  return (
    <Drawer open={Boolean(project)} onClose={onClose}>
      <DrawerHeader>
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold leading-tight">{project.nombre || "(Sin nombre)"}</div>
          <div className="mt-0.5 text-[13px] text-text-2">{clienteNombre || "Sin cliente"}</div>
        </div>
        <DrawerCloseButton onClose={onClose} />
      </DrawerHeader>

      <div className="flex-1 p-5">
        <DrawerSection title="Estado" />
        <div className="flex flex-wrap gap-1.5">
          <Badge bg={st.bg} color={st.c}>
            {estadoNombre}
          </Badge>
          <Badge bg={bst.bg} color={bst.c}>
            {project.estadoBrief}
          </Badge>
        </div>
        <div className="mt-2 text-[11px] text-text-2">{project.porcentajeAvance}% de avance</div>

        <DrawerSection title="Evento" />
        <KeyValue k="Fecha de solicitud" v={fmtDateLong(project.fechaSolicitud?.slice(0, 10))} />
        <KeyValue k="Fecha del evento" v={fmtDateLong(project.fechaEvento?.slice(0, 10))} />
        <KeyValue k="Cliente" v={clienteNombre || "—"} />
        <KeyValue k="Contacto" v={project.contactoProyecto || "—"} />
        <KeyValue k="Tipo" v={project.tipoProyecto || "—"} />
        <KeyValue k="Prioridad" v={project.prioridad || "—"} />
        <KeyValue k="Ciudad" v={project.ciudad || "—"} />
        <KeyValue k="Sede Next" v={project.sedeNext || "—"} />

        <DrawerSection title="Facturación" />
        <KeyValue k="N.º de factura" v={project.numeroFactura || "—"} />
        <KeyValue k="Pagado" v={project.pagado ? "Sí" : "No"} />
        <KeyValue k="Fecha de pago" v={fmtDateLong(project.fechaPago?.slice(0, 10))} />

        {project.equipo.length > 0 && (
          <>
            <DrawerSection title="Equipo" />
            {project.equipo.map((m, i) => (
              <KeyValue key={m.id ?? i} k={m.rol || "Miembro"} v={m.nombre} />
            ))}
          </>
        )}

        {project.notas && (
          <>
            <DrawerSection title="Notas" />
            <NoteBox>{project.notas}</NoteBox>
          </>
        )}

        <DrawerSection title={`Proveedores asignados (${assigned.length})`} />
        {assigned.length === 0 ? (
          <div className="py-2 text-xs text-text-3">Aún no hay proveedores asignados a este proyecto.</div>
        ) : (
          <div className="flex flex-col">
            {assigned.map((p) => {
              const sc = statusColor(PROVIDER_STATUS_COLORS, p.estado);
              const catNombre = categoriasProveedor.find((c) => c.id === p.categoriaId)?.nombre;
              return (
                <div key={p.id} className="flex items-center gap-2.5 border-b border-border py-2.5 last:border-b-0">
                  <Avatar nombre={p.nombre} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{p.nombre}</div>
                    <div className="truncate text-[11px] text-text-2">{catNombre}</div>
                  </div>
                  {typeof p.score === "number" && <Stars n={p.score} />}
                  <Badge bg={sc.bg} color={sc.c} className="ml-1">
                    {p.estado}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        <DrawerSection title="Bitácora del proyecto" />
        <Bitacora proyectoId={project.id} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border p-4">
        <Button variant="primary" icon={Pencil} onClick={onEdit}>
          Editar
        </Button>
        <DeleteOrRequestButton tipoEntidad="proyecto" entidadId={project.id} onDelete={onDelete} />
      </div>
    </Drawer>
  );
}

function Bitacora({ proyectoId }: { proyectoId: string }) {
  const pushToast = useUiStore((s) => s.pushToast);
  const [entradas, setEntradas] = useState<SeguimientoProyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState(AREAS_SEGUIMIENTO[0]);
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial bitacora load on mount/proyectoId change
    setLoading(true);
    proyectosApi
      .listarSeguimiento(proyectoId)
      .then((items) => {
        if (!cancelled) setEntradas(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [proyectoId]);

  async function agregar() {
    if (!nota.trim()) return;
    setSaving(true);
    try {
      const creada = await proyectosApi.agregarSeguimiento(proyectoId, { area, nota: nota.trim() });
      setEntradas((prev) => [creada, ...prev]);
      setNota("");
      pushToast("Entrada agregada a la bitácora", "success");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo agregar la entrada", "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-2.5 flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-gray-light p-3">
        <div className="flex gap-1.5">
          <Select value={area} onChange={(e) => setArea(e.target.value)} className="w-[160px]">
            {AREAS_SEGUIMIENTO.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </div>
        <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nueva nota para la bitácora…" />
        <Button size="sm" icon={Plus} onClick={agregar} disabled={saving || !nota.trim()} className="self-start">
          {saving ? "Guardando…" : "Agregar entrada"}
        </Button>
      </div>

      {loading && <div className="py-2 text-center text-xs text-text-3">Cargando bitácora…</div>}
      {!loading && entradas.length === 0 && <div className="py-2 text-center text-xs text-text-3">Sin entradas todavía</div>}
      <div className="flex flex-col gap-2">
        {entradas.map((e) => (
          <div key={e.id} className="rounded-[var(--radius-md)] border border-border p-2.5">
            <div className="mb-1 flex items-center justify-between text-[11px] text-text-3">
              <span className="font-semibold uppercase tracking-wide">{e.area}</span>
              <span>{fmtDateLong(e.fecha?.slice(0, 10))}</span>
            </div>
            <div className="text-[13px] leading-relaxed">{e.nota}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
