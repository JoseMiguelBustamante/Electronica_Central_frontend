const CLAVE = 'eca_favoritos_v1'

function leerIds(): string[] {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return []
    const parsed = JSON.parse(crudo) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

function guardarIds(ids: string[]) {
  localStorage.setItem(CLAVE, JSON.stringify(ids))
}

export function listarFavoritosIds(): string[] {
  return leerIds()
}

export function esFavorito(id: string): boolean {
  return leerIds().includes(id)
}

export function alternarFavorito(id: string): boolean {
  const actual = leerIds()
  const indice = actual.indexOf(id)
  let activo: boolean
  if (indice >= 0) {
    actual.splice(indice, 1)
    guardarIds(actual)
    activo = false
  } else {
    actual.push(id)
    guardarIds(actual)
    activo = true
  }
  window.dispatchEvent(new Event('eca-favoritos'))
  return activo
}

export function cantidadFavoritos(): number {
  return leerIds().length
}
