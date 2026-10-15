import { useCallback, useId, useRef, useState } from 'react'
import { DotsThreeIcon } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import IconButton from './IconButton'
import { useClickOutside } from '../hooks/useClickOutside'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { FOCUS_RING, cn } from '../utils/styles'

export interface ActionMenuItem {
  label: string
  icon: Icon
  onSelect: () => void
  disabled?: boolean
}

interface ActionMenuProps {
  /** Nombre accesible del boton que abre el menu. */
  label: string
  items: readonly ActionMenuItem[]
}

/** Menu de acciones secundarias de una fila. */
export default function ActionMenu({ label, items }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const close = useCallback(() => setOpen(false), [])
  const closeAndFocus = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  useClickOutside(containerRef, open, close)
  useEscapeKey(open, closeAndFocus)

  const select = (item: ActionMenuItem) => {
    // El foco vuelve al boton antes de abrir el modal para que este lo restaure al cerrarse.
    setOpen(false)
    buttonRef.current?.focus()
    item.onSelect()
  }

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        ref={buttonRef}
        label={label}
        icon={DotsThreeIcon}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      />
      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-linea bg-superficie p-1 shadow-md"
        >
          <ul>
            {items.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={() => select(item)}
                  className={cn(
                    'flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium text-tinta',
                    'hover:bg-suave hover:text-tinta',
                    'disabled:cursor-not-allowed disabled:text-secundario disabled:hover:bg-transparent',
                    FOCUS_RING,
                  )}
                >
                  <item.icon size={18} aria-hidden="true" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
