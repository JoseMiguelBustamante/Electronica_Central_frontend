import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Disponibilidad from '../components/tienda/Disponibilidad'
import { mensajeError } from '../lib/errors'
import { leerToken } from '../lib/session'
import {
  crearSolicitudProducto,
  listarCatalogoPublico,
  obtenerProductoPublico,
  type ProductoPublico,
} from '../services/catalogoService'
import { formatCurrency } from '../utils/formatters'
import { ROUTES } from '../utils/navigation'
import { FOCUS_RING } from '../utils/styles'

export default function DetallePublico() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [producto, setProducto] = useState<ProductoPublico | null>(null)
  const [relacionados, setRelacionados] = useState<ProductoPublico[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [cantidad, setCantidad] = useState('1')
  const [observaciones, setObservaciones] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [avisoError, setAvisoError] = useState<string | null>(null)
  const conSesion = Boolean(leerToken())

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)
    setProducto(null)
    setAviso(null)
    setAvisoError(null)
    obtenerProductoPublico(id)
      .then(async (detalle) => {
        if (!vigente) return
        setProducto(detalle)
        const pagina = await listarCatalogoPublico({ limite: 8, pagina: 1 })
        if (!vigente) return
        setRelacionados(pagina.productos.filter((item) => item.id !== detalle.id).slice(0, 4))
      })
      .catch((causa) => {
        if (!vigente) return
        setError(mensajeError(causa, 'No se pudo abrir el producto.'))
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [id, intento])

  const solicitar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!producto || enviando) return
    const unidades = Number(cantidad)
    if (!Number.isFinite(unidades) || unidades <= 0) {
      setAvisoError('Indique una cantidad mayor que cero.')
      return
    }
    setEnviando(true)
    setAviso(null)
    setAvisoError(null)
    try {
      await crearSolicitudProducto(producto, unidades, observaciones)
      setAviso('Solicitud registrada. No aparta unidades ni confirma una venta.')
      setObservaciones('')
    } catch (causa) {
      setAvisoError(mensajeError(causa, 'No se pudo registrar la solicitud.'))
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) {
    return (
      <LoadingState label="Cargando producto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-72" />
      </LoadingState>
    )
  }

  if (error || !producto) {
    return (
      <Alert
        variant="error"
        title="Producto no disponible"
        action={
          <Button variant="secondary" onClick={() => setIntento((valor) => valor + 1)}>
            Reintentar
          </Button>
        }
      >
        {error ?? 'El producto no está en el catálogo.'}
      </Alert>
    )
  }

  const volver = `/catalogo/${producto.id}`

  return (
    <div>
      <nav className="text-sm text-secundario" aria-label="Miga de pan">
        <Link to={ROUTES.catalogo} className={`hover:text-mascara ${FOCUS_RING}`}>
          Catálogo
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-tinta">{producto.nombre}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-72 items-start rounded-lg border border-linea bg-superficie p-6">
          <p className="text-sm font-semibold tracking-wide text-secundario uppercase">{producto.categoria}</p>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-tinta">{producto.nombre}</h1>
          <p className="mt-2 font-mono text-sm text-secundario">{producto.codigo}</p>
          <p className="mt-1 text-sm text-secundario">
            {producto.marca}
            {producto.modelo ? ` · ${producto.modelo}` : ''}
          </p>
          <p className="mt-4 font-mono text-3xl text-cobre">{formatCurrency(producto.precio)}</p>
          <div className="mt-3">
            <Disponibilidad valor={producto.disponibilidad} />
          </div>
          {producto.descripcion && (
            <p className="mt-5 text-sm leading-6 text-tinta">{producto.descripcion}</p>
          )}

          <div className="mt-6 rounded-lg border border-linea bg-superficie p-4">
            {aviso && (
              <Alert variant="success" title="Listo">
                {aviso}
              </Alert>
            )}
            {avisoError && (
              <Alert variant="error" title="No se registró">
                {avisoError}
              </Alert>
            )}
            {conSesion ? (
              <form className="mt-3 space-y-3" onSubmit={solicitar}>
                <label className="block text-[13px] font-semibold text-tinta">
                  Cantidad
                  <input
                    value={cantidad}
                    onChange={(event) => setCantidad(event.target.value)}
                    inputMode="decimal"
                    className={`mt-1 h-11 w-32 rounded-md border border-campo bg-superficie px-3 font-mono text-sm ${FOCUS_RING}`}
                  />
                </label>
                <label className="block text-[13px] font-semibold text-tinta">
                  Observaciones
                  <textarea
                    value={observaciones}
                    onChange={(event) => setObservaciones(event.target.value)}
                    rows={3}
                    className={`mt-1 w-full rounded-md border border-campo bg-superficie px-3 py-2 text-sm ${FOCUS_RING}`}
                  />
                </label>
                <Button type="submit" loading={enviando}>
                  Solicitar
                </Button>
                <p className="text-xs text-secundario">La solicitud no reserva stock ni crea una venta.</p>
              </form>
            ) : (
              <div>
                <Button
                  onClick={() => navigate(`${ROUTES.login}?volver=${encodeURIComponent(volver)}`)}
                >
                  Ingresar para solicitar
                </Button>
                <p className="mt-2 text-xs text-secundario">
                  Puede ver el precio sin cuenta. Para dejar la solicitud necesita ingresar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-tinta">Otros productos del catálogo</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relacionados.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/catalogo/${item.id}`}
                  className={`block rounded-lg border border-linea bg-superficie p-4 hover:border-mascara ${FOCUS_RING}`}
                >
                  <p className="font-semibold text-tinta">{item.nombre}</p>
                  <p className="mt-1 font-mono text-xs text-secundario">{item.codigo}</p>
                  <p className="mt-2 font-mono text-cobre">{formatCurrency(item.precio)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
