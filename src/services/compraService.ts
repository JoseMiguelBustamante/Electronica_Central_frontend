import api from '../lib/api'
import type { Compra } from '../types/domain'

interface Meta {
  pagina: number
  limite: number
  total: number
}

function mapCompra(row: Record<string, unknown>): Compra {
  return {
    id: String(row.idCompra ?? row.id_compra ?? row.id),
    numeroComprobante: String(row.numeroComprobante ?? row.numero_comprobante ?? ''),
    fecha: String(row.fecha ?? ''),
    estado: String(row.estado ?? ''),
    idProveedor: String(row.idProveedor ?? row.id_proveedor ?? ''),
    proveedorNombre: String(row.proveedorRazonSocial ?? row.proveedorNombre ?? row.proveedor_nombre ?? row.razonSocial ?? ''),
  }
}

export async function listarCompras(params?: {
  estado?: string
  idProveedor?: string
  pagina?: number
  limite?: number
}): Promise<{ items: Compra[]; meta: Meta }> {
  const { data } = await api.get('/api/compras', { params })
  return {
    items: (data.data as Array<Record<string, unknown>>).map(mapCompra),
    meta: data.meta as Meta,
  }
}

export async function crearCompra(datos: {
  idProveedor: string
  numeroComprobante: string
  fecha?: string
  detalles: Array<{ idProducto: string; cantidad: number; costoUnitario: number }>
}): Promise<void> {
  await api.post('/api/compras', datos)
}

export async function recibirCompra(id: string, claveIdempotencia: string): Promise<void> {
  await api.post(`/api/compras/${id}/recibir`, { claveIdempotencia })
}

export async function cancelarCompra(id: string): Promise<void> {
  await api.post(`/api/compras/${id}/cancelar`)
}
