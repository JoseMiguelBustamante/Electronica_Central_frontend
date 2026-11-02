import { Link } from 'react-router-dom'
import type { Icon } from '@phosphor-icons/react'
import { FOCUS_RING, cn } from '../utils/styles'

interface StatCardProps {
  title: string
  value: string
  description?: string
  icon: Icon
  to?: string
}

/** Indicador resumido. Debe renderizarse dentro de un `<dl>`. */
export default function StatCard({ title, value, description, icon: StatIcon, to }: StatCardProps) {
  const cuerpo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <dt className="text-sm font-medium text-secundario">{title}</dt>
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-md bg-suave text-tinta"
        >
          <StatIcon size={20} />
        </span>
      </div>
      <dd className="mt-3 font-mono text-3xl font-semibold tabular-nums text-tinta">{value}</dd>
      {description && <dd className="mt-1 text-sm text-secundario">{description}</dd>}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          'block rounded-lg border border-linea bg-superficie p-4 transition-colors hover:border-mascara hover:bg-suave/40',
          FOCUS_RING,
        )}
      >
        {cuerpo}
      </Link>
    )
  }

  return <div className="rounded-lg border border-linea bg-superficie p-4">{cuerpo}</div>
}
