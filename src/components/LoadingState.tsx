import type { ReactNode } from 'react'
import { cn } from '../utils/styles'

/** Bloque de relleno para esqueletos de carga con la forma del contenido final. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-linea motion-reduce:animate-none', className)}
    />
  )
}

interface LoadingStateProps {
  label?: string
  children: ReactNode
}

/** Envuelve un esqueleto de carga y lo anuncia a lectores de pantalla. */
export default function LoadingState({ label = 'Cargando…', children }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
