import type { Icon } from '@phosphor-icons/react'

interface StatCardProps {
  title: string
  value: string
  description?: string
  icon: Icon
}

/** Indicador resumido. Debe renderizarse dentro de un `<dl>`. */
export default function StatCard({ title, value, description, icon: StatIcon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-linea bg-superficie p-4">
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
    </div>
  )
}
