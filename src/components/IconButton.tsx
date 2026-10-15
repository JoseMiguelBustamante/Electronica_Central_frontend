import type { ComponentProps } from 'react'
import type { Icon } from '@phosphor-icons/react'
import { FOCUS_RING, cn } from '../utils/styles'

interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children' | 'aria-label'> {
  /** Nombre accesible del boton; tambien se muestra como tooltip. */
  label: string
  icon: Icon
}

export default function IconButton({
  label,
  icon: ButtonIcon,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-md text-secundario',
        'hover:bg-suave hover:text-tinta',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
        FOCUS_RING,
        className,
      )}
      {...rest}
    >
      <ButtonIcon size={20} aria-hidden="true" />
    </button>
  )
}
