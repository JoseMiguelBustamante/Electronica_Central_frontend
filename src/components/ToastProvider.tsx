import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircleIcon, InfoIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import IconButton from './IconButton'
import { ToastContext } from '../hooks/toastContext'
import type { ToastApi } from '../hooks/toastContext'
import { cn } from '../utils/styles'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  variant: ToastVariant
  message: string
}

const VARIANTS: Record<ToastVariant, { classes: string; iconClass: string; icon: Icon }> = {
  success: { classes: 'border-disponible-borde bg-disponible-fondo text-tinta', iconClass: 'text-disponible', icon: CheckCircleIcon },
  error: { classes: 'border-agotado-borde bg-agotado-fondo text-tinta', iconClass: 'text-peligro', icon: WarningCircleIcon },
  info: { classes: 'border-mascara/40 bg-suave text-tinta', iconClass: 'text-mascara', icon: InfoIcon },
}

const DURATION_MS: Record<ToastVariant, number> = { success: 5000, info: 5000, error: 8000 }

/** Notificaciones internas. Se montan una vez y se usan con `useToast()`. */
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = ++nextId.current
      setToasts((prev) => [...prev, { id, variant, message }])
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), DURATION_MS[variant]),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
      >
        {toasts.map((toast) => {
          const { classes, iconClass, icon: ToastIcon } = VARIANTS[toast.variant]
          return (
            <div
              key={toast.id}
              role={toast.variant === 'error' ? 'alert' : undefined}
              className={cn(
                'pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-superficie p-3 shadow-md',
                classes,
              )}
            >
              <ToastIcon size={20} weight="fill" aria-hidden="true" className={cn('mt-0.5 shrink-0', iconClass)} />
              <p className="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>
              <IconButton
                label="Cerrar notificación"
                icon={XIcon}
                onClick={() => dismiss(toast.id)}
                className="-my-1 -mr-1 size-8"
              />
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
