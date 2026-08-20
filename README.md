# Nexus · Front

Frontend de Nexus (gestión de proveedores y proyectos para Next Marketing
Experiencial), construido con **Next.js (App Router) + TypeScript +
Tailwind CSS**.

Este repositorio contiene **solo las vistas**: no está conectado todavía al
backend en C# / .NET. Toda la data vive en memoria (mock data +
`localStorage` para un par de cosas puntuales) para poder maquetar y
validar la experiencia completa antes de integrar los endpoints reales.

## Por qué Next.js

- Consume cualquier API HTTP (incluida una Web API en .NET) sin fricción vía
  `fetch`.
- Enrutamiento por archivos (`src/app/...`), fácil de escalar a medida que
  se agregan módulos.
- Se puede desplegar como SPA/CSR (como está configurado ahora) o activar
  SSR/SSG más adelante si se necesita (por ejemplo, para una landing
  pública).
- Ecosistema muy grande y curva de aprendizaje suave si el equipo crece.

## Cómo correr el proyecto

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. El login es una demo: cualquier correo y
contraseña funcionan (ver nota en la pantalla de login).

```bash
npm run build   # build de producción
npm run lint    # eslint
```

## Estructura de carpetas

```
src/
  app/
    login/                     Pantalla de login (fuera del layout autenticado)
    (dashboard)/                Layout con header + tabs + guard de autenticación
      proveedores/               Vista de proveedores (grid, filtros, modal, detalle)
      proyectos/                 Vista de proyectos (grid, filtros, modal, detalle)
      panel/                     Panel de control (calendario por mes/año)
      informe/                   Informe semanal/mensual con snapshots
  components/ui/                Librería de componentes compartidos (Button, Modal,
                                 Drawer, form controls, badges, etc.)
  store/                        Estado global con Zustand (auth, providers, projects, ui/toasts)
  services/                     Capa de acceso a datos — ver siguiente sección
  data/                         Mock data (semilla inicial, igual a la del prototipo)
  lib/                          Utilidades: geo (país/región/ciudad), formato, CSV, informes
  types/                        Tipos de dominio compartidos (Provider, Project, enums…)
```

## Cómo conectar el backend (.NET) más adelante

Toda la lectura/escritura de datos pasa por dos archivos:

- `src/services/provider-service.ts`
- `src/services/project-service.ts`

Cada uno expone una interfaz (`ProviderService` / `ProjectService`) con
métodos `list / create / update / remove`, implementada hoy por una clase
mock en memoria. Para integrar el backend real:

1. Crear una clase `HttpProviderService` (y `HttpProjectService`) que
   implemente la misma interfaz, llamando a la Web API en .NET con `fetch`
   (usando `NEXT_PUBLIC_API_BASE_URL`, ver `.env.example`).
2. Cambiar la última línea de cada archivo de servicio para exportar la
   nueva implementación en vez de la mock.

Ningún componente de UI ni store necesita cambiar — todos dependen de la
interfaz, no de la implementación. Lo mismo aplica para autenticación
(`src/store/auth-store.ts`): hoy acepta cualquier correo/contraseña; el
`login()` se puede reemplazar por una llamada real sin tocar la UI de
login.

## Estado (state management)

Se usa [Zustand](https://github.com/pmndrs/zustand) por ser mínimo y fácil
de escalar por feature (un store por dominio: `providers-store`,
`projects-store`, `auth-store`, `ui-store` para toasts). Cada store
delega la persistencia real en la capa de `services/`.

## Diseño

Los tokens de diseño (colores, radios, tipografía) están portados 1:1 del
mockup aprobado (`baseproveedores_Next.html`) en `src/app/globals.css`,
incluyendo modo oscuro automático (`prefers-color-scheme`). Tailwind v4 los
expone como utilidades (`bg-surface`, `text-text-2`, `bg-teal-light`, etc.)
para mantener consistencia en toda la app.

## Pendientes conocidos / próximos pasos

- Conectar `services/*` a la Web API en .NET (ver sección de arriba).
- Reemplazar el login demo por autenticación real (JWT/cookies desde .NET
  Identity o el proveedor que se use).
- Mover el guardado de adjuntos (hoy en memoria, como `data:` URL) a un
  storage real (Azure Blob / S3 / disco del backend) cuando exista el
  endpoint de subida de archivos.
- Mover los snapshots del Informe (`localStorage`) a un endpoint del
  backend para que se compartan entre el equipo en vez de vivir por
  navegador.
