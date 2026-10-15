import type { ReactNode } from 'react'
import { CheckCircleIcon, InfoIcon, WarningCircleIcon, WarningIcon } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '../utils/styles'

type AlertVariant = 'error' | 'warning' | 'info' | 'success'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  /** Accion opcional, por ejemplo un boton para reintentar. */
  action?: ReactNode
}

const VARIANTS: Record<AlertVariant, { classes: string; iconClass: string; icon: Icon }> = {
  error: { classes: 'border-agotado-borde bg-agotado-fondo text-tinta', iconClass: 'text-peligro', icon: WarningCircleIcon },
  warning: { classes: 'border-poco-borde bg-poco-fondo text-tinta', iconClass: 'text-poco', icon: WarningIcon },
  info: { classes: 'border-mascara/40 bg-suave text-tinta', iconClass: 'text-mascara', icon: InfoIcon },
  success: { classes: 'border-disponible-borde bg-disponible-fondo text-tinta', iconClass: 'text-disponible', icon: CheckCircleIcon },
}

/** Mensaje en linea. Los errores se anuncian de inmediato; el resto de forma cortes. */
export default function Alert({ variant = 'info', title, children, action }: AlertProps) {
  const { classes, iconClass, icon: AlertIcon } = VARIANTS[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-md border p-3 text-sm', classes)}
    >
      <AlertIcon size={20} weight="fill" aria-hidden="true" className={cn('shrink-0', iconClass)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}
