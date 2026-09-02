"use client";

import { ExternalLink, Pencil } from "lucide-react";
import { Avatar, Button } from "@/components/ui/primitives";
import { DeleteOrRequestButton } from "@/components/ui/DeleteAction";
import { Drawer, DrawerBox, DrawerCloseButton, DrawerHeader, DrawerSection, KeyValue, NoteBox } from "@/components/ui/Drawer";
import { useUiStore } from "@/store/ui-store";
import { toSafeHref } from "@/lib/url-safety";
import type { Cliente } from "@/types/api";

export function ClienteDetail({
  cliente,
  onClose,
  onEdit,
  onDelete,
}: {
  cliente: Cliente | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pushToast = useUiStore((s) => s.pushToast);

  if (!cliente) return <Drawer open={false} onClose={onClose}><></></Drawer>;

  function copyContact() {
    if (!cliente) return;
    const telefonos = cliente.telefonos.map((t) => t.telefono).join(", ");
    const txt = `${cliente.nombre}\n${cliente.contacto ?? ""}\n${telefonos}\n${cliente.email ?? ""}`;
    navigator.clipboard?.writeText(txt).then(() => pushToast("Contacto copiado", "info"));
  }

  return (
    <Drawer open={Boolean(cliente)} onClose={onClose}>
      <DrawerHeader>
        <Avatar nombre={cliente.nombre} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold leading-tight">{cliente.nombre}</div>
          <div className="mt-0.5 text-[13px] text-text-2">{cliente.sector || "Sin sector"}</div>
        </div>
        <DrawerCloseButton onClose={onClose} />
      </DrawerHeader>

      <div className="flex-1 p-5">
        <DrawerBox title="Ubicación">
          <KeyValue k="Ciudad" v={cliente.ciudad || "—"} />
          <KeyValue k="Dirección" v={cliente.direccion || "—"} />
          <KeyValue
            k="Sitio web"
            v={
            cliente.web ? (
              (() => {
                const href = toSafeHref(cliente.web);
                // Si no es un http(s) válido (ej. alguien guardó algo tipo
                // "javascript:...") no se vuelve un link clickeable -- se
                // muestra el texto tal cual para que se pueda ver y corregir.
                return href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-teal-mid hover:underline"
                  >
                    {cliente.web} <ExternalLink size={11} strokeWidth={2} />
                  </a>
                ) : (
                  cliente.web
                );
              })()
            ) : (
              "—"
            )
            }
          />
        </DrawerBox>

        <DrawerBox
          title="Contacto"
          action={
            <button
              onClick={copyContact}
              className="cursor-pointer border-none bg-transparent text-[11px] font-medium normal-case text-teal-mid hover:underline"
            >
              Copiar
            </button>
          }
        >
          <KeyValue k="Contacto" v={cliente.contacto || "—"} />
          <KeyValue k="Cargo" v={cliente.cargoContacto || "—"} />
          <KeyValue k="Email" v={cliente.email || "—"} />
          {cliente.telefonos.length > 0 ? (
            cliente.telefonos.map((t, i) => (
              <KeyValue key={t.id ?? i} k={t.etiqueta || "Teléfono"} v={t.telefono} />
            ))
          ) : (
            <KeyValue k="Teléfono" v="—" />
          )}
        </DrawerBox>

        <DrawerBox title="Facturación">
          <KeyValue k="Valor de referencia" v={cliente.valorReferencia || "—"} />
        </DrawerBox>

        {cliente.notas && (
          <>
            <DrawerSection title="Notas internas" />
            <NoteBox>{cliente.notas}</NoteBox>
          </>
        )}

        <DrawerSection title="Archivos y enlaces" />
        <NoteBox>Sin archivos ni enlaces registrados.</NoteBox>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border p-4">
        <Button variant="primary" icon={Pencil} onClick={onEdit}>
          Editar
        </Button>
        <DeleteOrRequestButton tipoEntidad="cliente" entidadId={cliente.id} onDelete={onDelete} />
      </div>
    </Drawer>
  );
}
