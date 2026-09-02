# Organización de estilos

Todo el CSS del proyecto vive en esta carpeta, `src/styles/` -- nada de
`*.module.css` colocado dentro de `src/app/**` o `src/components/**`. Es la
única carpeta de estilos del repositorio.

## Por qué una sola carpeta (no colocado)

Next.js permite colocar CSS junto a cada página/componente y también
permite centralizarlo -- el framework es deliberadamente "unopinionated" al
respecto (así lo dice su propia documentación de organización de proyecto:
https://nextjs.org/docs/app/getting-started/project-structure). Esa misma
página de Next.js nombra explícitamente `styles/` como una de las carpetas
de nivel superior de uso común (junto a `components`, `lib`, `hooks`), y su
única recomendación firme es: **elige una estrategia y sé consistente en
todo el proyecto** -- no mezclar "a veces colocado, a veces centralizado".
Antes de este cambio el repo tenía justo esa inconsistencia: 3 archivos
`*.module.css` sueltos dentro de `src/app/login/` y `src/components/ui/`,
mientras el resto de reglas responsive vivían en una carpeta `styles/`
aparte. Ahora todo el CSS -- tokens globales, chrome del dashboard,
patrones compartidos y CSS de una sola pantalla/componente -- está en un
solo lugar, con un solo criterio de nombre.

## Qué hay en esta carpeta

- **`globals.css`** -- tokens de diseño (`:root` custom properties: colores,
  radios), el entrypoint de Tailwind, resets base y la regla `@media
  print`. Importado una sola vez, desde `src/app/layout.tsx`. No debe
  crecer con reglas de layout de una pantalla concreta.
- **`shell.module.css`** -- riel lateral / barra superior e inferior móvil
  (la navegación del dashboard). Usado por `src/app/(dashboard)/layout.tsx`
  y `src/components/ui/MobileNav.tsx`.
- **`dashboard.module.css`** -- título de página, fila de KPIs y filas de
  filtros: patrones que se repiten en Clientes/Proyectos/Proveedores/
  Calendario/Informe/Usuarios, para no duplicar la misma regla 6 veces.
- **`login.module.css`** -- estilos específicos del login (panel oscuro
  con sus dos media queries reales del diseño aprobado). Usado solo por
  `src/app/login/page.tsx`.
- **`drawer.module.css`** -- ancho del panel deslizante de detalle. Usado
  solo por `src/components/ui/Drawer.tsx`.

## Convención de nombres

- Un archivo por pantalla/componente que necesite CSS propio, nombrado
  igual que lo que estiliza en minúsculas (`login.module.css`,
  `drawer.module.css`) -- así se sabe qué usa cada archivo sin tener que
  abrirlo.
- Todo archivo de CSS Module termina en `.module.css` (nunca `.css` a
  secas, salvo `globals.css`, que es el único CSS global del proyecto).
- Dentro de cada archivo, las clases usan camelCase (`.mobileNavItem`, no
  `.mobile-nav-item`) para que `styles.mobileNavItem` se sienta como una
  prop de JS normal en el componente que lo importa -- mismo criterio en
  los 5 archivos, sin mezclar camelCase y kebab-case entre ellos.

## Cuándo usar Tailwind vs. un CSS Module

Si Tailwind puede expresar la regla con una utilidad simple (color, padding
fijo, spacing, tipografía sin responsive), se usa Tailwind directo en el
JSX -- no hace falta crear un archivo para eso. Un CSS Module aquí se
justifica solo cuando la regla necesita un `@media` real -- como el corte
de 1000px del diseño aprobado, o el `max-height: 780px` del login -- o
cuando el mismo valor se repite entre varios archivos y conviene una sola
fuente de verdad. Así el CSS queda aparte del componente (nunca como
estilos inline mezclados con JS) y sin duplicar reglas entre pantallas.

Todos los valores numéricos en estos archivos vienen de medir el HTML del
mockup aprobado (`Nexit Standalone.html`) con `getComputedStyle`, no de
aproximaciones.
