import type { ComponentProps, ReactNode } from 'react'
import FormField from './FormField'
import { FOCUS_RING, cn } from '../utils/styles'

interface InputProps extends Omit<ComponentProps<'input'>, 'id'> {
  label: string
  /** Mensaje de error visible bajo el campo. */
  error?: string
  /** Elemento al final del campo, por ejemplo un boton de accion. */
  endAdornment?: ReactNode
}

export default function Input({
  label,
  error,
  endAdornment,
  required,
  className,
  ...rest
}: InputProps) {
  return (
    <FormField label={label} required={required} error={error}>
      {(control) => (
        <div className="relative">
          <input
            {...control}
            required={required}
            className={cn(
              'block min-h-11 w-full rounded-md border bg-superficie px-3 text-base text-tinta',
              'disabled:cursor-not-allowed disabled:bg-fondo disabled:text-secundario',
              error ? 'border-peligro' : 'border-campo hover:border-campo',
              endAdornment ? 'pr-12' : null,
              FOCUS_RING,
              className,
            )}
            {...rest}
          />
          {endAdornment && (
            <div className="absolute inset-y-0 right-0.5 flex items-center">{endAdornment}</div>
          )}
        </div>
      )}
    </FormField>
  )
}
