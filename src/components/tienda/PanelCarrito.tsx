import { useEffect, useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MinusIcon, PlusIcon, ShoppingCartIcon, TrashIcon, XIcon } from '@phosphor-icons/react'
import Button from '../Button'
import ImagenProducto from './ImagenProducto'
import { useCart } from '../../hooks/useCart'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { leerToken } from '../../lib/session'
import { formatCurrency } from '../../utils/formatters'
import { ROUTES } from '../../utils/navigation'
import { FOCUS_RING, cn } from '../../utils/styles'

function etiquetaUnidades(n: number): string {
  return n === 1 ? '1 unidad' : `${n} unidades`
}

function etiquetaProductos(n: number): string {
  return n === 1 ? '1 producto' : `${n} productos`
}

/** Panel lateral del carrito: se abre sobre la página actual, sin cambiar de ruta. */
export default function PanelCarrito() {
  const navigate = useNavigate()
  const tituloId = useId()
  const {
    items,
    lineCount,
    unitCount,
    total,
    drawerOpen,
    closeDrawer,
    setQuantity,
    removeItem,
  } = useCart()
  const conSesion = Boolean(leerToken())

  useEscapeKey(drawerOpen, closeDrawer)

  useEffect(() => {
    if (!drawerOpen) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [drawerOpen])

  const irAPagar = () => {
    closeDrawer()
    if (!conSesion) {
      navigate(`${ROUTES.login}?volver=${encodeURIComponent(ROUTES.carrito)}`)
      return
    }
    navigate(ROUTES.carrito)
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[55]',
        drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!drawerOpen}
    >
      <button
        type="button"
        tabIndex={drawerOpen ? 0 : -1}
        aria-label="Cerrar carrito"
        onClick={closeDrawer}
        className={cn(
          'absolute inset-0 bg-tinta/40 transition-opacity duration-200',
          drawerOpen ? 'opacity-100' : 'opacity-0',
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200 ease-out',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-linea px-4 py-4">
          <div>
            <h2 id={tituloId} className="text-lg font-semibold text-tinta">
              Tu carrito
            </h2>
            <p className="mt-0.5 text-sm text-secundario">
              {etiquetaProductos(lineCount)} · {etiquetaUnidades(unitCount)}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className={`grid size-10 place-items-center rounded-md text-secundario hover:bg-suave hover:text-tinta ${FOCUS_RING}`}
            aria-label="Cerrar"
          >
            <XIcon size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
              <ShoppingCartIcon size={36} className="text-secundario" aria-hidden="true" />
              <p className="text-sm text-secundario">Tu carrito está vacío.</p>
              <Button variant="secondary" onClick={closeDrawer}>
                Seguir comprando
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="rounded-xl border border-linea p-3">
                  <div className="flex gap-3">
                    <ImagenProducto
                      codigo={item.codigo}
                      categoria=""
                      nombre={item.nombre}
                      marcoClassName="h-16 w-16 shrink-0 rounded-lg border border-linea bg-white"
                      className="max-h-14"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-tinta">{item.nombre}</p>
                          <p className="text-xs text-secundario">
                            {formatCurrency(item.precio)} por unidad
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Quitar ${item.nombre}`}
                          onClick={() => removeItem(item.id)}
                          className={`grid size-8 shrink-0 place-items-center rounded-md text-secundario hover:bg-suave hover:text-peligro ${FOCUS_RING}`}
                        >
                          <TrashIcon size={16} aria-hidden="true" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex h-10 items-center rounded-lg border border-linea bg-white">
                          <button
                            type="button"
                            aria-label="Disminuir cantidad"
                            onClick={() => setQuantity(item.id, item.cantidad - 1)}
                            className={`grid size-10 place-items-center hover:bg-suave ${FOCUS_RING}`}
                          >
                            <MinusIcon size={14} aria-hidden="true" />
                          </button>
                          <span className="min-w-8 text-center font-mono text-sm">{item.cantidad}</span>
                          <button
                            type="button"
                            aria-label="Aumentar cantidad"
                            onClick={() => setQuantity(item.id, item.cantidad + 1)}
                            className={`grid size-10 place-items-center hover:bg-suave ${FOCUS_RING}`}
                          >
                            <PlusIcon size={14} aria-hidden="true" />
                          </button>
                        </div>
                        <p className="font-mono text-sm font-semibold text-disponible">
                          {formatCurrency(item.precio * item.cantidad)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="space-y-3 border-t border-linea px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-tinta">Total</span>
              <span className="font-mono text-lg font-semibold text-cobre">{formatCurrency(total)}</span>
            </div>
            <Button className="w-full" onClick={irAPagar}>
              <ShoppingCartIcon size={16} aria-hidden="true" />
              Ir al carrito
            </Button>
            <Button variant="secondary" className="w-full" onClick={closeDrawer}>
              Seguir comprando
            </Button>
            <p className="text-center text-xs text-secundario">
              O abrí la{' '}
              <Link to={ROUTES.carrito} onClick={closeDrawer} className={`font-semibold text-mascara hover:underline ${FOCUS_RING}`}>
                página de pago
              </Link>
              .
            </p>
          </footer>
        )}
      </aside>
    </div>
  )
}
