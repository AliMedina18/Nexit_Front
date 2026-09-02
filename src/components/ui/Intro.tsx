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
  // Inicializador perezoso (no un useEffect + setState): se decide de una vez
  // si ya la vio antes del primer render, sin disparar un setState síncrono
  // dentro de un efecto (regla react-hooks/set-state-in-effect).
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SEEN_KEY) !== "1";
    } catch {
      // localStorage no disponible (modo privado, etc.) -- no bloquea el login,
      // se asume que aún no la ha visto.
      return true;
    }
  });
  const [out, setOut] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    closeTimer.current = setTimeout(close, 2600);

    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
    };
    // Solo debe correr una vez al montar, con el valor inicial de "visible";
    // "close" no cambia entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
