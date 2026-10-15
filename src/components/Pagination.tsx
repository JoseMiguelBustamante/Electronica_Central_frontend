import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import Button from './Button'
import { FOCUS_RING, cn } from '../utils/styles'

interface PaginationProps {
  /** Pagina actual, empezando en 1. */
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  /** Nombre de la navegacion para lectores de pantalla. */
  label?: string
  /** Nombre plural de los elementos paginados. */
  itemsLabel?: string
}

type Elemento = { tipo: 'pagina'; numero: number } | { tipo: 'espacio'; clave: string }

/** Primera, ultima y vecinas de la actual; los saltos se resumen con puntos suspensivos. */
function construirElementos(actual: number, total: number): Elemento[] {
  const numeros = new Set([1, total, actual - 1, actual, actual + 1])
  const ordenados = [...numeros].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const elementos: Elemento[] = []
  ordenados.forEach((numero, indice) => {
    const anterior = ordenados[indice - 1]
    if (anterior !== undefined && numero - anterior > 1) {
      elementos.push(
        numero - anterior === 2
          ? { tipo: 'pagina', numero: anterior + 1 }
          : { tipo: 'espacio', clave: `espacio-${numero}` },
      )
    }
    elementos.push({ tipo: 'pagina', numero })
  })
  return elementos
}

/** Paginacion accesible: resumen del rango visible, anterior/siguiente y numeros de pagina. */
export default function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  label = 'Paginación',
  itemsLabel = 'registros',
}: PaginationProps) {
  if (totalItems === 0) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const desde = (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, totalItems)

  return (
    <nav aria-label={label} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite" className="text-sm text-secundario">
        Mostrando {desde}–{hasta} de {totalItems} {itemsLabel}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <CaretLeftIcon size={18} aria-hidden="true" />
            Anterior
          </Button>

          <span className="text-sm text-tinta sm:hidden">
            Página {page} de {totalPages}
          </span>

          <ul className="hidden items-center gap-1 sm:flex">
            {construirElementos(page, totalPages).map((elemento) =>
              elemento.tipo === 'espacio' ? (
                <li key={elemento.clave} aria-hidden="true" className="px-1 text-secundario">
                  …
                </li>
              ) : (
                <li key={elemento.numero}>
                  <button
                    type="button"
                    aria-label={`Ir a la página ${elemento.numero}`}
                    aria-current={elemento.numero === page ? 'page' : undefined}
                    onClick={() => onPageChange(elemento.numero)}
                    className={cn(
                      'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 text-sm font-medium',
                      elemento.numero === page
                        ? 'bg-mascara text-white'
                        : 'text-tinta hover:bg-suave',
                      FOCUS_RING,
                    )}
                  >
                    {elemento.numero}
                  </button>
                </li>
              ),
            )}
          </ul>

          <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Siguiente
            <CaretRightIcon size={18} aria-hidden="true" />
          </Button>
        </div>
      )}
    </nav>
  )
}
