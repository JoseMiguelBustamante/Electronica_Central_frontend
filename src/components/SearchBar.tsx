import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import FormField from './FormField'
import { FOCUS_RING, cn } from '../utils/styles'

interface SearchBarProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ label, value, onChange, placeholder }: SearchBarProps) {
  return (
    <FormField label={label} hideLabel>
      {(control) => (
        <div className="relative">
          <MagnifyingGlassIcon
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secundario"
          />
          <input
            {...control}
            type="search"
            name="busqueda"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className={cn(
              'block min-h-11 w-full rounded-md border border-campo bg-superficie pl-10 pr-3 text-base text-tinta hover:border-campo',
              FOCUS_RING,
            )}
          />
        </div>
      )}
    </FormField>
  )
}
