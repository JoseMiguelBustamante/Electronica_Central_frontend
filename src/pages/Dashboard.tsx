import { Link } from 'react-router-dom'
import {
  CaretRightIcon,
  ChartBarIcon,
  ClockCounterClockwiseIcon,
  CurrencyCircleDollarIcon,
  PackageIcon,
  ShoppingCartIcon,
  TrayIcon,
  TruckIcon,
  UsersIcon,
  WarningCircleIcon,
  NotePencilIcon,
  WarehouseIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import LoadingState, { Skeleton } from '../components/LoadingState'
import StatCard from '../components/StatCard'
import { useDashboardData } from '../hooks/useDashboardData'
import { formatCurrency, formatDateTime, formatNumber } from '../utils/formatters'
import type { IndicadorId } from '../types/indicadores'
import { NAV_GROUPS, ROUTES } from '../utils/navigation'
import { cn } from '../utils/styles'

const INDICATOR_ICONS: Record<IndicadorId, Icon> = {
  vendidoHoy: CurrencyCircleDollarIcon,
  cobradoHoy: CurrencyCircleDollarIcon,
  porCobrar: ChartBarIcon,
  alertasStock: WarningCircleIcon,
  solicitudes: NotePencilIcon,
  comprasPendientes: TruckIcon,
  ventasBorrador: ShoppingCartIcon,
  productos: PackageIcon,
  usuarios: UsersIcon,
}

/** Un acceso por paquete (no repetir todo el menú lateral). */
const ACCESO_PAQUETE = NAV_GROUPS.filter((g) => g.id !== 'panel').map((grupo) => ({
  id: grupo.id,
  label: grupo.paquete,
  to: grupo.items[0]?.to ?? ROUTES.dashboard,
  description: grupo.items.map((i) => i.label).join(' · '),
  icon: grupo.items[0]?.icon ?? PackageIcon,
}))

const SECTION_TITLE = 'text-base font-semibold text-tinta'
const LIST_BOX = 'divide-y divide-linea overflow-hidden rounded-lg border border-linea bg-superficie'
const INSET_FOCUS =
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mascara'

function DashboardSkeleton() {
  return (
    <LoadingState label="Cargando el panel…">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    </LoadingState>
  )
}

export default function Dashboard() {
  const { cargando, sesion, indicadores, sistema, alertas, cola, actividad } = useDashboardData()
  const fecha = formatDateTime(new Date().toISOString())

  return (
    <div className="w-full space-y-5">
      <header>
        <h2 className="text-xl font-semibold text-tinta">
          {sesion ? `Hola, ${sesion.nombreUsuario}` : 'Panel'}
        </h2>
        <p className="mt-1 text-sm text-secundario">
          Resumen operativo · {fecha}
        </p>
      </header>

      {cargando ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section aria-labelledby="ops-titulo">
            <h3 id="ops-titulo" className={SECTION_TITLE}>
              Hoy y pendientes
            </h3>
            {indicadores.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {indicadores.map((indicador) => (
                  <StatCard
                    key={indicador.id}
                    title={indicador.titulo}
                    value={
                      indicador.moneda
                        ? formatCurrency(indicador.valor)
                        : formatNumber(indicador.valor)
                    }
                    description={indicador.contexto}
                    icon={INDICATOR_ICONS[indicador.id]}
                    to={indicador.to}
                  />
                ))}
              </div>
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

          <section aria-labelledby="paquetes-titulo">
            <h3 id="paquetes-titulo" className={SECTION_TITLE}>
              Paquetes
            </h3>
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ACCESO_PAQUETE.map((paquete) => {
                const Icono = paquete.icon
                return (
                  <li key={paquete.id}>
                    <Link
                      to={paquete.to}
                      className={cn(
                        'flex min-h-16 items-center gap-3 rounded-lg border border-linea bg-superficie px-4 py-3 hover:border-mascara hover:bg-suave/40',
                        INSET_FOCUS,
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-10 shrink-0 place-items-center rounded-md bg-suave text-mascara"
                      >
                        <Icono size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-tinta">{paquete.label}</span>
                        <span className="block text-xs text-secundario">{paquete.description}</span>
                      </span>
                      <CaretRightIcon size={16} aria-hidden="true" className="shrink-0 text-secundario" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <section aria-labelledby="alertas-titulo">
              <div className="flex items-center justify-between gap-3">
                <h3 id="alertas-titulo" className={SECTION_TITLE}>
                  Alertas
                </h3>
                <Link
                  to={ROUTES.inventario}
                  className="rounded-md px-1 text-sm font-medium text-mascara hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mascara"
                >
                  Inventario
                </Link>
              </div>
              {alertas.length > 0 ? (
                <ul className={`mt-3 ${LIST_BOX}`}>
                  {alertas.map((alerta) => (
                    <li key={alerta.id}>
                      <Link
                        to={alerta.to}
                        className={`flex min-h-12 items-start gap-3 px-4 py-2.5 hover:bg-fondo ${INSET_FOCUS}`}
                      >
                        <span
                          className={cn(
                            'mt-0.5 grid size-8 shrink-0 place-items-center rounded-md',
                            alerta.tono === 'peligro' && 'bg-peligro-suave text-peligro',
                            alerta.tono === 'aviso' && 'bg-poco-fondo text-poco',
                            alerta.tono === 'info' && 'bg-suave text-mascara',
                          )}
                          aria-hidden="true"
                        >
                          <WarningCircleIcon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-tinta">{alerta.titulo}</span>
                          <span className="block text-xs text-secundario">{alerta.detalle}</span>
                        </span>
                        <CaretRightIcon size={16} aria-hidden="true" className="mt-1 shrink-0 text-secundario" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={`mt-3 ${LIST_BOX} px-4 py-6`}>
                  <p className="text-center text-sm text-secundario">Sin alertas de stock ni borradores.</p>
                </div>
              )}
            </section>

            <section aria-labelledby="cola-titulo">
              <h3 id="cola-titulo" className={SECTION_TITLE}>
                Cola operativa
              </h3>
              {cola.length > 0 ? (
                <ul className={`mt-3 ${LIST_BOX}`}>
                  {cola.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.to}
                        className={`flex min-h-12 items-center gap-3 px-4 py-2.5 hover:bg-fondo ${INSET_FOCUS}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-tinta">{item.titulo}</span>
                          <span className="block text-xs text-secundario">{item.detalle}</span>
                        </span>
                        <CaretRightIcon size={16} aria-hidden="true" className="shrink-0 text-secundario" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={`mt-3 ${LIST_BOX} px-4 py-6`}>
                  <p className="text-center text-sm text-secundario">Sin solicitudes, compras ni borradores pendientes.</p>
                </div>
              )}
            </section>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <section aria-labelledby="actividad-titulo">
              <div className="flex items-center justify-between gap-3">
                <h3 id="actividad-titulo" className={SECTION_TITLE}>
                  Actividad reciente
                </h3>
                <Link
                  to={ROUTES.bitacora}
                  className="rounded-md px-1 text-sm font-medium text-mascara hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mascara"
                >
                  Bitácora
                </Link>
              </div>
              {actividad.length > 0 ? (
                <ul className={`mt-3 ${LIST_BOX}`}>
                  {actividad.map((registro) => (
                    <li
                      key={registro.id}
                      className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-tinta">{registro.accion}</p>
                        <p className="truncate text-xs text-tinta">{registro.objeto}</p>
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
                <div className={`mt-3 ${LIST_BOX} px-4 py-6`}>
                  <div className="flex items-center justify-center gap-2 text-sm text-secundario">
                    <ClockCounterClockwiseIcon size={18} aria-hidden="true" />
                    Sin actividad reciente.
                  </div>
                </div>
              )}
            </section>

            {sistema.length > 0 && (
              <section aria-labelledby="sistema-titulo">
                <h3 id="sistema-titulo" className={SECTION_TITLE}>
                  Catálogo y sistema
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {sistema.map((indicador) => (
                    <StatCard
                      key={indicador.id}
                      title={indicador.titulo}
                      value={formatNumber(indicador.valor)}
                      description={indicador.contexto}
                      icon={INDICATOR_ICONS[indicador.id]}
                      to={indicador.to}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  )
}
