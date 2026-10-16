import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCartIcon, TrashIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { useCart } from '../hooks/useCart'
import { mensajeError } from '../lib/errors'
import { leerToken } from '../lib/session'
import { crearSolicitudProducto } from '../services/catalogoService'
import { formatCurrency } from '../utils/formatters'
import { ROUTES } from '../utils/navigation'
import { FOCUS_RING } from '../utils/styles'

export default function Carrito() {
  const navigate = useNavigate()
  const { items, total, setQuantity, removeItem, clear } = useCart()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const conSesion = Boolean(leerToken())

  const confirmarPedido = async () => {
    if (confirmando || items.length === 0) return
    if (!conSesion) {
      navigate(`${ROUTES.login}?volver=${encodeURIComponent(ROUTES.carrito)}`)
      return
    }
    setConfirmando(true)
    setError(null)
    try {
      for (const item of items) {
        await crearSolicitudProducto(
          { id: item.id, nombre: item.nombre },
          item.cantidad,
          'Pedido desde carrito. Pago en tienda (pasarela pendiente).',
        )
      }
      clear()
      navigate(`${ROUTES.misSolicitudes}?pedido=1`, { replace: true })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo confirmar el pedido.'))
      setConfirmando(false)
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCartIcon}
        title="Carrito vacío"
        description="Agregá productos desde el catálogo. El pago online llega después; por ahora el pedido se confirma para retirar/pagar en tienda."
        action={(
          <Link to={ROUTES.catalogo} className={`inline-flex ${FOCUS_RING}`}>
            <Button>Ir al catálogo</Button>
          </Link>
        )}
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-tinta">Carrito</h1>
        <p className="mt-1 text-sm text-secundario">
          Revisá tu pedido. Todavía no hay pasarela de pago: al confirmar se registra la solicitud y el cobro se cierra en tienda.
        </p>
      </header>

      {error && (
        <Alert variant="error" title="No se confirmó">
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
          <span className="font-semibold text-tinta">Total estimado</span>
          <span className="font-mono text-xl font-semibold text-cobre">{formatCurrency(total)}</span>
        </div>
        <p className="mt-3 rounded-md border border-linea bg-suave p-3 text-sm text-secundario">
          <strong className="text-tinta">Pago:</strong> no disponible online todavía. Al confirmar, el personal ve tus solicitudes y cobra en el mostrador.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" disabled={confirmando} onClick={() => clear()}>
            Vaciar carrito
          </Button>
          <Button loading={confirmando} onClick={confirmarPedido}>
            {conSesion ? 'Confirmar pedido (sin pago online)' : 'Ingresar para confirmar'}
          </Button>
        </div>
      </section>
    </div>
  )
}
