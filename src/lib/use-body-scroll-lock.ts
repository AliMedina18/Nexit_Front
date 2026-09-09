"use client";

import { useEffect } from "react";

/**
 * Cuántos overlays (Drawer, Modal, el diálogo de confirmar eliminar) están
 * abiertos ahora mismo, compartido entre TODOS ellos -- si cada uno llevara
 * su propio contador, cerrar un Modal mientras un Drawer sigue abierto
 * liberaría el scroll de fondo por error (o viceversa).
 */
let openOverlayCount = 0;

/**
 * Bloquea el scroll del `body` mientras haya al menos un overlay abierto, y
 * lo libera solo cuando cierra el último. Sin esto, la página de atrás se
 * podía seguir desplazando con un drawer/modal abierto encima -- se sentía
 * "pegado" porque el scroll de fondo y el del overlay se peleaban por el
 * mismo gesto de mouse/trackpad.
 */
export function useBodyScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    if (openOverlayCount === 0) document.body.style.overflow = "hidden";
    openOverlayCount += 1;
    return () => {
      openOverlayCount = Math.max(0, openOverlayCount - 1);
      if (openOverlayCount === 0) document.body.style.overflow = "";
    };
  }, [open]);
}
