"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { Check, ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, Rows3, Search, Star, X, type LucideIcon } from "lucide-react";
import { initials } from "@/lib/format";
import { COUNTRY_BADGE_COLORS } from "@/lib/constants";
import { countryCode } from "@/lib/geo";

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */
type ButtonVariant = "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  icon?: LucideIcon;
}

/** :active (al presionar) agregado 2026-09-01 -- antes solo había :hover, sin
 * ningún cambio visual al hacer clic/tap (pedido explícito: "el cambio de
 * color en los botones al presionarlos"). */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-teal-mid text-white hover:bg-green hover:text-text active:bg-teal active:text-white",
  ghost: "bg-surface text-text border border-border hover:bg-gray-light hover:border-border-strong active:bg-border",
  danger: "bg-red-light text-red border border-transparent hover:opacity-85 active:opacity-70",
};

export function Button({ variant = "ghost", size = "md", icon: Icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        size === "md" ? "px-3.5 py-2 text-[13px]" : "px-2.5 py-1.5 text-xs",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={size === "md" ? 15 : 13} strokeWidth={2} />}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Badge / Tag                                                                 */
/* -------------------------------------------------------------------------- */
export function Badge({
  children,
  bg,
  color,
  className,
}: {
  children: ReactNode;
  bg: string;
  color: string;
  className?: string;
}) {
  // Píldora (border-radius 20px, 11px/500, padding 3px 9px) -- es la forma que
  // el mockup aprobado usa para los estados en tarjeta, tabla y detalle.
  return (
    <span
      className={clsx("inline-flex items-center rounded-[20px] px-[9px] py-[3px] text-[11px] font-medium", className)}
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx("rounded-[20px] px-[9px] py-[3px] text-[11px] font-medium bg-gray-light text-text-2", className)}
    >
      {children}
    </span>
  );
}

/** Small 2-letter country chip, replaces flag emoji. */
export function CountryBadge({ pais }: { pais: string | undefined }) {
  const code = countryCode(pais);
  const c = COUNTRY_BADGE_COLORS[code];
  return (
    <Badge bg={c.bg} color={c.c} className="font-semibold tracking-wide">
      {code === "OTHER" ? "—" : code}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                      */
/* -------------------------------------------------------------------------- */
/**
 * Avatar de entidad (cliente/proveedor/proyecto): cuadrado negro con texto
 * verde -- ported 2026-08-28 del mockup aprobado (antes era un círculo con
 * paleta rotativa de 8 colores vía avatarColor(idx)). `idx` se deja opcional
 * y sin uso solo para no tocar los 6 call sites existentes que aún lo pasan.
 */
export function Avatar({
  nombre,
  size = "md",
}: {
  nombre: string;
  idx?: number;
  size?: "md" | "lg" | "sm";
}) {
  // 38px en tarjeta y 44px en el encabezado del detalle: medidas del mockup
  // aprobado (antes 34/48). `sm` (22px) es el de las filas de tabla.
  const px = size === "lg" ? 44 : size === "sm" ? 22 : 38;
  const fontSize = size === "lg" ? 15 : size === "sm" ? 9 : 13;
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-[3px] bg-text font-semibold text-green"
      style={{ width: px, height: px, fontSize }}
    >
      {initials(nombre)}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stars (SVG rating)                                                          */
/* -------------------------------------------------------------------------- */
export function Stars({ n, size = 13 }: { n: number; size?: number }) {
  // Verdes (#00A85A relleno / #C9C6BE contorno vacío) -- ported del HTML
  // aprobado (kPromStars en el prototipo). Antes quedaron en naranja
  // (#EF9F27) por error; el color real de la calificación en todo el
  // sistema es el mismo verde oscuro que usa "Valoración promedio".
  return (
    <span className="inline-flex items-center gap-[1px]" aria-label={`${n} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={i <= n ? 0 : 1.5}
          fill={i <= n ? "#00A85A" : "none"}
          stroke={i <= n ? "#00A85A" : "#C9C6BE"}
        />
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */
/**
 * `tone: "danger"` + `action` cubre el caso de que la carga inicial haya
 * fallado (ver el campo `error` de los stores de clientes/proveedores/
 * proyectos): mismo layout que el vacío normal, ícono y texto en rojo, y un
 * botón para reintentar en vez de dejar a la persona sin salida.
 */
export function EmptyState({
  icon: Icon,
  title,
  tone = "neutral",
  action,
}: {
  icon: LucideIcon;
  title: string;
  tone?: "neutral" | "danger";
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      className={clsx(
        "col-span-full flex flex-col items-center gap-2 py-14 text-center",
        tone === "danger" ? "text-red" : "text-text-2",
      )}
    >
      <Icon size={28} strokeWidth={1.5} className={tone === "danger" ? "text-red" : "text-text-3"} />
      <div className="text-[13px]">{title}</div>
      {action && (
        <Button variant="ghost" size="sm" className="mt-1" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat card                                                                   */
/* -------------------------------------------------------------------------- */
/**
 * `accent` pinta el número con el color del estado que resume la tarjeta --
 * en el mockup aprobado los KPI "Activos" van en verde (#036B3C) y
 * "Prospectos" en ámbar (#7A4E00), no todos en negro.
 */
export function StatCard({ n, label, accent }: { n: ReactNode; label: string; accent?: string }) {
  return (
    <div className="min-h-[80px] rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-3">{label}</div>
      <div className="mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em]" style={accent ? { color: accent } : undefined}>
        {n}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* View toggle (Tarjetas / Tabla)                                              */
/* -------------------------------------------------------------------------- */
/** Alterna entre vista de tarjetas y tabla en las 3 listas de base de datos
 * (Clientes/Proveedores/Proyectos) -- ported 2026-09-02 del HTML aprobado. */
export function ViewToggle({ view, onChange }: { view: "cards" | "table"; onChange: (v: "cards" | "table") => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-[var(--radius-lg)] border border-border bg-gray-light p-0.5">
      <button
        type="button"
        onClick={() => onChange("cards")}
        aria-pressed={view === "cards"}
        className={clsx(
          "flex items-center gap-1.5 rounded-[3px] px-2.5 py-1.5 text-[13px] font-medium transition-colors",
          view === "cards" ? "bg-surface text-text shadow-sm" : "text-text-2 hover:text-text",
        )}
      >
        <LayoutGrid size={14} strokeWidth={1.8} />
        Tarjetas
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        aria-pressed={view === "table"}
        className={clsx(
          "flex items-center gap-1.5 rounded-[3px] px-2.5 py-1.5 text-[13px] font-medium transition-colors",
          view === "table" ? "bg-surface text-text shadow-sm" : "text-text-2 hover:text-text",
        )}
      >
        <Rows3 size={14} strokeWidth={1.8} />
        Tabla
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Search input                                                                */
/* -------------------------------------------------------------------------- */
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full max-w-[260px]">
      <Search
        size={13}
        strokeWidth={2}
        className="pointer-events-none absolute left-[9px] top-1/2 -translate-y-1/2 text-text-3"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-md)] border border-border bg-surface py-1.5 pl-[27px] pr-2.5 text-[13px] text-text outline-none transition-colors focus:border-teal-mid"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Active filter chips                                                        */
/* -------------------------------------------------------------------------- */
export interface FilterChip {
  key: string;
  label: string;
}

/**
 * Chips de filtros aplicados -- ported del mockup aprobado: etiqueta
 * "APLICADOS" monoespaciada seguida de píldoras negras (28px de alto,
 * radio 20px) que al pasar el mouse se invierten a verde, y "Limpiar todo"
 * subrayado al final.
 *
 * `variant="panel"` es la forma del mockup: los chips viven DENTRO de la
 * tarjeta de filtros, separados por un borde superior. `"standalone"` (el
 * valor por defecto) mantiene la fila suelta debajo del panel, que es como
 * la usan todavía Proveedores, Proyectos y Calendario.
 */
export function ActiveFilters({
  chips,
  onRemove,
  onClearAll,
  variant = "standalone",
}: {
  chips: FilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  variant?: "standalone" | "panel";
}) {
  if (chips.length === 0) return null;
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-1.5",
        variant === "panel" ? "mt-3 border-t border-border pt-3" : "mb-4",
      )}
    >
      <span className="mr-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-3">Aplicados</span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex h-7 items-center gap-1.5 rounded-[20px] bg-text pl-[11px] pr-2 text-xs text-bg transition-colors hover:bg-green hover:text-text"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="flex cursor-pointer items-center rounded-[20px] border-none bg-transparent p-0.5 text-inherit hover:bg-white/15"
            aria-label={`Quitar filtro ${chip.label}`}
          >
            <X size={12} strokeWidth={2.2} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="ml-1 cursor-pointer border-none bg-transparent px-0.5 text-xs text-text-3 underline hover:text-text"
      >
        Limpiar todo
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tabs (header nav)                                                          */
/* -------------------------------------------------------------------------- */
export function TabsShell({ children }: { children: ReactNode }) {
  return <div className="flex gap-0.5 rounded-[var(--radius-lg)] bg-[#EAE8E1] p-[3px]">{children}</div>;
}

export function TabButton({
  active,
  icon: Icon,
  children,
  ...props
}: { active: boolean; icon?: LucideIcon; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        // `bg-transparent`/`bg-surface` no pueden ir los dos en la misma clase base: al
        // compilar, Tailwind ordena las utilidades por su posición en la hoja de estilos, no
        // por el orden del string, así que "el último que se declara gana" no depende de cuál
        // se escribió después aquí -- por eso antes el botón activo nunca se veía blanco (el
        // `bg-transparent` de la base le ganaba a `bg-surface` sin importar `active`). Cada
        // rama trae su propio fondo, nunca los dos a la vez.
        "inline-flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[var(--radius-md)] border-none px-[13px] text-[13px] font-medium text-text transition-colors",
        active ? "bg-surface shadow-[0_1px_2px_rgba(12,12,12,.1)]" : "bg-transparent hover:bg-bg",
      )}
      {...props}
    >
      {Icon && <Icon size={14} strokeWidth={2} />}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Dropdown (custom select)                                                    */
/* -------------------------------------------------------------------------- */
export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownGroup {
  label: string;
  options: DropdownOption[];
}

/**
 * Selector con panel desplegable propio -- ported 2026-09-03 del mockup
 * aprobado (patrón `mkDD` del HTML): un botón de 40px con el valor actual y
 * una flecha, que abre un panel (borde negro, radio 4px, sombra) con un
 * check verde junto a la opción elegida. Reemplaza el `<select>` nativo en
 * los filtros y en los formularios -- el navegador no puede reproducir ese
 * panel con un `<select>` normal, por eso es un componente aparte y no solo
 * una nueva clase sobre `Select`.
 *
 * `groups` es opcional (usa `options` normalmente) -- lo necesita el estado
 * del proyecto, que en el sistema real está organizado por fase (algo que el
 * mockup no modelaba con un `<optgroup>`, pero es dato real y no se podía
 * perder solo por pasar del `<select>` nativo a este panel).
 */
export function Dropdown({
  value,
  onChange,
  placeholder,
  options,
  groups,
  disabled,
  disabledHint,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options?: DropdownOption[];
  groups?: DropdownGroup[];
  disabled?: boolean;
  /** Texto del botón mientras está deshabilitado (ej. "— elige país primero —"). */
  disabledHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const flatOptions = groups ? groups.flatMap((g) => g.options) : (options ?? []);
  const current = flatOptions.find((o) => o.value === value)?.label;
  const label = disabled ? (disabledHint ?? placeholder) : (current ?? placeholder);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={clsx(
          "flex h-10 w-full cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border px-[11px] text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          current ? "border-text bg-surface font-medium text-text" : "border-border bg-bg font-normal text-text",
          !disabled && "hover:border-text hover:bg-surface",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronDown size={14} strokeWidth={2} className="flex-shrink-0 text-text-3" />
      </button>
      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[45px] z-[61] flex max-h-[266px] w-max min-w-full max-w-[290px] flex-col gap-[1px] overflow-y-auto rounded-[var(--radius-lg)] border border-text bg-surface p-[5px] shadow-[0_12px_34px_rgba(12,12,12,0.16)]">
            <DropdownItem label={placeholder} selected={!value} onClick={() => { onChange(""); setOpen(false); }} />
            {groups
              ? groups.map((g) => (
                  <div key={g.label}>
                    <div className="px-[9px] pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text-3">
                      {g.label}
                    </div>
                    {g.options.map((o) => (
                      <DropdownItem
                        key={o.value}
                        label={o.label}
                        selected={value === o.value}
                        onClick={() => { onChange(o.value); setOpen(false); }}
                      />
                    ))}
                  </div>
                ))
              : (options ?? []).map((o) => (
                  <DropdownItem
                    key={o.value}
                    label={o.label}
                    selected={value === o.value}
                    onClick={() => { onChange(o.value); setOpen(false); }}
                  />
                ))}
          </div>
        </>
      )}
    </div>
  );
}

function DropdownItem({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // El fondo va por clase (no por `style` inline como antes): un `style` inline gana
      // siempre sobre `hover:bg-gray-light` sin importar cuál se declaró después, así que la
      // opción no seleccionada nunca se resaltaba al pasar el mouse -- mismo defecto que el
      // de TabButton, solo que aquí con `style` en vez de una clase base fija.
      className={clsx(
        "flex w-full cursor-pointer items-center gap-[9px] whitespace-nowrap rounded-[3px] px-[9px] py-2 text-left text-sm text-text hover:bg-gray-light",
        selected ? "bg-[#F1EFE8]" : "bg-transparent",
      )}
    >
      <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center text-[#00A85A]">
        {selected && <Check size={14} strokeWidth={2.6} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                  */
/* -------------------------------------------------------------------------- */
/**
 * Paginación de las listas (Clientes/Proveedores/Proyectos) -- ported del
 * mockup aprobado: selector de "Filas" (10/15/20/Todas) a la izquierda,
 * rango actual ("1–10 de 24") a la derecha, y botones de página (solo si
 * hay más de una) al final. Antes esto faltaba por completo en la vista de
 * tabla y de tarjetas -- las listas largas no tenían forma de paginarse.
 */
export function Pagination({
  total,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 15, 20, 0],
}: {
  total: number;
  /** Página actual, 1-indexada. */
  page: number;
  /** Filas por página; 0 significa "Todas". */
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
}) {
  const per = perPage === 0 ? Math.max(total, 1) : perPage;
  const pages = Math.max(1, Math.ceil(total / per));
  const current = Math.min(page, pages);
  const start = (current - 1) * per;
  const rangeLabel = total > 0 ? `${start + 1}–${Math.min(start + per, total)} de ${total}` : "0 de 0";

  return (
    <div className="flex flex-wrap items-center gap-[18px]">
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] text-text-2">Filas</span>
        <div className="flex gap-1">
          {perPageOptions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPerPageChange(n)}
              className={clsx(
                "h-8 min-w-[36px] cursor-pointer rounded-[var(--radius-md)] border px-2.5 text-[13px] transition-colors",
                perPage === n
                  ? "border-text bg-text font-semibold text-white"
                  : "border-border bg-surface font-normal text-text-2 hover:border-text",
              )}
            >
              {n === 0 ? "Todas" : n}
            </button>
          ))}
        </div>
      </div>

      <span className="ml-auto font-mono text-xs text-text-3">{rangeLabel}</span>

      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Anterior"
            aria-label="Página anterior"
            disabled={current === 1}
            onClick={() => onPageChange(current - 1)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-text transition-colors hover:border-text disabled:cursor-default disabled:text-border-strong disabled:hover:border-border"
          >
            <ChevronLeft size={15} strokeWidth={2} />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              className={clsx(
                "h-8 min-w-[32px] cursor-pointer rounded-[var(--radius-md)] border px-2 text-[13px] transition-colors",
                n === current
                  ? "border-text bg-text font-semibold text-white"
                  : "border-border bg-surface font-normal text-text hover:border-text",
              )}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            title="Siguiente"
            aria-label="Página siguiente"
            disabled={current === pages}
            onClick={() => onPageChange(current + 1)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-text transition-colors hover:border-text disabled:cursor-default disabled:text-border-strong disabled:hover:border-border"
          >
            <ChevronRight size={15} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
