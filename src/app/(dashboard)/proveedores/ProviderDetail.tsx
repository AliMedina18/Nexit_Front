"use client";

import { useRef, useState } from "react";
import { Avatar, Badge, Button, Stars, Tag } from "@/components/ui/primitives";
import { Drawer, DrawerCloseButton, DrawerHeader, DrawerSection, KeyValue, NoteBox } from "@/components/ui/Drawer";
import { PROVIDER_STATUS_COLORS } from "@/lib/constants";
import { countryFlag } from "@/lib/geo";
import { fileIcon, fmtSize } from "@/lib/format";
import { nextStringId } from "@/lib/id";
import { useUiStore } from "@/store/ui-store";
import type { Attachment, Provider } from "@/types/domain";

export function ProviderDetail({
  provider,
  idx,
  onClose,
  onEdit,
  onDelete,
  onAttachmentsChange,
}: {
  provider: Provider | null;
  idx: number;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAttachmentsChange: (attachments: Attachment[]) => void;
}) {
  const pushToast = useUiStore((s) => s.pushToast);

  if (!provider) return <Drawer open={false} onClose={onClose}><></></Drawer>;

  const sc = PROVIDER_STATUS_COLORS[provider.status];
  const svcs = provider.servicios
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  function copyContact() {
    if (!provider) return;
    const txt = `${provider.nombre}\n${provider.contacto}\n${provider.tel}\n${provider.email}`;
    navigator.clipboard?.writeText(txt).then(() => pushToast("Contacto copiado", "📋"));
  }

  return (
    <Drawer open={Boolean(provider)} onClose={onClose}>
      <DrawerHeader>
        <Avatar nombre={provider.nombre} idx={idx} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold leading-tight">{provider.nombre}</div>
          <div className="mt-0.5 text-[13px] text-text-2">{provider.cat}</div>
        </div>
        <DrawerCloseButton onClose={onClose} />
      </DrawerHeader>

      <div className="flex-1 p-5">
        <DrawerSection title="Evaluación" />
        <Stars n={provider.score} size="lg" />
        <div className="mt-2">
          <Badge bg={sc.bg} color={sc.c}>
            {provider.status}
          </Badge>
        </div>

        <DrawerSection title="Ubicación" />
        <KeyValue k="País" v={`${countryFlag(provider.pais)} ${provider.pais || "—"}`} />
        <KeyValue k="Región" v={provider.region || "—"} />
        <KeyValue k="Ciudad" v={provider.ciudad || "—"} />
        <KeyValue k="Cobertura" v={provider.cobertura || "—"} />

        <DrawerSection title="Contacto" action={
          <button onClick={copyContact} className="cursor-pointer border-none bg-transparent text-[11px] font-medium normal-case text-teal-mid hover:underline">
            Copiar
          </button>
        } />
        <KeyValue k="Contacto" v={provider.contacto || "—"} />
        <KeyValue k="Teléfono" v={provider.tel || "—"} />
        <KeyValue k="Email" v={provider.email || "—"} />
        <KeyValue k="Presupuesto" v={provider.budget || "—"} />

        {svcs.length > 0 && (
          <>
            <DrawerSection title="Servicios" />
            <div className="flex flex-wrap gap-1.5">
              {svcs.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          </>
        )}

        {provider.notas && (
          <>
            <DrawerSection title="Notas internas" />
            <NoteBox>{provider.notas}</NoteBox>
          </>
        )}

        <DrawerSection title={`📎 Archivos y links (${provider.attachments.length})`} />
        <AttachmentsSection attachments={provider.attachments} onChange={onAttachmentsChange} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border p-4">
        <Button variant="primary" onClick={onEdit}>
          ✏️ Editar
        </Button>
        <Button variant="danger" onClick={onDelete}>
          🗑 Eliminar
        </Button>
      </div>
    </Drawer>
  );
}

function AttachmentsSection({
  attachments,
  onChange,
}: {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const attachment: Attachment = {
        id: nextStringId("att"),
        type: "file",
        name: file.name,
        url: String(reader.result),
        meta: fmtSize(file.size),
        date: new Date().toISOString().slice(0, 10),
      };
      onChange([...attachments, attachment]);
    };
    reader.readAsDataURL(file);
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    [...files].forEach(readFile);
  }

  function addLink() {
    const url = linkUrl.trim();
    const name = linkName.trim() || url;
    if (!url) return;
    let host = url;
    try {
      host = new URL(url).hostname;
    } catch {
      // keep raw url as meta if it doesn't parse
    }
    const attachment: Attachment = {
      id: nextStringId("link"),
      type: "link",
      name,
      url,
      meta: host,
      date: new Date().toISOString().slice(0, 10),
    };
    onChange([...attachments, attachment]);
    setLinkName("");
    setLinkUrl("");
  }

  function removeAttachment(id: string) {
    onChange(attachments.filter((a) => a.id !== id));
  }

  function download(a: Attachment) {
    if (a.type !== "file") return;
    const el = document.createElement("a");
    el.href = a.url;
    el.download = a.name;
    el.click();
  }

  return (
    <div>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className="mb-2.5 cursor-pointer rounded-[var(--radius-md)] border-[1.5px] border-dashed p-3.5 text-center transition-colors"
        style={{ borderColor: dragOver ? "var(--teal-mid)" : "var(--border-strong)", background: dragOver ? "var(--teal-light)" : "transparent" }}
      >
        <span className="mb-1 block text-[22px]">📎</span>
        <span className="pointer-events-none text-xs text-text-2">
          Arrastra archivos aquí o haz clic para subir
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
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
          className="flex-1 rounded-[var(--radius-md)] border border-border bg-bg px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-teal-mid"
        />
        <input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://…"
          onKeyDown={(e) => e.key === "Enter" && addLink()}
          className="flex-1 rounded-[var(--radius-md)] border border-border bg-bg px-2.5 py-1.5 text-[13px] text-text outline-none focus:border-teal-mid"
        />
        <Button size="sm" onClick={addLink}>
          + Link
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        {attachments.length === 0 && (
          <div className="py-2 text-center text-xs text-text-3">Sin archivos ni links aún</div>
        )}
        {attachments.map((a) => (
          <div key={a.id} className="flex items-center gap-2 rounded-[var(--radius-md)] bg-gray-light px-2.5 py-2">
            <span className="flex-shrink-0 text-lg">{fileIcon(a.name, a.type)}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{a.name}</div>
              <div className="mt-0.5 truncate text-[11px] text-text-3">{a.meta}</div>
            </div>
            <div className="flex flex-shrink-0 gap-1">
              {a.type === "file" ? (
                <button
                  onClick={() => download(a)}
                  className="cursor-pointer rounded border-none bg-transparent px-1 py-0.5 text-[15px] text-text-2 hover:bg-border"
                  aria-label="Descargar"
                >
                  ⬇
                </button>
              ) : (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer rounded px-1 py-0.5 text-[15px] text-text-2 hover:bg-border"
                  aria-label="Abrir link"
                >
                  ↗
                </a>
              )}
              <button
                onClick={() => removeAttachment(a.id)}
                className="cursor-pointer rounded border-none bg-transparent px-1 py-0.5 text-[15px] text-red hover:bg-border"
                aria-label="Eliminar"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
