"use client";

/* Hallmark · component: modal · genre: modern-minimal · theme: proyecto (tokens de globals.css)
 * states: default · hover · focus · active · disabled · loading · error · success
 * pre-emit critique: P4 H5 E4 S5 R5 V4
 */

import { useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { AlertTriangle, AtSign, Mail, MessageSquareText, Send, ShieldCheck, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button, Dropdown } from "@/components/ui/primitives";
import { Field, Textarea } from "@/components/ui/form";
import { ROLES_ASIGNABLES, ROL_LABELS } from "@/lib/constants";
import { DOMINIOS_CORREO_PERMITIDOS, esDominioPermitido, mensajeDominioNoPermitido } from "@/lib/dominios-correo";
import { invitacionesApi } from "@/services/api/invitaciones-service";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import type { InvitacionFallida, Rol } from "@/types/api";

/** Mismo tope que CrearInvitacionesLoteValidator en Nexit_Back -- si cambia allá, cambia acá. */
const MAXIMO_POR_LOTE = 25;

/** Lo que separa un correo del siguiente al escribir o pegar: coma, punto y coma, espacio o salto de línea. */
const SEPARADORES = /[\s,;]+/;

/**
 * Invitar a alguien: se le manda un correo y ella completa sus propios datos al aceptar (docs/25).
 *
 * Deliberadamente SEPARADO de registrar (`RegistrarUsuarioModal`), aunque las dos acciones den de
 * alta a una persona. Invitar es pedir; registrar es dar por hecho. Tienen campos distintos, ritmo
 * distinto y consecuencias distintas, y meterlas en un mismo formulario con pestañas obligaba a
 * entender la diferencia antes de poder ver cada una.
 *
 * El campo de correos son fichas, como el "Para" de cualquier cliente de correo: se escribe, se
 * pulsa Enter (o coma, o se pega una lista entera) y queda una ficha que se puede quitar. Sin
 * instrucciones al lado -- el gesto ya es conocido y el marcador de posición lo insinúa.
 */
export function InvitarUsuarioModal({
  open,
  onClose,
  onInvitado,
}: {
  open: boolean;
  onClose: () => void;
  onInvitado: () => void;
}) {
  const pushToast = useUiStore((s) => s.pushToast);
  const quienInvita = useAuthStore((s) => s.user);

  const [correos, setCorreos] = useState<string[]>([]);
  const [borrador, setBorrador] = useState("");
  const [rol, setRol] = useState<Rol>("miembro");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fallidas, setFallidas] = useState<InvitacionFallida[]>([]);
  const [enviando, setEnviando] = useState(false);

  function cerrar() {
    setCorreos([]);
    setBorrador("");
    setRol("miembro");
    setMensaje("");
    setError(null);
    setFallidas([]);
    onClose();
  }

  /**
   * Convierte lo escrito (o pegado) en fichas. El dominio se valida aquí para avisar de inmediato,
   * sin ida y vuelta al servidor -- el filtro que manda sigue siendo el del backend (ver
   * src/lib/dominios-correo.ts). Los repetidos se ignoran en silencio: escribir dos veces el mismo
   * correo es un error de dedo, no una intención.
   */
  function agregar(texto: string): boolean {
    const nuevos = texto.split(SEPARADORES).map((x) => x.trim().toLowerCase()).filter(Boolean);
    if (nuevos.length === 0) return true;

    const invalido = nuevos.find((x) => !esDominioPermitido(x));
    if (invalido) {
      setError(`${invalido} · ${mensajeDominioNoPermitido()}`);
      return false;
    }
    const total = new Set([...correos, ...nuevos]);
    if (total.size > MAXIMO_POR_LOTE) {
      setError(`Puedes invitar hasta ${MAXIMO_POR_LOTE} correos por envío.`);
      return false;
    }
    setCorreos([...total]);
    setError(null);
    return true;
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === " ") {
      e.preventDefault();
      if (agregar(borrador)) setBorrador("");
      return;
    }
    // Retroceso con el campo vacío borra la última ficha -- el gesto que ya espera cualquiera que
    // haya usado el campo "Para" de un correo.
    if (e.key === "Backspace" && borrador === "" && correos.length > 0) setCorreos(correos.slice(0, -1));
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const texto = e.clipboardData.getData("text");
    if (!SEPARADORES.test(texto)) return; // un solo correo: que siga el camino normal de escritura
    e.preventDefault();
    if (agregar(texto)) setBorrador("");
  }

  async function enviar() {
    // Lo que quedó escrito sin confirmar cuenta igual -- nadie debería perder una invitación por no
    // haber apretado Enter en el último correo.
    const pendiente = borrador.trim();
    if (pendiente && !agregar(pendiente)) return;
    const finales = pendiente
      ? [...new Set([...correos, ...pendiente.split(SEPARADORES).map((x) => x.trim().toLowerCase()).filter(Boolean)])]
      : correos;

    if (finales.length === 0) return setError("Escribe al menos un correo.");
    if (!mensaje.trim()) return setError("Escribe el mensaje que va a leer quien reciba la invitación.");

    setEnviando(true);
    setError(null);
    setFallidas([]);
    try {
      const resultado = await invitacionesApi.crearLote({ emails: finales, rol, mensaje: mensaje.trim() });
      const enviadas = resultado.enviadas.length;
      if (enviadas > 0) {
        pushToast(enviadas === 1 ? "Invitación enviada" : `${enviadas} invitaciones enviadas`, "success");
        onInvitado();
      }
      if (resultado.fallidas.length > 0) {
        // Se queda abierto a propósito cuando algo falló: cerrar escondería justo la información
        // que hace falta para corregir. Las fichas se repueblan solo con las que no salieron.
        setFallidas(resultado.fallidas);
        setCorreos(resultado.fallidas.map((f) => f.email));
        setBorrador("");
        if (enviadas === 0) setError("No se pudo invitar a ninguno de esos correos.");
        return;
      }
      cerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron enviar las invitaciones");
    } finally {
      setEnviando(false);
    }
  }

  const totalDestinatarios = correos.length + (borrador.trim() ? 1 : 0);

  return (
    <Modal
      open={open}
      onClose={cerrar}
      maxWidth={560}
      eyebrow="Equipo"
      title="Invitar al equipo"
      description="Le llega un correo con tu mensaje. Cada quien completa sus propios datos al aceptar."
      footer={
        <>
          <Button onClick={cerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="primary" icon={Send} onClick={enviar} disabled={enviando}>
            {enviando
              ? "Enviando…"
              : totalDestinatarios > 1
                ? `Enviar ${totalDestinatarios} invitaciones`
                : "Enviar invitación"}
          </Button>
        </>
      }
    >
      <Field label="Para" icon={AtSign} required>
        <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-md)] border border-border bg-surface px-2 py-1.5 transition-colors focus-within:border-teal-mid">
          {correos.map((c) => (
            <span
              key={c}
              className="inline-flex max-w-full items-center gap-1 rounded-[var(--radius-md)] border border-border bg-gray-light py-1 pl-2 pr-1 text-[12px] text-text"
            >
              <span className="truncate">{c}</span>
              <button
                type="button"
                onClick={() => setCorreos(correos.filter((x) => x !== c))}
                aria-label={`Quitar ${c}`}
                className="flex cursor-pointer items-center rounded-[2px] p-0.5 text-text-3 transition-colors hover:bg-red-light hover:text-red active:bg-red-light"
              >
                <X size={11} strokeWidth={2.4} />
              </button>
            </span>
          ))}
          <input
            type="email"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={() => agregar(borrador) && setBorrador("")}
            placeholder={correos.length === 0 ? `nombre@${DOMINIOS_CORREO_PERMITIDOS[0]}` : "otro correo…"}
            className="min-w-[170px] flex-1 border-0 bg-transparent py-1 text-[13px] text-text outline-none placeholder:text-text-3"
          />
        </div>
      </Field>

      <Field label="Rol" icon={ShieldCheck}>
        <Dropdown
          value={rol}
          onChange={(v) => setRol(v as Rol)}
          placeholder="Elige un rol"
          options={ROLES_ASIGNABLES.map((r) => ({ value: r, label: ROL_LABELS[r] }))}
        />
      </Field>

      <Field label="Mensaje" icon={MessageSquareText} required>
        <Textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          maxLength={500}
          placeholder="Bienvenida al equipo. Cualquier duda me escribes."
        />
      </Field>

      {/* Lo que de verdad va a leer la otra persona, con el nombre real de quien invita. No es
          adorno: es la única forma de darse cuenta de que el mensaje quedó cortante antes de
          mandarlo a cinco personas a la vez. */}
      {mensaje.trim() && (
        <div className="rounded-[var(--radius-md)] border border-border bg-bg p-3.5">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-3">Le llegará así</div>
          <div className="flex gap-2.5">
            <span
              aria-hidden
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-text-2"
            >
              <Mail size={13} strokeWidth={1.9} />
            </span>
            <div className="min-w-0 text-[12.5px] leading-[1.5]">
              <div className="font-medium text-text">
                {quienInvita?.displayName ?? "Alguien del equipo"} te invitó a Nexit como {ROL_LABELS[rol].toLowerCase()}
              </div>
              <div className="mt-0.5 text-text-2">“{mensaje.trim()}”</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-3.5 flex items-start gap-2 rounded-[var(--radius-md)] border border-red bg-red-light px-3.5 py-2.5 text-[12.5px] leading-[1.45] text-red"
        >
          <AlertTriangle size={15} strokeWidth={2} className="mt-px flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {fallidas.length > 0 && (
        <div className="mt-3 rounded-[var(--radius-md)] border border-border bg-red-light px-3.5 py-3">
          <div className="mb-1.5 text-[12px] font-semibold text-red">
            {fallidas.length === 1 ? "Un correo no se pudo invitar" : `${fallidas.length} correos no se pudieron invitar`}
          </div>
          <ul className="flex flex-col gap-1 text-[12px] leading-[1.45] text-text-2">
            {fallidas.map((f) => (
              <li key={f.email}>
                <span className="font-medium text-text">{f.email}</span> — {f.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
