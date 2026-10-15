import type { ComponentProps } from 'react'
import FormField from './FormField'
import { FOCUS_RING, cn } from '../utils/styles'

interface TextareaProps extends Omit<ComponentProps<'textarea'>, 'id'> {
  label: string
  /** Mensaje de error visible bajo el campo. */
  error?: string
}

/** Area de texto multilinea con etiqueta y mensaje de error. */
export default function Textarea({ label, error, required, className, ...rest }: TextareaProps) {
  return (
    <FormField label={label} required={required} error={error}>
      {(control) => (
        <textarea
          {...control}
          required={required}
          className={cn(
            'block w-full rounded-md border bg-superficie px-3 py-2 text-base text-tinta',
            'disabled:cursor-not-allowed disabled:bg-fondo disabled:text-secundario',
            error ? 'border-peligro' : 'border-campo hover:border-campo',
            FOCUS_RING,
            className,
          )}
          {...rest}
        />
      )}
    </FormField>
  )
}
