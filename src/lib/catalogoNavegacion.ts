const CLAVE = 'eca_catalogo_return_v1'

/** Guarda la última URL del catálogo (con filtros/página) para volver desde ficha o nav. */
export function recordarCatalogo(rutaConBusqueda: string) {
  try {
    sessionStorage.setItem(CLAVE, rutaConBusqueda)
  } catch {
    /* ignore quota / private mode */
  }
}

export function ultimaRutaCatalogo(fallback = '/'): string {
  try {
    const guardada = sessionStorage.getItem(CLAVE)
    if (guardada && guardada.startsWith('/')) return guardada
  } catch {
    /* ignore */
  }
  return fallback
}
