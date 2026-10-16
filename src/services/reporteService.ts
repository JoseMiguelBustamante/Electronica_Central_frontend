import api from '../lib/api'

export async function reporteVentas(params: {
  desde: string
  hasta: string
  estado?: string
}): Promise<unknown> {
  const { data } = await api.get('/api/reportes/ventas', { params: { ...params, formato: 'json' } })
  return data.data
}

export async function reporteGanancias(params: { desde: string; hasta: string }): Promise<unknown> {
  const { data } = await api.get('/api/reportes/ganancias', { params: { ...params, formato: 'json' } })
  return data.data
}

export async function reporteInventario(params: { fechaCorte: string }): Promise<unknown> {
  const { data } = await api.get('/api/reportes/inventario', {
    params: { ...params, formato: 'json' },
  })
  return data.data
}

export async function reporteRotacion(params: { desde: string; hasta: string }): Promise<unknown> {
  const { data } = await api.get('/api/reportes/rotacion-demanda', {
    params: { ...params, formato: 'json' },
  })
  return data.data
}
