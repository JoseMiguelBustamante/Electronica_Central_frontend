import type { ComponentProps } from 'react'
import { SpinnerIcon } from '@phosphor-icons/react'
import { FOCUS_RING, cn } from '../utils/styles'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant
  /** Muestra un indicador de carga y deshabilita el boton. */
  loading?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-cobre text-white hover:bg-cobre-press disabled:bg-linea disabled:text-secundario',
  secondary:
    'border border-mascara bg-superficie text-mascara hover:bg-suave disabled:border-linea disabled:bg-superficie disabled:text-secundario',
  danger:
    'border border-peligro bg-superficie text-peligro hover:bg-peligro-suave disabled:border-linea disabled:text-secundario',
}

export default function Button({
  variant = 'primary',
  loading = false,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold',
        'transition-colors motion-reduce:transition-none',
        'disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        FOCUS_RING,
        className,
      )}
      {...rest}
    >
      {loading && (
        <SpinnerIcon size={18} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
      )}
      {children}
    </button>
  )
}
