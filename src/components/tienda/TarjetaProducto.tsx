import { useState } from 'react'
import { HeartIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import Disponibilidad from './Disponibilidad'
import ImagenProducto from './ImagenProducto'
import { useCart } from '../../hooks/useCart'
import { useToast } from '../../hooks/useToast'
import type { ProductoPublico } from '../../services/catalogoService'
import { formatPrecioMostrador } from '../../utils/formatters'
import { FOCUS_RING, cn } from '../../utils/styles'

interface TarjetaProductoProps {
  producto: ProductoPublico
  guardado: boolean
  vista: 'grilla' | 'lista'
  onGuardar: (id: string) => void
}

function lineaSecundaria(producto: ProductoPublico): string {
  const desc = producto.descripcion.trim()
  if (desc && desc.toLowerCase() !== producto.nombre.toLowerCase()) {
    return desc.length > 80 ? `${desc.slice(0, 77)}…` : desc
  }
  const partes = [producto.codigo]
  if (producto.marca && producto.marca !== 'Sin marca') partes.push(producto.marca)
  return partes.join(' · ')
}

function formatearCantidad(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : String(valor)
}

export default function TarjetaProducto({ producto, guardado, vista, onGuardar }: TarjetaProductoProps) {
  const enLista = vista === 'lista'
  const toast = useToast()
  const { addItem, quantityOf, openDrawer } = useCart()
  const ubicacion = useLocation()
  const fromCatalog = `${ubicacion.pathname}${ubicacion.search}`
  const enCarrito = quantityOf(producto.id)
  const [cantidad, setCantidad] = useState(1)
  const [destacado, setDestacado] = useState(false)

  const cantidadSegura = Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1

  const ajustarCantidad = (delta: number) => {
    setCantidad((actual) => {
      const base = Number.isFinite(actual) && actual > 0 ? actual : 1
      return Math.max(1, Math.round((base + delta) * 1000) / 1000)
    })
  }

  const agregar = () => {
    const agregadas = cantidadSegura
    const totalLinea = addItem({
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: producto.precio,
      disponibilidad: producto.disponibilidad,
      cantidad: agregadas,
    })
    setDestacado(true)
    window.setTimeout(() => setDestacado(false), 280)
    openDrawer()
    toast.success(
      `Agregaste ${formatearCantidad(agregadas)} × ${producto.codigo}. Ahora tienes ${formatearCantidad(totalLinea)}.`,
      { action: { label: 'Ver carrito', onClick: openDrawer } },
    )
  }

  return (
    <article
      className={cn(
        'relative rounded-xl border bg-white shadow-sm transition duration-200',
        destacado ? 'border-disponible scale-[1.01]' : 'border-linea',
        enLista && 'flex items-stretch',
      )}
    >
      <button
        type="button"
        aria-pressed={guardado}
        aria-label={guardado ? `Quitar ${producto.nombre} de favoritos` : `Guardar ${producto.nombre} en favoritos`}
        onClick={() => onGuardar(producto.id)}
        className={cn(
          'absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-full text-secundario hover:bg-suave hover:text-peligro',
          FOCUS_RING,
        )}
      >
        <HeartIcon size={18} weight={guardado ? 'fill' : 'regular'} aria-hidden="true" />
      </button>

      <div
        className={cn(
          'flex min-w-0 flex-1 rounded-xl p-4',
          enLista ? 'flex-row items-center gap-5 pr-12' : 'flex-col',
        )}
      >
        <Link
          to={`/catalogo/${producto.id}`}
          state={{ fromCatalog }}
          className={cn('flex min-w-0', enLista ? 'flex-1 flex-row items-center gap-5' : 'flex-col', FOCUS_RING)}
        >
          <ImagenProducto
            codigo={producto.codigo}
            categoria={producto.categoria}
            nombre={producto.nombre}
            marcoClassName={enLista ? 'h-24 w-28 shrink-0' : 'h-36 w-full'}
            className={enLista ? 'max-h-24' : 'max-h-36'}
          />
          <div className={cn('min-w-0', enLista ? 'flex-1' : 'mt-1')}>
            <p className="text-[11px] font-semibold tracking-wide text-secundario uppercase">
              {producto.categoria}
            </p>
            <p className="mt-1 truncate text-base font-semibold text-tinta">{producto.nombre}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-secundario">{lineaSecundaria(producto)}</p>
            <p className={cn('font-semibold text-cobre', enLista ? 'mt-2 text-base' : 'mt-3 text-lg')}>
              {formatPrecioMostrador(producto.precio)}
            </p>
            <div className="mt-2">
              <Disponibilidad valor={producto.disponibilidad} />
            </div>
          </div>
        </Link>

        <div className={cn('flex shrink-0 flex-col gap-2', enLista ? 'w-48' : 'mt-3 w-full')}>
          <div
            className={cn(
              'overflow-hidden transition-all duration-200',
              enCarrito > 0 ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0',
            )}
            aria-live="polite"
          >
            {enCarrito > 0 && (
              <p className="rounded-md bg-disponible-fondo px-2 py-1 text-xs font-medium text-disponible">
                Ya tienes {formatearCantidad(enCarrito)} {enCarrito === 1 ? 'unidad' : 'unidades'} en el carrito
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex h-10 flex-1 items-center rounded-lg border border-linea bg-white">
              <button
                type="button"
                aria-label="Disminuir cantidad"
                onClick={() => ajustarCantidad(-1)}
                className={`grid size-10 place-items-center text-tinta hover:bg-suave ${FOCUS_RING}`}
              >
                <MinusIcon size={14} aria-hidden="true" />
              </button>
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                aria-label={`Cantidad de ${producto.nombre}`}
                value={Number.isFinite(cantidad) ? cantidad : ''}
                onChange={(event) => {
                  const valor = Number(event.target.value)
                  setCantidad(Number.isFinite(valor) ? valor : Number.NaN)
                }}
                onBlur={() => {
                  if (!Number.isFinite(cantidad) || cantidad < 1) setCantidad(1)
                }}
                className={`h-10 min-w-0 flex-1 border-x border-linea bg-transparent text-center font-mono text-sm ${FOCUS_RING}`}
              />
              <button
                type="button"
                aria-label="Aumentar cantidad"
                onClick={() => ajustarCantidad(1)}
                className={`grid size-10 place-items-center text-tinta hover:bg-suave ${FOCUS_RING}`}
              >
                <PlusIcon size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          <button
            type="button"
            aria-label={`Agregar ${formatearCantidad(cantidadSegura)} de ${producto.nombre} al carrito`}
            onClick={agregar}
            className={cn(
              'inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-cobre px-3 text-sm font-semibold text-white transition duration-200 hover:bg-cobre-press',
              FOCUS_RING,
            )}
          >
            <ShoppingCartIcon size={16} aria-hidden="true" />
            {cantidadSegura === 1
              ? 'Agregar al carrito'
              : `Agregar ${formatearCantidad(cantidadSegura)} unidades`}
          </button>
        </div>
      </div>
    </article>
  )
}
