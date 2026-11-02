import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ChartBarIcon } from '@phosphor-icons/react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import Select from '../components/Select'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import { mensajeError } from '../lib/errors'
import {
  reporteGanancias,
  reporteInventario,
  reporteRotacion,
  reporteVentas,
  type ReporteGanancias,
  type ReporteInventario,
  type ReporteRotacion,
  type ReporteVentas,
} from '../services/reporteService'
import { formatCurrency, formatDateTime, formatNumber, toDateKey } from '../utils/formatters'

type TipoReporte = 'ventas' | 'ganancias' | 'inventario' | 'rotacion'

type Resultado =
  | { tipo: 'ventas'; data: ReporteVentas }
  | { tipo: 'ganancias'; data: ReporteGanancias }
  | { tipo: 'inventario'; data: ReporteInventario }
  | { tipo: 'rotacion'; data: ReporteRotacion }

const COLOR_COBRE = '#8e4b24'
const COLOR_MASCARA = '#1a4636'
const COLOR_OK = '#1f7a4a'
const COLOR_ALERTA = '#a56a12'
const COLOR_PELIGRO = '#8c342c'
const COLOR_NEUTRO = '#849088'
const PIE_COLORS = [COLOR_MASCARA, COLOR_COBRE, COLOR_OK, COLOR_ALERTA, COLOR_PELIGRO, COLOR_NEUTRO]

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function hace30Dias(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-linea bg-superficie p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-secundario">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-tinta">{value}</p>
      {hint ? <p className="mt-1 text-xs text-secundario">{hint}</p> : null}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-linea bg-superficie p-4">
      <h3 className="text-sm font-semibold text-tinta">{title}</h3>
      <div className="mt-3 h-64 w-full min-w-0">{children}</div>
    </section>
  )
}

function tooltipMoney(value: number | string | undefined) {
  const n = Number(value ?? 0)
  return formatCurrency(n)
}

function agruparPorDia(
  items: Array<{ fechaHora: string; monto: number }>,
): Array<{ dia: string; monto: number }> {
  const map = new Map<string, number>()
  for (const item of items) {
    const dia = toDateKey(item.fechaHora)
    map.set(dia, (map.get(dia) ?? 0) + item.monto)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, monto]) => ({ dia: dia.slice(5), monto: Math.round(monto * 100) / 100 }))
}

function DashboardVentas({ data }: { data: ReporteVentas }) {
  const porDia = useMemo(
    () => agruparPorDia(
      data.items
        .filter((i) => i.estado === 'CONFIRMADA')
        .map((i) => ({ fechaHora: i.fechaHora, monto: i.total })),
    ),
    [data.items],
  )

  const porEstado = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of data.items) {
      map.set(item.estado, (map.get(item.estado) ?? 0) + 1)
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }))
  }, [data.items])

  const columnas: Column<ReporteVentas['items'][number]>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (row) => formatDateTime(row.fechaHora),
    },
    { key: 'cliente', header: 'Cliente', primary: true, cell: (row) => row.cliente },
    { key: 'vendedor', header: 'Vendedor', cell: (row) => row.vendedor },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) => (
        <Badge variant={row.estado === 'CONFIRMADA' ? 'success' : row.estado === 'ANULADA' ? 'error' : 'neutral'}>
          {row.estado}
        </Badge>
      ),
    },
    { key: 'total', header: 'Total', cell: (row) => formatCurrency(row.total) },
    { key: 'cobrado', header: 'Cobrado', cell: (row) => formatCurrency(row.cobrado) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Vendido" value={formatCurrency(data.resumen.vendido)} hint="Solo ventas confirmadas" />
        <Kpi label="Cobrado" value={formatCurrency(data.resumen.cobrado)} />
        <Kpi label="Ventas en el período" value={formatNumber(data.items.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Ventas confirmadas por día">
          {porDia.length === 0 ? (
            <p className="text-sm text-secundario">Sin ventas confirmadas en el rango.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={porDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d2d8ce" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => tooltipMoney(v as number)} />
                <Line type="monotone" dataKey="monto" name="Vendido" stroke={COLOR_COBRE} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Cantidad por estado">
          {porEstado.length === 0 ? (
            <p className="text-sm text-secundario">Sin datos.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porEstado} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {porEstado.map((_, index) => (
                    <Cell key={porEstado[index].name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-tinta">Detalle de ventas</h3>
        {data.items.length === 0 ? (
          <p className="text-sm text-secundario">No hay ventas en este período.</p>
        ) : (
          <Table
            caption="Detalle de ventas del reporte"
            columns={columnas}
            rows={data.items}
            getRowKey={(row) => row.idVenta}
          />
        )}
      </section>
    </div>
  )
}

function DashboardGanancias({ data }: { data: ReporteGanancias }) {
  const porDia = useMemo(
    () => agruparPorDia(data.items.map((i) => ({ fechaHora: i.fechaHora, monto: i.gananciaLinea }))),
    [data.items],
  )

  const topProductos = useMemo(() => {
    const map = new Map<string, { nombre: string; ganancia: number; cantidad: number }>()
    for (const item of data.items) {
      const prev = map.get(item.codigo) ?? { nombre: item.nombre, ganancia: 0, cantidad: 0 }
      prev.ganancia += item.gananciaLinea
      prev.cantidad += item.cantidad
      map.set(item.codigo, prev)
    }
    return [...map.entries()]
      .map(([codigo, v]) => ({
        codigo,
        etiqueta: codigo,
        ganancia: Math.round(v.ganancia * 100) / 100,
        cantidad: v.cantidad,
        nombre: v.nombre,
      }))
      .sort((a, b) => b.ganancia - a.ganancia)
      .slice(0, 8)
  }, [data.items])

  const columnas: Column<ReporteGanancias['items'][number]>[] = [
    { key: 'fecha', header: 'Fecha', cell: (row) => formatDateTime(row.fechaHora) },
    { key: 'producto', header: 'Producto', primary: true, cell: (row) => `${row.codigo} — ${row.nombre}` },
    { key: 'cant', header: 'Cant.', cell: (row) => formatNumber(row.cantidad) },
    { key: 'precio', header: 'Precio', cell: (row) => formatCurrency(row.precioUnitario) },
    { key: 'costo', header: 'Costo', cell: (row) => formatCurrency(row.costoUnitarioHistorico) },
    { key: 'ganancia', header: 'Ganancia', cell: (row) => formatCurrency(row.gananciaLinea) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Kpi label="Ganancia bruta" value={formatCurrency(data.resumen.gananciaBruta)} />
        <Kpi label="Líneas vendidas" value={formatNumber(data.items.length)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Ganancia por día">
          {porDia.length === 0 ? (
            <p className="text-sm text-secundario">Sin ganancias en el rango.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d2d8ce" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => tooltipMoney(v as number)} />
                <Bar dataKey="monto" name="Ganancia" fill={COLOR_MASCARA} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top productos por ganancia">
          {topProductos.length === 0 ? (
            <p className="text-sm text-secundario">Sin productos.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductos} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d2d8ce" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="etiqueta" width={72} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => tooltipMoney(v as number)}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as { nombre?: string; codigo?: string } | undefined
                    return row ? `${row.codigo} — ${row.nombre}` : ''
                  }}
                />
                <Bar dataKey="ganancia" name="Ganancia" fill={COLOR_COBRE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-tinta">Detalle por línea</h3>
        {data.items.length === 0 ? (
          <p className="text-sm text-secundario">No hay líneas con ganancia en este período.</p>
        ) : (
          <Table
            caption="Detalle de ganancias"
            columns={columnas}
            rows={data.items}
            getRowKey={(row) => `${row.idVenta}-${row.codigo}-${row.fechaHora}`}
          />
        )}
      </section>
    </div>
  )
}

function DashboardInventario({ data }: { data: ReporteInventario }) {
  const porAlerta = useMemo(() => {
    let ok = 0
    let bajo = 0
    let agotado = 0
    for (const item of data.items) {
      if (item.alerta === 'AGOTADO') agotado += 1
      else if (item.alerta === 'BAJO_MINIMO') bajo += 1
      else ok += 1
    }
    return [
      { name: 'OK', value: ok },
      { name: 'Bajo mínimo', value: bajo },
      { name: 'Agotado', value: agotado },
    ].filter((x) => x.value > 0)
  }, [data.items])

  const topValor = useMemo(
    () => [...data.items]
      .sort((a, b) => b.valoracion - a.valoracion)
      .slice(0, 8)
      .map((i) => ({
        codigo: i.codigo,
        valoracion: i.valoracion,
        nombre: i.nombre,
      })),
    [data.items],
  )

  const columnas: Column<ReporteInventario['items'][number]>[] = [
    { key: 'codigo', header: 'Código', cell: (row) => row.codigo },
    { key: 'nombre', header: 'Producto', primary: true, cell: (row) => row.nombre },
    { key: 'stock', header: 'Stock', cell: (row) => formatNumber(row.stockCorte) },
    { key: 'min', header: 'Mínimo', cell: (row) => formatNumber(row.stockMinimo) },
    { key: 'valor', header: 'Valoración', cell: (row) => formatCurrency(row.valoracion) },
    {
      key: 'alerta',
      header: 'Alerta',
      cell: (row) => (
        <Badge variant={row.alerta === 'AGOTADO' ? 'error' : row.alerta === 'BAJO_MINIMO' ? 'warning' : 'success'}>
          {row.alerta || 'OK'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          label="Valoración total"
          value={formatCurrency(data.resumen.valoracionTotal)}
          hint={`Corte ${data.fechaCorte}`}
        />
        <Kpi label="Agotados" value={formatNumber(data.resumen.agotados)} />
        <Kpi label="Bajo mínimo" value={formatNumber(data.resumen.bajoMinimo)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Estado del stock">
          {porAlerta.length === 0 ? (
            <p className="text-sm text-secundario">Sin productos.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={porAlerta} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {porAlerta.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === 'Agotado'
                          ? COLOR_PELIGRO
                          : entry.name === 'Bajo mínimo'
                            ? COLOR_ALERTA
                            : COLOR_OK
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Productos con mayor valoración">
          {topValor.length === 0 ? (
            <p className="text-sm text-secundario">Sin datos.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topValor} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d2d8ce" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="codigo" width={72} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => tooltipMoney(v as number)}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as { nombre?: string; codigo?: string } | undefined
                    return row ? `${row.codigo} — ${row.nombre}` : ''
                  }}
                />
                <Bar dataKey="valoracion" name="Valoración" fill={COLOR_MASCARA} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-tinta">Inventario al corte</h3>
        <Table
          caption="Inventario al corte"
          columns={columnas}
          rows={data.items}
          getRowKey={(row) => row.idProducto}
        />
      </section>
    </div>
  )
}

function DashboardRotacion({ data }: { data: ReporteRotacion }) {
  const demanda = [
    { name: 'Ventas (u)', value: data.demanda.ventasUnidades },
    { name: 'Solicitudes (u)', value: data.demanda.solicitudesUnidades },
  ]

  const inventario = [
    { name: 'Inicial', value: data.rotacion.inventarioInicial },
    { name: 'Final', value: data.rotacion.inventarioFinal },
    { name: 'Promedio', value: data.rotacion.inventarioPromedio },
    { name: 'COGS', value: data.rotacion.cogs },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Rotación"
          value={data.rotacion.valor == null ? (data.rotacion.etiqueta || 'N/A') : String(data.rotacion.valor)}
        />
        <Kpi label="COGS" value={formatCurrency(data.rotacion.cogs)} />
        <Kpi label="Inventario promedio" value={formatCurrency(data.rotacion.inventarioPromedio)} />
        <Kpi
          label="Demanda vendida"
          value={`${formatNumber(data.demanda.ventasUnidades)} u`}
          hint={data.demanda.nota}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Valores de rotación (Bs)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventario}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d2d8ce" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => tooltipMoney(v as number)} />
              <Bar dataKey="value" name="Monto" fill={COLOR_COBRE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Demanda: ventas vs solicitudes">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demanda}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d2d8ce" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatNumber(Number(v))} />
              <Bar dataKey="value" name="Unidades" fill={COLOR_MASCARA} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

export default function Reportes() {
  const [tipo, setTipo] = useState<TipoReporte>('ventas')
  const [desde, setDesde] = useState(hace30Dias())
  const [hasta, setHasta] = useState(hoyIso())
  const [fechaCorte, setFechaCorte] = useState(hoyIso())
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const generar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    setResultado(null)
    try {
      if (tipo === 'ventas') {
        setResultado({ tipo: 'ventas', data: await reporteVentas({ desde, hasta }) })
      } else if (tipo === 'ganancias') {
        setResultado({ tipo: 'ganancias', data: await reporteGanancias({ desde, hasta }) })
      } else if (tipo === 'inventario') {
        setResultado({ tipo: 'inventario', data: await reporteInventario({ fechaCorte }) })
      } else {
        setResultado({ tipo: 'rotacion', data: await reporteRotacion({ desde, hasta }) })
      }
    } catch (err) {
      setError(mensajeError(err, 'No se pudo generar el reporte.'))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-tinta">Reportes</h2>
        <p className="mt-1 text-sm text-secundario">
          Dashboard de ventas, ganancias, inventario y rotación/demanda.
        </p>
      </header>

      <form
        onSubmit={generar}
        className="grid max-w-3xl gap-4 rounded-lg border border-linea bg-superficie p-4 sm:grid-cols-2"
      >
        <Select
          label="Tipo de reporte"
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value as TipoReporte)
            setResultado(null)
          }}
        >
          <option value="ventas">Ventas</option>
          <option value="ganancias">Ganancias</option>
          <option value="inventario">Inventario</option>
          <option value="rotacion">Rotación / más vendidos</option>
        </Select>

        {tipo === 'inventario' ? (
          <Input
            label="Fecha de corte"
            type="date"
            required
            value={fechaCorte}
            onChange={(e) => setFechaCorte(e.target.value)}
          />
        ) : (
          <>
            <Input label="Desde" type="date" required value={desde} onChange={(e) => setDesde(e.target.value)} />
            <Input label="Hasta" type="date" required value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" loading={ocupado}>
            Generar dashboard
          </Button>
        </div>
      </form>

      {error && (
        <Alert variant="error" title="Error al generar">
          {error}
        </Alert>
      )}

      {!resultado && !error && !ocupado && (
        <EmptyState
          icon={ChartBarIcon}
          title="Sin reporte"
          description="Elija el tipo y el rango, luego pulse Generar dashboard."
        />
      )}

      {resultado?.tipo === 'ventas' && <DashboardVentas data={resultado.data} />}
      {resultado?.tipo === 'ganancias' && <DashboardGanancias data={resultado.data} />}
      {resultado?.tipo === 'inventario' && <DashboardInventario data={resultado.data} />}
      {resultado?.tipo === 'rotacion' && <DashboardRotacion data={resultado.data} />}
    </div>
  )
}
