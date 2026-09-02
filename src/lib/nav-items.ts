import { BarChart3, Building2, CalendarCheck2, LayoutGrid, Truck, Users, type LucideIcon } from "lucide-react";

/**
 * Navegación del dashboard -- una sola fuente de verdad compartida por el
 * riel de escritorio (layout.tsx) y la barra/hoja "Más" de móvil
 * (MobileNav.tsx), para no repetir el mismo arreglo en dos archivos.
 * Orden y set de iconos confirmados 1:1 contra el HTML aprobado.
 */
export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV: NavItem[] = [
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/proyectos", label: "Proyectos", icon: CalendarCheck2 },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/calendario", label: "Calendario", icon: LayoutGrid },
  { href: "/informe", label: "Informes", icon: BarChart3 },
  { href: "/usuarios", label: "Usuarios", icon: Users },
];

/** Los primeros 4 items van en la barra inferior de móvil; el resto ("Informes")
 *  se ve solo en la hoja "Más" -- mismo criterio que el <nav class="nx-mobile">
 *  del mockup (Clientes / Proyectos / Proveedores / Más). */
export const MOBILE_NAV_PRIMARY = NAV.slice(0, 3);
export const MOBILE_NAV_MORE = NAV.slice(3);
