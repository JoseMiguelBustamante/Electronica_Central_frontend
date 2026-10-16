import api from '../lib/api'
import type { PagoVenta, Venta } from '../types/domain'

interface Meta {
  pagina: number
  limite: number
  total: number
}

function mapVenta(row: Record<string, unknown>): Venta {
  return {
    id: String(row.idVenta ?? row.id_venta ?? row.id),
    fechaHora: String(row.fechaHora ?? row.fecha_hora ?? ''),
    estado: String(row.estado ?? ''),
    idCliente: String(row.idCliente ?? row.id_cliente ?? ''),
    clienteNombre: String(row.clienteNombre ?? row.cliente_nombre ?? ''),
  }
}

function mapPago(row: Record<string, unknown>): PagoVenta {
  return {
    id: String(row.idPago ?? row.id_pago ?? row.id),
    fechaHora: String(row.fechaHora ?? row.fecha_hora ?? ''),
    monto: Number(row.monto ?? 0),
    metodo: String(row.metodo ?? ''),
    estado: String(row.estado ?? ''),
  }
}

export async function listarVentas(params?: {
  estado?: string
  idCliente?: string
  pagina?: number
  limite?: number
}): Promise<{ items: Venta[]; meta: Meta }> {
  const { data } = await api.get('/api/ventas', { params })
  return {
    items: (data.data as Array<Record<string, unknown>>).map(mapVenta),
    meta: data.meta as Meta,
  }
}

export async function crearVenta(datos: {
  idCliente: string
  detalles: Array<{ idProducto: string; cantidad: number; precioUnitario?: number }>
}): Promise<{ id: string }> {
  const { data } = await api.post('/api/ventas', datos)
  const row = data.data as Record<string, unknown>
  return { id: String(row.idVenta ?? row.id_venta ?? row.id) }
}

export async function confirmarVenta(id: string, claveIdempotencia: string): Promise<void> {
  await api.post(`/api/ventas/${id}/confirmar`, { claveIdempotencia })
}

export async function anularVenta(id: string, claveIdempotencia: string): Promise<void> {
  await api.post(`/api/ventas/${id}/anular`, { claveIdempotencia })
}

export async function listarPagosVenta(id: string): Promise<PagoVenta[]> {
  const { data } = await api.get(`/api/ventas/${id}/pagos`)
  return (data.data as Array<Record<string, unknown>>).map(mapPago)
}

export async function registrarPagoVenta(
  id: string,
  datos: { monto: number; metodo: 'EFECTIVO' | 'QR'; referenciaExterna?: string },
): Promise<void> {
  await api.post(`/api/ventas/${id}/pagos`, datos)
}

export async function confirmarPago(idPago: string, claveIdempotencia: string): Promise<void> {
  await api.post(`/api/pagos/${idPago}/confirmar`, { claveIdempotencia })
}
