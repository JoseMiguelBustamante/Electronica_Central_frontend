import api from '../lib/api'
import type { Cliente } from '../types/domain'

function mapCliente(row: Record<string, unknown>): Cliente {
  return {
    id: String(row.id_cliente ?? row.idCliente ?? row.id),
    nombre: String(row.nombre ?? ''),
    documento: String(row.documento ?? ''),
    telefono: String(row.telefono ?? ''),
    correo: String(row.correo ?? ''),
  }
}

export async function listarClientes(): Promise<Cliente[]> {
  const { data } = await api.get('/api/clientes')
  const rows = Array.isArray(data.data) ? data.data : data.data?.items ?? []
  return (rows as Array<Record<string, unknown>>).map(mapCliente)
}

export async function crearCliente(datos: {
  nombre: string
  documento?: string
  telefono?: string
  correo?: string
}): Promise<void> {
  await api.post('/api/clientes', datos)
}
