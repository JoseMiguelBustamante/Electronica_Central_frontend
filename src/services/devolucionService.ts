import api from '../lib/api'

export interface DetalleDevolucion {
  idDetalleDevolucion: string
  idDetalleVenta: string
  idProducto: string
  codigo: string | null
  nombre: string | null
  cantidad: number
  resolucion: 'CANJE' | 'REEMBOLSO'
  montoReembolso: number
}

export interface Devolucion {
  idDevolucion: string
  fechaHora: string
  motivo: string
  observacion: string | null
  idVenta: string
  ventaEstado: string | null
  clienteNombre: string | null
  nombreUsuario: string | null
  montoReembolsoTotal: number
  ventaAnulada?: boolean
  detalles: DetalleDevolucion[]
}

interface Meta {
  pagina: number
  limite: number
  total: number
}

function mapDetalle(row: Record<string, unknown>): DetalleDevolucion {
  return {
    idDetalleDevolucion: String(row.idDetalleDevolucion ?? row.id_detalle_devolucion ?? ''),
    idDetalleVenta: String(row.idDetalleVenta ?? row.id_detalle_venta ?? ''),
    idProducto: String(row.idProducto ?? row.id_producto ?? ''),
    codigo: row.codigo != null ? String(row.codigo) : null,
    nombre: row.nombre != null ? String(row.nombre) : null,
    cantidad: Number(row.cantidad ?? 0),
    resolucion: String(row.resolucion) as 'CANJE' | 'REEMBOLSO',
    montoReembolso: Number(row.montoReembolso ?? row.monto_reembolso ?? 0),
  }
}

function mapDevolucion(row: Record<string, unknown>): Devolucion {
  return {
    idDevolucion: String(row.idDevolucion ?? row.id_devolucion ?? ''),
    fechaHora: String(row.fechaHora ?? row.fecha_hora ?? ''),
    motivo: String(row.motivo ?? ''),
    observacion: row.observacion != null ? String(row.observacion) : null,
    idVenta: String(row.idVenta ?? row.id_venta ?? ''),
    ventaEstado: row.ventaEstado != null || row.venta_estado != null
      ? String(row.ventaEstado ?? row.venta_estado)
      : null,
    clienteNombre: row.clienteNombre != null || row.cliente_nombre != null
      ? String(row.clienteNombre ?? row.cliente_nombre)
      : null,
    nombreUsuario: row.nombreUsuario != null || row.nombre_usuario != null
      ? String(row.nombreUsuario ?? row.nombre_usuario)
      : null,
    montoReembolsoTotal: Number(row.montoReembolsoTotal ?? row.monto_reembolso_total ?? 0),
    ventaAnulada: Boolean(row.ventaAnulada),
    detalles: Array.isArray(row.detalles)
      ? (row.detalles as Array<Record<string, unknown>>).map(mapDetalle)
      : [],
  }
}

export async function listarDevoluciones(params?: {
  idVenta?: string
  pagina?: number
  limite?: number
}): Promise<{ items: Devolucion[]; meta: Meta }> {
  const { data } = await api.get('/api/devoluciones', { params })
  return {
    items: (data.items as Array<Record<string, unknown>>).map(mapDevolucion),
    meta: data.meta as Meta,
  }
}

export async function crearDevolucion(datos: {
  idVenta: string
  observacion?: string
  detalles: Array<{ idDetalleVenta: string; cantidad: number }>
}): Promise<Devolucion> {
  const { data } = await api.post('/api/devoluciones', datos)
  return mapDevolucion(data.data as Record<string, unknown>)
}
