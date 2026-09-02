"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/styles/intro.module.css";

const SEEN_KEY = "nexit_intro_v1";

/**
 * Animación de bienvenida que se ve una sola vez por navegador, la primera
 * vez que alguien llega a /login (ver src/styles/intro.module.css para el
 * detalle de dónde sale cada valor). Timing 1:1 del mockup: se cierra sola
 * a los 2600ms, con un fade de 520ms antes de desmontarse del todo; el
 * botón "Entrar" permite saltarla en cualquier momento.
 */
export function Intro() {
  // Arranca en `false` tanto en el servidor como en el primer render del
  // cliente -- a propósito, para que los dos coincidan. Antes esto se
  // decidía en el inicializador de useState leyendo localStorage, pero ese
  // inicializador también corre durante el renderizado en el servidor
  // (Next.js SSR), donde localStorage no existe: el servidor siempre
  // asumía "primera vez" (true) y, si el navegador YA la había visto, el
  // cliente decidía false apenas hidrataba -- server y cliente mostraban
  // árboles distintos y React tiraba "Hydration failed". Decidirlo en el
  // efecto de abajo (que solo corre en el navegador, después de montar)
  // evita el mismatch; el único costo es que, para quien nunca la ha visto,
  // la animación aparece un instante después del primer pintado en vez de
  // venir ya en el HTML del servidor -- imperceptible en la práctica.
  const [visible, setVisible] = useState(false);
  const [out, setOut] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let yaLaVio = false;
    try {
      yaLaVio = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // localStorage no disponible (modo privado, etc.) -- no bloquea el login,
      // se asume que aún no la ha visto.
    }
    if (yaLaVio) return;

    // Deliberado: esto es justo lo que evita el mismatch de hidratación de
    // arriba -- no hay forma de saber si ya la vio antes sin preguntarle a
    // localStorage, y eso solo se puede hacer después de montar. Un
    // render extra en el cliente es el costo aceptado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    closeTimer.current = setTimeout(close, 2600);

    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
    };
    // Solo debe correr una vez al montar; "close" no cambia entre renders.
  }, []);

  function close() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOut((current) => {
      if (current) return current;
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        // ver nota arriba
      }
      unmountTimer.current = setTimeout(() => setVisible(false), 520);
      return true;
    });
  }

  if (!visible) return null;

  return (
    <div className={`${styles.overlay} ${out ? styles.out : ""}`}>
      <div className={styles.row}>
        <span aria-hidden className={styles.trail} />
        <span aria-hidden className={styles.arrow}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h16" />
            <path d="m13 5 7 7-7 7" />
          </svg>
        </span>
      </div>

      <div className={styles.wordRow}>
        <span className={styles.word}>Nexit</span>
        <span aria-hidden className={styles.dot} />
      </div>

      <div className={styles.sub}>
        <div className={styles.subEyebrow}>Plataforma interna</div>
        <div className={styles.subCompany}>Next Marketing Experiencial</div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.barTrack}>
          <span aria-hidden className={styles.bar} />
        </div>
        <button type="button" className={styles.skipBtn} onClick={close}>
          Entrar
        </button>
      </div>
    </div>
  );
}
