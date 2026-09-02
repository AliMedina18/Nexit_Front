"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { MOBILE_NAV_MORE, MOBILE_NAV_PRIMARY } from "@/lib/nav-items";
import { useAuthStore } from "@/store/auth-store";
import { Modal } from "@/components/ui/Modal";
import styles from "@/styles/shell.module.css";

/**
 * Barra de navegación inferior fija de móvil (< 1000px) -- reemplaza al
 * riel lateral cuando este desaparece (ver src/styles/shell.module.css).
 * Muestra los primeros 3 accesos y agrupa el resto ("Informes", "Usuarios")
 * más la cuenta/cerrar sesión detrás de "Más", igual que el
 * <nav class="nx-mobile"> del HTML aprobado (Clientes / Proyectos /
 * Proveedores / Más).
 */
export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = MOBILE_NAV_MORE.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <nav className={styles.mobileNav} aria-label="Navegación principal">
        {MOBILE_NAV_PRIMARY.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileNavItem}
              aria-current={active ? "page" : undefined}
            >
              {active && <span aria-hidden className={styles.mobileNavActiveBar} />}
              <Icon size={20} strokeWidth={1.7} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button type="button" className={styles.mobileNavItem} onClick={() => setMoreOpen(true)}>
          {moreActive && <span aria-hidden className={styles.mobileNavActiveBar} />}
          <Menu size={20} strokeWidth={1.7} />
          <span>Más</span>
        </button>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Más" maxWidth={340}>
        <div className="flex flex-col gap-1">
          {MOBILE_NAV_MORE.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-[3px] px-2.5 py-2.5 text-[14px] font-medium text-text hover:bg-gray-light"
              >
                <Icon size={18} strokeWidth={1.7} />
                {item.label}
              </Link>
            );
          })}

          {user && (
            <>
              <div className="mt-2 border-t border-border pt-3">
                <div className="truncate px-2.5 text-[13px] font-medium text-text">{user.displayName}</div>
                <div className="truncate px-2.5 pb-1 text-xs text-text-3">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setMoreOpen(false);
                  await logout();
                  router.replace("/login");
                }}
                className="flex items-center gap-3 rounded-[3px] px-2.5 py-2.5 text-left text-[14px] text-text hover:bg-gray-light"
              >
                <LogOut size={18} strokeWidth={1.7} />
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
