import { Link } from 'react-router-dom'
import {
  CaretRightIcon,
  ClockCounterClockwiseIcon,
  PackageIcon,
  RulerIcon,
  ShieldCheckIcon,
  TagIcon,
  TrayIcon,
  UsersIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import LoadingState, { Skeleton } from '../components/LoadingState'
import StatCard from '../components/StatCard'
import { useDashboardData } from '../hooks/useDashboardData'
import { formatDateTime, formatNumber } from '../utils/formatters'
import type { IndicadorId } from '../types/indicadores'
import { NAV_ITEMS, ROUTES } from '../utils/navigation'

const INDICATOR_ICONS: Record<IndicadorId, Icon> = {
  usuarios: UsersIcon,
  roles: ShieldCheckIcon,
  productos: PackageIcon,
  categorias: TagIcon,
  unidadesMedida: RulerIcon,
}

const QUICK_ACCESS = NAV_ITEMS.filter((item) => item.to !== ROUTES.dashboard)

const SECTION_TITLE = 'text-base font-semibold text-tinta'
const LIST_BOX = 'divide-y divide-linea overflow-hidden rounded-lg border border-linea bg-superficie'
const INSET_FOCUS =
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mascara'

function DashboardSkeleton() {
  return (
    <LoadingState label="Cargando el panel…">
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <div className="grid gap-8 xl:grid-cols-3">
          <Skeleton className="h-72 xl:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    </LoadingState>
  )
}

export default function Dashboard() {
  const { cargando, indicadores, actividad } = useDashboardData()

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-tinta">Panel</h2>
        <p className="mt-1 text-sm text-secundario">
          Resumen general del sistema y accesos rápidos a sus principales módulos.
        </p>
      </header>

      {cargando ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section aria-labelledby="resumen-titulo">
            <h3 id="resumen-titulo" className={SECTION_TITLE}>
              Resumen
            </h3>
            {indicadores.length > 0 ? (
              <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {indicadores.map((indicador) => (
                  <StatCard
                    key={indicador.id}
                    title={indicador.titulo}
                    value={formatNumber(indicador.valor)}
                    description={indicador.contexto}
                    icon={INDICATOR_ICONS[indicador.id]}
                  />
                ))}
              </dl>
            ) : (
              <div className="mt-3">
                <EmptyState
                  icon={TrayIcon}
                  title="Sin indicadores disponibles"
                  description="Cuando existan datos registrados, el resumen aparecerá aquí."
                />
              </div>
            )}
          </section>

          <div className="grid gap-8 xl:grid-cols-3">
            <section aria-labelledby="accesos-titulo" className="xl:col-start-3 xl:row-start-1">
              <h3 id="accesos-titulo" className={SECTION_TITLE}>
                Accesos rápidos
              </h3>
              <ul className={`mt-3 ${LIST_BOX}`}>
                {QUICK_ACCESS.map(({ label, to, description, icon: ItemIcon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className={`flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-fondo ${INSET_FOCUS}`}
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-9 shrink-0 place-items-center rounded-md bg-suave text-mascara"
                      >
                        <ItemIcon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-tinta">{label}</span>
                        <span className="block text-sm text-secundario">{description}</span>
                      </span>
                      <CaretRightIcon size={16} aria-hidden="true" className="shrink-0 text-secundario" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="actividad-titulo"
              className="xl:col-span-2 xl:col-start-1 xl:row-start-1"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 id="actividad-titulo" className={SECTION_TITLE}>
                  Actividad reciente
                </h3>
                <Link
                  to={ROUTES.bitacora}
                  className="rounded-md px-1 text-sm font-medium text-mascara hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mascara"
                >
                  Ver bitácora
                </Link>
              </div>
              {actividad.length > 0 ? (
                <ul className={`mt-3 ${LIST_BOX}`}>
                  {actividad.map((registro) => (
                    <li
                      key={registro.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-tinta">{registro.accion}</p>
                        <p className="break-words text-sm text-tinta">{registro.objeto}</p>
                        <p className="mt-0.5 text-xs text-secundario">
                          {registro.usuario} <span aria-hidden="true">·</span>{' '}
                          <time dateTime={registro.fechaHora}>{formatDateTime(registro.fechaHora)}</time>
                        </p>
                      </div>
                      <Badge variant={registro.resultado === 'exitoso' ? 'success' : 'error'}>
                        {registro.resultado === 'exitoso' ? 'Exitoso' : 'Error'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3">
                  <EmptyState
                    icon={ClockCounterClockwiseIcon}
                    title="Sin actividad reciente"
                    description="Las acciones administrativas del sistema aparecerán aquí."
                  />
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
