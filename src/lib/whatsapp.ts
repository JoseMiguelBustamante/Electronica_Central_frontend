import { COMPRA } from './compraMensajes'

/** Digitos E.164 sin +. Preferí VITE_WHATSAPP; si no, COMPRA.whatsappE164. */
export function whatsappE164(): string {
  const desdeEnv = String(import.meta.env.VITE_WHATSAPP ?? '')
    .replace(/\D/g, '')
    .trim()
  if (desdeEnv) return desdeEnv
  return String(COMPRA.whatsappE164 ?? '').replace(/\D/g, '').trim()
}

export function whatsappDisponible(): boolean {
  return whatsappE164().length >= 8
}

export function urlWhatsapp(mensaje?: string): string | null {
  const numero = whatsappE164()
  if (!numero) return null
  const base = `https://wa.me/${numero}`
  const texto = mensaje?.trim()
  if (!texto) return base
  return `${base}?text=${encodeURIComponent(texto)}`
}

export function mensajeConsultaProducto(datos: {
  codigo: string
  nombre: string
  precioTexto: string
  cantidad?: number
}): string {
  const unidades = datos.cantidad && datos.cantidad > 1 ? ` (x${datos.cantidad})` : ''
  return [
    'Hola, quiero consultar este producto de Electrónica Central AZ:',
    `${datos.codigo} — ${datos.nombre}${unidades}`,
    `Precio: ${datos.precioTexto}`,
  ].join('\n')
}

export function mensajeConsultaCarrito(
  lineas: Array<{ codigo: string; nombre: string; cantidad: number; precio: number }>,
  totalTexto: string,
): string {
  const detalle = lineas
    .map((l) => `• ${l.cantidad} × ${l.codigo} — ${l.nombre}`)
    .join('\n')
  return [
    'Hola, quiero consultar este pedido de Electrónica Central AZ:',
    detalle,
    `Total estimado: ${totalTexto}`,
  ].join('\n')
}
