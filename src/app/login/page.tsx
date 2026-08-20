"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { Field, Input } from "@/components/ui/form";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const pushToast = useUiStore((s) => s.pushToast);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  function attemptLogin() {
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Escribe tu correo";
    if (!password) nextErrors.password = "Escribe tu contraseña";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      login(email.trim());
      setSubmitting(false);
      router.replace("/proveedores");
    }, 350);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-bg p-5">
      <div className="w-full max-w-[380px] rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <Image src="/logo.png" alt="Next Marketing Experiencial" width={104} height={26} style={{ height: 26, width: "auto" }} priority />
          <span className="h-5 w-px bg-border-strong" />
          <span className="text-[15px] font-semibold tracking-tight">Nexus</span>
        </div>
        <div className="mb-1 text-center text-[19px] font-semibold">Bienvenido de nuevo</div>
        <div className="mb-6 text-center text-[13px] text-text-2">
          Inicia sesión con tu cuenta de Next Marketing Experiencial
        </div>

        <Field label="Correo" error={errors.email}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@nextexperiencial.com"
            onKeyDown={(e) => e.key === "Enter" && attemptLogin()}
          />
        </Field>

        <Field label="Contraseña" error={errors.password}>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="pr-9"
              onKeyDown={(e) => e.key === "Enter" && attemptLogin()}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer rounded-md border-none bg-transparent p-1.5 text-text-3 hover:bg-gray-light"
              aria-label="Mostrar contraseña"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </Field>

        <Button
          variant="primary"
          className="w-full justify-center py-2.5 text-sm"
          onClick={attemptLogin}
          disabled={submitting}
        >
          {submitting ? "Ingresando…" : "Iniciar sesión"}
        </Button>

        <a
          className="mt-3.5 block cursor-pointer text-center text-xs text-teal-mid hover:underline"
          onClick={() => pushToast("Pídele a tu administrador que restablezca tu contraseña", "🔑")}
        >
          ¿Olvidaste tu contraseña?
        </a>

        <div className="mt-5 border-t border-border pt-4 text-center text-[11px] leading-relaxed text-text-3">
          🔧 Demo de diseño: cualquier correo y contraseña funcionan por ahora. La autenticación real
          se conecta cuando esté lista la base de datos.
        </div>
      </div>
    </div>
  );
}
