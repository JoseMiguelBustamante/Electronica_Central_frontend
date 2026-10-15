import type { ReactNode } from 'react'
import { cn } from '../utils/styles'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  /** Columna que identifica la fila. En pantallas pequenas es el titulo de la tarjeta. */
  primary?: boolean
  /** Columna de acciones. En pantallas pequenas se ubica al pie de la tarjeta. */
  actions?: boolean
  className?: string
}

interface TableProps<T> {
  /** Descripcion de la tabla para lectores de pantalla. */
  caption: string
  columns: readonly Column<T>[]
  rows: readonly T[]
  getRowKey: (row: T) => string | number
}

/**
 * Tabla administrativa responsive: tabla en pantallas grandes (lg) y lista de tarjetas
 * en pantallas pequenas, para no depender de scroll horizontal.
 */
export default function Table<T>({ caption, columns, rows, getRowKey }: TableProps<T>) {
  const primary = columns.find((column) => column.primary)
  const actions = columns.find((column) => column.actions)
  const details = columns.filter((column) => !column.primary && !column.actions)

  return (
    <>
      <div className="hidden rounded-lg border border-linea bg-superficie lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-linea">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-secundario',
                    column.actions && 'text-right',
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-linea">
            {rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3 align-middle text-tinta',
                      column.primary && 'font-medium text-tinta',
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={caption} className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <li key={getRowKey(row)} className="rounded-lg border border-linea bg-superficie p-4">
            {primary && <div className="text-base font-semibold text-tinta">{primary.cell(row)}</div>}
            <dl className={cn('space-y-2', primary && 'mt-3')}>
              {details.map((column) => (
                <div key={column.key} className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-xs font-semibold text-secundario">{column.header}</dt>
                  <dd className="min-w-0 break-words text-right text-sm text-tinta">{column.cell(row)}</dd>
                </div>
              ))}
            </dl>
            {actions && (
              <div className="mt-3 flex justify-end border-t border-linea pt-3">{actions.cell(row)}</div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
