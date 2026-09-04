"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Upload, X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { fileIcon, fmtSize } from "@/lib/format";
import { toSafeHref } from "@/lib/url-safety";
import { useUiStore } from "@/store/ui-store";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Forma mínima que necesita este componente de un adjunto real -- ClienteAdjunto,
 * ProveedorAdjunto y ProyectoAdjunto la cumplen los tres (mismo contrato, ver docs/28). */
export interface AttachmentLike {
  id: string;
  tipo: string; // "link" | "archivo"
  nombre: string;
  url?: string | null;
  meta?: string | null;
  tamanoBytes?: number | null;
}

/** Las 5 operaciones que cada *-adjuntos-service.ts expone, todas colgadas del mismo id de
 * entidad (proveedorId, clienteId o proyectoId según el caso). */
export interface AttachmentsApi<T extends AttachmentLike> {
  list: (entityId: string) => Promise<T[]>;
  crearLink: (entityId: string, input: { tipo: string; nombre: string; url: string }) => Promise<T>;
  subirArchivo: (entityId: string, archivo: File) => Promise<T>;
  obtenerUrlDescarga: (entityId: string, adjuntoId: string) => Promise<{ url: string }>;
  remove: (entityId: string, adjuntoId: string) => Promise<void>;
}

/**
 * "Archivos y enlaces" genérico -- generalizado 2026-09-03 desde el que ya existía solo para
 * proveedores (ver docs/28, HU-13) para poder reutilizarlo también en Cliente y Proyecto, que
 * comparten exactamente el mismo contrato de adjuntos del lado del backend.
 */
export function EntityAttachments<T extends AttachmentLike>({
  entityId,
  api,
}: {
  entityId: string;
  api: AttachmentsApi<T>;
}) {
  const pushToast = useUiStore((s) => s.pushToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [adjuntos, setAdjuntos] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  // id del adjunto que se está descargando ahora mismo (pidiendo la URL firmada) --
  // por id y no un booleano global, porque puede haber varios adjuntos en la lista.
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial adjuntos load on mount/entityId change
    setLoading(true);
    api
      .list(entityId)
      .then((items) => {
        if (!cancelled) setAdjuntos(items);
      })
      .catch(() => {
        if (!cancelled) setAdjuntos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `api` es un objeto de funciones estable (el módulo del servicio), no necesita entrar a las deps
  }, [entityId]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        pushToast(`"${file.name}" supera el máximo de 20 MB`, "danger");
        continue;
      }
      setUploading(true);
      try {
        const created = await api.subirArchivo(entityId, file);
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
      const created = await api.crearLink(entityId, { tipo: "link", nombre, url: safeUrl });
      setAdjuntos((prev) => [...prev, created]);
      setLinkName("");
      setLinkUrl("");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo agregar el link", "danger");
    }
  }

  async function removeAdjunto(id: string) {
    try {
      await api.remove(entityId, id);
      setAdjuntos((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "No se pudo eliminar", "danger");
    }
  }

  async function openAdjunto(a: T) {
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
      const { url } = await api.obtenerUrlDescarga(entityId, a.id);
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
        <button
          type="button"
          onClick={addLink}
          className="flex h-8 flex-shrink-0 cursor-pointer items-center whitespace-nowrap rounded-[var(--radius-md)] border border-border bg-surface px-2.5 text-[13px] font-medium text-text transition-colors hover:border-text hover:bg-bg"
        >
          + Link
        </button>
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
