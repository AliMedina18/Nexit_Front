"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarCheck2, MapPin, Settings, Truck } from "lucide-react";
import { TabButton, TabsShell } from "@/components/ui/primitives";
import { useAuthStore } from "@/store/auth-store";
import { useCatalogosStore } from "@/store/catalogos-store";
import styles from "@/styles/dashboard.module.css";
import { CatalogList } from "./CatalogList";
import { UbicacionesSection } from "./UbicacionesSection";
import { EstadosProyectoSection } from "./EstadosProyectoSection";
import { EtapasClienteSection } from "./EtapasClienteSection";

type Tab = "ubicaciones" | "proveedores" | "proyectos" | "clientes";

/**
 * Configuración (2026-09-09, debajo de Usuarios en el riel): así como admin/super_admin pueden
 * agregar/editar países, categorías de proveedor, estados de proyecto, etc. -- Alicia: "podemos
 * agregar más estados... más categorías o editarlas, podemos agregar más países... es de acuerdo
 * para poder agregar más etapas, como más etapas de proceso comercial". Es una pantalla de solo
 * catálogos: nada de esto toca clientes/proveedores/proyectos directamente, solo las listas de
 * las que esos formularios sacan sus opciones (mismo `catalogosApi` que ya usa el resto de la app).
 */
export default function ConfiguracionPage() {
  const user = useAuthStore((s) => s.user);
  const puedeVer = user?.rol === "admin" || user?.rol === "super_admin";
  const { categoriasProveedor, servicios, fetchBase, addCategoria, updateCategoria, addServicio, updateServicio, removeCatalogo } = useCatalogosStore();
  const [tab, setTab] = useState<Tab>("ubicaciones");

  useEffect(() => {
    if (puedeVer) fetchBase();
  }, [puedeVer, fetchBase]);

  if (!puedeVer) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center text-text-2">
        <Settings size={28} strokeWidth={1.5} className="text-text-3" />
        <div className="text-[13px]">La configuración está disponible solo para administradores.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-3">Catálogos</div>
        <h1 className={styles.h1}>Configuración</h1>
        <p className="mt-1 max-w-[640px] text-[13px] text-text-2">
          Los catálogos que usan los formularios de Clientes, Proveedores y Proyectos -- agregar o editar acá se refleja de inmediato en esas pantallas.
        </p>
      </div>

      <TabsShell className="self-start">
        <TabButton active={tab === "ubicaciones"} icon={MapPin} onClick={() => setTab("ubicaciones")}>Ubicaciones</TabButton>
        <TabButton active={tab === "proveedores"} icon={Truck} onClick={() => setTab("proveedores")}>Proveedores</TabButton>
        <TabButton active={tab === "proyectos"} icon={CalendarCheck2} onClick={() => setTab("proyectos")}>Proyectos</TabButton>
        <TabButton active={tab === "clientes"} icon={Building2} onClick={() => setTab("clientes")}>Clientes</TabButton>
      </TabsShell>

      {tab === "ubicaciones" && <UbicacionesSection />}

      {tab === "proveedores" && (
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-2 text-[13px] font-semibold text-text">Categorías de proveedor</div>
            <CatalogList
              items={categoriasProveedor}
              placeholder="Nueva categoría…"
              emptyLabel="Sin categorías todavía."
              onAdd={addCategoria}
              onUpdate={updateCategoria}
              onRemove={(id) => removeCatalogo("categorias-proveedor", id)}
            />
          </div>
          <div>
            <div className="mb-2 text-[13px] font-semibold text-text">Servicios que prestan</div>
            <CatalogList
              items={servicios}
              placeholder="Nuevo servicio…"
              emptyLabel="Sin servicios todavía."
              onAdd={addServicio}
              onUpdate={updateServicio}
              onRemove={(id) => removeCatalogo("servicios", id)}
            />
          </div>
          {/* Alicia 2026-09-09 mencionó también "estados de gestión de proveedores" (Activo/En
              evaluación/Pausado/Bloqueado) -- a diferencia de todo lo demás en esta pantalla, ESE
              no es un catálogo real del backend: está fijo en el código (`PROVEEDOR_ESTADOS` en
              lib/constants.ts). Hacerlo editable acá necesitaría trabajo de backend nuevo (tabla +
              endpoints), así que se avisa en vez de fingir que ya funciona. */}
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-gray-light px-4 py-3 text-sm text-text-2">
            Los estados de gestión de proveedores (Activo / En evaluación / Pausado / Bloqueado) todavía no son un catálogo editable -- están fijos en el código. Si los quieres editables desde acá, es un cambio de backend nuevo, no solo de esta pantalla.
          </div>
        </div>
      )}

      {tab === "proyectos" && <EstadosProyectoSection />}

      {tab === "clientes" && (
        <div>
          <div className="mb-2 text-[13px] font-semibold text-text">Etapas del proceso comercial</div>
          <EtapasClienteSection />
        </div>
      )}
    </div>
  );
}
