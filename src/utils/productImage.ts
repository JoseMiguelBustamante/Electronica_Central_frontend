/** Public URL for a product photo stored as `<codigo>.jpg` on the API. */
export function urlImagenProducto(codigo: string): string {
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
  const seguro = encodeURIComponent(codigo.trim())
  return `${base}/media/productos/${seguro}.jpg`
}
