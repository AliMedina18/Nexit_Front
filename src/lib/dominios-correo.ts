/**
 * Dominios de correo permitidos -- Nexit_Back/docs/09
 * (docs/schema/seed_geografia_categorias_estados.sql, "novena revisión",
 * confirmado 2026-08-23): 'agencianextmkt.com' es el ÚNICO dominio permitido
 * hoy -- lo confirmó la usuaria con cuentas reales bajo ese dominio, y el
 * antiguo placeholder 'nextexperiencial.com' ya se retiró de la tabla. Esta
 * es una validación de UX (mensaje inmediato, sin esperar la ida y vuelta
 * al backend/Supabase) -- el filtro real y definitivo sigue viviendo en
 * Nexit_Back (CreateUsuarioValidator / InvitacionValidators) y en el
 * trigger de Postgres check_usuario_dominio_correo, tal como documenta
 * docs/10. Si algún día se agrega otro dominio, es un INSERT en esa misma
 * tabla del backend -- y hay que reflejarlo acá también. */
export const DOMINIOS_CORREO_PERMITIDOS = ["agencianextmkt.com"];

export function esDominioPermitido(correo: string): boolean {
  const dominio = correo.trim().toLowerCase().split("@")[1];
  if (!dominio) return false;
  return DOMINIOS_CORREO_PERMITIDOS.includes(dominio);
}

export function mensajeDominioNoPermitido(): string {
  if (DOMINIOS_CORREO_PERMITIDOS.length === 1) {
    return `Solo se permiten correos del dominio @${DOMINIOS_CORREO_PERMITIDOS[0]}.`;
  }
  return `Solo se permiten correos de estos dominios: ${DOMINIOS_CORREO_PERMITIDOS.map((d) => `@${d}`).join(", ")}.`;
}
