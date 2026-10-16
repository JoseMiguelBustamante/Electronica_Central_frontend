import api from '../lib/api'
import type { SolicitudProducto } from '../types/domain'

interface Meta {
  pagina: number
  limite: number
  total: number
}

function mapSolicitud(row: Record<string, unknown>): SolicitudProducto {
  return {
    id: String(row.idSolicitud ?? row.id_solicitud ?? row.id),
    fechaHora: String(row.fechaHora ?? row.fecha_hora ?? ''),
    descripcionProducto: String(row.descripcionProducto ?? row.descripcion_producto ?? ''),
    cantidad: Number(row.cantidad ?? 0),
    estado: String(row.estado ?? ''),
    clienteNombre: String(row.clienteNombre ?? row.cliente_nombre ?? ''),
  }
}

export async function listarSolicitudes(params?: {
  estado?: string
  pagina?: number
  limite?: number
}): Promise<{ items: SolicitudProducto[]; meta: Meta }> {
  const { data } = await api.get('/api/solicitudes', { params })
  return {
    items: (data.data as Array<Record<string, unknown>>).map(mapSolicitud),
    meta: data.meta as Meta,
  }
}

export async function crearSolicitud(datos: {
  descripcionProducto: string
  cantidad: number
  observaciones?: string
  idCliente?: string
  idProducto?: string
}): Promise<void> {
  await api.post('/api/solicitudes', datos)
}

export async function actualizarEstadoSolicitud(
  id: string,
  estado: 'ATENDIDA' | 'CANCELADA',
): Promise<void> {
  await api.patch(`/api/solicitudes/${id}/estado`, { estado })
}
