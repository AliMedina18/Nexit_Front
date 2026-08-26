/**
 * Punto de entrada único a todos los servicios reales que hablan con Nexit_Back
 * (uno por controller/módulo del backend). Ninguno de estos se usa todavía en
 * ninguna pantalla -- son la capa de conexión lista para cuando el diseño de
 * cada vista esté listo. Los mocks de src/services/*.ts (usados hoy por las
 * pantallas de proyectos/proveedores) no se tocaron.
 */
export { calendarioApi } from "./calendario-service";
export { catalogosApi } from "./catalogos-service";
export { clientesApi } from "./clientes-service";
export { historialApi } from "./historial-service";
export { informesApi } from "./informes-service";
export { invitacionesApi } from "./invitaciones-service";
export { notificacionesApi } from "./notificaciones-service";
export { presenciaApi } from "./presencia-service";
export { proveedorAdjuntosApi } from "./proveedor-adjuntos-service";
export { proveedoresApi } from "./proveedores-service";
export { proyectosApi } from "./proyectos-service";
export { solicitudesEliminacionApi } from "./solicitudes-eliminacion-service";
export { usuariosApi } from "./usuarios-service";
