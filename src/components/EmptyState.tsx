import type { ReactNode } from 'react'
import type { Icon } from '@phosphor-icons/react'

interface EmptyStateProps {
  icon: Icon
  title: string
  description?: string
  /** Accion opcional, por ejemplo un boton para crear el primer registro. */
  action?: ReactNode
}

export default function EmptyState({ icon: EmptyIcon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-campo bg-superficie px-6 py-10 text-center">
      <EmptyIcon size={32} aria-hidden="true" className="text-secundario" />
      <p className="mt-3 text-sm font-semibold text-tinta">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-secundario">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
