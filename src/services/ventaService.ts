import api from '../lib/api'
import type { LineaVenta, PagoVenta, Venta } from '../types/domain'

interface Meta {
  pagina: number
  limite: number
  total: number
}

function mapLinea(row: Record<string, unknown>): LineaVenta {
  return {
    idDetalleVenta: String(row.idDetalleVenta ?? row.id_detalle_venta ?? ''),
    idProducto: String(row.idProducto ?? row.id_producto ?? ''),
    codigo: String(row.codigo ?? ''),
    nombre: String(row.nombre ?? ''),
    cantidad: Number(row.cantidad ?? 0),
    precioUnitario: Number(row.precioUnitario ?? row.precio_unitario ?? 0),
    subtotal: Number(row.subtotal ?? 0),
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

function mapVenta(row: Record<string, unknown>): Venta {
  const comprobante = row.comprobante as Record<string, unknown> | null | undefined
  return {
    id: String(row.idVenta ?? row.id_venta ?? row.id),
    fechaHora: String(row.fechaHora ?? row.fecha_hora ?? ''),
    estado: String(row.estado ?? ''),
    idCliente: String(row.idCliente ?? row.id_cliente ?? ''),
    clienteNombre: String(row.clienteNombre ?? row.cliente_nombre ?? ''),
    clienteDocumento: row.clienteDocumento != null || row.cliente_documento != null
      ? String(row.clienteDocumento ?? row.cliente_documento)
      : undefined,
    total: row.total != null ? Number(row.total) : undefined,
    cobrado: row.cobrado != null ? Number(row.cobrado) : undefined,
    saldo: row.saldo != null ? Number(row.saldo) : undefined,
    resumenProductos: row.resumenProductos != null || row.resumen_productos != null
      ? String(row.resumenProductos ?? row.resumen_productos)
      : undefined,
    numeroComprobante: row.numeroComprobante != null || row.numero_comprobante != null
      ? String(row.numeroComprobante ?? row.numero_comprobante)
      : comprobante?.numero != null
        ? String(comprobante.numero)
        : null,
    detalles: Array.isArray(row.detalles)
      ? (row.detalles as Array<Record<string, unknown>>).map(mapLinea)
      : undefined,
    pagos: Array.isArray(row.pagos)
      ? (row.pagos as Array<Record<string, unknown>>).map(mapPago)
      : undefined,
    comprobante: comprobante
      ? {
          numero: String(comprobante.numero ?? ''),
          fechaEmision: String(comprobante.fechaEmision ?? comprobante.fecha_emision ?? ''),
        }
      : null,
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

export async function obtenerVenta(id: string): Promise<Venta> {
  const { data } = await api.get(`/api/ventas/${id}`)
  return mapVenta(data.data as Record<string, unknown>)
}

export async function crearVenta(datos: {
  idCliente: string
  detalles: Array<{ idProducto: string; cantidad: number; precioUnitario?: number }>
}): Promise<Venta> {
  const { data } = await api.post('/api/ventas', datos)
  return mapVenta(data.data as Record<string, unknown>)
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

/** Contrato de la rama del compañero: POST .../pagos/en-linea → urlPago */
export async function crearPagoEnLinea(
  id: string,
  datos?: { monto?: number; successUrl?: string; cancelUrl?: string },
): Promise<{ urlPago: string; idPago: string }> {
  const { data } = await api.post(`/api/ventas/${id}/pagos/en-linea`, datos ?? {})
  const row = data.data as Record<string, unknown>
  return {
    urlPago: String(row.urlPago ?? row.url ?? ''),
    idPago: String(row.idPago ?? row.id_pago ?? ''),
  }
}

export async function confirmarPago(idPago: string, claveIdempotencia: string): Promise<void> {
  await api.post(`/api/pagos/${idPago}/confirmar`, { claveIdempotencia })
}

export async function descargarComprobantePdf(id: string): Promise<void> {
  const { data } = await api.get(`/api/ventas/${id}/comprobante`, {
    params: { formato: 'pdf' },
    responseType: 'blob',
  })
  const blob = data as Blob
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `comprobante-${id.slice(0, 8)}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
