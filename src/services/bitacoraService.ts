import { z } from 'zod'
import api from '../lib/api'
import type { RegistroBitacora, ResultadoBitacora } from '../types/domain'

const registroSchema = z.object({
  id_registro: z.string(),
  fecha_hora: z.string(),
  accion: z.string(),
  objeto_afectado: z.string(),
  objeto: z.string(),
  resultado: z.string(),
  id_usuario: z.string().nullable(),
  usuario: z.string(),
  direccion_ip: z.string().nullable().optional(),
  tabla_afectada: z.string().nullable().optional(),
})

const listaSchema = z.object({ data: z.array(registroSchema) })

const mapResultado = (valor: string): ResultadoBitacora => {
  const normalizado = valor.trim().toUpperCase()
  if (normalizado === 'OK' || normalizado === 'EXITO' || normalizado === 'ÉXITO') return 'exito'
  if (normalizado === 'ERROR' || normalizado === 'FALLIDO') return 'error'
  return 'advertencia'
}

/** Filtros del servidor (CU-3). Las fechas van como YYYY-MM-DD en hora de La Paz. */
export interface FiltrosBitacora {
  desde?: string
  hasta?: string
  usuario?: string
  accion?: string
  tabla?: string
  limite?: number
}

export async function listarRegistrosBitacora(filtros: FiltrosBitacora = {}): Promise<RegistroBitacora[]> {
  const { data } = await api.get('/api/bitacora', {
    params: {
      desde: filtros.desde || undefined,
      hasta: filtros.hasta || undefined,
      usuario: filtros.usuario || undefined,
      accion: filtros.accion || undefined,
      tabla: filtros.tabla || undefined,
      limite: filtros.limite ?? 2000,
    },
  })
  const parsed = listaSchema.safeParse(data)
  if (!parsed.success) throw new Error('Respuesta invalida del servidor')
  return parsed.data.data.map((row) => ({
    id: row.id_registro,
    fechaHora: row.fecha_hora,
    accion: row.accion,
    objeto: row.objeto,
    resultado: mapResultado(row.resultado),
    usuario: row.usuario,
    direccionIp: row.direccion_ip ?? '',
    tabla: row.tabla_afectada ?? '',
  }))
}
