import { isAxiosError } from 'axios'

export function mensajeError(error: unknown, respaldo: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string' && message.trim()) return message
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return respaldo
}
