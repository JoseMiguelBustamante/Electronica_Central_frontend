import type { ReactNode } from 'react'
import {
  CheckCircleIcon,
  InfoIcon,
  MinusCircleIcon,
  WarningIcon,
  XCircleIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { cn } from '../utils/styles'

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  /** Icono propio, o `false` para mostrar solo texto (por ejemplo, etiquetas de rol). */
  icon?: Icon | false
  children: ReactNode
}

// Cada estado combina color, icono y texto: nunca depende solo del color.
const VARIANTS: Record<BadgeVariant, { classes: string; iconClass: string; icon: Icon }> = {
  success: {
    classes: 'border border-disponible-borde bg-disponible-fondo text-tinta',
    iconClass: 'text-disponible',
    icon: CheckCircleIcon,
  },
  error: {
    classes: 'border border-agotado-borde bg-agotado-fondo text-tinta',
    iconClass: 'text-peligro',
    icon: XCircleIcon,
  },
  warning: {
    classes: 'border border-poco-borde bg-poco-fondo text-tinta',
    iconClass: 'text-poco',
    icon: WarningIcon,
  },
  info: {
    classes: 'border border-mascara/40 bg-suave text-tinta',
    iconClass: 'text-mascara',
    icon: InfoIcon,
  },
  neutral: {
    classes: 'border border-campo bg-fondo text-tinta',
    iconClass: 'text-secundario',
    icon: MinusCircleIcon,
  },
}

export default function Badge({ variant = 'neutral', icon, children }: BadgeProps) {
  const { classes, iconClass, icon: defaultIcon } = VARIANTS[variant]
  const BadgeIcon = icon === false ? null : (icon ?? defaultIcon)
  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium',
        classes,
      )}
    >
      {BadgeIcon && <BadgeIcon size={14} weight="fill" aria-hidden="true" className={iconClass} />}
      {children}
    </span>
  )
}
