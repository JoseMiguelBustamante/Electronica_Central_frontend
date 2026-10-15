import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { FOCUS_RING, cn } from '../utils/styles'

export interface TabItem {
  id: string
  label: string
}

interface TabsProps {
  /** Nombre accesible del grupo de pestanas. */
  label: string
  /** Prefijo para enlazar cada pestana con su panel (`${idPrefix}-tab-ID` y `${idPrefix}-panel-ID`). */
  idPrefix: string
  tabs: readonly TabItem[]
  value: string
  onChange: (id: string) => void
}

export default function Tabs({ label, idPrefix, tabs, value, onChange }: TabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.findIndex((tab) => tab.id === value)
    const targets: Record<string, number> = {
      ArrowRight: (current + 1) % tabs.length,
      ArrowLeft: (current - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }
    const next = targets[event.key]
    if (next === undefined) return
    event.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="flex gap-1 border-b border-linea"
    >
      {tabs.map((tab, index) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              '-mb-px min-h-11 border-b-2 px-4 text-sm',
              selected
                ? 'border-mascara font-semibold text-mascara'
                : 'border-transparent font-medium text-tinta hover:text-tinta',
              FOCUS_RING,
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
