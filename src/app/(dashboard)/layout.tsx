"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Avatar, Button, TabButton, TabsShell } from "@/components/ui/primitives";
import { useAuthStore } from "@/store/auth-store";

const TABS = [
  { href: "/proveedores", label: "Proveedores" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/panel", label: "Panel de control" },
  { href: "/informe", label: "📊 Informe" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr]">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-surface px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Next Marketing Experiencial" width={104} height={26} style={{ height: 26, width: "auto" }} priority />
          <span className="h-5 w-px bg-border-strong" />
          <span className="text-[15px] font-semibold tracking-tight">Nexus</span>
        </div>

        <TabsShell>
          {TABS.map((tab) => (
            <Link key={tab.href} href={tab.href}>
              <TabButton active={pathname.startsWith(tab.href)}>{tab.label}</TabButton>
            </Link>
          ))}
        </TabsShell>

        <div className="ml-auto flex items-center gap-2">
          <Avatar nombre={user.displayName} idx={0} size="sm" />
          <span className="hidden max-w-[110px] truncate text-[13px] font-medium sm:inline">
            {user.displayName}
          </span>
          <Button
            size="sm"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-6 py-6">{children}</main>
    </div>
  );
}
