import { isAxiosError } from 'axios'

export function mensajeError(error: unknown, respaldo: string): string {
  if (isAxiosError(error)) {
    const payload = error.response?.data?.error
    const message = payload?.message
    if (typeof message === 'string' && message.trim()) {
      const details = payload?.details
      if (details && typeof details === 'object' && details !== null) {
        const restantes = (details as { intentosRestantes?: number }).intentosRestantes
        if (typeof restantes === 'number' && restantes >= 0) {
          return `${message} Intentos restantes: ${restantes}.`
        }
        const minutos = (details as { minutosBloqueo?: number }).minutosBloqueo
        if (typeof minutos === 'number' && minutos > 0 && !message.includes('Espere')) {
          return `${message} Espere ${minutos} minuto(s).`
        }
      }
      return message
    }
  }
  if (error instanceof Error && error.message.trim()) return error.message
  return respaldo
}
