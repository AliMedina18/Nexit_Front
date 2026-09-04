"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MessageCircle, Pencil, Plus } from "lucide-react";
import { Avatar, Badge, Dropdown, Stars } from "@/components/ui/primitives";
import {
  DetailBox,
  DetailRow,
  Drawer,
  DrawerCloseButton,
  DrawerFooter,
  DrawerHeader,
  DrawerIconButton,
} from "@/components/ui/Drawer";
import { EntityAttachments } from "@/components/ui/EntityAttachments";
import { Textarea } from "@/components/ui/form";
import { BRIEF_STATUS_COLORS, PROJECT_STATUS_COLORS, PROVIDER_STATUS_COLORS, statusColor } from "@/lib/constants";
import { fmtDateLong } from "@/lib/format";
import { proyectoAdjuntosApi } from "@/services/api/proyecto-adjuntos-service";
import { proyectosApi } from "@/services/api/proyectos-service";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useClientesStore } from "@/store/clientes-store";
import { useUiStore } from "@/store/ui-store";
import type { Proveedor, Proyecto, SeguimientoProyecto } from "@/types/api";

const AREAS_SEGUIMIENTO = ["General", "Comercial", "Producción", "Diseño", "Logística", "Facturación"];

/**
 * Sin botón de eliminar: aquí solo se mira y se puede editar. Eliminar (o
 * pedirlo) vive dentro del formulario de edición -- ver ProjectFormModal.
 */
export function ProjectDetail({
  project,
  providers,
  onClose,
  onEdit,
}: {
  project: Proyecto | null;
  providers: Proveedor[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const { estadosProyecto, categoriasProveedor, fetchBase } = useCatalogosStore();
  const { items: clientes, fetchAll: fetchClientes } = useClientesStore();

  useEffect(() => {
    fetchBase();
    fetchClientes();
  }, [fetchBase, fetchClientes]);

  if (!project) return <Drawer open={false} onClose={onClose} size="detail"><></></Drawer>;

  const estadoNombre = estadosProyecto.find((e) => e.id === project.estadoId)?.nombre ?? "—";
  const cliente = clientes.find((c) => c.id === project.clienteId) ?? null;
  const st = statusColor(PROJECT_STATUS_COLORS, estadoNombre);
  const bst = statusColor(BRIEF_STATUS_COLORS, project.estadoBrief);
  const assigned = project.proveedorIds.map((id) => providers.find((p) => p.id === id)).filter((p): p is Proveedor => Boolean(p));
  const primerTelefono = cliente?.telefonos[0]?.telefono;
  const whatsappHref = primerTelefono ? `https://wa.me/${primerTelefono.replace(/[^\d]/g, "")}` : null;
  const correoHref = cliente?.email ? `mailto:${cliente.email}` : null;
  const fechaEventoLabel = fmtDateLong(project.fechaEvento?.slice(0, 10)) || "Sin fecha";
  const fechaSolicitudLabel = fmtDateLong(project.fechaSolicitud?.slice(0, 10)) || "Sin fecha";
  const facturaLabel = project.pagado
    ? `${project.numeroFactura || "Sin número"} · Pagada`
    : project.numeroFactura
      ? `${project.numeroFactura} · Sin pagar`
      : "Sin facturar";

  return (
    <Drawer open={Boolean(project)} onClose={onClose} size="detail">
      <DrawerHeader>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold leading-tight tracking-[-0.025em]">{project.nombre || "(Sin nombre)"}</div>
          <div className="mt-[3px] text-[13px] text-text-3">{cliente?.nombre || "Sin cliente"}</div>
        </div>
        <div className="flex flex-shrink-0 gap-1.5">
          <DrawerIconButton label="Editar proyecto" onClick={onEdit}>
            <Pencil size={15} strokeWidth={1.8} />
          </DrawerIconButton>
          <DrawerCloseButton onClose={onClose} />
        </div>
      </DrawerHeader>

      <div className="flex flex-1 flex-col gap-[18px] p-[22px]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge bg={st.bg} color={st.c}>
            {estadoNombre}
          </Badge>
          <Badge bg={bst.bg} color={bst.c}>
            Brief: {project.estadoBrief}
          </Badge>
          <Badge bg="#F1EFE8" color="#0C0C0C">
            {fechaEventoLabel}
          </Badge>
          {(project.tipoProyecto || project.prioridad) && (
            <Badge bg="#F1EFE8" color="#0C0C0C">
              {[project.tipoProyecto, project.prioridad].filter(Boolean).join(" · ")}
            </Badge>
          )}
        </div>

        <DetailBox title="Avance">
          <div className="mb-3.5">
            <div className="mb-[9px] flex items-center justify-between text-sm">
              <span className="font-semibold">Avance</span>
              <span className="font-mono text-xs text-text-3">{project.porcentajeAvance}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-[20px] bg-[#EFEDE7]">
              <div className="h-full rounded-[20px] bg-text" style={{ width: `${project.porcentajeAvance}%` }} />
            </div>
          </div>
          <DetailRow k="Ciudad / sede" v={[project.ciudad, project.sedeNext].filter(Boolean).join(" · ") || "—"} />
          <DetailRow k="Solicitud → evento" v={`${fechaSolicitudLabel} → ${fechaEventoLabel}`} />
          <DetailRow k="Propuesta" v={project.propuestaEstado || "—"} />
          <DetailRow k="Factura" v={facturaLabel} />
          {project.fechaPago && <DetailRow k="Fecha de pago" v={fmtDateLong(project.fechaPago.slice(0, 10))} />}
        </DetailBox>

        <DetailBox title="Equipo">
          <DetailRow k="Contacto cliente" v={project.contactoProyecto || "—"} />
          {project.equipo.length === 0 ? (
            <DetailRow k="Miembros" v="—" />
          ) : (
            project.equipo.map((m, i) => <DetailRow key={m.id ?? i} k={m.rol || "Miembro"} v={m.nombre} />)
          )}
        </DetailBox>

        <DetailBox title="Proveedores asignados">
          {assigned.length === 0 ? (
            <p className="text-sm text-text-3">Sin proveedores asignados todavía.</p>
          ) : (
            <div className="flex flex-col">
              {assigned.map((p) => {
                const sc = statusColor(PROVIDER_STATUS_COLORS, p.estado);
                const catNombre = categoriasProveedor.find((c) => c.id === p.categoriaId)?.nombre;
                return (
                  <div key={p.id} className="flex items-center gap-2.5 border-b border-[#EFEDE7] py-2.5 last:border-b-0">
                    <Avatar nombre={p.nombre} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{p.nombre}</div>
                      <div className="truncate text-[11px] text-text-3">{catNombre}</div>
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
        </DetailBox>

        {project.notas && (
          <DetailBox title="Notas internas">
            <p className="border-l-2 border-green pl-3 text-sm leading-relaxed text-text-2">{project.notas}</p>
          </DetailBox>
        )}

        <DetailBox title="Archivos y enlaces" tone="plain">
          <EntityAttachments entityId={project.id} api={proyectoAdjuntosApi} />
        </DetailBox>

        <DetailBox title="Bitácora de seguimiento" tone="plain">
          <Bitacora proyectoId={project.id} />
        </DetailBox>
      </div>

      <DrawerFooter>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-w-[130px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-teal-mid px-3.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green hover:text-text"
          >
            <MessageCircle size={15} strokeWidth={1.8} />
            Escribir al cliente
          </a>
        )}
        {correoHref && (
          <a
            href={correoHref}
            className="inline-flex min-w-[130px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-transparent px-3.5 py-2.5 text-sm font-medium text-text transition-colors hover:border-text hover:bg-bg"
          >
            <ExternalLink size={15} strokeWidth={1.8} />
            Correo
          </a>
        )}
      </DrawerFooter>
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-border bg-bg p-3">
        <Dropdown value={area} onChange={(v) => setArea(v || AREAS_SEGUIMIENTO[0])} placeholder="Área" options={AREAS_SEGUIMIENTO.map((a) => ({ value: a, label: a }))} />
        <Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nueva nota para la bitácora…" className="!bg-surface" />
        <button
          type="button"
          disabled={saving || !nota.trim()}
          onClick={agregar}
          className="flex h-9 w-fit cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-md)] bg-teal-mid px-3 text-[13px] font-medium text-white transition-colors hover:bg-green hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={14} strokeWidth={2} />
          {saving ? "Guardando…" : "Agregar entrada"}
        </button>
      </div>

      {loading ? (
        <div className="py-1 text-sm text-text-3">Cargando bitácora…</div>
      ) : entradas.length === 0 ? (
        <div className="py-1 text-sm text-text-3">Todavía no hay notas de seguimiento.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {entradas.map((e) => (
            <div key={e.id} className="border-l-2 border-border pl-3 text-[13px]">
              <div className="flex flex-wrap items-baseline gap-2 font-mono text-[11px] text-text-3">
                <span className="font-semibold text-text">{e.area}</span>
                <span className="ml-auto">{fmtDateLong(e.fecha?.slice(0, 10))}</span>
              </div>
              <div className="leading-relaxed">{e.nota}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
