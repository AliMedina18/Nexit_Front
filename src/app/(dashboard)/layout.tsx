"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronRight, LogOut } from "lucide-react";
import { presenciaApi } from "@/services/api/presencia-service";
import { useAuthStore } from "@/store/auth-store";
import { NAV } from "@/lib/nav-items";
import { MobileNav } from "@/components/ui/MobileNav";
import styles from "@/styles/shell.module.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  /**
   * Heartbeat de presencia en vivo (HU-12, docs/29) -- ping cada 50s mientras
   * la pestaña esté visible, para que "conectados ahora" en Usuarios sea
   * real. No pinguea con la pestaña en segundo plano (Page Visibility API),
   * tal cual pide el comentario del propio presencia-service.ts.
   */
  useEffect(() => {
    if (!user) return;
    let interval: ReturnType<typeof setInterval> | null = null;

    function pingIfVisible() {
      if (document.visibilityState === "visible") presenciaApi.ping().catch(() => {});
    }

    pingIfVisible();
    interval = setInterval(pingIfVisible, 50_000);
    document.addEventListener("visibilitychange", pingIfVisible);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", pingIfVisible);
    };
  }, [user]);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  if (!hydrated || !user) return null;

  return (
    <div className={styles.shell}>
      <aside className={`${styles.rail} flex-col items-center bg-[#0c0c0c] py-5`}>
        <Link
          href="/clientes"
          aria-label="Nexit"
          className="mb-9 flex h-6 w-6 items-center justify-center rounded-[4px] bg-green text-[13px] font-black leading-none lowercase text-text"
        >
          n
        </Link>

        <nav className="flex flex-col items-center gap-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex h-9 w-9 items-center justify-center rounded-[3px] text-white/65 transition-colors hover:bg-white/10 hover:text-white",
                  active && "bg-white/10 text-white",
                )}
              >
                {active && <span aria-hidden className="absolute -left-2.5 h-4 w-[2px] rounded-full bg-green" />}
                <Icon size={18} strokeWidth={1.75} />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-4">
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-[3px] text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Contraer barra lateral"
          >
            <ChevronRight size={14} strokeWidth={2} />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Cuenta"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-green text-[12px] font-semibold text-text"
            >
              {user.initials}
            </button>
            {menuOpen && (
              <div className="absolute bottom-0 left-[calc(100%+8px)] z-20 w-52 rounded-[var(--radius-lg)] border border-border bg-surface p-1.5 shadow-lg">
                <div className="truncate px-2.5 py-1.5 text-[13px] font-medium text-text">{user.displayName}</div>
                <div className="truncate px-2.5 pb-1.5 text-xs text-text-3">{user.email}</div>
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    router.replace("/login");
                  }}
                  className="flex w-full items-center gap-2 rounded-[3px] px-2.5 py-1.5 text-left text-[13px] text-text hover:bg-gray-light"
                >
                  <LogOut size={14} strokeWidth={2} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={styles.mobileHeader}>
        <Link href="/clientes" aria-label="Nexit" className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-green text-[13px] font-black leading-none lowercase text-text">
            n
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-text">Nexit</span>
        </Link>
      </div>

      <main className={styles.main}>{children}</main>

      <MobileNav />
    </div>
  );
}
