export interface CartItem {
  id: string
  codigo: string
  nombre: string
  precio: number
  cantidad: number
  disponibilidad: string
}

const STORAGE_KEY = 'ec_cart_v1'

function leerBruto(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((row): row is CartItem => (
        row
        && typeof row === 'object'
        && typeof (row as CartItem).id === 'string'
        && typeof (row as CartItem).nombre === 'string'
        && typeof (row as CartItem).precio === 'number'
        && typeof (row as CartItem).cantidad === 'number'
      ))
      .map((row) => ({
        id: row.id,
        codigo: String(row.codigo ?? ''),
        nombre: row.nombre,
        precio: row.precio,
        cantidad: Math.max(0.0001, row.cantidad),
        disponibilidad: String(row.disponibilidad ?? ''),
      }))
  } catch {
    return []
  }
}

export function loadCart(): CartItem[] {
  return leerBruto()
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function cartUnitCount(items: CartItem[]): number {
  return items.reduce((suma, item) => suma + item.cantidad, 0)
}

export function cartLineCount(items: CartItem[]): number {
  return items.length
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((suma, item) => suma + item.precio * item.cantidad, 0)
}
