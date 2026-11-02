import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShoppingCartIcon, TrashIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { useCart } from '../hooks/useCart'
import { mensajeError } from '../lib/errors'
import { leerToken } from '../lib/session'
import { crearCheckoutStripeCarrito } from '../services/pagoStripeService'
import { formatCurrency } from '../utils/formatters'
import { ROUTES } from '../utils/navigation'
import { FOCUS_RING } from '../utils/styles'

export default function Carrito() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { items, total, setQuantity, removeItem, clear } = useCart()
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
        successUrl: `${origin}${ROUTES.carrito}?pago=ok`,
        cancelUrl: `${origin}${ROUTES.carrito}?pago=cancel`,
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
        description="Agregá productos desde el catálogo y pagá online con Stripe (modo test, BOB)."
        action={(
          <Link to={ROUTES.catalogo} className={`inline-flex ${FOCUS_RING}`}>
            <Button>Ir al catálogo</Button>
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
        <h1 className="text-2xl font-bold text-tinta">Carrito</h1>
        <p className="mt-1 text-sm text-secundario">
          Revisá tu pedido y pagá con Stripe Checkout en bolivianos (modo test).
        </p>
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
          <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Link to={`/catalogo/${item.id}`} className={`font-semibold text-tinta hover:text-mascara ${FOCUS_RING}`}>
                {item.nombre}
              </Link>
              <p className="mt-0.5 font-mono text-xs text-secundario">{item.codigo}</p>
              <p className="mt-1 font-mono text-sm text-cobre">{formatCurrency(item.precio)} c/u</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-secundario">
                Cant.
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={item.cantidad}
                  disabled={confirmando}
                  onChange={(event) => setQuantity(item.id, Number(event.target.value))}
                  className={`ml-2 h-10 w-20 rounded-md border border-campo bg-white px-2 font-mono text-sm ${FOCUS_RING}`}
                />
              </label>
              <p className="min-w-20 text-right font-mono text-sm font-semibold text-tinta">
                {formatCurrency(item.precio * item.cantidad)}
              </p>
              <button
                type="button"
                aria-label={`Quitar ${item.nombre}`}
                disabled={confirmando}
                onClick={() => removeItem(item.id)}
                className={`grid size-10 place-items-center rounded-md text-secundario hover:bg-suave hover:text-peligro disabled:opacity-50 ${FOCUS_RING}`}
              >
                <TrashIcon size={18} aria-hidden="true" />
              </button>
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
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
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
