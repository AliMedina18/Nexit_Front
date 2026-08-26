"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { Logo, NexitWordmark } from "@/components/ui/Logo";
import { Field, Input } from "@/components/ui/form";
import { useUiStore } from "@/store/ui-store";
import { supabase } from "@/lib/supabase-client";
import { validatePassword } from "@/lib/password-policy";

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
 */

type Step =
  | "email"
  | "otp"
  | "create-password"
  | "password"
  | "recover-request"
  | "recover-code"
  | "recover-password";

export default function LoginPage() {
  const router = useRouter();
  const pushToast = useUiStore((s) => s.pushToast);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function goToDashboard() {
    router.replace("/proveedores");
  }

  async function enviarCodigo() {
    setError(null);
    if (!email.trim()) return setError("Escribe tu correo.");
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
    goToDashboard();
  }

  async function solicitarRecuperacion() {
    setError(null);
    if (!email.trim()) return setError("Escribe tu correo.");
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
    pushToast("Contraseña actualizada", "success");
    goToDashboard();
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-bg p-5">
      <div className="w-full max-w-[380px] rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <Logo />
          <span className="h-5 w-px bg-border-strong" />
          <NexitWordmark />
        </div>

        {step === "email" && (
          <>
            <div className="mb-1 text-center text-[19px] font-semibold">Bienvenido de nuevo</div>
            <div className="mb-6 text-center text-[13px] text-text-2">
              Inicia sesión con tu cuenta de Next Marketing Experiencial
            </div>
            <Field label="Correo" error={error ?? undefined}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@agencianextmkt.com"
                onKeyDown={(e) => e.key === "Enter" && enviarCodigo()}
              />
            </Field>
            <Button variant="primary" className="w-full justify-center py-2.5 text-sm" onClick={enviarCodigo} disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar código por correo"}
            </Button>
            <Button className="mt-2 w-full justify-center py-2.5 text-sm" onClick={() => { setError(null); setStep("password"); }} disabled={submitting}>
              Ya tengo contraseña
            </Button>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="mb-1 text-center text-[19px] font-semibold">Escribe tu código</div>
            <div className="mb-6 text-center text-[13px] text-text-2">Te llegó un código de 6 dígitos a {email}</div>
            <Field label="Código" error={error ?? undefined}>
              <Input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                onKeyDown={(e) => e.key === "Enter" && verificarCodigo()}
              />
            </Field>
            <Button variant="primary" className="w-full justify-center py-2.5 text-sm" onClick={verificarCodigo} disabled={submitting}>
              {submitting ? "Verificando…" : "Verificar código"}
            </Button>
            <a className="mt-3.5 block cursor-pointer text-center text-xs text-teal-mid hover:underline" onClick={enviarCodigo}>
              Reenviar código
            </a>
            <a className="mt-1.5 block cursor-pointer text-center text-xs text-text-3 hover:underline" onClick={() => { setError(null); setStep("email"); }}>
              Volver
            </a>
          </>
        )}

        {(step === "create-password" || step === "recover-password") && (
          <>
            <div className="mb-1 text-center text-[19px] font-semibold">
              {step === "create-password" ? "Crea tu contraseña" : "Elige tu nueva contraseña"}
            </div>
            <div className="mb-6 text-center text-[13px] text-text-2">
              Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo
            </div>
            <Field label="Contraseña">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu nueva contraseña" />
            </Field>
            <Field label="Repite tu contraseña" error={error ?? undefined}>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                onKeyDown={(e) => e.key === "Enter" && (step === "create-password" ? crearContrasena() : guardarNuevaContrasena())}
              />
            </Field>
            <Button
              variant="primary"
              className="w-full justify-center py-2.5 text-sm"
              onClick={step === "create-password" ? crearContrasena : guardarNuevaContrasena}
              disabled={submitting}
            >
              {submitting ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </>
        )}

        {step === "password" && (
          <>
            <div className="mb-1 text-center text-[19px] font-semibold">Bienvenido de nuevo</div>
            <div className="mb-6 text-center text-[13px] text-text-2">
              Inicia sesión con tu cuenta de Next Marketing Experiencial
            </div>
            <Field label="Correo">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@agencianextmkt.com" />
            </Field>
            <Field label="Contraseña" error={error ?? undefined}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                onKeyDown={(e) => e.key === "Enter" && iniciarConContrasena()}
              />
            </Field>
            <Button variant="primary" className="w-full justify-center py-2.5 text-sm" onClick={iniciarConContrasena} disabled={submitting}>
              {submitting ? "Ingresando…" : "Iniciar sesión"}
            </Button>
            <a className="mt-3.5 block cursor-pointer text-center text-xs text-teal-mid hover:underline" onClick={() => { setError(null); setPassword(""); setStep("recover-request"); }}>
              ¿Olvidaste tu contraseña?
            </a>
            <a className="mt-1.5 block cursor-pointer text-center text-xs text-text-3 hover:underline" onClick={() => { setError(null); setPassword(""); setStep("email"); }}>
              Volver
            </a>
          </>
        )}

        {step === "recover-request" && (
          <>
            <div className="mb-1 text-center text-[19px] font-semibold">Recuperar contraseña</div>
            <div className="mb-6 text-center text-[13px] text-text-2">Te mandamos un código para elegir una nueva</div>
            <Field label="Correo" error={error ?? undefined}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@agencianextmkt.com"
                onKeyDown={(e) => e.key === "Enter" && solicitarRecuperacion()}
              />
            </Field>
            <Button variant="primary" className="w-full justify-center py-2.5 text-sm" onClick={solicitarRecuperacion} disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar código de recuperación"}
            </Button>
            <a className="mt-3.5 block cursor-pointer text-center text-xs text-text-3 hover:underline" onClick={() => { setError(null); setStep("password"); }}>
              Volver
            </a>
          </>
        )}

        {step === "recover-code" && (
          <>
            <div className="mb-1 text-center text-[19px] font-semibold">Escribe tu código</div>
            <div className="mb-6 text-center text-[13px] text-text-2">Te llegó un código de recuperación a {email}</div>
            <Field label="Código" error={error ?? undefined}>
              <Input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                onKeyDown={(e) => e.key === "Enter" && verificarCodigoRecuperacion()}
              />
            </Field>
            <Button variant="primary" className="w-full justify-center py-2.5 text-sm" onClick={verificarCodigoRecuperacion} disabled={submitting}>
              {submitting ? "Verificando…" : "Verificar código"}
            </Button>
            <a className="mt-3.5 block cursor-pointer text-center text-xs text-teal-mid hover:underline" onClick={solicitarRecuperacion}>
              Reenviar código
            </a>
          </>
        )}
      </div>
    </div>
  );
}
