"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Calcula cuántas columnas debe tener una grilla de tarjetas para que
 * SIEMPRE llenen el ancho disponible del contenedor, sin franja vacía a la
 * derecha ni columnas más angostas que `min` (Alicia, Proveedores
 * 2026-09-08: "cuando [el riel] no está desplegado, [las tarjetas] se
 * quedan chiquitas... tienen que alargarse un poco para ocupar bien el
 * espacio").
 *
 * Antes se usaba `grid-template-columns: repeat(auto-fill, minmax(240px,
 * 300px))` (ver dashboard.module.css): con un MÁXIMO fijo en px, el
 * número de columnas queda decidido por ese máximo, pero una vez fijo el
 * número de columnas cada una deja de crecer al llegar a 300px aunque
 * sobre espacio -- y ese sobrante nunca se reparte, queda como una franja
 * vacía. No existe un valor fijo de "máximo" que evite esto en todos los
 * anchos posibles (se probó 300/320/340/360/380px por Playwright: siempre
 * hay algún ancho de pantalla, con el riel expandido o colapsado, donde
 * sobra una franja notable). La solución real es calcular cuántas
 * columnas caben (entre `min` y `max` de ancho cada una) y ponerlas en
 * `1fr`, para que el navegador reparta TODO el ancho sobrante entre las
 * columnas que ya existen en vez de dejarlo sin usar.
 */
// Alicia 2026-09-08 (Clientes): "cuando yo inicio me aparece una tarjeta
// supergrande, larga, pero cuando vuelvo a proveedores se vuelve a
// convertir". Causa real: `columns` arranca en 1 (una sola columna, o sea
// tarjetas de ancho completo) y antes se recalculaba en un `useEffect`
// normal, que corre DESPUÉS de que el navegador ya pintó esa primera
// versión con 1 columna. En Proveedores (lista corta) ese parpadeo casi no
// se nota; en Clientes (200+ filas, la grilla ocupa mucha más pantalla) se
// veía clarísimo como "una tarjeta gigante" al entrar a la página, antes de
// que se acomodara sola. `useLayoutEffect` calcula las columnas reales
// ANTES de pintar, así que ese parpadeo desaparece en las dos páginas.
// (En el servidor no existe layout que medir, así que ahí se usa
// `useEffect` normal para no disparar la advertencia de React sobre
// useLayoutEffect en SSR.)
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useGridColumns(min = 240, max = 300, gap = 12) {
  const ref = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    function compute(width: number) {
      if (width <= 0) return;
      const byMax = Math.ceil((width + gap) / (max + gap));
      const byMin = Math.floor((width + gap) / (min + gap));
      setColumns(Math.max(1, Math.min(byMax, byMin || 1)));
    }

    compute(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) compute(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [min, max, gap]);

  return { ref, columns };
}
