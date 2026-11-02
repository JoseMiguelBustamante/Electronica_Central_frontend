import api from '../lib/api'

export async function crearCheckoutStripeCarrito(datos: {
  items: Array<{ idProducto: string; cantidad: number }>
  successUrl: string
  cancelUrl: string
}): Promise<{ url: string; idVenta: string }> {
  const { data } = await api.post('/api/pagos/stripe/carrito', datos)
  const row = data.data as Record<string, unknown>
  return {
    url: String(row.url ?? ''),
    idVenta: String(row.idVenta ?? ''),
  }
}
