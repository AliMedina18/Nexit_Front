# Especificacion del sistema visual Nexit

## Objetivo

Replicar visualmente el sistema interno de Nexit exactamente a partir de `_design_reference/Nexit_Standalone.html`. El trabajo modifica unicamente la capa de presentacion: CSS, clases visuales, composicion de componentes y estados visuales ya existentes.

## Fuera de alcance

- No cambiar stores, llamadas API, rutas, permisos ni modelos de datos.
- No cambiar las reglas de validacion ni los mensajes funcionales existentes.
- No introducir nuevas funcionalidades.
- No reemplazar la aplicacion por una pagina estatica.

## Fuente de verdad

La referencia visual es `_design_reference/Nexit_Standalone.html`. Cuando una regla no sea visible directamente en el HTML empaquetado, se conserva el patron ya extraido en `src/styles/globals.css` y se valida contra la apariencia renderizada.

## Sistema visual

- Fondo de aplicacion marfil claro y superficies blancas.
- Texto principal casi negro, texto secundario gris y bordes neutros de bajo contraste.
- Verde de marca reservado para identidad, indicadores y acentos; las acciones primarias usan negro con texto claro.
- Tipografia Archivo para contenido y titulos, IBM Plex Mono para etiquetas, indices y datos tecnicos.
- Radios pequenos de 3 a 4 px, bordes finos y sombras discretas.
- Jerarquia compacta, editorial y orientada a escaneo rapido.
- Estados de foco visibles y contraste suficiente para controles e informacion.

## Superficies a igualar

1. Shell interno: rail lateral, logo, navegacion activa, cuenta, topbar, busqueda y responsive mobile.
2. Vistas de gestion: encabezado, eyebrow, titulo, subtitulo, KPIs, filtros, chips y alternancia tabla/tarjetas.
3. Datos: tarjetas, tablas, filas interactivas, badges, estados y acciones.
4. Formularios: labels, campos, selects, textareas, grupos, secciones numeradas, botones, foco, invalidez y mensajes.
5. Modal y drawer: overlay, ancho, cabecera, cierre, separadores, contenido, cajas de detalle y pie de acciones.
6. Estados: carga, vacio, error, exito, peligro, hover, focus-visible y disabled.
7. Responsive: conservar jerarquia, evitar desbordes y mantener controles tactiles utilizables en pantallas pequenas.

## Arquitectura de implementacion

- Mantener los tokens en `src/styles/globals.css` como fuente central.
- Ajustar primero componentes compartidos: `primitives`, `form`, `Modal`, `Drawer`, `ErrorState`, `Intro`, `Toaster` y navegacion.
- Ajustar los modulos de dashboard solo donde su composicion difiera de la referencia.
- Evitar estilos inline nuevos salvo valores dinamicos imprescindibles.
- Mantener las APIs publicas y props actuales de los componentes.

## Validacion

- Comparar visualmente las rutas `clientes`, `proyectos`, `proveedores`, `usuarios`, `calendario` e `informe`.
- Revisar al menos un formulario abierto, un detalle abierto, un error, un estado vacio y una tabla.
- Revisar viewport desktop y mobile.
- Ejecutar `npm run lint`, `npm test` y las pruebas E2E disponibles cuando el servidor pueda iniciarse.
- Confirmar que no aparecen errores TypeScript/ESLint nuevos y que la interaccion existente permanece intacta.

## Criterio de aceptacion

La interfaz debe verse como la referencia, no como una reinterpretacion: misma paleta, tipografia, densidad, proporciones, alineaciones, radios, bordes, estados y comportamiento responsive visual. Las diferencias permitidas se limitan a contenido dinamico procedente de la aplicacion.
