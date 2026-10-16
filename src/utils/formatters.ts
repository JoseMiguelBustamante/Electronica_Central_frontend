const numberFormat = new Intl.NumberFormat('es')

const dateTimeFormat = new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/La_Paz',
})

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** Formatea una fecha ISO 8601 como fecha y hora legibles. */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

const dateFormat = new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
  timeZone: 'America/La_Paz',
})

/** Formatea una fecha ISO 8601 solo como fecha. */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

const dateKeyFormat = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'America/La_Paz',
})

/** Dia calendario de una fecha ISO 8601 como `AAAA-MM-DD` (mismo formato que `<input type="date">`). */
export function toDateKey(iso: string): string {
  return dateKeyFormat.format(new Date(iso))
}

const currencyFormat = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' })
const precioMostrador = new Intl.NumberFormat('es-BO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formatea un monto en bolivianos (Bs). */
export function formatCurrency(value: number): string {
  return currencyFormat.format(value)
}

/** Precio de mostrador tal como se lee en el catálogo: `Bs 15,00`. */
export function formatPrecioMostrador(value: number): string {
  return `Bs ${precioMostrador.format(value)}`
}
