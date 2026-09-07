"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Download, RefreshCcw, Sheet, Upload } from "lucide-react";
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
 *
 * El modal de resultado (docs/35) se rediseñó en tarjetas de resumen (creados/actualizados,
 * con sus propios colores e íconos) en vez de una sola línea de texto plano -- ahora que
 * importar puede tanto crear como actualizar (upsert), una sola frase ya no alcanza para
 * comunicar de un vistazo qué pasó.
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
  /** Se llama después de una importación con al menos una fila creada o actualizada, para refrescar la lista. */
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
      const tocados = resultado.creados + resultado.actualizados;
      if (tocados > 0) {
        onImported();
        const partes = [
          resultado.creados > 0 ? `${resultado.creados} creados` : null,
          resultado.actualizados > 0 ? `${resultado.actualizados} actualizados` : null,
        ].filter(Boolean);
        pushToast(
          resultado.errores.length === 0
            ? `${entidad}: ${partes.join(", ")}`
            : `${entidad}: ${partes.join(", ")}, ${resultado.errores.length} fila(s) con error`,
          resultado.errores.length === 0 ? "success" : "info",
        );
      } else {
        pushToast(`No se creó ni actualizó ningún registro -- revisa los errores`, "danger");
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : `No se pudo importar el archivo`, "danger");
    } finally {
      setImporting(false);
    }
  }

  const busy = exporting || importing;
  const totalErrores = resultado?.errores.length ?? 0;
  const totalTocados = resultado ? resultado.creados + resultado.actualizados : 0;

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
                Importar desde Excel
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
          <div className="flex flex-col gap-4">
            {totalTocados > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-success-light px-4 py-3.5">
                  <CheckCircle2 size={22} strokeWidth={1.8} className="shrink-0 text-success" />
                  <div>
                    <div className="font-mono text-xl font-semibold leading-none text-success">{resultado.creados}</div>
                    <div className="mt-1 text-[12.5px] text-text-2">
                      {entidad} {resultado.creados === 1 ? "nuevo" : "nuevos"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-blue-light px-4 py-3.5">
                  <RefreshCcw size={22} strokeWidth={1.8} className="shrink-0 text-blue" />
                  <div>
                    <div className="font-mono text-xl font-semibold leading-none text-blue">{resultado.actualizados}</div>
                    <div className="mt-1 text-[12.5px] text-text-2">
                      {resultado.actualizados === 1 ? "ya existía, se actualizó" : "ya existían, se actualizaron"}
                    </div>
                  </div>
                </div>
              </div>
            ) : totalErrores === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-border bg-gray-light px-4 py-3.5 text-[13px] text-text-2">
                El archivo no tenía filas para importar.
              </div>
            ) : null}

            {totalErrores > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5 font-medium text-red">
                  <AlertTriangle size={15} strokeWidth={2} className="shrink-0" />
                  {totalErrores} fila{totalErrores === 1 ? "" : "s"} no se {totalErrores === 1 ? "pudo" : "pudieron"} importar
                </div>
                <div className="max-h-72 overflow-y-auto rounded-[var(--radius-md)] border border-border">
                  {resultado.errores.map((e, i) => (
                    <div key={i} className={`flex gap-2.5 px-3 py-2.5 text-[13px] ${i > 0 ? "border-t border-border" : ""}`}>
                      <span className="shrink-0 rounded-[3px] bg-red-light px-1.5 py-0.5 font-mono text-[12px] text-red">Fila {e.fila}</span>
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
