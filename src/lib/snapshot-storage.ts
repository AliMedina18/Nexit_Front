/**
 * Retirado 2026-08-28: los snapshots de Informes ahora se guardan de verdad
 * en el backend (compartidos por todo el equipo), no en localStorage por
 * navegador -- ver `informesApi.crearSnapshot`/`snapshot` en
 * services/api/informes-service.ts, usado desde app/(dashboard)/informe/page.tsx.
 * Este archivo se deja vacío (en vez de borrado) porque este entorno no tiene
 * permiso para eliminar archivos del repo -- no lo importa nada más.
 */
export {};
