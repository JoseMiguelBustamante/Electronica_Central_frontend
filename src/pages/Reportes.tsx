import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import type { ToastApi } from '../hooks/toastContext'
import { mensajeError } from '../lib/errors'
import { useToast } from '../hooks/useToast'
import { useReconocimientoVoz } from '../hooks/useReconocimientoVoz'
import {
  cambiarModeloIA,
  descargarReporte,
  interpretarReporteVoz,
  obtenerModeloIA,
  preguntarSobreInforme,
  reporteGanancias,
  reporteInventario,
  reporteRotacion,
  reporteVentas,
  type ContextoReporte,
  type PreguntaInformeHistorial,
  type FormatoReporte,
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
      <p className="mt-2 break-words font-mono text-xl font-semibold leading-tight tabular-nums text-tinta sm:text-2xl">{value}</p>
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

/** Última instancia por defecto del navegador: síntesis de voz del resumen. */
const VOZ_PREFERIDAS: Array<{ re: RegExp; en: 'nombre' | 'lang' }> = [
  { re: /google.*esp/i, en: 'nombre' },
  { re: /microsoft.*(natural|online)[^,]*esp/i, en: 'nombre' },
  { re: /esp/i, en: 'nombre' },
  { re: /^es$|^es-/i, en: 'lang' },
]

function elegirVoz(sintesis: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  const voces = sintesis.getVoices()
  for (const { re, en } of VOZ_PREFERIDAS) {
    const voice = voces.find((v) => (en === 'nombre' ? re.test(v.name) : re.test(v.lang)))
    if (voice) return voice
  }
  return undefined
}

/** Fecha en palabras: "23 de noviembre de 2026" — así la voz suena humana. */
function fechaVoz(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Intl.DateTimeFormat('es', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)))
}

/** Monto legible por la voz: "107 bolivianos con 50 centavos" (nunca "Bs 107.50"). */
function dineroVoz(monto: number): string {
  const centavos = Math.round(monto * 100)
  const entero = Math.trunc(centavos / 100)
  const resto = centavos % 100
  return `${entero} bolivianos${resto ? ` con ${resto} centavos` : ''}`
}

const fechaDelResultado = (resultado: Resultado): string | undefined =>
  'periodo' in resultado.data ? resultado.data.periodo.desde : undefined

/** Lee un texto en voz alta con la mejor voz española disponible. */
function decir(frase: string): void {
  const sintesis = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  if (!sintesis) return
  sintesis.cancel()
  const utterance = new SpeechSynthesisUtterance(frase)
  utterance.lang = 'es-419'
  utterance.rate = 1.03
  const voz = elegirVoz(sintesis)
  if (voz) utterance.voice = voz
  sintesis.speak(utterance)
}

/** Serializa el resultado a un informe plano (solo datos, sin componentes). */
function informeParaIa(resultado: Resultado): Record<string, unknown> {
  const base: Record<string, unknown> = { tipo: resultado.tipo }
  const data = resultado.data as unknown as Record<string, unknown>
  if (resultado.tipo === 'rotacion') {
    const r = data.rotacion as Record<string, unknown>
    const d = data.demanda as Record<string, unknown>
    return {
      ...base,
      periodo: data.periodo,
      resumen: { ...r, ...d },
    }
  }
  if (resultado.tipo === 'inventario') {
    return {
      ...base,
      fechaCorte: data.fechaCorte,
      resumen: data.resumen,
      items: (data.items as unknown[]).slice(0, 60),
    }
  }
  return {
    ...base,
    periodo: data.periodo,
    resumen: data.resumen,
    items: (data.items as unknown[]).slice(0, 60),
  }
}

function pronunciarResumen(resultado: Resultado, prefijo?: string): void {
  const sintesis = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  if (!sintesis) return
  let frase: string
  if (resultado.tipo === 'ventas') {
    const r = resultado.data.resumen
    const desde = fechaDelResultado(resultado)
    const periodo = desde ? ` Entre ${fechaVoz(desde)} y ${fechaVoz(resultado.data.periodo.hasta)}.` : ''
    frase = `Reporte de ventas listo.${periodo} Vendieron ${dineroVoz(r.vendido)} y se cobró ${dineroVoz(r.cobrado)}, en ${resultado.data.items.length} ventas.`
  } else if (resultado.tipo === 'ganancias') {
    frase = `Ganancia bruta: ${dineroVoz(resultado.data.resumen.gananciaBruta)}, en ${resultado.data.items.length} líneas de venta.`
  } else if (resultado.tipo === 'inventario') {
    const r = resultado.data.resumen
    frase = `Inventario valorado en ${dineroVoz(r.valoracionTotal)}. Hay ${r.agotados === 0 ? 'ningún producto agotado' : `${r.agotados} agotados`} y ${r.bajoMinimo} bajo mínimo.`
  } else {
    const d = resultado.data
    const rotacion = d.rotacion.etiqueta ?? (d.rotacion.valor !== null ? `${d.rotacion.valor} veces` : 'no aplicable')
    frase = `Rotación de inventario: ${rotacion}. Ventas de ${d.demanda.ventasUnidades} unidades, con ${d.demanda.solicitudesUnidades} solicitudes de pedido.`
  }
  decir(prefijo ? `${prefijo} ${frase}` : frase)
}

const MODELOS_IA = ['glm5.3-flash', 'deepseek-v4-flash'] as const

/** Selector del modelo IA para el intérprete de voz: cambia en caliente (PUT). */
function ModeloSelector({ toast }: { toast: ToastApi }) {
  const [modelo, setModelo] = useState<string>('')
  const [origen, setOrigen] = useState<'bd' | 'env'>('env')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vivo = true
    obtenerModeloIA()
      .then((m) => {
        if (!vivo) return
        setModelo(m.modelo)
        setOrigen(m.origen)
      })
      .catch(() => {}) // el selector se oculta si el backend viejo no lo tiene
      .finally(() => {
        if (vivo) setCargando(false)
      })
    return () => { vivo = false }
  }, [])

  const cambiar = async (nuevo: string) => {
    if (!nuevo || nuevo === modelo) return
    setGuardando(true)
    try {
      const resp = await cambiarModeloIA(nuevo)
      setModelo(resp.modelo)
      setOrigen(resp.origen)
      toast.success(`Modelo IA ahora: ${resp.modelo}`)
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo cambiar el modelo.'))
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return null
  return (
    <Select
      label="Modelo IA"
      value={modelo}
      disabled={guardando}
      onChange={(e) => { void cambiar(e.target.value) }}
      title={origen === 'bd' ? 'Configurado en la base: aplica al instante' : 'Default del servidor (env)'}
      className="max-w-48"
    >
      {MODELOS_IA.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </Select>
  )
}

interface PreguntasInformeProps {
  resultado: Resultado
  toast: ToastApi
}

/** Fase 2 de la conversación: preguntas libres ancladas al informe generado. */
function PreguntasInforme({ resultado, toast }: PreguntasInformeProps) {
  const [pregunta, setPregunta] = useState('')
  const [respuesta, setRespuesta] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [historial, setHistorial] = useState<PreguntaInformeHistorial[]>([])
  const informe = useMemo(() => informeParaIa(resultado), [resultado])

  const preguntar = useCallback(async (texto: string) => {
    const limpio = texto.trim()
    if (limpio.length < 3) return
    setEnviando(true)
    setRespuesta(null)
    try {
      const r = await preguntarSobreInforme(limpio, informe, historial)
      setRespuesta(r.respuesta)
      setHistorial((h) => [...h, { pregunta: limpio, respuesta: r.respuesta }].slice(-5))
      decir(r.respuesta)
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo responder la pregunta.'))
    } finally {
      setEnviando(false)
    }
  }, [informe, historial, toast])

  const voz = useReconocimientoVoz({
    onFinal: (texto) => { void preguntar(texto) },
    onError: (mensaje) => { if (mensaje) toast.error(mensaje) },
  })

  return (
    <section className="mt-4 rounded-lg border border-linea bg-superficie p-4">
      <h3 className="text-sm font-semibold text-tinta">Preguntá sobre este informe</h3>
      <p className="mt-1 text-xs text-secundario">
        La IA responde solo con los datos del informe en pantalla: «¿cuál fue la venta más cara?»,
        «¿qué producto dejó más ganancia?», «¿cuántos vendió el vendedor admin?».
      </p>
      <form
        className="mt-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => { e.preventDefault(); void preguntar(pregunta) }}
      >
        <input
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="Escribí o dictá tu pregunta…"
          maxLength={500}
          className="min-w-0 flex-1 rounded-md border border-linea bg-superficie px-3 py-2 text-sm text-tinta"
        />
        <Button type="submit" loading={enviando}>Preguntar</Button>
        {voz.soportado && (
          <Button
            type="button"
            variant={voz.estado === 'escuchando' ? 'danger' : 'secondary'}
            className={voz.estado === 'escuchando' ? 'animate-pulse' : undefined}
            onClick={() => (voz.estado === 'inactivo' ? voz.iniciar() : voz.detener())}
          >
            {voz.estado === 'escuchando' ? 'Escuchando…' : 'Dictar pregunta'}
          </Button>
        )}
      </form>
      {voz.estado === 'escuchando' && (
        <p className="mt-2 text-xs italic text-peligro">
          {voz.parcial ? `«${voz.parcial}»` : 'Estoy escuchando tu pregunta…'}
        </p>
      )}
      {respuesta && (
        <p className="mt-3 rounded-md bg-suave px-3 py-2 text-sm text-tinta" aria-live="polite">
          {respuesta}
        </p>
      )}
      {historial.length > 1 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-secundario">
            Preguntas anteriores ({historial.length - 1})
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-secundario">
            {historial.slice(0, -1).map((h, i) => (
              <li key={`${h.pregunta}-${i}`}>«{h.pregunta}» — {h.respuesta}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
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
  const [exportando, setExportando] = useState<FormatoReporte | null>(null)
  const [rangoExport, setRangoExport] = useState<{
    tipo: TipoReporte
    desde: string
    hasta: string
    fechaCorte: string
  } | null>(null)
  const toast = useToast()
  // Nivel 2: turnos previos del dictado (máx 5) que viajan al intérprete.
  const historialRef = useRef<ContextoReporte[]>([])

  const generar = async (event: FormEvent) => {
    event.preventDefault()
    await ejecutarReporte(tipo, desde, hasta, fechaCorte)
  }

  /* Shared engine for form submit and voice flow: one place for state updates. */
  const ejecutarReporte = async (
    tipoPedido: TipoReporte,
    desdePedido: string,
    hastaPedido: string,
    fechaCortePedido: string,
    hablar = true,
  ): Promise<Resultado | null> => {
    setTipo(tipoPedido)
    setDesde(desdePedido)
    setHasta(hastaPedido)
    setFechaCorte(fechaCortePedido)
    setOcupado(true)
    setError(null)
    setResultado(null)
    try {
      const nuevo: Resultado =
        tipoPedido === 'ventas'
          ? { tipo: 'ventas', data: await reporteVentas({ desde: desdePedido, hasta: hastaPedido }) }
          : tipoPedido === 'ganancias'
            ? { tipo: 'ganancias', data: await reporteGanancias({ desde: desdePedido, hasta: hastaPedido }) }
            : tipoPedido === 'inventario'
              ? { tipo: 'inventario', data: await reporteInventario({ fechaCorte: fechaCortePedido }) }
              : { tipo: 'rotacion', data: await reporteRotacion({ desde: desdePedido, hasta: hastaPedido }) }
      setResultado(nuevo)
      setRangoExport({ tipo: tipoPedido, desde: desdePedido, hasta: hastaPedido, fechaCorte: fechaCortePedido })
      if (hablar) pronunciarResumen(nuevo)
      return nuevo
    } catch (err) {
      setError(mensajeError(err, 'No se pudo generar el reporte.'))
      return null
    } finally {
      setOcupado(false)
    }
  }

  /* Voz → interpretación IA → ejecutarReporte (S1/S3/S6/S7/S10/S11) */
  const procesarOrdenDeVoz = async (texto: string) => {
    try {
      // Conversación sin estado: el último reporte (contexto) y los turnos
      // anteriores (historial) viajan con el pedido para resolver
      // "el mes anterior", "volvé al de antes", "ese mismo tipo"…
      const contexto = rangoExport
        ? { tipo: rangoExport.tipo, desde: rangoExport.desde, hasta: rangoExport.hasta, fechaCorte: rangoExport.fechaCorte || undefined }
        : undefined
      const interpretado = await interpretarReporteVoz(texto, contexto, historialRef.current)
      const pedidos = interpretado.reportes?.length
        ? interpretado.reportes
        : [{ tipo: interpretado.tipo, desde: interpretado.desde, hasta: interpretado.hasta, fechaCorte: interpretado.fechaCorte }]
      // Nivel 2: varios reportes en una frase → se generan en secuencia sin
      // hablar en cada uno; al final se pronuncia un resumen corto.
      const generados: string[] = []
      let ultimo: Resultado | null = null
      for (const pedido of pedidos) {
        const tipoPedido = pedido.tipo as TipoReporte
        const fechaCortePedido = pedido.fechaCorte ?? hoyIso()
        const ok = await ejecutarReporte(tipoPedido, pedido.desde, pedido.hasta, fechaCortePedido, false)
        if (ok) {
          generados.push(tipoPedido)
          ultimo = ok
        }
      }
      if (generados.length === 0) {
        toast.error('No se pudo generar el reporte pedido.')
      } else {
        // Confirmación hablada de lo entendido + resumen del último generado.
        if (ultimo) {
          const prefijo = generados.length > 1
            ? `Generé ${generados.length} reportes. Te leo el último.`
            : undefined
          pronunciarResumen(ultimo, prefijo)
        }
        toast.success(
          generados.length > 1
            ? `Generé ${generados.length} reportes por voz.`
            : 'Reporte por voz generado.',
        )
        historialRef.current = [
          ...historialRef.current,
          ...pedidos.map((p) => ({ tipo: p.tipo, desde: p.desde, hasta: p.hasta, fechaCorte: p.fechaCorte })),
        ].slice(-5)
      }
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo procesar el comando de voz.'))
    } finally {
      // Siempre liberar el micrófono: sin esto el botón queda 'Procesando…' para siempre.
      voz.reset()
    }
  }

  const voz = useReconocimientoVoz({
    onFinal: (texto) => { void procesarOrdenDeVoz(texto) },
    onError: (mensaje) => { if (mensaje) toast.error(mensaje) },
  })

  const descargar = async (formato: FormatoReporte) => {
    if (!rangoExport) return
    setExportando(formato)
    try {
      const { tipo, desde, hasta, fechaCorte } = rangoExport
      if (tipo === 'inventario') {
        await descargarReporte({ tipo, fechaCorte, formato })
      } else {
        await descargarReporte({ tipo, desde, hasta, formato })
      }
      toast.success(`Reporte ${formato.toUpperCase()} descargado.`)
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo descargar el reporte.'))
    } finally {
      setExportando(null)
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
            setRangoExport(null)
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

        <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
          <Button type="submit" loading={ocupado}>
            Generar dashboard
          </Button>
          {voz.soportado && (
            <Button
              type="button"
              variant={voz.estado === 'escuchando' ? 'danger' : 'secondary'}
              loading={voz.estado === 'procesando'}
              onClick={() => (voz.estado === 'inactivo' ? voz.iniciar() : voz.detener())}
              className={voz.estado === 'escuchando' ? 'animate-pulse' : undefined}
              title={voz.estado === 'escuchando' ? 'Tocá para cancelar el dictado' : undefined}
            >
              {voz.estado === 'escuchando' ? (
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 animate-pulse rounded-full"
                    style={{ backgroundColor: COLOR_PELIGRO }}
                  />
                  Escuchando… (tocá para cancelar)
                </span>
              ) : voz.estado === 'procesando' ? (
                'Procesando…'
              ) : (
                'Dictar reporte'
              )}
            </Button>
          )}
        </div>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-3 border-t border-linea pt-3">
          <ModeloSelector toast={toast} />
          <span className="text-xs text-secundario">
            Cambia al instante, sin reiniciar: aplica al dictado por voz.
          </span>
        </div>
      </form>

      {voz.estado === 'escuchando' && (
        <div className="flex items-center gap-3 rounded-lg border border-peligro bg-peligro-suave px-4 py-3 text-sm text-peligro">
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 animate-pulse rounded-full"
            style={{ backgroundColor: COLOR_PELIGRO }}
          />
          <div className="min-w-0 flex-1">
            <span>
              <strong>Estoy escuchando…</strong> decí tu reporte, por ejemplo:
              «ventas de esta semana», «inventario de hoy» o «ganancias de este mes».
            </span>
            {voz.parcial && (
              <p className="mt-1 truncate italic text-peligro/80" aria-live="polite">
                «{voz.parcial}»
              </p>
            )}
          </div>
        </div>
      )}

      {rangoExport && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-linea bg-superficie p-3">
          <span className="text-sm font-medium text-tinta">Exportar:</span>
          <Button
            variant="secondary"
            loading={exportando === 'pdf'}
            disabled={exportando !== null && exportando !== 'pdf'}
            onClick={() => descargar('pdf')}
          >
            PDF
          </Button>
          <Button
            variant="secondary"
            loading={exportando === 'xlsx'}
            disabled={exportando !== null && exportando !== 'xlsx'}
            onClick={() => descargar('xlsx')}
          >
            Excel (xlsx)
          </Button>
          <Button
            variant="secondary"
            loading={exportando === 'csv'}
            disabled={exportando !== null && exportando !== 'csv'}
            onClick={() => descargar('csv')}
          >
            CSV
          </Button>
        </div>
      )}

      {voz.estado === 'procesando' && voz.parcial && (
        <div className="flex items-center gap-3 rounded-lg border border-linea bg-suave px-4 py-3 text-sm text-tinta">
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 animate-pulse rounded-full"
            style={{ backgroundColor: COLOR_MASCARA }}
          />
          <span className="min-w-0 flex-1 truncate" aria-live="polite">
            Reconocido: <strong>«{voz.parcial}»</strong> — interpretando con IA…
          </span>
        </div>
      )}

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

      {resultado && <PreguntasInforme resultado={resultado} toast={toast} />}

      {resultado?.tipo === 'ventas' && <DashboardVentas data={resultado.data} />}
      {resultado?.tipo === 'ganancias' && <DashboardGanancias data={resultado.data} />}
      {resultado?.tipo === 'inventario' && <DashboardInventario data={resultado.data} />}
      {resultado?.tipo === 'rotacion' && <DashboardRotacion data={resultado.data} />}
    </div>
  )
}
