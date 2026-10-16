import { z } from 'zod'
import api from '../lib/api'
import { borrarToken, guardarToken } from '../lib/session'
import type { SesionUsuario } from '../types/domain'

const sesionUsuarioSchema = z.object({
  id: z.string(),
  nombreUsuario: z.string(),
  correo: z.string(),
  roles: z.array(z.string()),
  permisos: z.array(z.string()).default([]),
  cambioContrasenaObligatorio: z.boolean(),
})

const loginSchema = z.object({
  data: z.object({
    token: z.string(),
    usuario: sesionUsuarioSchema,
  }),
})

const meSchema = z.object({
  data: sesionUsuarioSchema,
})

function leer<T>(schema: z.ZodType<T>, payload: unknown): T {
  const parsed = schema.safeParse(payload)
  if (!parsed.success) throw new Error('Respuesta invalida del servidor')
  return parsed.data
}

export async function iniciarSesion(identificador: string, contrasena: string, recordar: boolean): Promise<SesionUsuario> {
  const { data } = await api.post('/api/auth/login', { identificador, contrasena })
  const sesion = leer(loginSchema, data)
  guardarToken(sesion.data.token, recordar)
  return sesion.data.usuario
}

export async function registrarCuentaCliente(datos: {
  nombreUsuario: string
  correo: string
  contrasena: string
  nombre: string
  telefono?: string
}): Promise<void> {
  await api.post('/api/auth/registro', {
    nombreUsuario: datos.nombreUsuario,
    correo: datos.correo,
    contrasena: datos.contrasena,
    nombre: datos.nombre,
    telefono: datos.telefono || undefined,
  })
}

export async function obtenerSesion(): Promise<SesionUsuario> {
  const { data } = await api.get('/api/auth/me')
  return leer(meSchema, data).data
}

export async function cerrarSesion(): Promise<void> {
  try {
    await api.post('/api/auth/logout')
  } finally {
    borrarToken()
  }
}

export async function cambiarContrasena(contrasenaActual: string, contrasenaNueva: string): Promise<void> {
  await api.post('/api/auth/cambiar-contrasena', { contrasenaActual, contrasenaNueva })
}

export async function solicitarRecuperacion(correo: string): Promise<{ enviado: boolean; mensaje: string }> {
  const { data } = await api.post('/api/auth/recuperar', { correo })
  const parsed = z
    .object({
      data: z.object({
        enviado: z.boolean(),
        mensaje: z.string(),
      }),
    })
    .safeParse(data)
  if (!parsed.success) throw new Error('Respuesta invalida del servidor')
  return parsed.data.data
}

export async function restablecerConToken(token: string, contrasenaNueva: string): Promise<void> {
  await api.post('/api/auth/restablecer', { token, contrasenaNueva })
}
