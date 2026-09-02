"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, Sheet, Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useUiStore } from "@/store/ui-store";
import { downloadBlob } from "@/lib/download-file";
import type { ImportarResultado } from "@/types/api";

/**
 * Exportar/importar una entidad completa como Excel (docs/31) -- un solo componente
 * reutilizado en Clientes/Proveedores/Proyectos en vez de triplicar la misma lógica de
 * descarga + input de archivo + reporte de resultado. "Exportar" siempre está disponible
 * (mismo permiso que ver la lista); "Importar" solo se muestra si `puedeImportar` es true
 * (el backend igual lo exige con `AdminOrAbove`, esto solo evita mostrar una opción que va a
 * fallar con 403).
 *
 * Botón único "Excel" con menú desplegable (Importar / Exportar) -- ported 2026-09-02 del
 * HTML aprobado (Nexit Standalone.html): antes eran dos botones "Exportar"/"Importar"
 * siempre visibles lado a lado, sin corresponder al mockup (un solo trigger con chevron
 * que abre un menú de 210px, borde negro, dos ítems). Valores (padding, radio, sombra)
 * tomados con getComputedStyle contra el HTML real.
 */
export function ImportExportBar({
  entidad,
  puedeImportar,
  onExport,
  onImport,
  onImported,
}: {
  /** Para los mensajes ("clientes", "proveedores", "proyectos") y el nombre del archivo de respaldo. */
  entidad: string;
  puedeImportar: boolean;
  onExport: () => Promise<{ blob: Blob; fileName: string }>;
  onImport: (archivo: File) => Promise<ImportarResultado>;
  /** Se llama después de una importación con al menos una fila creada, para refrescar la lista. */
  onImported: () => void;
}) {
  const pushToast = useUiStore((s) => s.pushToast);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resultado, setResultado] = useState<ImportarResultado | null>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function handleExport() {
    setOpen(false);
    setExporting(true);
    try {
      const { blob, fileName } = await onExport();
      downloadBlob(blob, fileName);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : `No se pudo exportar ${entidad}`, "danger");
    } finally {
      setExporting(false);
    }
  }

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo si se corrige y reintenta
    if (!archivo) return;
    setImporting(true);
    try {
      const resultado = await onImport(archivo);
      setResultado(resultado);
      if (resultado.creados > 0) {
        onImported();
        pushToast(
          resultado.errores.length === 0
            ? `${resultado.creados} ${entidad} importados`
            : `${resultado.creados} ${entidad} importados, ${resultado.errores.length} fila(s) con error`,
          resultado.errores.length === 0 ? "success" : "info",
        );
      } else {
        pushToast(`No se creó ningún registro -- revisa los errores`, "danger");
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : `No se pudo importar el archivo`, "danger");
    } finally {
      setImporting(false);
    }
  }

  const busy = exporting || importing;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={busy}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex h-[38px] cursor-pointer items-center gap-1.5 rounded-[var(--radius-lg)] border border-border bg-transparent px-3 text-[13px] font-medium text-text transition-colors hover:bg-gray-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Spinner label={exporting ? "Exportando…" : "Importando…"} />
          ) : (
            <>
              <Sheet size={15} strokeWidth={1.8} />
              Excel
              <ChevronDown size={14} strokeWidth={2} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
            </>
          )}
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-40 mt-1.5 w-[210px] rounded-[var(--radius-lg)] border border-text bg-surface p-[5px] shadow-[0_12px_34px_rgba(12,12,12,0.16)]"
          >
            {puedeImportar && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  inputRef.current?.click();
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-[3px] px-2.5 py-2.5 text-left text-[13px] text-text hover:bg-gray-light"
              >
                <Upload size={15} strokeWidth={1.8} />
                Importar desde CSV
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={handleExport}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[3px] px-2.5 py-2.5 text-left text-[13px] text-text hover:bg-gray-light"
            >
              <Download size={15} strokeWidth={1.8} />
              Exportar a Excel
            </button>
          </div>
        )}
      </div>

      {puedeImportar && (
        <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChosen} />
      )}

      <Modal open={resultado !== null} onClose={() => setResultado(null)} title="Resultado de la importación" maxWidth={640}>
        {resultado && (
          <div className="flex flex-col gap-3 text-[13px]">
            <div>
              <span className="font-semibold text-teal-mid">{resultado.creados}</span> {entidad} creados correctamente.
            </div>
            {resultado.errores.length > 0 && (
              <div>
                <div className="mb-1.5 font-medium text-red">{resultado.errores.length} fila(s) no se pudieron crear:</div>
                <div className="max-h-72 overflow-y-auto rounded-[var(--radius-md)] border border-border">
                  {resultado.errores.map((e, i) => (
                    <div key={i} className={`flex gap-2 px-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}>
                      <span className="shrink-0 font-mono text-text-3">Fila {e.fila}</span>
                      <span className="text-text-2">{e.mensaje}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
