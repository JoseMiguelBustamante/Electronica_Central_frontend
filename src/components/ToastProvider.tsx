import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircleIcon, InfoIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import IconButton from './IconButton'
import { ToastContext } from '../hooks/toastContext'
import type { ToastAction, ToastApi, ToastOptions } from '../hooks/toastContext'
import { FOCUS_RING, cn } from '../utils/styles'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  variant: ToastVariant
  message: string
  action?: ToastAction
}

const VARIANTS: Record<ToastVariant, { classes: string; iconClass: string; icon: Icon }> = {
  success: { classes: 'border-disponible-borde bg-disponible-fondo text-tinta', iconClass: 'text-disponible', icon: CheckCircleIcon },
  error: { classes: 'border-agotado-borde bg-agotado-fondo text-tinta', iconClass: 'text-peligro', icon: WarningCircleIcon },
  info: { classes: 'border-mascara/40 bg-suave text-tinta', iconClass: 'text-mascara', icon: InfoIcon },
}

const DURATION_MS: Record<ToastVariant, number> = { success: 4500, info: 5000, error: 8000 }

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
    (variant: ToastVariant, message: string, options?: ToastOptions) => {
      const id = ++nextId.current
      setToasts((prev) => [...prev, { id, variant, message, action: options?.action }])
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
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      info: (message, options) => push('info', message, options),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-4 right-4 z-[60] flex w-[min(100%-2rem,22rem)] flex-col items-stretch gap-2"
      >
        {toasts.map((toast) => {
          const { classes, iconClass, icon: ToastIcon } = VARIANTS[toast.variant]
          return (
            <div
              key={toast.id}
              role={toast.variant === 'error' ? 'alert' : undefined}
              className={cn(
                'pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-superficie p-3 shadow-md transition duration-200',
                classes,
              )}
            >
              <ToastIcon size={20} weight="fill" aria-hidden="true" className={cn('mt-0.5 shrink-0', iconClass)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
                {toast.action && (
                  toast.action.to ? (
                    <Link
                      to={toast.action.to}
                      onClick={() => dismiss(toast.id)}
                      className={`mt-1 inline-block text-sm font-semibold text-mascara hover:underline ${FOCUS_RING}`}
                    >
                      {toast.action.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        toast.action?.onClick?.()
                        dismiss(toast.id)
                      }}
                      className={`mt-1 text-sm font-semibold text-mascara hover:underline ${FOCUS_RING}`}
                    >
                      {toast.action.label}
                    </button>
                  )
                )}
              </div>
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
