import { HeartIcon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import Disponibilidad from './Disponibilidad'
import ImagenProducto from './ImagenProducto'
import type { ProductoPublico } from '../../services/catalogoService'
import { formatPrecioMostrador } from '../../utils/formatters'
import { FOCUS_RING, cn } from '../../utils/styles'

interface TarjetaProductoProps {
  producto: ProductoPublico
  guardado: boolean
  vista: 'grilla' | 'lista'
  onGuardar: (id: string) => void
}

export default function TarjetaProducto({ producto, guardado, vista, onGuardar }: TarjetaProductoProps) {
  const enLista = vista === 'lista'

  return (
    <article
      className={cn(
        'relative rounded-xl border border-linea bg-white shadow-sm',
        enLista && 'flex items-stretch',
      )}
    >
      <button
        type="button"
        aria-pressed={guardado}
        aria-label={guardado ? `Quitar ${producto.nombre} de guardados` : `Guardar ${producto.nombre}`}
        onClick={() => onGuardar(producto.id)}
        className={cn(
          'absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-full text-secundario hover:bg-suave hover:text-peligro',
          FOCUS_RING,
        )}
      >
        <HeartIcon size={18} weight={guardado ? 'fill' : 'regular'} aria-hidden="true" />
      </button>

      <Link
        to={`/catalogo/${producto.id}`}
        className={cn(
          'flex min-w-0 flex-1 rounded-xl p-4 hover:border-mascara',
          enLista ? 'flex-row items-center gap-5 pr-12' : 'flex-col',
          FOCUS_RING,
        )}
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
          <p className="mt-0.5 truncate font-mono text-xs text-secundario">{producto.codigo}</p>
          <p className={cn('font-semibold text-cobre', enLista ? 'mt-2 text-base' : 'mt-3 text-lg')}>
            {formatPrecioMostrador(producto.precio)}
          </p>
          <div className="mt-2">
            <Disponibilidad valor={producto.disponibilidad} />
          </div>
        </div>
      </Link>
    </article>
  )
}
