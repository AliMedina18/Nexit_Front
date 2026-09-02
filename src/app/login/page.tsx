"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState, type InputHTMLAttributes } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { Logo } from "@/components/ui/Logo";
import { Field, Input, PasswordInput } from "@/components/ui/form";
import { Spinner } from "@/components/ui/Spinner";
import { Intro } from "@/components/ui/Intro";
import { useUiStore } from "@/store/ui-store";
import { authApi } from "@/services/api";
import { supabase } from "@/lib/supabase-client";
import { validatePassword } from "@/lib/password-policy";
import styles from "@/styles/login.module.css";

/** Recuerda el último correo usado para iniciar sesión, en este navegador
 * -- ported 2026-09-01, según Nexit_Back/docs/10 §2.2: "el correo puede
 * quedar recordado del ingreso anterior para prellenar el campo" (la
 * pantalla no decide "primera vez o no" por adelantado -- eso es a
 * propósito, ver docs/10 -- pero sí puede ahorrarle escribirlo de nuevo). */
const LAST_EMAIL_KEY = "nexit_last_email";

/** Dominios de correo permitidos para iniciar sesión -- Nexit_Back/docs/09
 * (docs/schema/seed_geografia_categorias_estados.sql, "novena revisión",
 * confirmado 2026-08-23): 'agencianextmkt.com' es el ÚNICO dominio permitido
 * hoy -- lo confirmó la usuaria con cuentas reales bajo ese dominio, y el
 * antiguo placeholder 'nextexperiencial.com' ya se retiró de la tabla. Esta
 * es una validación de UX (mensaje inmediato, sin esperar la ida y vuelta
 * al backend/Supabase) -- el filtro real y definitivo sigue viviendo en
 * Nexit_Back (CreateUsuarioValidator / InvitacionValidators) y en el
 * trigger de Postgres check_usuario_dominio_correo, tal como documenta
 * docs/10. Si algún día se agrega otro dominio, es un INSERT en esa misma
 * tabla del backend -- y hay que reflejarlo acá también. */
const DOMINIOS_CORREO_PERMITIDOS = ["agencianextmkt.com"];

function esDominioPermitido(correo: string): boolean {
  const dominio = correo.trim().toLowerCase().split("@")[1];
  if (!dominio) return false;
  return DOMINIOS_CORREO_PERMITIDOS.includes(dominio);
}

function mensajeDominioNoPermitido(): string {
  if (DOMINIOS_CORREO_PERMITIDOS.length === 1) {
    return `Solo se permiten correos del dominio @${DOMINIOS_CORREO_PERMITIDOS[0]}.`;
  }
  return `Solo se permiten correos de estos dominios: ${DOMINIOS_CORREO_PERMITIDOS.map((d) => `@${d}`).join(", ")}.`;
}
function rememberEmail(value: string) {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, value);
  } catch {
    // localStorage no disponible -- no es crítico, solo se pierde el prellenado.
  }
}

/**
 * Login real contra Supabase Auth (Nexit_Back/docs/10, sección 2.2 y 2.3 -- ver
 * también HU-01/HU-02/HU-04 en docs/12). Nunca habla con Nexit_Back: el
 * intercambio de credenciales es 100% frontend <-> Supabase.
 *
 *  - "Iniciar con código": para quien todavía no tiene contraseña (primera vez) --
 *    signInWithOtp -> verifyOtp(type: "email") -> crea su contraseña con updateUser.
 *  - "Iniciar con contraseña": para quien ya la tiene -- signInWithPassword.
 *  - "¿Olvidaste tu contraseña?": resetPasswordForEmail -> verifyOtp(type: "recovery")
 *    -> updateUser con la nueva contraseña (HU-04).
 *
 * Layout de dos paneles ported 2026-08-28 del mockup aprobado (Claude Diseño) --
 * el panel oscuro de la izquierda es solo presentación; toda la lógica de
 * arriba vive intacta en el panel derecho, paso a paso como antes.
 */

type Step =
  | "email"
  | "otp"
  | "create-password"
  | "password"
  | "recover-request"
  | "recover-code"
  | "recover-password";

const FEATURES = [
  { label: "Clientes", sub: "con su historial" },
  { label: "Proyectos", sub: "con equipo asignado" },
  { label: "Proveedores", sub: "base única" },
];

/** Input de correo con ícono -- usado en los 3 pasos que piden el correo. */
function EmailInput({
  style,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <Mail
        size={17}
        strokeWidth={1.7}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3"
      />
      <Input
        type="email"
        autoComplete="email"
        invalid={invalid}
        style={{ height: 48, padding: "0 14px 0 40px", fontSize: 16, ...style }}
        {...props}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const pushToast = useUiStore((s) => s.pushToast);

  const [step, setStep] = useState<Step>("email");
  // Arranca vacío tanto en el servidor como en el primer render del cliente
  // -- a propósito. Antes se leía localStorage en el inicializador de
  // useState, pero ese inicializador también corre durante el renderizado
  // en el servidor (Next.js SSR), donde localStorage no existe: el
  // servidor siempre renderizaba el campo vacío y, si el navegador SÍ tenía
  // un correo recordado, el cliente lo mostraba apenas hidrataba -- server
  // y cliente no coincidían y React tiraba "Hydration failed" (mismo
  // problema que tenía Intro.tsx). El correo recordado se carga abajo, en
  // el efecto que ya existía para la autodetección "recurrente" (docs/30) --
  // así no hay dos lugares leyendo la misma llave de localStorage.
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Autodetección "recurrente" al cargar la pantalla (docs/30): si el correo
  // recordado ya tiene contraseña configurada, salta directo al paso de
  // contraseña sin que la persona tenga que escribir nada. Si falla (backend
  // caído, cuenta sin marca aún, etc.) o dice que no tiene, se queda en el
  // paso de correo como siempre -- por eso el catch no hace nada: se degrada
  // con gracia al comportamiento manual que ya existía (docs/10 §2.2).
  useEffect(() => {
    let correoRecordado = "";
    try {
      correoRecordado = localStorage.getItem(LAST_EMAIL_KEY)?.trim() ?? "";
    } catch {
      // localStorage no disponible -- no es crítico, solo se pierde el prellenado.
    }
    if (!correoRecordado) return;
    // Deliberado: mismo motivo que en Intro.tsx -- el correo recordado solo
    // se puede leer después de montar (ver comentario junto a useState de
    // arriba), así que llenarlo implica un setState acá.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail(correoRecordado);
    authApi
      .estadoCuenta(correoRecordado)
      .then((estado) => {
        if (estado.tieneContrasena) setStep("password");
      })
      .catch(() => {
        // Silencioso a propósito -- ver comentario de arriba.
      });
    // Solo debe correr una vez al montar; no queremos repetir la consulta
    // cada vez que la persona escribe.
  }, []);

  function goToDashboard() {
    router.replace("/proveedores");
  }

  /**
   * Maneja el submit del paso de correo (botón "Enviar código" / Enter):
   * primero le pregunta a Nexit_Back si ese correo ya tiene contraseña
   * configurada (docs/30) y, si es así, salta directo al paso de contraseña
   * en vez de mandar un código -- sin que la persona tenga que saber de
   * antemano cuál de los dos botones usar. Si la consulta falla (backend
   * caído, sin red, etc.) sigue con el envío de código de siempre: ese flujo
   * no depende de Nexit_Back y nunca debe quedar bloqueado por él.
   */
  async function manejarContinuarConCorreo() {
    setError(null);
    if (!email.trim()) return setError("Escribe tu correo.");
    if (!esDominioPermitido(email)) return setError(mensajeDominioNoPermitido());
    setSubmitting(true);
    let tieneContrasena = false;
    try {
      tieneContrasena = (await authApi.estadoCuenta(email.trim())).tieneContrasena;
    } catch {
      // Se degrada con gracia -- ver comentario de arriba.
    }
    if (tieneContrasena) {
      setSubmitting(false);
      setStep("password");
      return;
    }
    await enviarCodigo();
  }

  async function enviarCodigo() {
    setError(null);
    if (!email.trim()) return setError("Escribe tu correo.");
    if (!esDominioPermitido(email)) return setError(mensajeDominioNoPermitido());
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setSubmitting(false);
    if (err) return setError(err.message);
    pushToast("Te enviamos un código de 6 dígitos a tu correo", "info");
    setStep("otp");
  }

  async function verificarCodigo() {
    setError(null);
    if (!code.trim()) return setError("Escribe el código que te llegó por correo.");
    setSubmitting(true);
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setSubmitting(false);
    if (err) return setError(err.message);
    setCode("");
    setStep("create-password");
  }

  async function crearContrasena() {
    setError(null);
    const validationError = validatePassword(password, confirmPassword);
    if (validationError) return setError(validationError);
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (err) return setError(err.message);
    rememberEmail(email.trim());
    try {
      // Best-effort (docs/30): marca la cuenta como "recurrente" para la
      // próxima vez. Si falla, no bloquea el login -- el enlace manual de
      // respaldo sigue disponible.
      await authApi.confirmarContrasena();
    } catch {
      // Silencioso a propósito -- ver comentario de arriba.
    }
    pushToast("Contraseña creada", "success");
    goToDashboard();
  }

  async function iniciarConContrasena() {
    setError(null);
    if (!email.trim()) return setError("Escribe tu correo.");
    if (!password) return setError("Escribe tu contraseña.");
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (err) return setError(err.message);
    rememberEmail(email.trim());
    goToDashboard();
  }

  async function solicitarRecuperacion() {
    setError(null);
    if (!email.trim()) return setError("Escribe tu correo.");
    if (!esDominioPermitido(email)) return setError(mensajeDominioNoPermitido());
    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setSubmitting(false);
    if (err) return setError(err.message);
    pushToast("Te enviamos un código de recuperación a tu correo", "info");
    setStep("recover-code");
  }

  async function verificarCodigoRecuperacion() {
    setError(null);
    if (!code.trim()) return setError("Escribe el código que te llegó por correo.");
    setSubmitting(true);
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "recovery" });
    setSubmitting(false);
    if (err) return setError(err.message);
    setCode("");
    setStep("recover-password");
  }

  async function guardarNuevaContrasena() {
    setError(null);
    const validationError = validatePassword(password, confirmPassword);
    if (validationError) return setError(validationError);
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (err) return setError(err.message);
    try {
      // Best-effort (docs/30) -- ver comentario de crearContrasena().
      await authApi.confirmarContrasena();
    } catch {
      // Silencioso a propósito.
    }
    pushToast("Contraseña actualizada", "success");
    goToDashboard();
  }

  return (
    <>
      <Intro />
      <div className={`fixed inset-0 z-[300] grid ${styles.shell}`}>
      {/* Panel izquierdo -- solo presentación, ported 1:1 del mockup (medido con
          getComputedStyle contra el export de Claude Diseño: patrón isométrico,
          ícono/colores/tipografía y anillo decorativo exactos, no aproximados). */}
      <div className={`relative overflow-hidden bg-[#0c0c0c] text-white ${styles.panel}`}>
        {/* Patrón isométrico de fondo */}
        <div aria-hidden className={styles.pattern} />
        {/* Anillo decorativo -- esquina inferior derecha */}
        <div aria-hidden className={styles.ring} />

        <div className="relative z-[2] font-mono text-[11px] uppercase tracking-[0.14em] text-[#948ea3]">
          Next Marketing Experiencial
        </div>

        {/* Bloque centrado como una sola unidad (título + párrafo + features + pie
            de página) -- así el pie siempre queda pegado al contenido, con el
            espacio libre repartido arriba/abajo del bloque entero, en vez de
            quedar pegado al borde inferior de la pantalla sin importar qué tan
            alta sea la ventana. */}
        <div className="relative z-[2] flex flex-1 flex-col justify-center">
          <div className="mb-[26px] flex items-center gap-3.5">
            <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[4px] bg-green text-text">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="6" rx="1" />
                <rect x="3" y="15" width="6" height="6" rx="1" />
                <rect x="15" y="15" width="6" height="6" rx="1" />
                <path d="M12 9v3" />
                <path d="M6 15v-1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
              </svg>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-green">Plataforma interna</span>
          </div>
          <h1 className={`max-w-[11ch] font-semibold leading-[0.94] tracking-[-0.035em] ${styles.h1}`}>
            Nexit<span className="text-green">.</span>
          </h1>
          <p className={`max-w-[470px] leading-[1.55] text-[#b9b5ac] ${styles.lead}`}>
            El centro de operación del sistema: gestiona clientes, proyectos y proveedores
            conectados en tiempo real. Se acabaron las hojas de cálculo sueltas.
          </p>

          <div className={`flex max-w-[470px] justify-between border-t border-[#262626] ${styles.kpis}`}>
            {FEATURES.map((f, i) => (
              <Fragment key={f.label}>
                {i > 0 && <div className="w-px shrink-0 bg-[#262626]" />}
                <div className="px-[22px] text-center">
                  <div className="text-[22px] font-semibold tracking-[-0.02em]">{f.label}</div>
                  <div className="mt-1.5 font-mono text-[10.5px] tracking-[0.03em] text-text-3">{f.sub}</div>
                </div>
              </Fragment>
            ))}
          </div>

          <div className="mt-16 font-mono text-[11px] leading-[1.7] text-[#4a4845]">
            © {new Date().getFullYear()} Next Marketing Experiencial
            <br />
            Todos los derechos reservados
          </div>
        </div>
      </div>

      {/* Panel derecho -- el formulario real, paso a paso */}
      <div className="flex items-center justify-center overflow-y-auto bg-bg p-6">
        <div className="w-full max-w-[380px] py-8">
          <div className="mb-8">
            <Logo height={30} />
          </div>

          {step === "email" && (
            <>
              <div className="mb-1.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em]">Bienvenido</div>
              <div className="mb-6 text-[15px] text-text-3">Inicia sesión en el sistema con tu cuenta corporativa.</div>
              <Field label="Correo" error={error ?? undefined}>
                <EmailInput
                  invalid={!!error}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@agencianextmkt.com"
                  onKeyDown={(e) => e.key === "Enter" && manejarContinuarConCorreo()}
                />
              </Field>
              <Button
                variant="primary"
                className="w-full justify-center h-[50px] !text-[15px]"
                onClick={manejarContinuarConCorreo}
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner label="Enviando…" />
                ) : (
                  <>
                    Enviar código
                    <ArrowRight size={15} strokeWidth={2} className={styles.arrowIcon} />
                  </>
                )}
              </Button>
              <a
                className="mt-4 block cursor-pointer text-center text-[13px] text-text-3 hover:underline"
                onClick={() => {
                  setError(null);
                  setStep("password");
                }}
              >
                ¿Ya tienes contraseña? <span className="font-medium text-text">Inicia sesión</span>
              </a>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="mb-1.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em]">Escribe tu código</div>
              <div className="mb-6 text-[15px] text-text-3">Te llegó un código de 6 dígitos a {email}</div>
              <Field label="Código" error={error ?? undefined}>
                <Input
                  invalid={!!error}
                  style={{ height: 48, padding: "0 14px", fontSize: 16 }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  onKeyDown={(e) => e.key === "Enter" && verificarCodigo()}
                />
              </Field>
              <Button
                variant="primary"
                className="w-full justify-center h-[50px] !text-[15px]"
                onClick={verificarCodigo}
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner label="Verificando…" />
                ) : (
                  <>
                    Verificar código
                    <ArrowRight size={15} strokeWidth={2} className={styles.arrowIcon} />
                  </>
                )}
              </Button>
              <a className="mt-3.5 block cursor-pointer text-center text-xs text-teal-mid hover:underline" onClick={enviarCodigo}>
                Reenviar código
              </a>
              <a
                className="mt-1.5 block cursor-pointer text-center text-xs text-text-3 hover:underline"
                onClick={() => {
                  setError(null);
                  setStep("email");
                }}
              >
                Volver
              </a>
            </>
          )}

          {(step === "create-password" || step === "recover-password") && (
            <>
              <div className="mb-1.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em]">
                {step === "create-password" ? "Crea tu contraseña" : "Elige tu nueva contraseña"}
              </div>
              <div className="mb-6 text-[15px] text-text-3">
                Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo
              </div>
              <Field label="Contraseña">
                <PasswordInput
                  invalid={!!error}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu nueva contraseña"
                />
              </Field>
              <Field label="Repite tu contraseña" error={error ?? undefined}>
                <PasswordInput
                  invalid={!!error}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (step === "create-password" ? crearContrasena() : guardarNuevaContrasena())
                  }
                />
              </Field>
              <Button
                variant="primary"
                className="w-full justify-center h-[50px] !text-[15px]"
                onClick={step === "create-password" ? crearContrasena : guardarNuevaContrasena}
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner label="Guardando…" />
                ) : (
                  <>
                    Guardar contraseña
                    <ArrowRight size={15} strokeWidth={2} className={styles.arrowIcon} />
                  </>
                )}
              </Button>
            </>
          )}

          {step === "password" && (
            <>
              <div className="mb-1.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em]">Bienvenido de nuevo</div>
              <div className="mb-6 text-[15px] text-text-3">Inicia sesión en el sistema con tu cuenta corporativa.</div>
              <Field label="Correo">
                <EmailInput
                  invalid={!!error}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@agencianextmkt.com"
                />
              </Field>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-medium text-text-2">Contraseña</label>
                <a
                  className="cursor-pointer text-xs text-teal-mid hover:underline"
                  onClick={() => {
                    setError(null);
                    setPassword("");
                    setStep("recover-request");
                  }}
                >
                  ¿La olvidaste?
                </a>
              </div>
              <div className="mb-3.5">
                <PasswordInput
                  invalid={!!error}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  onKeyDown={(e) => e.key === "Enter" && iniciarConContrasena()}
                />
                {error && <div className="mt-1 text-xs text-red">{error}</div>}
              </div>
              <Button
                variant="primary"
                className="w-full justify-center h-[50px] !text-[15px]"
                onClick={iniciarConContrasena}
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner label="Ingresando…" />
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowRight size={15} strokeWidth={2} className={styles.arrowIcon} />
                  </>
                )}
              </Button>
              <a
                className="mt-3.5 block cursor-pointer text-center text-xs text-text-3 hover:underline"
                onClick={() => {
                  setError(null);
                  setPassword("");
                  setStep("email");
                }}
              >
                Volver
              </a>
              {/* Enlace de respaldo en la otra dirección (docs/30): por si la
                  autodetección se equivocó y esta persona en realidad no
                  tiene contraseña configurada todavía. */}
              <a
                className="mt-1.5 block cursor-pointer text-center text-xs text-teal-mid hover:underline"
                onClick={() => {
                  setError(null);
                  setPassword("");
                  manejarContinuarConCorreo();
                }}
              >
                ¿Prefieres iniciar con código?
              </a>
            </>
          )}

          {step === "recover-request" && (
            <>
              <div className="mb-1.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em]">Recuperar contraseña</div>
              <div className="mb-6 text-[15px] text-text-3">Te mandamos un código para elegir una nueva</div>
              <Field label="Correo" error={error ?? undefined}>
                <EmailInput
                  invalid={!!error}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@agencianextmkt.com"
                  onKeyDown={(e) => e.key === "Enter" && solicitarRecuperacion()}
                />
              </Field>
              <Button
                variant="primary"
                className="w-full justify-center h-[50px] !text-[15px]"
                onClick={solicitarRecuperacion}
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner label="Enviando…" />
                ) : (
                  <>
                    Enviar código de recuperación
                    <ArrowRight size={15} strokeWidth={2} className={styles.arrowIcon} />
                  </>
                )}
              </Button>
              <a
                className="mt-3.5 block cursor-pointer text-center text-xs text-text-3 hover:underline"
                onClick={() => {
                  setError(null);
                  setStep("password");
                }}
              >
                Volver
              </a>
            </>
          )}

          {step === "recover-code" && (
            <>
              <div className="mb-1.5 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em]">Escribe tu código</div>
              <div className="mb-6 text-[15px] text-text-3">Te llegó un código de recuperación a {email}</div>
              <Field label="Código" error={error ?? undefined}>
                <Input
                  invalid={!!error}
                  style={{ height: 48, padding: "0 14px", fontSize: 16 }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  onKeyDown={(e) => e.key === "Enter" && verificarCodigoRecuperacion()}
                />
              </Field>
              <Button
                variant="primary"
                className="w-full justify-center h-[50px] !text-[15px]"
                onClick={verificarCodigoRecuperacion}
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner label="Verificando…" />
                ) : (
                  <>
                    Verificar código
                    <ArrowRight size={15} strokeWidth={2} className={styles.arrowIcon} />
                  </>
                )}
              </Button>
              <a className="mt-3.5 block cursor-pointer text-center text-xs text-teal-mid hover:underline" onClick={solicitarRecuperacion}>
                Reenviar código
              </a>
            </>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
