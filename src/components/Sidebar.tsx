import { Link, NavLink } from 'react-router-dom'
import { XIcon } from '@phosphor-icons/react'
import { BRAND_NAME, NAV_ITEMS, ROUTES } from '../utils/navigation'
import { FOCUS_RING, cn } from '../utils/styles'
import { useEscapeKey } from '../hooks/useEscapeKey'

interface SidebarProps {
  /** Solo aplica en pantallas pequenas, donde el Sidebar es un panel deslizable. */
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  useEscapeKey(open, onClose)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-tinta/40 lg:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        id="sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-linea bg-superficie',
          'transition-[transform,visibility] duration-200 motion-reduce:transition-none',
          'lg:visible lg:translate-x-0',
          open ? 'visible translate-x-0' : 'invisible -translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-linea px-4">
          <Link
            to={ROUTES.dashboard}
            onClick={onClose}
            className={cn(
              'flex items-center gap-1.5 rounded-md text-base font-bold leading-tight text-mascara',
              FOCUS_RING,
            )}
          >
            <span translate="no">{BRAND_NAME}</span>
            {/* <span aria-hidden="true">⚡</span> */}
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú de navegación"
            className={cn(
              'grid size-11 place-items-center rounded-md text-secundario hover:bg-suave lg:hidden',
              FOCUS_RING,
            )}
          >
            <XIcon size={22} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto overscroll-contain p-3">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ label, to, icon: NavIcon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'relative flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors motion-reduce:transition-none',
                      isActive
                        ? 'bg-suave font-semibold text-mascara'
                        : 'font-medium text-tinta hover:bg-suave hover:text-tinta',
                      FOCUS_RING,
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-2 left-0 w-1 rounded-r bg-mascara"
                        />
                      )}
                      <NavIcon size={20} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
