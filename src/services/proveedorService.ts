import api from '../lib/api'
import type { Proveedor } from '../types/domain'

interface Meta {
  pagina: number
  limite: number
  total: number
}

function mapProveedor(row: Record<string, unknown>): Proveedor {
  return {
    id: String(row.idProveedor ?? row.id_proveedor),
    razonSocial: String(row.razonSocial ?? row.razon_social ?? ''),
    documento: String(row.documento ?? ''),
    telefono: String(row.telefono ?? ''),
    correo: String(row.correo ?? ''),
    direccion: String(row.direccion ?? ''),
    activo: Boolean(row.activo ?? true),
  }
}

export async function listarProveedores(params?: {
  buscar?: string
  activo?: boolean
  pagina?: number
  limite?: number
}): Promise<{ items: Proveedor[]; meta: Meta }> {
  const { data } = await api.get('/api/proveedores', { params })
  return {
    items: (data.data as Array<Record<string, unknown>>).map(mapProveedor),
    meta: data.meta as Meta,
  }
}

export async function crearProveedor(datos: {
  razonSocial: string
  documento?: string
  telefono?: string
  correo?: string
  direccion?: string
}): Promise<void> {
  await api.post('/api/proveedores', datos)
}

export async function actualizarProveedor(
  id: string,
  datos: Partial<{
    razonSocial: string
    documento: string | null
    telefono: string | null
    correo: string | null
    direccion: string | null
    activo: boolean
  }>,
): Promise<void> {
  await api.patch(`/api/proveedores/${id}`, datos)
}
