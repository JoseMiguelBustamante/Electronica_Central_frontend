import { useEffect, useId, useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { XIcon } from '@phosphor-icons/react'
import IconButton from './IconButton'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { cn } from '../utils/styles'

type ModalSize = 'sm' | 'md' | 'lg'

interface ModalProps {
  title: string
  description?: string
  /** Cierra el modal (boton, Esc). No se invoca mientras `busy` sea true. */
  onClose: () => void
  /** Hay una operacion en curso: se bloquea el cierre para no perder el trabajo. */
  busy?: boolean
  size?: ModalSize
  role?: 'dialog' | 'alertdialog'
  children: ReactNode
  footer?: ReactNode
}

const SIZES: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modal accesible. Existe mientras esta montado: el componente padre decide cuando mostrarlo.
 * Atrapa el foco, se cierra con Esc y devuelve el foco al elemento que lo abrio.
 * Hacer clic fuera NO lo cierra, para evitar perder datos escritos por accidente.
 */
export default function Modal({
  title,
  description,
  onClose,
  busy = false,
  size = 'md',
  role = 'dialog',
  children,
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEscapeKey(!busy, onClose)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const target = dialog?.querySelector<HTMLElement>('[data-autofocus]') ?? dialog
    target?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return
    const focusables = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (focusables.length === 0) {
      event.preventDefault()
      return
    }
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === dialogRef.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex max-h-[92dvh] w-full flex-col rounded-t-xl bg-superficie outline-none sm:rounded-xl',
          SIZES[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-linea px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-tinta">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-secundario">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Cerrar ventana" icon={XIcon} onClick={onClose} disabled={busy} className="-mr-2 -mt-1" />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-linea px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
