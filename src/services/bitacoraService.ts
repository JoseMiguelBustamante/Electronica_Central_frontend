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
})

const listaSchema = z.object({ data: z.array(registroSchema) })

const mapResultado = (valor: string): ResultadoBitacora => {
  const normalizado = valor.trim().toUpperCase()
  if (normalizado === 'OK' || normalizado === 'EXITO' || normalizado === 'ÉXITO') return 'exito'
  if (normalizado === 'ERROR') return 'error'
  return 'advertencia'
}

export async function listarRegistrosBitacora(): Promise<RegistroBitacora[]> {
  const { data } = await api.get('/api/bitacora')
  const parsed = listaSchema.safeParse(data)
  if (!parsed.success) throw new Error('Respuesta invalida del servidor')
  return parsed.data.data.map((row) => ({
    id: row.id_registro,
    fechaHora: row.fecha_hora,
    accion: row.accion,
    objeto: row.objeto,
    resultado: mapResultado(row.resultado),
    usuario: row.usuario,
  }))
}
