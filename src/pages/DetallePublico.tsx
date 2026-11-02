import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { HeartIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from '@phosphor-icons/react'
import { Link, useLocation, useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Disponibilidad from '../components/tienda/Disponibilidad'
import ImagenProducto from '../components/tienda/ImagenProducto'
import TarjetaProducto from '../components/tienda/TarjetaProducto'
import { useCart } from '../hooks/useCart'
import { useToast } from '../hooks/useToast'
import { ultimaRutaCatalogo } from '../lib/catalogoNavegacion'
import { COMPRA } from '../lib/compraMensajes'
import { mensajeError } from '../lib/errors'
import { alternarFavorito, esFavorito, listarFavoritosIds } from '../lib/favoritosStorage'
import { leerToken } from '../lib/session'
import {
  mensajeConsultaProducto,
  urlWhatsapp,
  whatsappDisponible,
} from '../lib/whatsapp'
import {
  listarCatalogoPublico,
  obtenerProductoPublico,
  type ProductoPublico,
} from '../services/catalogoService'
import { formatCurrency } from '../utils/formatters'
import { ROUTES } from '../utils/navigation'
import { FOCUS_RING, cn } from '../utils/styles'

function formatearCantidad(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : String(valor)
}

export default function DetallePublico() {
  const { id = '' } = useParams()
  const ubicacion = useLocation()
  const fromCatalog =
    (ubicacion.state as { fromCatalog?: string } | null)?.fromCatalog
    || ultimaRutaCatalogo(ROUTES.catalogo)
  const [producto, setProducto] = useState<ProductoPublico | null>(null)
  const [relacionados, setRelacionados] = useState<ProductoPublico[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [cantidad, setCantidad] = useState(1)
  const [aviso, setAviso] = useState<string | null>(null)
  const [avisoError, setAvisoError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [favoritosRel, setFavoritosRel] = useState<Set<string>>(() => new Set())
  const { addItem, openDrawer, quantityOf } = useCart()
  const toast = useToast()
  const conSesion = Boolean(leerToken())

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)
    setProducto(null)
    setAviso(null)
    setAvisoError(null)
    setCantidad(1)
    obtenerProductoPublico(id)
      .then(async (detalle) => {
        if (!vigente) return
        setProducto(detalle)
        setGuardado(esFavorito(detalle.id))
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

  useEffect(() => {
    const sync = () => {
      if (producto) setGuardado(esFavorito(producto.id))
      setFavoritosRel(new Set(listarFavoritosIds()))
    }
    sync()
    window.addEventListener('eca-favoritos', sync)
    return () => window.removeEventListener('eca-favoritos', sync)
  }, [producto])

  const ajustarCantidad = (delta: number) => {
    setCantidad((actual) => {
      const base = Number.isFinite(actual) && actual > 0 ? actual : 1
      return Math.max(1, Math.round((base + delta) * 1000) / 1000)
    })
  }

  const cantidadSegura = Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1

  const agregarAlCarrito = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!producto) return
    if (!Number.isFinite(cantidadSegura) || cantidadSegura <= 0) {
      setAvisoError('Indique una cantidad mayor que cero.')
      return
    }
    setAvisoError(null)
    const totalLinea = addItem({
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: producto.precio,
      disponibilidad: producto.disponibilidad,
      cantidad: cantidadSegura,
    })
    setAviso(COMPRA.fichaAgregado)
    openDrawer()
    toast.success(
      `Agregaste ${formatearCantidad(cantidadSegura)} × ${producto.codigo}. Ahora tienes ${formatearCantidad(totalLinea)}.`,
      { action: { label: 'Ver carrito', onClick: openDrawer } },
    )
  }

  const toggleFavorito = () => {
    if (!producto) return
    const activo = alternarFavorito(producto.id)
    setGuardado(activo)
    toast.success(activo ? 'Guardado en favoritos.' : 'Quitado de favoritos.')
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
  const enCarrito = quantityOf(producto.id)
  const waHref = whatsappDisponible()
    ? urlWhatsapp(
        mensajeConsultaProducto({
          codigo: producto.codigo,
          nombre: producto.nombre,
          precioTexto: formatCurrency(producto.precio),
          cantidad: cantidadSegura,
        }),
      )
    : null

  return (
    <div>
      <nav className="text-sm text-secundario" aria-label="Miga de pan">
        <Link to={ROUTES.catalogo} className={`hover:text-mascara ${FOCUS_RING}`}>
          Inicio
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <Link to={fromCatalog} className={`hover:text-mascara ${FOCUS_RING}`}>
          Catálogo
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-tinta">{producto.nombre}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative rounded-lg border border-linea bg-superficie p-6">
          <button
            type="button"
            aria-pressed={guardado}
            aria-label={guardado ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            onClick={toggleFavorito}
            className={cn(
              'absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full text-secundario hover:bg-suave hover:text-peligro',
              FOCUS_RING,
            )}
          >
            <HeartIcon size={20} weight={guardado ? 'fill' : 'regular'} aria-hidden="true" />
          </button>
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
            {producto.marca !== 'Sin marca' && producto.idMarca ? (
              <Link
                to={`${ROUTES.catalogo}?marca=${encodeURIComponent(producto.idMarca)}`}
                className={`font-semibold text-mascara hover:underline ${FOCUS_RING}`}
              >
                {producto.marca}
              </Link>
            ) : (
              'Marca no registrada'
            )}
            {producto.modelo ? ` · ${producto.modelo}` : ''}
          </p>
          <p className="mt-4 font-mono text-3xl text-cobre">{formatCurrency(producto.precio)}</p>
          <div className="mt-3">
            <Disponibilidad valor={producto.disponibilidad} stockRestante={producto.stockRestante} />
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
            {enCarrito > 0 && (
              <p className="mt-3 rounded-md bg-disponible-fondo px-2 py-1 text-xs font-medium text-disponible">
                Ya tienes {formatearCantidad(enCarrito)} {enCarrito === 1 ? 'unidad' : 'unidades'} en el carrito
              </p>
            )}
            <form className="mt-3 space-y-3" onSubmit={agregarAlCarrito}>
              <div>
                <span className="block text-[13px] font-semibold text-tinta">Cantidad</span>
                <div className="mt-1 inline-flex h-11 items-center rounded-lg border border-campo bg-superficie">
                  <button
                    type="button"
                    aria-label="Disminuir cantidad"
                    onClick={() => ajustarCantidad(-1)}
                    className={`grid size-11 place-items-center text-tinta hover:bg-suave ${FOCUS_RING}`}
                  >
                    <MinusIcon size={14} aria-hidden="true" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    aria-label="Cantidad"
                    value={Number.isFinite(cantidad) ? cantidad : ''}
                    onChange={(event) => {
                      const valor = Number(event.target.value)
                      setCantidad(Number.isFinite(valor) ? valor : Number.NaN)
                    }}
                    onBlur={() => {
                      if (!Number.isFinite(cantidad) || cantidad < 1) setCantidad(1)
                    }}
                    className={`h-11 w-16 border-x border-campo bg-transparent text-center font-mono text-sm ${FOCUS_RING}`}
                  />
                  <button
                    type="button"
                    aria-label="Aumentar cantidad"
                    onClick={() => ajustarCantidad(1)}
                    className={`grid size-11 place-items-center text-tinta hover:bg-suave ${FOCUS_RING}`}
                  >
                    <PlusIcon size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit">
                  <ShoppingCartIcon size={16} aria-hidden="true" />
                  {cantidadSegura === 1
                    ? 'Agregar al carrito'
                    : `Agregar ${formatearCantidad(cantidadSegura)} unidades`}
                </Button>
                <Button type="button" variant="secondary" onClick={openDrawer}>
                  Ver carrito
                </Button>
              </div>
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 text-sm font-semibold text-white hover:bg-[#1ebe57]',
                    FOCUS_RING,
                  )}
                >
                  {COMPRA.whatsappCta}
                </a>
              )}
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
                <TarjetaProducto
                  producto={item}
                  guardado={favoritosRel.has(item.id)}
                  vista="grilla"
                  onGuardar={(pid) => {
                    alternarFavorito(pid)
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
