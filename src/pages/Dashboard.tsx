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
import { ROUTES } from '../utils/navigation'
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

const QUICK_ACCESS: Array<{ label: string; to: string; description: string; icon: Icon }> = [
  { label: 'Ventas', to: ROUTES.ventas, description: 'Cobrar y confirmar ventas', icon: ShoppingCartIcon },
  { label: 'Inventario', to: ROUTES.inventario, description: 'Stock y alertas', icon: WarehouseIcon },
  { label: 'Productos', to: ROUTES.productos, description: 'Catálogo interno', icon: PackageIcon },
  { label: 'Compras', to: ROUTES.compras, description: 'Órdenes y recepción', icon: TruckIcon },
  { label: 'Solicitudes', to: ROUTES.solicitudes, description: 'Pedidos pendientes', icon: NotePencilIcon },
  { label: 'Reportes', to: ROUTES.reportes, description: 'Ventas e inventario', icon: ChartBarIcon },
]

const SECTION_TITLE = 'text-base font-semibold text-tinta'
const LIST_BOX = 'divide-y divide-linea overflow-hidden rounded-lg border border-linea bg-superficie'
const INSET_FOCUS =
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-mascara'

function DashboardSkeleton() {
  return (
    <LoadingState label="Cargando el panel…">
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
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
  const { cargando, sesion, indicadores, sistema, alertas, cola, actividad } = useDashboardData()
  const fecha = formatDateTime(new Date().toISOString())

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-semibold text-tinta">
          {sesion ? `Hola, ${sesion.nombreUsuario}` : 'Panel'}
        </h2>
        <p className="mt-1 text-sm text-secundario">
          Resumen operativo de la tienda · {fecha}
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
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          <div className="grid gap-8 xl:grid-cols-3">
            <section aria-labelledby="alertas-titulo" className="xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <h3 id="alertas-titulo" className={SECTION_TITLE}>
                  Alertas
                </h3>
                <Link
                  to={ROUTES.inventario}
                  className="rounded-md px-1 text-sm font-medium text-mascara hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mascara"
                >
                  Ver inventario
                </Link>
              </div>
              {alertas.length > 0 ? (
                <ul className={`mt-3 ${LIST_BOX}`}>
                  {alertas.map((alerta) => (
                    <li key={alerta.id}>
                      <Link
                        to={alerta.to}
                        className={`flex min-h-14 items-start gap-3 px-4 py-3 hover:bg-fondo ${INSET_FOCUS}`}
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
                          <span className="block text-sm text-secundario">{alerta.detalle}</span>
                        </span>
                        <CaretRightIcon size={16} aria-hidden="true" className="mt-1 shrink-0 text-secundario" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3">
                  <EmptyState
                    icon={WarehouseIcon}
                    title="Sin alertas"
                    description="No hay borradores ni alertas de stock por ahora."
                  />
                </div>
              )}
            </section>

            <section aria-labelledby="accesos-titulo">
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
          </div>

          <div className="grid gap-8 xl:grid-cols-3">
            <section aria-labelledby="cola-titulo" className="xl:col-span-2">
              <h3 id="cola-titulo" className={SECTION_TITLE}>
                Cola operativa
              </h3>
              {cola.length > 0 ? (
                <ul className={`mt-3 ${LIST_BOX}`}>
                  {cola.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={item.to}
                        className={`flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-fondo ${INSET_FOCUS}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-tinta">{item.titulo}</span>
                          <span className="block text-sm text-secundario">{item.detalle}</span>
                        </span>
                        <CaretRightIcon size={16} aria-hidden="true" className="shrink-0 text-secundario" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3">
                  <EmptyState
                    icon={TrayIcon}
                    title="Cola vacía"
                    description="No hay solicitudes, compras ni borradores pendientes."
                  />
                </div>
              )}
            </section>

            <section aria-labelledby="actividad-titulo">
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
                    description="Las acciones administrativas aparecerán aquí."
                  />
                </div>
              )}
            </section>
          </div>

          {sistema.length > 0 && (
            <section aria-labelledby="sistema-titulo">
              <h3 id="sistema-titulo" className={SECTION_TITLE}>
                Catálogo y sistema
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </>
      )}
    </div>
  )
}
