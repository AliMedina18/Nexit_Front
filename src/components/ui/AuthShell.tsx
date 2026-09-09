"use client";

import { Fragment, type ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import styles from "@/styles/login.module.css";

/**
 * El marco de dos paneles de las pantallas de acceso (ported 1:1 del mockup
 * aprobado -- ver src/styles/login.module.css para de dónde sale cada medida).
 * Se extrajo de /login cuando apareció la segunda pantalla que lo necesita
 * (/registro, el paso obligatorio de crear el perfil al aceptar una
 * invitación): las dos tienen que verse exactamente igual, y mantener dos
 * copias del panel izquierdo era la forma segura de que se desincronizaran.
 * El panel izquierdo es solo presentación; `children` es el contenido real
 * del panel derecho.
 */
const FEATURES = [
  { label: "Clientes", sub: "con su historial" },
  { label: "Proyectos", sub: "con equipo asignado" },
  { label: "Proveedores", sub: "base única" },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
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

    {/* Panel derecho -- el contenido real de cada pantalla */}
    <div className={`flex items-center justify-center overflow-y-auto bg-bg p-6 ${styles.formPanel}`}>
      <div className="w-full max-w-[380px] py-8">
        <div className="mb-8">
          <Logo height={30} />
        </div>

        {children}
      </div>
    </div>
    </div>
  );
}
