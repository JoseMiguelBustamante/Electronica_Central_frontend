import { CheckCircleIcon, MinusCircleIcon, XCircleIcon } from '@phosphor-icons/react'
import { cn } from '../../utils/styles'

const ESTADOS: Record<string, { texto: string; clase: string; icono: typeof CheckCircleIcon; iconoClase: string }> = {
  DISPONIBLE: {
    texto: 'Disponible',
    clase: 'border-disponible-borde bg-disponible-fondo',
    icono: CheckCircleIcon,
    iconoClase: 'text-disponible',
  },
  NO_DISPONIBLE: {
    texto: 'Agotado',
    clase: 'border-agotado-borde bg-agotado-fondo',
    icono: XCircleIcon,
    iconoClase: 'text-peligro',
  },
}

/** Estado público del catálogo. Solo muestra lo que devuelve la API. */
export default function Disponibilidad({
  valor,
  stockRestante = null,
}: {
  valor: string
  /** Si el backend envía pocas unidades, se muestra urgencia. */
  stockRestante?: number | null
}) {
  const urgencia =
    valor === 'DISPONIBLE' && stockRestante != null && stockRestante > 0
      ? stockRestante === 1
        ? 'Solo queda 1'
        : `Quedan ${stockRestante}`
      : null
  const estado = ESTADOS[valor] ?? {
    texto: valor,
    clase: 'border-linea bg-fondo',
    icono: MinusCircleIcon,
    iconoClase: 'text-secundario',
  }
  const Icono = estado.icono
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold text-tinta',
          estado.clase,
        )}
      >
        <Icono size={14} weight="fill" aria-hidden="true" className={estado.iconoClase} />
        {estado.texto}
      </span>
      {urgencia && (
        <span className="text-xs font-semibold text-cobre">
          ¡Date prisa! {urgencia} en stock.
        </span>
      )}
    </span>
  )
}
