"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { getLastSection } from "@/lib/last-section";

export default function RootPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    // Antes mandaba siempre a "/proveedores" -- ahora vuelve a la última
    // sección visitada (o Clientes, si es la primera vez). Ver
    // src/lib/last-section.ts.
    router.replace(user ? getLastSection() : "/login");
  }, [hydrated, user, router]);

  return null;
}
