import api from '../lib/api'
import type { ItemInventario, MovimientoInventario } from '../types/domain'

interface Meta {
  pagina: number
  limite: number
  total: number
}

export async function listarInventario(params?: {
  buscar?: string
  pagina?: number
  limite?: number
}): Promise<{ items: ItemInventario[]; meta: Meta }> {
  const { data } = await api.get('/api/inventario', { params })
  return {
    items: (data.data as Array<Record<string, unknown>>).map((row) => ({
      idProducto: String(row.idProducto),
      codigo: String(row.codigo),
      nombre: String(row.nombre),
      stockActual: Number(row.stockActual),
      stockMinimo: Number(row.stockMinimo),
      ubicacionCodigo: String((row.ubicacion as { codigo?: string } | null)?.codigo ?? ''),
      alerta: String(row.alerta ?? ''),
      costoPromedio: Number(row.costoPromedio ?? 0),
    })),
    meta: data.meta as Meta,
  }
}

export async function listarAlertasInventario(params?: {
  pagina?: number
  limite?: number
}): Promise<{ items: ItemInventario[]; meta: Meta }> {
  const { data } = await api.get('/api/inventario/alertas', { params })
  return {
    items: (data.data as Array<Record<string, unknown>>).map((row) => ({
      idProducto: String(row.idProducto),
      codigo: String(row.codigo),
      nombre: String(row.nombre),
      stockActual: Number(row.stockActual),
      stockMinimo: Number(row.stockMinimo),
      ubicacionCodigo: String((row.ubicacion as { codigo?: string } | null)?.codigo ?? ''),
      alerta: String(row.alerta ?? ''),
      costoPromedio: Number(row.costoPromedio ?? 0),
    })),
    meta: data.meta as Meta,
  }
}

export async function listarMovimientos(
  productoId: string,
  params?: { pagina?: number; limite?: number },
): Promise<{ items: MovimientoInventario[]; meta: Meta }> {
  const { data } = await api.get(`/api/inventario/${productoId}/movimientos`, { params })
  return {
    items: (data.data as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.idMovimiento ?? row.id ?? ''),
      fechaHora: String(row.fechaHora ?? ''),
      tipo: String(row.tipo ?? ''),
      cantidad: Number(row.cantidad ?? 0),
      motivo: String(row.motivo ?? ''),
    })),
    meta: data.meta as Meta,
  }
}

export async function actualizarStockMinimo(productoId: string, stockMinimo: number): Promise<void> {
  await api.patch(`/api/inventario/${productoId}`, { stockMinimo })
}

export async function crearAjuste(datos: {
  idProducto: string
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  motivo: string
  costoUnitario?: number
  claveIdempotencia: string
}): Promise<void> {
  await api.post('/api/inventario/ajustes', datos)
}
