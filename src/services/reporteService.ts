import api from '../lib/api'

export interface ReporteVentas {
  periodo: { desde: string; hasta: string; zona: string }
  resumen: { vendido: number; cobrado: number; excluyeAnuladasDeVendido: boolean }
  items: Array<{
    idVenta: string
    fechaHora: string
    estado: string
    vendedor: string
    cliente: string
    total: number
    cobrado: number
    saldo: number
  }>
}

export interface ReporteGanancias {
  periodo: { desde: string; hasta: string; zona: string }
  resumen: { gananciaBruta: number }
  items: Array<{
    idVenta: string
    fechaHora: string
    codigo: string
    nombre: string
    cantidad: number
    precioUnitario: number
    costoUnitarioHistorico: number
    gananciaLinea: number
  }>
}

export interface ReporteInventario {
  fechaCorte: string
  zona: string
  resumen: { valoracionTotal: number; agotados: number; bajoMinimo: number }
  items: Array<{
    idProducto: string
    codigo: string
    nombre: string
    ubicacion: string
    stockCorte: number
    stockMinimo: number
    costoPromedio: number
    valoracion: number
    alerta: string | null
  }>
}

export interface ReporteRotacion {
  periodo: { desde: string; hasta: string; zona: string }
  rotacion: {
    cogs: number
    inventarioInicial: number
    inventarioFinal: number
    inventarioPromedio: number
    valor: number | null
    etiqueta: string | null
  }
  demanda: {
    ventasUnidades: number
    solicitudesUnidades: number
    nota: string
  }
}

export type TipoReporte = 'ventas' | 'ganancias' | 'inventario' | 'rotacion'

export interface ReporteInterpretado {
  tipo: TipoReporte
  desde: string
  hasta: string
  fechaCorte?: string
  titulo?: string
}

export async function interpretarReporteVoz(texto: string): Promise<ReporteInterpretado> {
  const { data } = await api.post('/api/reportes/interpretar', { texto })
  return data.data as ReporteInterpretado
}

export async function reporteVentas(params: {
  desde: string
  hasta: string
  estado?: string
}): Promise<ReporteVentas> {
  const { data } = await api.get('/api/reportes/ventas', { params: { ...params, formato: 'json' } })
  return data.data as ReporteVentas
}

export async function reporteGanancias(params: {
  desde: string
  hasta: string
}): Promise<ReporteGanancias> {
  const { data } = await api.get('/api/reportes/ganancias', { params: { ...params, formato: 'json' } })
  return data.data as ReporteGanancias
}

export async function reporteInventario(params: {
  fechaCorte: string
}): Promise<ReporteInventario> {
  const { data } = await api.get('/api/reportes/inventario', {
    params: { ...params, formato: 'json' },
  })
  return data.data as ReporteInventario
}

export async function reporteRotacion(params: {
  desde: string
  hasta: string
}): Promise<ReporteRotacion> {
  const { data } = await api.get('/api/reportes/rotacion-demanda', {
    params: { ...params, formato: 'json' },
  })
  return data.data as ReporteRotacion
}

type TipoExportable = 'ventas' | 'ganancias' | 'inventario' | 'rotacion'

export type FormatoReporte = 'pdf' | 'xlsx' | 'csv'

const ENDPOINTS: Record<TipoExportable, string> = {
  ventas: '/api/reportes/ventas',
  ganancias: '/api/reportes/ganancias',
  inventario: '/api/reportes/inventario',
  rotacion: '/api/reportes/rotacion-demanda',
}

export async function descargarReporte(params: {
  tipo: TipoExportable
  desde?: string
  hasta?: string
  fechaCorte?: string
  formato: FormatoReporte
}): Promise<void> {
  const { tipo, desde, hasta, fechaCorte, formato } = params
  const query =
    tipo === 'inventario' ? { fechaCorte } : { desde, hasta }
  const { data } = await api.get(ENDPOINTS[tipo], {
    params: { ...query, formato },
    responseType: 'blob',
  })
  const blob = data as Blob
  // Un error (400/403/500) llega como JSON dentro del blob: detectarlo antes de guardar.
  if (blob.type.includes('application/json')) {
    const body = JSON.parse(await blob.text()) as { error?: { message?: string } }
    throw new Error(body.error?.message || 'No se pudo descargar el reporte.')
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `reporte-${tipo}.${formato}`
  link.click()
  URL.revokeObjectURL(url)
}
