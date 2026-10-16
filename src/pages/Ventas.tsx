import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { PlusIcon, ReceiptIcon } from '@phosphor-icons/react'
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
import type { EstadoCarga } from '../hooks/estadoCarga'
import { useToast } from '../hooks/useToast'
import { mensajeError } from '../lib/errors'
import { claveIdempotencia } from '../lib/idempotency'
import { listarClientes } from '../services/clienteService'
import { listarInventario } from '../services/inventarioService'
import {
  anularVenta,
  confirmarPago,
  confirmarVenta,
  crearVenta,
  listarPagosVenta,
  listarVentas,
  registrarPagoVenta,
} from '../services/ventaService'
import type { Cliente, ItemInventario, PagoVenta, Venta } from '../types/domain'
import { formatCurrency, formatDateTime } from '../utils/formatters'

export default function Ventas() {
  const toast = useToast()
  const [items, setItems] = useState<Venta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<ItemInventario[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [creando, setCreando] = useState(false)
  const [pagoVenta, setPagoVenta] = useState<Venta | null>(null)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    Promise.all([
      listarVentas({ estado: filtroEstado || undefined, limite: 50 }),
      listarClientes(),
      listarInventario({ limite: 100 }),
    ]).then(
      ([ventas, listaClientes, inv]) => {
        if (!vigente) return
        setItems(ventas.items)
        setClientes(listaClientes)
        setProductos(inv.items)
        setEstado('listo')
      },
      () => {
        if (vigente) setEstado('error')
      },
    )
    return () => {
      vigente = false
    }
  }, [intento, filtroEstado])

  const columnas: Column<Venta>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (row) => (row.fechaHora ? formatDateTime(row.fechaHora) : '—'),
    },
    { key: 'cliente', header: 'Cliente', primary: true, cell: (row) => row.clienteNombre || row.idCliente },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) => <Badge variant={row.estado === 'CONFIRMADA' ? 'success' : 'neutral'}>{row.estado}</Badge>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.estado === 'BORRADOR' && (
            <>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await confirmarVenta(row.id, claveIdempotencia('venta'))
                    toast.success('Venta confirmada.')
                    recargar()
                  } catch (err) {
                    toast.error(mensajeError(err, 'No se pudo confirmar.'))
                  }
                }}
              >
                Confirmar
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  try {
                    await anularVenta(row.id, claveIdempotencia('anular'))
                    toast.success('Venta anulada.')
                    recargar()
                  } catch (err) {
                    toast.error(mensajeError(err, 'No se pudo anular.'))
                  }
                }}
              >
                Anular
              </Button>
            </>
          )}
          {row.estado === 'CONFIRMADA' && (
            <Button variant="secondary" onClick={() => setPagoVenta(row)}>
              Pagos
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Ventas</h2>
          <p className="mt-1 text-sm text-secundario">Borradores, confirmación, anulación y pagos (efectivo/QR).</p>
        </div>
        <Button onClick={() => setCreando(true)} disabled={clientes.length === 0}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva venta
        </Button>
      </header>

      <Select label="Estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
        <option value="">Todos</option>
        <option value="BORRADOR">Borrador</option>
        <option value="CONFIRMADA">Confirmada</option>
        <option value="ANULADA">Anulada</option>
      </Select>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando ventas…">
          <Skeleton className="h-48" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert variant="error" title="No se pudo cargar ventas" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Se requiere permiso VENTAS_GESTIONAR.
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState icon={ReceiptIcon} title="Sin ventas" description="Cree la primera venta." />
      ) : (
        <Table caption="Ventas" columns={columnas} rows={items} getRowKey={(row) => row.id} />
      )}

      {creando && (
        <FormularioVenta
          clientes={clientes}
          productos={productos}
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await crearVenta(datos)
            toast.success('Venta creada en borrador.')
            setCreando(false)
            recargar()
          }}
        />
      )}

      {pagoVenta && (
        <PanelPagos
          venta={pagoVenta}
          onClose={() => setPagoVenta(null)}
          onChanged={() => {
            toast.success('Pago actualizado.')
          }}
        />
      )}
    </div>
  )
}

function FormularioVenta({
  clientes,
  productos,
  onClose,
  onSubmit,
}: {
  clientes: Cliente[]
  productos: ItemInventario[]
  onClose: () => void
  onSubmit: (datos: {
    idCliente: string
    detalles: Array<{ idProducto: string; cantidad: number; precioUnitario?: number }>
  }) => Promise<void>
}) {
  const [idCliente, setIdCliente] = useState(clientes[0]?.id ?? '')
  const [idProducto, setIdProducto] = useState(productos[0]?.idProducto ?? '')
  const [cantidad, setCantidad] = useState('1')
  const [precio, setPrecio] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({
        idCliente,
        detalles: [
          {
            idProducto,
            cantidad: Number(cantidad),
            precioUnitario: precio === '' ? undefined : Number(precio),
          },
        ],
      })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la venta.'))
      setOcupado(false)
    }
  }

  return (
    <Modal title="Nueva venta" onClose={onClose} busy={ocupado} footer={<Button type="submit" form="form-venta" loading={ocupado}>Crear</Button>}>
      <form id="form-venta" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Select label="Cliente" required value={idCliente} onChange={(e) => setIdCliente(e.target.value)}>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
        <Select label="Producto" required value={idProducto} onChange={(e) => setIdProducto(e.target.value)}>
          {productos.map((p) => (
            <option key={p.idProducto} value={p.idProducto}>
              {p.codigo} — stock {p.stockActual}
            </option>
          ))}
        </Select>
        <Input label="Cantidad" type="number" min="0.0001" step="any" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <Input label="Precio unitario (opcional)" type="number" min="0" step="any" value={precio} onChange={(e) => setPrecio(e.target.value)} />
      </form>
    </Modal>
  )
}

function PanelPagos({
  venta,
  onClose,
  onChanged,
}: {
  venta: Venta
  onClose: () => void
  onChanged: () => void
}) {
  const toast = useToast()
  const [pagos, setPagos] = useState<PagoVenta[]>([])
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState<'EFECTIVO' | 'QR'>('EFECTIVO')
  const [referencia, setReferencia] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(() => {
    listarPagosVenta(venta.id).then(setPagos).catch(() => setPagos([]))
  }, [venta.id])

  useEffect(() => {
    cargar()
  }, [cargar])

  const registrar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await registrarPagoVenta(venta.id, {
        monto: Number(monto),
        metodo,
        referenciaExterna: referencia || undefined,
      })
      setMonto('')
      setReferencia('')
      cargar()
      onChanged()
      setOcupado(false)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo registrar el pago.'))
      setOcupado(false)
    }
  }

  return (
    <Modal title={`Pagos — ${venta.clienteNombre || venta.id}`} onClose={onClose} busy={ocupado}>
      <div className="space-y-4">
        {pagos.length === 0 ? (
          <p className="text-sm text-secundario">Sin pagos registrados.</p>
        ) : (
          <ul className="divide-y divide-linea rounded-md border border-linea">
            {pagos.map((pago) => (
              <li key={pago.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span>
                  {formatCurrency(pago.monto)} · {pago.metodo} · {pago.estado}
                </span>
                {pago.estado !== 'CONFIRMADO' && (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await confirmarPago(pago.id, claveIdempotencia('pago'))
                        toast.success('Pago confirmado.')
                        cargar()
                        onChanged()
                      } catch (err) {
                        toast.error(mensajeError(err, 'No se pudo confirmar el pago.'))
                      }
                    }}
                  >
                    Confirmar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={registrar} className="space-y-3 border-t border-linea pt-4">
          {error && <p className="text-sm text-peligro">{error}</p>}
          <Input label="Monto" type="number" min="0.01" step="any" required value={monto} onChange={(e) => setMonto(e.target.value)} />
          <Select label="Método" value={metodo} onChange={(e) => setMetodo(e.target.value as 'EFECTIVO' | 'QR')}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="QR">QR</option>
          </Select>
          {metodo === 'QR' && (
            <Input label="Referencia externa" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
          )}
          <Button type="submit" loading={ocupado}>
            Registrar pago
          </Button>
        </form>
      </div>
    </Modal>
  )
}
