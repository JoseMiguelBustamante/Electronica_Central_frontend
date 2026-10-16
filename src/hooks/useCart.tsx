import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  cartLineCount,
  cartTotal,
  cartUnitCount,
  loadCart,
  saveCart,
  type CartItem,
} from '../lib/cartStorage'

type CartListener = () => void

const listeners = new Set<CartListener>()
let snapshot: CartItem[] = typeof window === 'undefined' ? [] : loadCart()
let snapshotKey = JSON.stringify(snapshot)

function emitCartChange() {
  listeners.forEach((listener) => listener())
}

function subscribeCart(listener: CartListener) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== 'ec_cart_v1') return
    snapshot = loadCart()
    snapshotKey = JSON.stringify(snapshot)
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function getCartSnapshot(): CartItem[] {
  return snapshot
}

function getServerSnapshot(): CartItem[] {
  return []
}

function write(items: CartItem[]) {
  saveCart(items)
  const key = JSON.stringify(items)
  if (key !== snapshotKey) {
    snapshot = items
    snapshotKey = key
  } else {
    snapshot = items
  }
  emitCartChange()
}

interface CartContextValue {
  items: CartItem[]
  lineCount: number
  unitCount: number
  total: number
  addItem: (item: Omit<CartItem, 'cantidad'> & { cantidad?: number }) => void
  setQuantity: (id: string, cantidad: number) => void
  removeItem: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerSnapshot)

  const addItem = useCallback((entrada: Omit<CartItem, 'cantidad'> & { cantidad?: number }) => {
    const cantidad = Math.max(0.0001, entrada.cantidad ?? 1)
    const actual = loadCart()
    const idx = actual.findIndex((row) => row.id === entrada.id)
    let next: CartItem[]
    if (idx >= 0) {
      next = actual.map((row, i) => (
        i === idx
          ? {
              ...row,
              cantidad: row.cantidad + cantidad,
              precio: entrada.precio,
              nombre: entrada.nombre,
              codigo: entrada.codigo,
              disponibilidad: entrada.disponibilidad,
            }
          : row
      ))
    } else {
      next = [...actual, {
        id: entrada.id,
        codigo: entrada.codigo,
        nombre: entrada.nombre,
        precio: entrada.precio,
        cantidad,
        disponibilidad: entrada.disponibilidad,
      }]
    }
    write(next)
  }, [])

  const setQuantity = useCallback((id: string, cantidad: number) => {
    const actual = loadCart()
    if (cantidad <= 0) {
      write(actual.filter((row) => row.id !== id))
      return
    }
    write(actual.map((row) => (row.id === id ? { ...row, cantidad } : row)))
  }, [])

  const removeItem = useCallback((id: string) => {
    write(loadCart().filter((row) => row.id !== id))
  }, [])

  const clear = useCallback(() => {
    write([])
  }, [])

  const value = useMemo<CartContextValue>(() => ({
    items,
    lineCount: cartLineCount(items),
    unitCount: cartUnitCount(items),
    total: cartTotal(items),
    addItem,
    setQuantity,
    removeItem,
    clear,
  }), [items, addItem, setQuantity, removeItem, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
