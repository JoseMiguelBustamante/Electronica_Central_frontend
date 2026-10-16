import { z } from 'zod'
import api from '../lib/api'
import type { CambiosUsuario, DatosUsuario, Usuario } from '../types/domain'

const usuarioSchema = z.object({
  id_usuario: z.string(),
  nombre_usuario: z.string(),
  correo: z.string(),
  activo: z.boolean(),
  roles: z.array(z.string()),
})

const listaSchema = z.object({ data: z.array(usuarioSchema) })

const mapUsuario = (row: z.infer<typeof usuarioSchema>): Usuario => ({
  id: row.id_usuario,
  nombreUsuario: row.nombre_usuario,
  correo: row.correo,
  activo: row.activo,
  roles: row.roles,
})

function leerLista(payload: unknown): Usuario[] {
  const parsed = listaSchema.safeParse(payload)
  if (!parsed.success) throw new Error('Respuesta invalida del servidor')
  return parsed.data.data.map(mapUsuario)
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get('/api/usuarios')
  return leerLista(data)
}

export async function crearUsuario(datos: DatosUsuario): Promise<void> {
  await api.post('/api/usuarios', datos)
}

export async function restablecerUsuario(id: string, contrasenaTemporal: string): Promise<void> {
  await api.post(`/api/usuarios/${id}/restablecer`, { contrasenaTemporal })
}

export async function editarUsuario(id: string, cambios: CambiosUsuario): Promise<void> {
  await api.patch(`/api/usuarios/${id}`, cambios)
}
