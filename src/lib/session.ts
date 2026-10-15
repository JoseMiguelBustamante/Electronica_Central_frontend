const TOKEN_KEY = 'az.token'

export function leerToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
}

export function guardarToken(token: string, recordar: boolean): void {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
  const almacen = recordar ? localStorage : sessionStorage
  almacen.setItem(TOKEN_KEY, token)
}

export function borrarToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_KEY)
}
