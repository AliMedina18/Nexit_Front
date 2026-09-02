"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Pencil, Upload, UserMinus, UserPlus, X } from "lucide-react";
import { Avatar, Badge, Button, CountryBadge, Stars, Tag } from "@/components/ui/primitives";
import { Spinner } from "@/components/ui/Spinner";
import { DeleteOrRequestButton } from "@/components/ui/DeleteAction";
import { Drawer, DrawerCloseButton, DrawerHeader, DrawerSection, KeyValue, NoteBox } from "@/components/ui/Drawer";
import { PROVIDER_STATUS_COLORS, statusColor } from "@/lib/constants";
import { fileIcon, fmtSize } from "@/lib/format";
import { toSafeHref } from "@/lib/url-safety";
import { proveedorAdjuntosApi } from "@/services/api/proveedor-adjuntos-service";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogosStore } from "@/store/catalogos-store";
import { useProvidersStore } from "@/store/providers-store";
import { useUiStore } from "@/store/ui-store";
import type { Proveedor, ProveedorAdjunto } from "@/types/api";

export function ProviderDetail({
  provider,
  onClose,
  onEdit,
  onDelete,
}: {
  provider: Proveedor | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pushToast = useUiStore((s) => s.pushToast);
  const user = useAuthStore((s) => s.user);
  const { marcarColaborador, quitarColaborador } = useProvidersStore();
  const { paises, categoriasProveedor, servicios, regionesPorPais, ciudadesPorRegion, fetchBase, fetchRegiones, fetchCiudades } =
    useCatalogosStore();

  useEffect(() => {
    if (!provider) return;
    fetchBase();
    if (provider.paisId) fetchRegiones(provider.paisId);
    if (provider.regionId) fetchCiudades(provider.regionId);
  }, [provider, fetchBase, fetchRegiones, fetchCiudades]);

  if (!provider) return <Drawer open={false} onClose={onClose}><></></Drawer>;

  const sc = statusColor(PROVIDER_STATUS_COLORS, provider.estado);
  const paisNombre = paises.find((p) => p.id === provider.paisId)?.nombre;
  const regionNombre = regionesPorPais[provider.paisId]?.find((r) => r.id === provider.regionId)?.nombre;
  const ciudadNombre = ciudadesPorRegion[provider.regionId ?? ""]?.find((c) => c.id === provider.ciudadId)?.nombre;
  const serviciosNombres = provider.servicioIds
    .map((id) => servicios.find((s) => s.id === id)?.nombre)
    .filter((n): n is string => Boolean(n));
  const yoSoyColaborador = Boolean(user && provider.colaboradores.some((c) => c.usuarioId === user.id));

  function copyContact() {
    if (!provider) return;
    const telefonos = provider.telefonos.map((t) => t.telefono).join(", ");
    const txt = `${provider.nombre}\n${provider.contacto ?? ""}\n${telefonos}\n${provider.email ?? ""}`;
    navigator.clipboard?.writeText(txt).then(() => pushToast("Contacto copiado", "info"));
  }

  async function toggleColaborador() {
    try {
      if (yoSoyColaborador) {
        await quitarColaborador(provider!.id);
      } else {
        await marcarColaborador(provider!.id);
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo actualizar", "danger");
    }
  }

  return (
    <Drawer open={Boolean(provider)} onClose={onClose}>
      <DrawerHeader>
        <Avatar nombre={provider.nombre} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold leading-tight">{provider.nombre}</div>
          <div className="mt-0.5 text-[13px] text-text-2">
            {categoriasProveedor.find((c) => c.id === provider.categoriaId)?.nombre ?? "—"}
          </div>
        </div>
        <DrawerCloseButton onClose={onClose} />
      </DrawerHeader>

      <div className="flex-1 p-5">
        <DrawerSection title="Evaluación" />
        {typeof provider.score === "number" ? <Stars n={provider.score} size={18} /> : <span className="text-xs text-text-3">Sin score</span>}
        <div className="mt-2">
          <Badge bg={sc.bg} color={sc.c}>
            {provider.estado}
          </Badge>
        </div>

        <DrawerSection title="Ubicación" />
        <KeyValue
          k="País"
          v={
            <span className="flex items-center gap-1.5">
              <CountryBadge pais={paisNombre} /> {paisNombre || "—"}
            </span>
          }
        />
        <KeyValue k="Región" v={regionNombre || "—"} />
        <KeyValue k="Ciudad" v={ciudadNombre || "—"} />
        <KeyValue k="Cobertura" v={provider.cobertura || "—"} />

        <DrawerSection
          title="Contacto"
          action={
            <button
              onClick={copyContact}
              className="cursor-pointer border-none bg-transparent text-[11px] font-medium normal-case text-teal-mid hover:underline"
            >
              Copiar
            </button>
          }
        />
        <KeyValue k="Contacto" v={provider.contacto || "—"} />
        <KeyValue k="Cargo" v={provider.cargoContacto || "—"} />
        <KeyValue k="Email" v={provider.email || "—"} />
        {provider.telefonos.length > 0 ? (
          provider.telefonos.map((t, i) => <KeyValue key={t.id ?? i} k={t.etiqueta || "Teléfono"} v={t.telefono} />)
        ) : (
          <KeyValue k="Teléfono" v="—" />
        )}
        <KeyValue k="Presupuesto" v={provider.presupuesto || "—"} />
        <KeyValue k="Aforo" v={provider.aforo != null ? String(provider.aforo) : "—"} />
        <KeyValue k="Costo de referencia" v={provider.costoReferencia || "—"} />

        {serviciosNombres.length > 0 && (
          <>
            <DrawerSection title="Servicios" />
            <div className="flex flex-wrap gap-1.5">
              {serviciosNombres.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          </>
        )}

        <DrawerSection title={`Trabajando con este proveedor (${provider.colaboradores.length})`} />
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {provider.colaboradores.map((c) => (
            <Tag key={c.usuarioId}>{c.nombre}</Tag>
          ))}
          {provider.colaboradores.length === 0 && <span className="text-xs text-text-3">Nadie se ha marcado todavía</span>}
        </div>
        <Button size="sm" icon={yoSoyColaborador ? UserMinus : UserPlus} onClick={toggleColaborador} className="mt-1">
          {yoSoyColaborador ? "Ya no trabajo con este proveedor" : "Estoy trabajando con este proveedor"}
        </Button>

        {provider.notas && (
          <>
            <DrawerSection title="Notas internas" />
            <NoteBox>{provider.notas}</NoteBox>
          </>
        )}

        <DrawerSection title="Archivos y links" />
        <AttachmentsSection proveedorId={provider.id} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border p-4">
        <Button variant="primary" icon={Pencil} onClick={onEdit}>
          Editar
        </Button>
        <DeleteOrRequestButton tipoEntidad="proveedor" entidadId={provider.id} onDelete={onDelete} />
      </div>
    </Drawer>
  );
}

const MAX_FILE_BYTES = 20 * 1024 * 1024;

function AttachmentsSection({ proveedorId }: { proveedorId: string }) {
  const pushToast = useUiStore((s) => s.pushToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [adjuntos, setAdjuntos] = useState<ProveedorAdjunto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  // id del adjunto que se está descargando ahora mismo (pidiendo la URL firmada) --
  // por id y no un booleano global, porque puede haber varios adjuntos en la lista.
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial adjuntos load on mount/proveedorId change
    setLoading(true);
    proveedorAdjuntosApi
      .list(proveedorId)
      .then((items) => {
        if (!cancelled) setAdjuntos(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [proveedorId]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        pushToast(`"${file.name}" supera el máximo de 20 MB`, "danger");
        continue;
      }
      setUploading(true);
      try {
        const created = await proveedorAdjuntosApi.subirArchivo(proveedorId, file);
        setAdjuntos((prev) => [...prev, created]);
      } catch (err) {
        pushToast(err instanceof Error ? err.message : `No se pudo subir "${file.name}"`, "danger");
      } finally {
        setUploading(false);
      }
    }
  }

  async function addLink() {
    const url = linkUrl.trim();
    const nombre = linkName.trim() || url;
    if (!url) return;
    const safeUrl = toSafeHref(url);
    if (!safeUrl) {
      // No es http(s) -- ej. alguien pegó algo tipo "javascript:...". Se
      // rechaza acá para que ni siquiera llegue a guardarse (ver
      // src/lib/url-safety.ts): abrir ese link más adelante con
      // window.open() lo ejecutaría.
      pushToast("Ese link no es una URL válida (debe empezar con http:// o https://).", "danger");
      return;
    }
    try {
      const created = await proveedorAdjuntosApi.crearLink(proveedorId, { tipo: "link", nombre, url: safeUrl });
      setAdjuntos((prev) => [...prev, created]);
      setLinkName("");
      setLinkUrl("");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo agregar el link", "danger");
    }
  }

  async function removeAdjunto(id: string) {
    try {
      await proveedorAdjuntosApi.remove(proveedorId, id);
      setAdjuntos((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar", "danger");
    }
  }

  async function openAdjunto(a: ProveedorAdjunto) {
    if (a.tipo === "link") {
      // Segunda validación acá (además de la de addLink) -- por si el
      // adjunto se guardó antes de este arreglo, o se creó llamando a la
      // API directo sin pasar por este formulario.
      const safeUrl = a.url ? toSafeHref(a.url) : null;
      if (!safeUrl) {
        pushToast("Este link no es una URL http(s) válida.", "danger");
        return;
      }
      window.open(safeUrl, "_blank", "noreferrer");
      return;
    }
    setDownloadingId(a.id);
    try {
      const { url } = await proveedorAdjuntosApi.obtenerUrlDescarga(proveedorId, a.id);
      const safeUrl = toSafeHref(url);
      if (!safeUrl) {
        pushToast("No se pudo generar un enlace de descarga válido.", "danger");
        return;
      }
      window.open(safeUrl, "_blank", "noreferrer");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo generar el enlace de descarga", "danger");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!uploading) handleFiles(e.dataTransfer.files);
        }}
        aria-busy={uploading}
        className={`mb-2.5 flex flex-col items-center gap-1 rounded-[var(--radius-md)] border-[1.5px] border-dashed p-3.5 text-center transition-colors ${uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        style={{
          borderColor: dragOver ? "var(--teal-mid)" : "var(--border-strong)",
          background: dragOver ? "var(--teal-light)" : "transparent",
        }}
      >
        {uploading ? (
          <Spinner label="Subiendo…" />
        ) : (
          <>
            <Upload size={18} strokeWidth={1.5} className="text-text-3" />
            <span className="pointer-events-none text-xs text-text-2">
              Arrastra un PDF o Excel (máx. 20 MB) o haz clic para subir
            </span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xls,.xlsx"
          multiple
          hidden
          disabled={uploading}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mb-2.5 flex gap-1.5">
        <input
          value={linkName}
          onChange={(e) => setLinkName(e.target.value)}
          placeholder="Nombre del link"
          className="flex-1 rounded-[var(--radius-md)] border border-border bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-teal-mid"
        />
        <input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://…"
          onKeyDown={(e) => e.key === "Enter" && addLink()}
          className="flex-1 rounded-[var(--radius-md)] border border-border bg-surface px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-teal-mid"
        />
        <Button size="sm" onClick={addLink}>
          + Link
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        {loading && <div className="py-2 text-center text-xs text-text-3">Cargando…</div>}
        {!loading && adjuntos.length === 0 && (
          <div className="py-2 text-center text-xs text-text-3">Sin archivos ni links aún</div>
        )}
        {adjuntos.map((a) => {
          const Icon = fileIcon(a.nombre, a.tipo === "link" ? "link" : "file");
          return (
            <div key={a.id} className="flex items-center gap-2 rounded-[var(--radius-md)] bg-gray-light px-2.5 py-2">
              <Icon size={16} strokeWidth={1.75} className="flex-shrink-0 text-text-2" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{a.nombre}</div>
                <div className="mt-0.5 truncate text-[11px] text-text-3">
                  {a.tipo === "link" ? a.meta || a.url : fmtSize(a.tamanoBytes ?? 0)}
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-1">
                <button
                  onClick={() => openAdjunto(a)}
                  disabled={downloadingId === a.id}
                  className="flex cursor-pointer items-center rounded border-none bg-transparent p-1 text-text-2 hover:bg-border disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={a.tipo === "link" ? "Abrir link" : "Descargar"}
                >
                  {downloadingId === a.id ? (
                    <Spinner />
                  ) : a.tipo === "link" ? (
                    <ExternalLink size={14} strokeWidth={2} />
                  ) : (
                    <Download size={14} strokeWidth={2} />
                  )}
                </button>
                <button
                  onClick={() => removeAdjunto(a.id)}
                  className="flex cursor-pointer items-center rounded border-none bg-transparent p-1 text-red hover:bg-border"
                  aria-label="Eliminar"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
