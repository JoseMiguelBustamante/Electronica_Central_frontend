import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowCounterClockwiseIcon, PlusIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import Select from '../components/Select'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import Textarea from '../components/Textarea'
import type { EstadoCarga } from '../hooks/estadoCarga'
import { useToast } from '../hooks/useToast'
import { mensajeError } from '../lib/errors'
import {
  crearDevolucion,
  listarDevoluciones,
  type Devolucion,
} from '../services/devolucionService'
import { listarVentas, obtenerVenta } from '../services/ventaService'
import type { LineaVenta, Venta } from '../types/domain'
import { formatCurrency, formatDateTime } from '../utils/formatters'

export default function Devoluciones() {
  const toast = useToast()
  const [items, setItems] = useState<Devolucion[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    listarDevoluciones({ limite: 50 }).then(
      ({ items: datos }) => {
        if (!vigente) return
        setItems(datos)
        setEstado('listo')
      },
      () => {
        if (vigente) setEstado('error')
      },
    )
    return () => {
      vigente = false
    }
  }, [intento])

  const columnas: Column<Devolucion>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (row) => formatDateTime(row.fechaHora),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      primary: true,
      cell: (row) => row.clienteNombre || '—',
    },
    {
      key: 'motivo',
      header: 'Motivo',
      cell: (row) => row.motivo.replaceAll('_', ' '),
    },
    {
      key: 'reembolso',
      header: 'Reembolso',
      cell: (row) => formatCurrency(row.montoReembolsoTotal),
    },
    {
      key: 'lineas',
      header: 'Líneas',
      cell: (row) =>
        row.detalles.length
          ? row.detalles.map((d) => `${d.resolucion}×${d.cantidad}`).join(', ')
          : '—',
    },
    {
      key: 'venta',
      header: 'Venta',
      cell: (row) => (
        <Badge variant={row.ventaEstado === 'ANULADA' ? 'error' : 'neutral'}>
          {row.ventaEstado || '—'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Devoluciones</h2>
          <p className="mt-1 text-sm text-secundario">
            CU-23: componente defectuoso. Canje si hay stock; si no, reembolso al precio de venta. El
            defectuoso no se vende.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva devolución
        </Button>
      </header>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando devoluciones…">
          <Skeleton className="h-48" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert
          variant="error"
          title="No se pudo cargar las devoluciones"
          action={
            <Button variant="secondary" onClick={recargar}>
              Reintentar
            </Button>
          }
        >
          Se requiere permiso de ventas.
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ArrowCounterClockwiseIcon}
          title="Sin devoluciones"
          description="Registre la primera devolución por producto defectuoso."
        />
      ) : (
        <Table caption="Devoluciones" columns={columnas} rows={items} getRowKey={(r) => r.idDevolucion} />
      )}

      {creando && (
        <FormularioDevolucion
          onClose={() => setCreando(false)}
          onCreated={(dev) => {
            toast.success(
              dev.ventaAnulada
                ? 'Devolución registrada. La venta quedó anulada.'
                : 'Devolución registrada.',
            )
            setCreando(false)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioDevolucion({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (d: Devolucion) => void
}) {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [idVenta, setIdVenta] = useState('')
  const [venta, setVenta] = useState<Venta | null>(null)
  const [cantidades, setCantidades] = useState<Record<string, string>>({})
  const [observacion, setObservacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [cargandoVenta, setCargandoVenta] = useState(false)

  useEffect(() => {
    let vigente = true
    listarVentas({ estado: 'CONFIRMADA', limite: 50 }).then(
      ({ items }) => {
        if (!vigente) return
        setVentas(items.filter((v) => (v.saldo ?? 0) <= 0))
      },
      () => {
        if (vigente) setError('No se pudieron cargar las ventas pagadas.')
      },
    )
    return () => {
      vigente = false
    }
  }, [])

  useEffect(() => {
    if (!idVenta) {
      setVenta(null)
      setCantidades({})
      return
    }
    let vigente = true
    setCargandoVenta(true)
    obtenerVenta(idVenta).then(
      (detalle) => {
        if (!vigente) return
        setVenta(detalle)
        const inicial: Record<string, string> = {}
        for (const linea of detalle.detalles ?? []) {
          inicial[linea.idDetalleVenta] = ''
        }
        setCantidades(inicial)
        setCargandoVenta(false)
      },
      (err) => {
        if (!vigente) return
        setError(mensajeError(err, 'No se pudo cargar la venta.'))
        setCargandoVenta(false)
      },
    )
    return () => {
      vigente = false
    }
  }, [idVenta])

  const lineas = useMemo(() => venta?.detalles ?? [], [venta])

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    if (!idVenta) {
      setError('Elija una venta.')
      return
    }
    const detalles = lineas
      .map((linea) => ({
        idDetalleVenta: linea.idDetalleVenta,
        cantidad: Number(cantidades[linea.idDetalleVenta] || 0),
      }))
      .filter((d) => d.cantidad > 0)

    if (detalles.length === 0) {
      setError('Indique al menos una cantidad a devolver.')
      return
    }

    setOcupado(true)
    setError(null)
    try {
      const creada = await crearDevolucion({
        idVenta,
        observacion: observacion.trim() || undefined,
        detalles,
      })
      onCreated(creada)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo registrar la devolución.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title="Devolución — componente defectuoso"
      onClose={onClose}
      busy={ocupado}
      size="lg"
      footer={
        <Button type="submit" form="form-devolucion" loading={ocupado}>
          Registrar
        </Button>
      }
    >
      <form id="form-devolucion" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Select
          label="Venta pagada"
          name="idVenta"
          required
          value={idVenta}
          onChange={(event) => setIdVenta(event.target.value)}
        >
          <option value="">Seleccione…</option>
          {ventas.map((v) => (
            <option key={v.id} value={v.id}>
              {formatDateTime(v.fechaHora)} · {v.clienteNombre || 'Cliente'} ·{' '}
              {formatCurrency(v.total ?? 0)}
            </option>
          ))}
        </Select>

        {cargandoVenta && <p className="text-sm text-secundario">Cargando líneas…</p>}

        {lineas.length > 0 && (
          <ul className="divide-y divide-linea rounded-lg border border-linea">
            {lineas.map((linea: LineaVenta) => (
              <li key={linea.idDetalleVenta} className="flex flex-wrap items-end gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-tinta">
                    {linea.codigo} · {linea.nombre}
                  </p>
                  <p className="text-xs text-secundario">
                    Vendidos: {linea.cantidad} · {formatCurrency(linea.precioUnitario)} c/u
                  </p>
                </div>
                <Input
                  label="Cant. defectuosa"
                  name={`cant-${linea.idDetalleVenta}`}
                  type="number"
                  min={0}
                  max={linea.cantidad}
                  step="any"
                  className="w-28"
                  value={cantidades[linea.idDetalleVenta] ?? ''}
                  onChange={(event) =>
                    setCantidades((prev) => ({
                      ...prev,
                      [linea.idDetalleVenta]: event.target.value,
                    }))
                  }
                />
              </li>
            ))}
          </ul>
        )}

        <Textarea
          label="Observación"
          name="observacion"
          value={observacion}
          onChange={(event) => setObservacion(event.target.value)}
        />
        <p className="text-xs text-secundario">
          Si hay stock del mismo producto se canjea (sale 1 vendible, el defectuoso no se vende). Si no
          hay stock, se registra reembolso al precio de venta.
        </p>
      </form>
    </Modal>
  )
}
