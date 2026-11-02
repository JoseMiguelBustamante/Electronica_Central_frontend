import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Disponibilidad from '../components/tienda/Disponibilidad'
import ImagenProducto from '../components/tienda/ImagenProducto'
import { useCart } from '../hooks/useCart'
import { COMPRA } from '../lib/compraMensajes'
import { mensajeError } from '../lib/errors'
import { leerToken } from '../lib/session'
import {
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
  const ubicacion = useLocation()
  const fromCatalog = (ubicacion.state as { fromCatalog?: string } | null)?.fromCatalog ?? ROUTES.catalogo
  const [producto, setProducto] = useState<ProductoPublico | null>(null)
  const [relacionados, setRelacionados] = useState<ProductoPublico[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [cantidad, setCantidad] = useState('1')
  const [aviso, setAviso] = useState<string | null>(null)
  const [avisoError, setAvisoError] = useState<string | null>(null)
  const { addItem } = useCart()
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
        const pagina = await listarCatalogoPublico({
          idCategoria: detalle.idCategoria || undefined,
          limite: 8,
          pagina: 1,
        })
        if (!vigente) return
        const mismos = pagina.productos.filter((item) => item.id !== detalle.id)
        if (mismos.length > 0) {
          setRelacionados(mismos.slice(0, 4))
        } else {
          const fallback = await listarCatalogoPublico({ limite: 8, pagina: 1 })
          if (!vigente) return
          setRelacionados(fallback.productos.filter((item) => item.id !== detalle.id).slice(0, 4))
        }
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

  const agregarAlCarrito = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!producto) return
    const unidades = Number(cantidad)
    if (!Number.isFinite(unidades) || unidades <= 0) {
      setAvisoError('Indique una cantidad mayor que cero.')
      return
    }
    setAvisoError(null)
    addItem({
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: producto.precio,
      disponibilidad: producto.disponibilidad,
      cantidad: unidades,
    })
    setAviso(COMPRA.fichaAgregado)
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

  const volverLogin = `/catalogo/${producto.id}`
  const subtitulo =
    producto.descripcion.trim()
    && producto.descripcion.trim().toLowerCase() !== producto.nombre.toLowerCase()
      ? producto.descripcion
      : null

  return (
    <div>
      <nav className="text-sm text-secundario" aria-label="Miga de pan">
        <Link to={fromCatalog} className={`hover:text-mascara ${FOCUS_RING}`}>
          Volver al catálogo
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-tinta">{producto.nombre}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-linea bg-superficie p-6">
          <p className="text-sm font-semibold tracking-wide text-secundario uppercase">{producto.categoria}</p>
          <ImagenProducto
            codigo={producto.codigo}
            categoria={producto.categoria}
            nombre={producto.nombre}
            marcoClassName="mt-4 min-h-64 w-full"
            className="max-h-72"
          />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-tinta">{producto.nombre}</h1>
          <p className="mt-2 font-mono text-sm text-secundario">{producto.codigo}</p>
          <p className="mt-1 text-sm text-secundario">
            {producto.marca !== 'Sin marca' ? producto.marca : 'Marca no registrada'}
            {producto.modelo ? ` · ${producto.modelo}` : ''}
          </p>
          <p className="mt-4 font-mono text-3xl text-cobre">{formatCurrency(producto.precio)}</p>
          <div className="mt-3">
            <Disponibilidad valor={producto.disponibilidad} />
          </div>
          {subtitulo ? (
            <p className="mt-5 text-sm leading-6 text-tinta">{subtitulo}</p>
          ) : (
            <p className="mt-5 text-sm leading-6 text-secundario">
              Ficha técnica incompleta en catálogo. Consultá en tienda encapsulado, características eléctricas u hoja de datos.
            </p>
          )}
          {producto.compatibilidades.length > 0 && (
            <section className="mt-5" aria-labelledby="titulo-compatibles">
              <h2 id="titulo-compatibles" className="text-sm font-semibold tracking-wide text-secundario uppercase">
                Compatible con
              </h2>
              <ul className="mt-2 space-y-1 text-sm text-tinta">
                {producto.compatibilidades.map((compatible) => (
                  <li key={compatible.idModelo}>
                    {compatible.marca} {compatible.modelo}
                    {compatible.observaciones && (
                      <span className="text-secundario"> — {compatible.observaciones}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-6 rounded-lg border border-linea bg-superficie p-4">
            {aviso && (
              <Alert variant="success" title="Listo">
                {aviso}
              </Alert>
            )}
            {avisoError && (
              <Alert variant="error" title="No se agregó">
                {avisoError}
              </Alert>
            )}
            <form className="mt-3 space-y-3" onSubmit={agregarAlCarrito}>
              <label className="block text-[13px] font-semibold text-tinta">
                Cantidad
                <input
                  value={cantidad}
                  onChange={(event) => setCantidad(event.target.value)}
                  inputMode="decimal"
                  className={`mt-1 h-11 w-32 rounded-md border border-campo bg-superficie px-3 font-mono text-sm ${FOCUS_RING}`}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="submit">Agregar al carrito</Button>
                <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.carrito)}>
                  Ver carrito
                </Button>
              </div>
              <p className="text-xs text-secundario">
                {COMPRA.fichaPago}
                {!conSesion && (
                  <>
                    {' '}
                    <Link to={`${ROUTES.login}?volver=${encodeURIComponent(volverLogin)}`} className={`font-semibold text-mascara ${FOCUS_RING}`}>
                      Ingresar
                    </Link>
                    {' '}
                    para pagar online.
                  </>
                )}
              </p>
            </form>
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-tinta">
            {producto.idCategoria ? `Más de ${producto.categoria}` : 'Otros productos del catálogo'}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relacionados.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/catalogo/${item.id}`}
                  state={{ fromCatalog }}
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
