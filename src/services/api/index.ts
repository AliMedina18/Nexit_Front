/**
 * Punto de entrada único a todos los servicios reales que hablan con Nexit_Back
 * (uno por controller/módulo del backend). Todas las pantallas del dashboard
 * (clientes, proveedores, proyectos, calendario, informe, usuarios) y el login
 * ya usan esta capa a través de sus stores -- no queda ninguna pantalla sobre
 * datos mock (los mocks de la maqueta original fueron retirados).
 */
export { authApi } from "./auth-service";
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
