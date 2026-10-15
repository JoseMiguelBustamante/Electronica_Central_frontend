import { useId } from 'react'
import type { ReactNode } from 'react'
import { WarningCircleIcon } from '@phosphor-icons/react'
import { cn } from '../utils/styles'

export interface FieldControlProps {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

/** Mensaje de error de un campo. Su `id` debe referenciarse con `aria-describedby`. */
export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-peligro">
      <WarningCircleIcon size={16} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0" />
      {children}
    </p>
  )
}

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  /** Oculta la etiqueta visualmente pero la conserva para lectores de pantalla. */
  hideLabel?: boolean
  children: (control: FieldControlProps) => ReactNode
}

/** Etiqueta, indicador de obligatorio y mensaje de error compartidos por los campos. */
export default function FormField({ label, required, error, hideLabel, children }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className={cn('block text-[13px] font-semibold text-tinta', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-peligro">
            *
          </span>
        )}
      </label>
      <div className={cn(!hideLabel && 'mt-1.5')}>
        {children({
          id,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? errorId : undefined,
        })}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
