/**
 * Misma regla que exige Supabase (configurada en el dashboard) y que documenta
 * Nexit_Back/docs/10 sección 7 -- las dos DEBEN coincidir, si no alguien pasa esta
 * validación visual y aun así le rebota el error en el servidor.
 */
export function validatePassword(password: string, confirm: string): string | null {
  if (password.length < 10) return "Debe tener al menos 10 caracteres.";
  if (!/[a-z]/.test(password)) return "Debe incluir al menos una letra minúscula.";
  if (!/[A-Z]/.test(password)) return "Debe incluir al menos una letra mayúscula.";
  if (!/[0-9]/.test(password)) return "Debe incluir al menos un número.";
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]/~`;']/.test(password)) return "Debe incluir al menos un símbolo (ej. ! @ # $ %).";
  if (password !== confirm) return "Las dos contraseñas no coinciden.";
  return null;
}
