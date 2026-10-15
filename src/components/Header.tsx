import { ListIcon } from '@phosphor-icons/react'
import UserMenu from './UserMenu'
import type { UserInfo } from './UserMenu'
import { FOCUS_RING, cn } from '../utils/styles'

interface HeaderProps {
  title: string
  user: UserInfo
  menuOpen: boolean
  onMenuClick: () => void
  onLogout: () => void
}

export default function Header({ title, user, menuOpen, onMenuClick, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-linea bg-superficie px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menú de navegación"
          aria-expanded={menuOpen}
          aria-controls="sidebar"
          className={cn(
            'grid size-11 place-items-center rounded-md text-tinta hover:bg-suave lg:hidden',
            FOCUS_RING,
          )}
        >
          <ListIcon size={24} aria-hidden="true" />
        </button>
        <h1 className="text-lg font-semibold text-tinta">{title}</h1>
      </div>
      <UserMenu user={user} onLogout={onLogout} />
    </header>
  )
}
