import styles from "@/styles/spinner.module.css";

/**
 * Indicador de carga compacto para usar dentro de botones (ver
 * src/styles/spinner.module.css para el detalle del origen/adaptación).
 * Usa `currentColor` para los puntos -- hereda el color de texto del botón
 * que lo contiene, no hace falta pasarle una prop de color.
 */
export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <span className={styles.wrapper}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}
