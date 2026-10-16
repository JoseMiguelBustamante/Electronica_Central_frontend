import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { PlusIcon, ShoppingCartIcon } from '@phosphor-icons/react'
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
import { cancelarCompra, crearCompra, listarCompras, recibirCompra } from '../services/compraService'
import { listarInventario } from '../services/inventarioService'
import { listarProveedores } from '../services/proveedorService'
import type { Compra, ItemInventario, Proveedor } from '../types/domain'
import { formatDateTime } from '../utils/formatters'

export default function Compras() {
  const toast = useToast()
  const [items, setItems] = useState<Compra[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<ItemInventario[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [creando, setCreando] = useState(false)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    Promise.all([
      listarCompras({ estado: filtroEstado || undefined, limite: 50 }),
      listarProveedores({ limite: 100 }),
      listarInventario({ limite: 100 }),
    ]).then(
      ([compras, provs, inv]) => {
        if (!vigente) return
        setItems(compras.items)
        setProveedores(provs.items)
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

  const columnas: Column<Compra>[] = [
    { key: 'fecha', header: 'Fecha', cell: (row) => (row.fecha ? formatDateTime(row.fecha) : '—') },
    { key: 'prov', header: 'Proveedor', primary: true, cell: (row) => row.proveedorNombre || row.idProveedor },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) => <Badge variant={row.estado === 'RECIBIDA' ? 'success' : 'neutral'}>{row.estado}</Badge>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      cell: (row) =>
        row.estado === 'PENDIENTE' ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await recibirCompra(row.id, claveIdempotencia('recv'))
                  toast.success('Compra recibida; stock actualizado.')
                  recargar()
                } catch (err) {
                  toast.error(mensajeError(err, 'No se pudo recibir.'))
                }
              }}
            >
              Recibir
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await cancelarCompra(row.id)
                  toast.success('Compra cancelada.')
                  recargar()
                } catch (err) {
                  toast.error(mensajeError(err, 'No se pudo cancelar.'))
                }
              }}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Compras</h2>
          <p className="mt-1 text-sm text-secundario">Órdenes a proveedores y recepción al inventario.</p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva compra
        </Button>
      </header>

      <Select label="Estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
        <option value="">Todos</option>
        <option value="PENDIENTE">Pendiente</option>
        <option value="RECIBIDA">Recibida</option>
        <option value="CANCELADA">Cancelada</option>
      </Select>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando compras…">
          <Skeleton className="h-48" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert
          variant="error"
          title="No se pudo cargar compras"
          action={
            <Button variant="secondary" onClick={recargar}>
              Reintentar
            </Button>
          }
        >
          Se requiere permiso COMPRAS_GESTIONAR.
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState icon={ShoppingCartIcon} title="Sin compras" description="Cree la primera orden de compra." />
      ) : (
        <Table caption="Compras" columns={columnas} rows={items} getRowKey={(row) => row.id} />
      )}

      {creando && (
        <FormularioCompra
          proveedores={proveedores}
          productos={productos}
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await crearCompra(datos)
            toast.success('Compra creada.')
            setCreando(false)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioCompra({
  proveedores,
  productos,
  onClose,
  onSubmit,
}: {
  proveedores: Proveedor[]
  productos: ItemInventario[]
  onClose: () => void
  onSubmit: (datos: {
    idProveedor: string
    detalles: Array<{ idProducto: string; cantidad: number; costoUnitario: number }>
  }) => Promise<void>
}) {
  const [idProveedor, setIdProveedor] = useState('')
  const [idProducto, setIdProducto] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [costo, setCosto] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({
        idProveedor,
        detalles: [{ idProducto, cantidad: Number(cantidad), costoUnitario: Number(costo) }],
      })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la compra.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title="Nueva compra"
      onClose={onClose}
      busy={ocupado}
      footer={
        <Button type="submit" form="form-compra" loading={ocupado}>
          Crear
        </Button>
      }
    >
      <form id="form-compra" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Select label="Proveedor" required value={idProveedor} onChange={(e) => setIdProveedor(e.target.value)}>
          <option value="">Seleccione…</option>
          {proveedores.filter((p) => p.activo).map((p) => (
            <option key={p.id} value={p.id}>
              {p.razonSocial}
            </option>
          ))}
        </Select>
        <Select label="Producto" required value={idProducto} onChange={(e) => setIdProducto(e.target.value)}>
          <option value="">Seleccione…</option>
          {productos.map((p) => (
            <option key={p.idProducto} value={p.idProducto}>
              {p.codigo} — {p.nombre}
            </option>
          ))}
        </Select>
        <Input label="Cantidad" type="number" min="0.0001" step="any" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <Input label="Costo unitario" type="number" min="0" step="any" required value={costo} onChange={(e) => setCosto(e.target.value)} />
      </form>
    </Modal>
  )
}
