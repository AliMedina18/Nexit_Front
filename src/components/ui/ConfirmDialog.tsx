"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./primitives";
import { Textarea } from "./form";

/**
 * Confirmación para una acción que no se puede deshacer (Alicia 2026-09-08: "modal propio con
 * confirmación explícita"). Reemplaza los `window.confirm`/`window.prompt` nativos que quedaban
 * sueltos en la pantalla de Usuarios -- feos, sin estilo, y sin espacio para explicar qué va a pasar
 * de verdad. Mismo espíritu que el diálogo de DeleteAction, pero genérico: ese está atado al flujo
 * de solicitudes de eliminación de clientes/proveedores/proyectos.
 *
 * `comentario` convierte el diálogo en el reemplazo del `window.prompt` (p. ej. el motivo al
 * rechazar una solicitud): si se pide, el texto escrito llega en `onConfirm`.
 * `comentarioRequerido` lo vuelve obligatorio -- se usa al pedir una eliminación: quien revisa la
 * solicitud necesita saber por qué se pide, así que no puede llegar vacía.
 */
export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  tone = "danger",
  comentario,
  comentarioRequerido = false,
  loading = false,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  confirmLabel: string;
  tone?: "danger" | "neutral";
  /** Etiqueta del campo de texto opcional; sin esto no se muestra ninguno. */
  comentario?: string;
  /** Con esto, el botón de confirmar no hace nada mientras el campo esté vacío. */
  comentarioRequerido?: boolean;
  loading?: boolean;
  onConfirm: (comentario: string) => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState(false);

  function cerrar() {
    setTexto("");
    setError(false);
    onClose();
  }

  function confirmar() {
    if (comentarioRequerido && !texto.trim()) {
      setError(true);
      return;
    }
    onConfirm(texto.trim());
  }

  return (
    <Modal
      open={open}
      onClose={cerrar}
      title={title}
      maxWidth={470}
      footer={
        <>
          <Button onClick={cerrar} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            disabled={loading}
            onClick={confirmar}
          >
            {loading ? "Un momento…" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5">
        {tone === "danger" && (
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-light text-red">
            <AlertTriangle size={18} strokeWidth={2} />
          </span>
        )}
        <div className="flex-1 text-[13px] leading-[1.55] text-text-2">{children}</div>
      </div>
      {comentario && (
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium text-text-2">
            {comentario} {comentarioRequerido && <span className="text-red">*</span>}
          </label>
          <Textarea
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              if (e.target.value.trim()) setError(false);
            }}
            maxLength={500}
            invalid={error}
          />
          {error && <div className="mt-1 text-xs text-red">Escribe por qué se debe eliminar.</div>}
        </div>
      )}
    </Modal>
  );
}
