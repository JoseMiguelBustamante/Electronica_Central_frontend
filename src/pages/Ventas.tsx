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
import { listarProductosAdmin } from '../services/catalogoService'
import { listarClientes } from '../services/clienteService'
import {
  anularVenta,
  confirmarPago,
  confirmarVenta,
  crearPagoEnLinea,
  crearVenta,
  listarPagosVenta,
  listarVentas,
  registrarPagoVenta,
} from '../services/ventaService'
import { ROUTES } from '../utils/navigation'
import type { Cliente, PagoVenta, ProductoAdmin, Venta } from '../types/domain'
import { formatCurrency, formatDateTime } from '../utils/formatters'

export default function Ventas() {
  const toast = useToast()
  const [items, setItems] = useState<Venta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<ProductoAdmin[]>([])
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
      listarProductosAdmin({ estado: 'activos', limite: 200 }),
    ]).then(
      ([ventas, listaClientes, catalogo]) => {
        if (!vigente) return
        setItems(ventas.items)
        setClientes(listaClientes)
        setProductos(catalogo.productos.filter((p) => p.stockActual > 0))
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
      key: 'saldo',
      header: 'Saldo',
      cell: (row) => {
        if (row.estado !== 'CONFIRMADA') return '—'
        const saldo = Number(row.saldo ?? 0)
        return (
          <span className={saldo === 0 ? 'text-disponible' : 'text-tinta'}>
            {formatCurrency(saldo)}
            {saldo === 0 ? ' · pagada' : ''}
          </span>
        )
      },
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
                    toast.success('Venta confirmada (stock reservado). Ahora cobrá en Pagos.')
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
          {row.estado === 'CONFIRMADA' && Number(row.saldo ?? 0) > 0 && (
            <Button variant="secondary" onClick={() => setPagoVenta(row)}>
              Cobrar
            </Button>
          )}
          {row.estado === 'CONFIRMADA' && Number(row.saldo ?? 0) === 0 && (
            <Button variant="secondary" onClick={() => setPagoVenta(row)}>
              Ver pagos
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
          <p className="mt-1 text-sm text-secundario">
            Cliente → producto (precio de catálogo) → confirmar → cobrar (efectivo / Stripe).
          </p>
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
          onClose={() => {
            setPagoVenta(null)
            recargar()
          }}
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
  productos: ProductoAdmin[]
  onClose: () => void
  onSubmit: (datos: {
    idCliente: string
    detalles: Array<{ idProducto: string; cantidad: number }>
  }) => Promise<void>
}) {
  const [idCliente, setIdCliente] = useState(clientes[0]?.id ?? '')
  const [idProducto, setIdProducto] = useState(productos[0]?.id ?? '')
  const [cantidad, setCantidad] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const producto = productos.find((p) => p.id === idProducto)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({
        idCliente,
        detalles: [{ idProducto, cantidad: Number(cantidad) }],
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
            <option key={p.id} value={p.id}>
              {p.codigo} — {p.nombre} (stock {p.stockActual})
            </option>
          ))}
        </Select>
        <Input label="Cantidad" type="number" min="0.0001" step="any" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <p className="rounded-md border border-linea bg-suave px-3 py-2 text-sm text-secundario">
          Precio unitario (catálogo):{' '}
          <span className="font-mono font-semibold text-tinta">
            {producto ? formatCurrency(producto.precioVenta) : '—'}
          </span>
          . No se edita aquí; sale de la base de datos.
        </p>
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
  const [metodo, setMetodo] = useState<'EFECTIVO' | 'EN_LINEA'>('EFECTIVO')
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const saldo = Number(venta.saldo ?? 0)
  const yaPagada = saldo <= 0

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
    setCheckoutUrl(null)
    try {
      if (metodo === 'EN_LINEA') {
        const origin = window.location.origin
        const result = await crearPagoEnLinea(venta.id, {
          monto: monto ? Number(monto) : undefined,
          successUrl: `${origin}${ROUTES.pagosExito}?desde=ventas`,
          cancelUrl: `${origin}${ROUTES.pagosCancelado}?desde=ventas`,
        })
        setCheckoutUrl(result.urlPago)
        toast.success('Link de pago listo. Abrí Checkout o mostrá el QR.')
        cargar()
        onChanged()
      } else {
        await registrarPagoVenta(venta.id, {
          monto: Number(monto),
          metodo: 'EFECTIVO',
        })
        setMonto('')
        cargar()
        onChanged()
      }
      setOcupado(false)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo registrar el pago.'))
      setOcupado(false)
    }
  }

  return (
    <Modal title={`Pagos — ${venta.clienteNombre || venta.id}`} onClose={onClose} busy={ocupado}>
      <div className="space-y-4">
        <p className="text-sm text-secundario">
          Total {formatCurrency(Number(venta.total ?? 0))} · Cobrado {formatCurrency(Number(venta.cobrado ?? 0))} · Saldo{' '}
          <strong className="text-tinta">{formatCurrency(saldo)}</strong>
        </p>

        {pagos.length === 0 ? (
          <p className="text-sm text-secundario">Sin pagos registrados.</p>
        ) : (
          <ul className="divide-y divide-linea rounded-md border border-linea">
            {pagos.map((pago) => (
              <li key={pago.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span>
                  {formatCurrency(pago.monto)} · {pago.metodo} · {pago.estado}
                </span>
                {pago.estado === 'PENDIENTE' && pago.metodo !== 'EN_LINEA' && (
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

        {yaPagada ? (
          <Alert variant="success" title="Venta pagada">
            No hay saldo pendiente. No se pueden generar más cobros.
          </Alert>
        ) : (
          <form onSubmit={registrar} className="space-y-3 border-t border-linea pt-4">
            {error && <p className="text-sm text-peligro">{error}</p>}
            <Input
              label={metodo === 'EN_LINEA' ? 'Monto (vacío = saldo completo)' : 'Monto'}
              type="number"
              min="0.01"
              step="any"
              required={metodo === 'EFECTIVO'}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
            <Select label="Método" value={metodo} onChange={(e) => setMetodo(e.target.value as 'EFECTIVO' | 'EN_LINEA')}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="EN_LINEA">Tarjeta / QR (Stripe test)</option>
            </Select>
            <Button type="submit" loading={ocupado}>
              {metodo === 'EN_LINEA' ? 'Generar link Stripe' : 'Registrar pago'}
            </Button>
          </form>
        )}

        {checkoutUrl && (
          <div className="space-y-3 rounded-md border border-linea bg-suave p-3">
            <p className="text-sm text-tinta">Link de pago (modo test). El webhook confirma automáticamente.</p>
            <img
              alt="QR Stripe Checkout"
              className="mx-auto size-44 rounded-md bg-white p-2"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(checkoutUrl)}`}
            />
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="block break-all text-sm text-mascara underline"
            >
              {checkoutUrl}
            </a>
            <Button onClick={() => { window.location.assign(checkoutUrl) }}>
              Abrir Checkout
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
