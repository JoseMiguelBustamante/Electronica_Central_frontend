import { useCallback, useRef, useState } from 'react'
import { CaretDownIcon, SignOutIcon } from '@phosphor-icons/react'
import { FOCUS_RING, cn } from '../utils/styles'
import { useClickOutside } from '../hooks/useClickOutside'
import { useEscapeKey } from '../hooks/useEscapeKey'

export interface UserInfo {
  name: string
  role: string
}

interface UserMenuProps {
  user: UserInfo
  onLogout: () => void
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => setOpen(false), [])
  const closeAndRestoreFocus = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  useClickOutside(containerRef, open, close)
  useEscapeKey(open, closeAndRestoreFocus)

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="user-menu-panel"
        aria-label={`Menú de usuario, ${user.name}`}
        className={cn(
          'flex min-h-11 items-center gap-2 rounded-md px-2 text-tinta hover:bg-suave',
          FOCUS_RING,
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-full bg-mascara text-xs font-semibold text-white"
        >
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-tinta">{user.name}</span>
          <span className="block text-xs leading-tight text-secundario">{user.role}</span>
        </span>
        <CaretDownIcon size={16} aria-hidden="true" />
      </button>

      {open && (
        <div
          id="user-menu-panel"
          className="absolute right-0 z-30 mt-2 w-56 rounded-lg border border-linea bg-superficie p-1 shadow-md"
        >
          <div className="border-b border-linea px-3 py-2">
            <p className="text-sm font-medium text-tinta">{user.name}</p>
            <p className="text-xs text-secundario">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              close()
              onLogout()
            }}
            className={cn(
              'mt-1 flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-tinta hover:bg-suave',
              FOCUS_RING,
            )}
          >
            <SignOutIcon size={18} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
