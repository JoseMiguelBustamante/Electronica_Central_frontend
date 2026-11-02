import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MinusIcon, PlusIcon, ShoppingCartIcon, TrashIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import ImagenProducto from '../components/tienda/ImagenProducto'
import { useCart } from '../hooks/useCart'
import { mensajeError } from '../lib/errors'
import { leerToken } from '../lib/session'
import { crearCheckoutStripeCarrito } from '../services/pagoStripeService'
import { COMPRA } from '../lib/compraMensajes'
import { formatCurrency } from '../utils/formatters'
import { ROUTES } from '../utils/navigation'
import { FOCUS_RING } from '../utils/styles'

function etiquetaUnidades(n: number): string {
  return n === 1 ? '1 unidad' : `${n} unidades`
}

function etiquetaProductos(n: number): string {
  return n === 1 ? '1 producto' : `${n} productos`
}

export default function Carrito() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, lineCount, unitCount, total, setQuantity, removeItem, clear } = useCart()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avisoPago, setAvisoPago] = useState<'ok' | 'cancel' | null>(null)
  const conSesion = Boolean(leerToken())

  useEffect(() => {
    const pago = searchParams.get('pago')
    if (pago === 'ok' || pago === 'cancel') {
      setAvisoPago(pago)
      if (pago === 'ok') clear()
      const next = new URLSearchParams(searchParams)
      next.delete('pago')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, clear])

  const pagarConStripe = async () => {
    if (confirmando || items.length === 0) return
    if (!conSesion) {
      navigate(`${ROUTES.login}?volver=${encodeURIComponent(ROUTES.carrito)}`)
      return
    }
    setConfirmando(true)
    setError(null)
    try {
      const origin = window.location.origin
      const result = await crearCheckoutStripeCarrito({
        items: items.map((item) => ({ idProducto: item.id, cantidad: item.cantidad })),
        successUrl: `${origin}${ROUTES.pagosExito}?desde=carrito`,
        cancelUrl: `${origin}${ROUTES.pagosCancelado}?desde=carrito`,
      })
      window.location.assign(result.url)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo iniciar el pago con Stripe.'))
      setConfirmando(false)
    }
  }

  if (items.length === 0 && !avisoPago) {
    return (
      <EmptyState
        icon={ShoppingCartIcon}
        title="Carrito vacío"
        description={COMPRA.carritoVacio}
        action={(
          <Link to={ROUTES.catalogo} className={`inline-flex ${FOCUS_RING}`}>
            <Button>Seguir comprando</Button>
          </Link>
        )}
      />
    )
  }

  if (items.length === 0 && avisoPago === 'ok') {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert variant="success" title="Pago recibido">
          Stripe confirmó el cobro (o está por confirmar vía webhook). Podés retirar cuando el saldo de la venta quede en cero.
        </Alert>
        <Link to={ROUTES.catalogo} className={`inline-flex ${FOCUS_RING}`}>
          <Button>Seguir comprando</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-tinta">Tu carrito</h1>
        <p className="mt-1 text-sm text-secundario">
          {etiquetaProductos(lineCount)} · {etiquetaUnidades(unitCount)}
        </p>
        <p className="mt-1 text-sm text-secundario">{COMPRA.carritoResumen}</p>
      </header>

      {avisoPago === 'cancel' && (
        <Alert variant="warning" title="Pago cancelado">
          No se cobró nada. Podés intentar de nuevo cuando quieras.
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="No se inició el pago">
          {error}
        </Alert>
      )}

      <ul className="divide-y divide-linea rounded-xl border border-linea bg-superficie">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <Link to={`/catalogo/${item.id}`} className={`shrink-0 ${FOCUS_RING}`}>
              <ImagenProducto
                codigo={item.codigo}
                categoria=""
                nombre={item.nombre}
                marcoClassName="h-20 w-20 rounded-lg border border-linea bg-white"
                className="max-h-16"
              />
            </Link>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/catalogo/${item.id}`} className={`font-semibold text-tinta hover:text-mascara ${FOCUS_RING}`}>
                    {item.nombre}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-secundario">{item.codigo}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Quitar ${item.nombre}`}
                  disabled={confirmando}
                  onClick={() => removeItem(item.id)}
                  className={`grid size-10 shrink-0 place-items-center rounded-md text-secundario hover:bg-suave hover:text-peligro disabled:opacity-50 ${FOCUS_RING}`}
                >
                  <TrashIcon size={18} aria-hidden="true" />
                </button>
              </div>

              <dl className="grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-secundario">Precio unitario</dt>
                  <dd className="font-mono text-tinta">{formatCurrency(item.precio)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-secundario">Cantidad</dt>
                  <dd>
                    <div className="mt-0.5 inline-flex h-11 items-center rounded-lg border border-linea bg-white">
                      <button
                        type="button"
                        aria-label="Disminuir cantidad"
                        disabled={confirmando}
                        onClick={() => setQuantity(item.id, item.cantidad - 1)}
                        className={`grid size-11 place-items-center hover:bg-suave disabled:opacity-50 ${FOCUS_RING}`}
                      >
                        <MinusIcon size={16} aria-hidden="true" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={item.cantidad}
                        disabled={confirmando}
                        aria-label={`Cantidad de ${item.nombre}`}
                        onChange={(event) => setQuantity(item.id, Number(event.target.value))}
                        className={`h-11 w-14 border-x border-linea bg-transparent text-center font-mono text-sm ${FOCUS_RING}`}
                      />
                      <button
                        type="button"
                        aria-label="Aumentar cantidad"
                        disabled={confirmando}
                        onClick={() => setQuantity(item.id, item.cantidad + 1)}
                        className={`grid size-11 place-items-center hover:bg-suave disabled:opacity-50 ${FOCUS_RING}`}
                      >
                        <PlusIcon size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-secundario">Subtotal</dt>
                  <dd className="font-mono font-semibold text-disponible">
                    {formatCurrency(item.precio * item.cantidad)}
                  </dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-xl border border-linea bg-superficie p-5">
        <div className="flex items-center justify-between text-base">
          <span className="font-semibold text-tinta">Total</span>
          <span className="font-mono text-xl font-semibold text-cobre">{formatCurrency(total)}</span>
        </div>
        <p className="mt-3 rounded-md border border-linea bg-suave p-3 text-sm text-secundario">
          Al pagar se crea la venta, se reserva stock y Stripe cobra en BOB (test). La entrega en tienda queda habilitada cuando el webhook confirma el pago.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Link to={ROUTES.catalogo} className={`inline-flex ${FOCUS_RING}`}>
            <Button variant="secondary" disabled={confirmando}>
              Seguir comprando
            </Button>
          </Link>
          <Button variant="secondary" disabled={confirmando} onClick={() => clear()}>
            Vaciar carrito
          </Button>
          <Button loading={confirmando} onClick={pagarConStripe}>
            {conSesion ? 'Pagar con Stripe' : 'Ingresar para pagar'}
          </Button>
        </div>
      </section>
    </div>
  )
}
