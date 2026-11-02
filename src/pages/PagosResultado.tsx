import { Link, useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import { leerToken } from '../lib/session'
import { ROUTES } from '../utils/navigation'
import { FOCUS_RING } from '../utils/styles'

/** Página pública de retorno Stripe (no requiere sesión: Checkout abre otra ventana). */
export default function PagosResultado({ variant }: { variant: 'exito' | 'cancelado' }) {
  const [params] = useSearchParams()
  const conSesion = Boolean(leerToken())
  const desde = params.get('desde')
  const volverVentas = desde === 'ventas' || (!desde && variant === 'exito')

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-10">
      {variant === 'exito' ? (
        <Alert variant="success" title="Pago enviado">
          Stripe procesó el cobro en modo test. El webhook confirma el pago en la venta en unos segundos.
          Podés volver al panel y refrescar Pagos para ver el estado CONFIRMADO.
        </Alert>
      ) : (
        <Alert variant="warning" title="Pago cancelado">
          No se cobró nada. Podés generar otro link desde Ventas o el carrito.
        </Alert>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {conSesion && volverVentas ? (
          <Link to={ROUTES.ventas} className={`inline-flex ${FOCUS_RING}`}>
            <Button>Ir a Ventas</Button>
          </Link>
        ) : null}
        {conSesion ? (
          <Link to={ROUTES.carrito} className={`inline-flex ${FOCUS_RING}`}>
            <Button variant="secondary">Ir al carrito</Button>
          </Link>
        ) : (
          <Link to={`${ROUTES.login}?volver=${encodeURIComponent(ROUTES.ventas)}`} className={`inline-flex ${FOCUS_RING}`}>
            <Button>Ingresar para ver la venta</Button>
          </Link>
        )}
        <Link to={ROUTES.catalogo} className={`inline-flex ${FOCUS_RING}`}>
          <Button variant="secondary">Catálogo</Button>
        </Link>
      </div>
    </div>
  )
}
