# Nexit Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que todas las pantallas internas de Nexit coincidan visualmente con `_design_reference/Nexit_Standalone.html`, conservando intactas la lógica y la funcionalidad.

**Architecture:** Mantener un sistema de tokens único en `globals.css`, reforzar los componentes compartidos y corregir después las composiciones específicas de cada módulo. Los cambios se limitarán a estilos, clases y estructura visual existente; no se modificarán stores, API, rutas ni reglas de validación funcional.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, CSS Modules, Lucide React, Vitest y Playwright.

---

## Mapa de archivos

- `src/styles/globals.css`: tokens, tipografía, controles base, foco, scrollbar y media queries globales.
- `src/styles/shell.module.css`: rail, topbar, main, mobile header y navegación responsive.
- `src/styles/dashboard.module.css`: layout de páginas, KPIs, filtros y superficies de contenido.
- `src/styles/drawer.module.css`: ancho y comportamiento responsive de drawers.
- `src/components/ui/primitives.tsx`: botones, tarjetas estadísticas, badges, estados vacíos, tabs y controles de vista.
- `src/components/ui/form.tsx`: campos, labels, validación visual, filas y secciones de formulario.
- `src/components/ui/Modal.tsx`, `Drawer.tsx`: overlay, cabecera, cuerpo, pie, cierre y transición.
- `src/components/ui/ErrorState.tsx`, `Intro.tsx`, `Toaster.tsx`, `ImportExportBar.tsx`, `NotificationsBell.tsx`, `MobileNav.tsx`: estados y acciones compartidas.
- `src/app/(dashboard)/layout.tsx`: composición del shell y acciones de la barra superior.
- `src/app/(dashboard)/*/page.tsx`: encabezados, filtros y composición de cada pantalla.
- `src/app/(dashboard)/*/*Card.tsx`, `*Detail.tsx`, `*FormModal.tsx`: tarjetas, detalles y formularios por entidad.
- `src/app/(dashboard)/calendario/CalendarGrid.tsx`: superficie específica del calendario.
- `src/app/login/page.tsx`: pantalla de acceso, solo en su presentación visual.

### Task 1: Establecer la base visual global

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `src/styles/dashboard.module.css`
- Modify: `src/styles/shell.module.css`
- Modify: `src/styles/drawer.module.css`

- [ ] Comparar tokens, tamaños, pesos, line-height, radios, bordes, sombras y breakpoints existentes con la referencia renderizada.
- [ ] Consolidar cualquier valor repetido en variables CSS semánticas, preservando los nombres de variables ya consumidos por Tailwind.
- [ ] Ajustar la cascada global de controles y estados `:focus-visible`, sin cambiar atributos ni lógica de los componentes.
- [ ] Ajustar las reglas de layout de shell, dashboard y drawer para que los anchos y gutters coincidan en desktop y mobile.
- [ ] Ejecutar `npm run lint` y `npm test`.
- [ ] Revisar `git diff -- src/styles/globals.css src/styles/dashboard.module.css src/styles/shell.module.css src/styles/drawer.module.css` y crear un commit solo con esta tarea.

### Task 2: Igualar componentes compartidos

**Files:**
- Modify: `src/components/ui/primitives.tsx`
- Modify: `src/components/ui/form.tsx`
- Modify: `src/components/ui/Modal.tsx`
- Modify: `src/components/ui/Drawer.tsx`
- Modify: `src/components/ui/ErrorState.tsx`
- Modify: `src/components/ui/Intro.tsx`
- Modify: `src/components/ui/Toaster.tsx`
- Modify: `src/components/ui/ImportExportBar.tsx`
- Modify: `src/components/ui/NotificationsBell.tsx`
- Modify: `src/components/ui/MobileNav.tsx`

- [ ] Comparar cada componente compartido con la referencia: altura, padding, iconografía, estados hover/focus/disabled, radios, color y densidad.
- [ ] Ajustar `Button`, `StatCard`, `Badge`, `EmptyState`, `ActiveFilters` y `ViewToggle` manteniendo sus props y eventos.
- [ ] Ajustar `Field`, `Input`, `PasswordInput`, `Select`, `Textarea`, `FormSection` y `FieldGroup` para que estados normales e inválidos tengan la misma geometría visual.
- [ ] Ajustar `Modal` y `Drawer` sin alterar Escape, cierre por overlay, portal ni callbacks.
- [ ] Ajustar estados compartidos de error, toast, importación/exportación, notificaciones y navegación móvil.
- [ ] Añadir o actualizar pruebas de presentación accesible solo cuando el componente ya tenga pruebas cercanas; comprobar `aria-label`, `aria-invalid`, roles y foco.
- [ ] Ejecutar `npm run lint` y `npm test` antes de pasar a las páginas.

### Task 3: Igualar el shell y la pantalla de acceso

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/ui/Logo.tsx`
- Modify: `src/styles/shell.module.css`

- [ ] Comparar rail lateral expandido/contraído, navegación activa, cuenta, topbar, búsqueda, acciones y header móvil con la referencia.
- [ ] Ajustar exclusivamente clases y composición visual necesarias para las proporciones del shell, preservando rutas, permisos y acciones.
- [ ] Igualar la composición visual del login, incluyendo campos, botón, mensajes y estados de validación existentes.
- [ ] Verificar que el responsive no oculte controles funcionales ni provoque scroll horizontal.
- [ ] Ejecutar las pruebas enfocadas `npx playwright test e2e/login-smoke.spec.ts e2e/proxy-route-protection.spec.ts`.

### Task 4: Igualar módulos de gestión

**Files:**
- Modify: `src/app/(dashboard)/clientes/page.tsx`
- Modify: `src/app/(dashboard)/clientes/ClienteCard.tsx`
- Modify: `src/app/(dashboard)/clientes/ClienteDetail.tsx`
- Modify: `src/app/(dashboard)/clientes/ClienteFormModal.tsx`
- Modify: `src/app/(dashboard)/proyectos/page.tsx`
- Modify: `src/app/(dashboard)/proyectos/ProjectCard.tsx`
- Modify: `src/app/(dashboard)/proyectos/ProjectDetail.tsx`
- Modify: `src/app/(dashboard)/proyectos/ProjectFormModal.tsx`
- Modify: `src/app/(dashboard)/proyectos/ProviderPicker.tsx`
- Modify: `src/app/(dashboard)/proveedores/page.tsx`
- Modify: `src/app/(dashboard)/proveedores/ProviderCard.tsx`
- Modify: `src/app/(dashboard)/proveedores/ProviderDetail.tsx`
- Modify: `src/app/(dashboard)/proveedores/ProviderFormModal.tsx`
- Modify: `src/app/(dashboard)/usuarios/page.tsx`
- Modify: `src/app/(dashboard)/usuarios/UsuarioFormModal.tsx`
- Modify: `src/app/(dashboard)/usuarios/InviteModal.tsx`

- [ ] Homogeneizar encabezados, eyebrows, subtítulos, KPIs, filtros, chips, tablas y tarjetas en clientes, proyectos, proveedores y usuarios.
- [ ] Igualar detalles y formularios entidad por entidad, incluyendo secciones, cajas, acciones, validación visible y estados de carga/error/vacío ya existentes.
- [ ] Mantener exactamente las props, callbacks, nombres de campos, mensajes, permisos y llamadas a stores/API.
- [ ] Comprobar en cada entidad al menos la vista de tarjetas, tabla, formulario de alta y detalle abierto.
- [ ] Ejecutar `npm run lint` y `npm test` después del bloque.

### Task 5: Igualar calendario, informe y estados finales

**Files:**
- Modify: `src/app/(dashboard)/calendario/page.tsx`
- Modify: `src/app/(dashboard)/calendario/CalendarGrid.tsx`
- Modify: `src/app/(dashboard)/informe/page.tsx`
- Modify: `src/app/(dashboard)/error.tsx`
- Modify: `src/app/error.tsx`
- Modify: `src/app/not-found.tsx`
- Modify: `src/app/global-error.tsx`

- [ ] Igualar calendario e informe en jerarquía, superficies, tablas, filtros, estados y acciones visuales.
- [ ] Igualar errores de ruta y estados globales sin alterar recuperación, navegación ni mensajes funcionales.
- [ ] Revisar desktop y mobile en todas las rutas internas: `/clientes`, `/proyectos`, `/proveedores`, `/usuarios`, `/calendario` e `/informe`.
- [ ] Verificar que no hay desbordes, solapamientos ni saltos de layout en formularios, tablas, drawers y modales.
- [ ] Ejecutar `npm run lint`, `npm test` y `npm run build`.
- [ ] Ejecutar `npm run test:e2e` con el servidor disponible y documentar cualquier prueba bloqueada por entorno.

### Task 6: Revisión visual y cierre

**Files:**
- Modify: solo archivos que presenten diferencias confirmadas durante la revisión visual.

- [ ] Arrancar el servidor con `npm run dev` o usar otro puerto si el configurado está ocupado.
- [ ] Tomar capturas comparables de desktop y mobile para una pantalla de listado, un formulario, un detalle, una tabla y un estado vacío/error.
- [ ] Corregir únicamente diferencias visuales confirmadas, sin ampliar el alcance funcional.
- [ ] Repetir `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e`.
- [ ] Revisar `git diff` final y confirmar que no se modificaron stores, servicios, tipos ni lógica funcional.

## Criterio de terminado

Todas las rutas internas comparten la misma paleta, tipografía, densidad, geometría, estados y responsive de la referencia. Los tests y el build pasan, y las diferencias restantes se limitan a datos dinámicos de la aplicación.
