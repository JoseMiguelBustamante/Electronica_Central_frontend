export const PASSWORD_POLICY_HINT =
  'Mínimo 12 caracteres, con minúscula, mayúscula y número.'

export function validarPoliticaContrasena(valor: string): string | null {
  if (valor.length < 12) return 'La contraseña debe tener al menos 12 caracteres.'
  if (valor.length > 128) return 'La contraseña es demasiado larga.'
  if (!/[a-z]/.test(valor)) return 'La contraseña debe incluir al menos una minúscula.'
  if (!/[A-Z]/.test(valor)) return 'La contraseña debe incluir al menos una mayúscula.'
  if (!/\d/.test(valor)) return 'La contraseña debe incluir al menos un número.'
  return null
}
