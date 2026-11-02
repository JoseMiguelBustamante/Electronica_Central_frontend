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
  crearPagoEnLinea,
  crearVenta,
  descargarComprobantePdf,
  listarPagosVenta,
  listarVentas,
  obtenerVenta,
  registrarPagoVenta,
} from '../services/ventaService'
import { ROUTES } from '../utils/navigation'
import { FOCUS_RING } from '../utils/styles'
import type { Cliente, PagoVenta, ProductoAdmin, Venta } from '../types/domain'
import { formatCurrency, formatDateTime } from '../utils/formatters'

export default function Ventas() {
  const toast = useToast()
  const [items, setItems] = useState<Venta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [creando, setCreando] = useState(false)
  const [pagoVenta, setPagoVenta] = useState<Venta | null>(null)
  const [detalleVentaId, setDetalleVentaId] = useState<string | null>(null)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    Promise.all([
      listarVentas({ estado: filtroEstado || undefined, limite: 50 }),
      listarClientes(),
    ]).then(
      ([ventas, listaClientes]) => {
        if (!vigente) return
        setItems(ventas.items)
        // Cliente Mostrador primero para venta rápida en mostrador.
        const ordenados = [...listaClientes].sort((a, b) => {
          const aMostrador = /mostrador/i.test(a.nombre) ? 0 : 1
          const bMostrador = /mostrador/i.test(b.nombre) ? 0 : 1
          if (aMostrador !== bMostrador) return aMostrador - bMostrador
          return a.nombre.localeCompare(b.nombre, 'es')
        })
        setClientes(ordenados)
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
      key: 'productos',
      header: 'Productos',
      cell: (row) => (
        <span className="line-clamp-2 max-w-xs text-sm text-secundario" title={row.resumenProductos || undefined}>
          {row.resumenProductos || '—'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) => {
        if (row.estado === 'CONFIRMADA' && Number(row.saldo ?? 0) === 0) {
          return <Badge variant="success">Pagada</Badge>
        }
        if (row.estado === 'CONFIRMADA') {
          return <Badge variant="warning">Por completar pago</Badge>
        }
        if (row.estado === 'BORRADOR') {
          return <Badge variant="neutral">Por cobrar</Badge>
        }
        return <Badge variant="neutral">{row.estado}</Badge>
      },
    },
    {
      key: 'total',
      header: 'Total',
      cell: (row) => (
        <span className="font-mono text-tinta">{formatCurrency(Number(row.total ?? 0))}</span>
      ),
    },
    {
      key: 'saldo',
      header: 'Saldo',
      cell: (row) => {
        if (row.estado === 'ANULADA') return '—'
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
          <Button variant="secondary" onClick={() => setDetalleVentaId(row.id)}>
            Detalle
          </Button>
          {row.estado === 'BORRADOR' && (
            <>
              <Button variant="secondary" onClick={() => setPagoVenta(row)}>
                Cobrar
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
            Cliente en tienda → producto → cobrar. Stripe confirma sola; efectivo confirma al registrar el pago.
          </p>
        </div>
        <Button onClick={() => setCreando(true)} disabled={clientes.length === 0}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva venta
        </Button>
      </header>

      <Select label="Estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
        <option value="">Todos</option>
        <option value="BORRADOR">Por cobrar</option>
        <option value="CONFIRMADA">Confirmada / pagada</option>
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
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            const creada = await crearVenta(datos)
            toast.success('Venta lista. Cobrá con efectivo o Stripe.')
            setCreando(false)
            setPagoVenta({
              ...creada,
              clienteNombre:
                creada.clienteNombre
                || clientes.find((c) => c.id === datos.idCliente)?.nombre
                || '',
            })
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
            recargar()
          }}
        />
      )}

      {detalleVentaId && (
        <PanelDetalleVenta
          idVenta={detalleVentaId}
          onClose={() => setDetalleVentaId(null)}
        />
      )}
    </div>
  )
}

function PanelDetalleVenta({
  idVenta,
  onClose,
}: {
  idVenta: string
  onClose: () => void
}) {
  const toast = useToast()
  const [venta, setVenta] = useState<Venta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [descargando, setDescargando] = useState(false)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    obtenerVenta(idVenta).then(
      (data) => {
        if (!vigente) return
        setVenta(data)
        setCargando(false)
      },
      (err) => {
        if (!vigente) return
        setError(mensajeError(err, 'No se pudo cargar el detalle.'))
        setCargando(false)
      },
    )
    return () => {
      vigente = false
    }
  }, [idVenta])

  const puedePdf = Boolean(
    venta
    && (venta.estado === 'CONFIRMADA' || venta.estado === 'ANULADA')
    && (venta.comprobante?.numero || venta.numeroComprobante),
  )

  return (
    <Modal
      title={venta?.numeroComprobante || venta?.comprobante?.numero
        ? `Comprobante ${venta.numeroComprobante || venta.comprobante?.numero}`
        : 'Detalle de venta'}
      onClose={onClose}
      busy={cargando || descargando}
      footer={puedePdf ? (
        <Button
          variant="secondary"
          loading={descargando}
          onClick={async () => {
            setDescargando(true)
            try {
              await descargarComprobantePdf(idVenta)
              toast.success('PDF descargado.')
            } catch (err) {
              toast.error(mensajeError(err, 'No se pudo descargar el PDF.'))
            } finally {
              setDescargando(false)
            }
          }}
        >
          Descargar PDF
        </Button>
      ) : undefined}
    >
      {cargando ? (
        <LoadingState label="Cargando detalle…">
          <Skeleton className="h-40" />
        </LoadingState>
      ) : error ? (
        <Alert variant="error" title="Error">{error}</Alert>
      ) : venta ? (
        <div className="space-y-4 text-sm">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-secundario">Fecha</dt>
              <dd className="text-tinta">{venta.fechaHora ? formatDateTime(venta.fechaHora) : '—'}</dd>
            </div>
            <div>
              <dt className="text-secundario">Estado</dt>
              <dd className="text-tinta">{venta.estado}</dd>
            </div>
            <div>
              <dt className="text-secundario">Cliente</dt>
              <dd className="text-tinta">
                {venta.clienteNombre}
                {venta.clienteDocumento ? ` · ${venta.clienteDocumento}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-secundario">N.º interno</dt>
              <dd className="font-mono text-xs text-secundario">{venta.id}</dd>
            </div>
          </dl>

          <div className="overflow-x-auto rounded-md border border-linea">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Líneas de la venta</caption>
              <thead className="bg-suave text-secundario">
                <tr>
                  <th className="px-3 py-2 font-medium">Código</th>
                  <th className="px-3 py-2 font-medium">Producto</th>
                  <th className="px-3 py-2 font-medium text-right">Cant.</th>
                  <th className="px-3 py-2 font-medium text-right">P. unit.</th>
                  <th className="px-3 py-2 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {(venta.detalles ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-3 text-secundario">Sin líneas.</td>
                  </tr>
                ) : (
                  venta.detalles!.map((linea) => (
                    <tr key={linea.idDetalleVenta || `${linea.idProducto}-${linea.codigo}`}>
                      <td className="px-3 py-2 font-mono text-xs">{linea.codigo}</td>
                      <td className="px-3 py-2 text-tinta">{linea.nombre}</td>
                      <td className="px-3 py-2 text-right font-mono">{linea.cantidad}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatCurrency(linea.precioUnitario)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatCurrency(linea.subtotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <dl className="grid gap-1 border-t border-linea pt-3 sm:grid-cols-3">
            <div>
              <dt className="text-secundario">Total</dt>
              <dd className="font-mono font-semibold text-tinta">{formatCurrency(Number(venta.total ?? 0))}</dd>
            </div>
            <div>
              <dt className="text-secundario">Cobrado</dt>
              <dd className="font-mono text-tinta">{formatCurrency(Number(venta.cobrado ?? 0))}</dd>
            </div>
            <div>
              <dt className="text-secundario">Saldo</dt>
              <dd className="font-mono text-tinta">{formatCurrency(Number(venta.saldo ?? 0))}</dd>
            </div>
          </dl>

          <div>
            <p className="mb-2 font-medium text-tinta">Pagos</p>
            {(venta.pagos ?? []).length === 0 ? (
              <p className="text-secundario">Sin pagos registrados.</p>
            ) : (
              <ul className="divide-y divide-linea rounded-md border border-linea">
                {venta.pagos!.map((pago) => (
                  <li key={pago.id} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                    <span>
                      {formatCurrency(pago.monto)} · {pago.metodo} · {pago.estado}
                    </span>
                    <span className="text-xs text-secundario">
                      {pago.fechaHora ? formatDateTime(pago.fechaHora) : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

function FormularioVenta({
  clientes,
  onClose,
  onSubmit,
}: {
  clientes: Cliente[]
  onClose: () => void
  onSubmit: (datos: {
    idCliente: string
    detalles: Array<{ idProducto: string; cantidad: number }>
  }) => Promise<void>
}) {
  const mostrador = clientes.find((c) => /mostrador/i.test(c.nombre))
  const [idCliente, setIdCliente] = useState(mostrador?.id ?? clientes[0]?.id ?? '')
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<ProductoAdmin[]>([])
  const [buscando, setBuscando] = useState(false)
  const [producto, setProducto] = useState<ProductoAdmin | null>(null)
  const [cantidad, setCantidad] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    const texto = busqueda.trim()
    if (texto.length < 2) {
      setResultados([])
      return
    }
    let vigente = true
    const temporizador = window.setTimeout(() => {
      setBuscando(true)
      listarProductosAdmin({ buscar: texto, estado: 'activos', limite: 15 })
        .then(
          (resultado) => {
            if (!vigente) return
            setResultados(resultado.productos)
          },
          () => {
            if (vigente) setResultados([])
          },
        )
        .finally(() => {
          if (vigente) setBuscando(false)
        })
    }, 280)
    return () => {
      vigente = false
      window.clearTimeout(temporizador)
    }
  }, [busqueda])

  const qty = Number(cantidad)
  const stock = Number(producto?.stockActual ?? 0)
  const precio = Number(producto?.precioVenta ?? 0)
  const totalLinea = Number.isFinite(qty) && qty > 0 ? qty * precio : 0
  const sinStock = Boolean(producto) && stock <= 0
  const excedeStock = Boolean(producto) && Number.isFinite(qty) && qty > stock
  const puedeCrear = Boolean(producto) && !sinStock && !excedeStock && qty > 0

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    if (!producto) {
      setError('Buscá y elegí un producto.')
      return
    }
    if (sinStock) {
      setError('Ese producto no tiene stock disponible.')
      return
    }
    if (excedeStock) {
      setError(`La cantidad supera el stock (${stock}).`)
      return
    }
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({
        idCliente,
        detalles: [{ idProducto: producto.id, cantidad: qty }],
      })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la venta.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title="Nueva venta"
      onClose={onClose}
      busy={ocupado}
      footer={(
        <Button type="submit" form="form-venta" loading={ocupado} disabled={!puedeCrear}>
          Crear y cobrar
        </Button>
      )}
    >
      <form id="form-venta" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}

        <Select label="Cliente" required value={idCliente} onChange={(e) => setIdCliente(e.target.value)}>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
              {c.documento ? ` · ${c.documento}` : ''}
              {/mostrador/i.test(c.nombre) ? ' (venta rápida)' : ''}
            </option>
          ))}
        </Select>

        <div className="space-y-2">
          <Input
            label="Buscar producto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Código o nombre (mín. 2 letras)"
            autoComplete="off"
          />
          {busqueda.trim().length >= 2 && (
            <ul className="max-h-48 overflow-y-auto rounded-md border border-linea bg-superficie">
              {buscando && <li className="px-3 py-2 text-sm text-secundario">Buscando…</li>}
              {!buscando && resultados.length === 0 && (
                <li className="px-3 py-2 text-sm text-secundario">Sin resultados.</li>
              )}
              {!buscando && resultados.map((p) => {
                const agotado = p.stockActual <= 0
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={agotado}
                      onClick={() => {
                        setProducto(p)
                        setBusqueda('')
                        setResultados([])
                        setCantidad('1')
                      }}
                      className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-suave disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
                    >
                      <span className="font-medium text-tinta">{p.codigo} — {p.nombre}</span>
                      <span className="font-mono text-xs text-secundario">
                        {formatCurrency(p.precioVenta)} · stock {p.stockActual}
                        {agotado ? ' · sin stock' : ''}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {producto ? (
          <div className="space-y-3 rounded-md border border-linea bg-suave p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-tinta">{producto.codigo}</p>
                <p className="text-sm text-secundario">{producto.nombre}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setProducto(null)
                  setCantidad('1')
                }}
              >
                Cambiar
              </Button>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-secundario">Precio</dt>
                <dd className="font-mono font-semibold text-tinta">{formatCurrency(precio)}</dd>
              </div>
              <div>
                <dt className="text-secundario">Stock</dt>
                <dd className={`font-mono font-semibold ${stock <= 0 ? 'text-peligro' : 'text-tinta'}`}>{stock}</dd>
              </div>
              <div>
                <dt className="text-secundario">Total línea</dt>
                <dd className="font-mono font-semibold text-cobre">{formatCurrency(totalLinea)}</dd>
              </div>
            </dl>
            <Input
              label="Cantidad"
              type="number"
              min="1"
              max={stock > 0 ? String(stock) : undefined}
              step="1"
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              error={excedeStock ? `Máximo disponible: ${stock}` : sinStock ? 'Sin stock' : undefined}
            />
          </div>
        ) : (
          <p className="text-sm text-secundario">Escribí para buscar y elegí un producto con stock.</p>
        )}
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
  const saldo = Number(venta.saldo ?? venta.total ?? 0)
  const yaPagada = venta.estado === 'CONFIRMADA' && Number(venta.saldo ?? 0) <= 0

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
        toast.success('Efectivo recibido. Venta confirmada.')
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
