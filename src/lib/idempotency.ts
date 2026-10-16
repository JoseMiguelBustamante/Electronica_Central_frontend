/** Generates a unique idempotency key for mutating API calls. */
export function claveIdempotencia(prefijo = 'ui'): string {
  return `${prefijo}-${crypto.randomUUID()}`
}
