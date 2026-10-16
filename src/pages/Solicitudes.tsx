import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { NotePencilIcon, PlusIcon } from '@phosphor-icons/react'
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
import { listarClientes } from '../services/clienteService'
import {
  actualizarEstadoSolicitud,
  crearSolicitud,
  listarSolicitudes,
} from '../services/solicitudService'
import type { Cliente, SolicitudProducto } from '../types/domain'
import { formatDateTime } from '../utils/formatters'

export default function Solicitudes() {
  const toast = useToast()
  const [items, setItems] = useState<SolicitudProducto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
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
      listarSolicitudes({ estado: filtroEstado || undefined, limite: 50 }),
      listarClientes(),
    ]).then(
      ([sols, listaClientes]) => {
        if (!vigente) return
        setItems(sols.items)
        setClientes(listaClientes)
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

  const columnas: Column<SolicitudProducto>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (row) => (row.fechaHora ? formatDateTime(row.fechaHora) : '—'),
    },
    { key: 'desc', header: 'Producto solicitado', primary: true, cell: (row) => row.descripcionProducto },
    { key: 'cant', header: 'Cant.', cell: (row) => row.cantidad },
    { key: 'cliente', header: 'Cliente', cell: (row) => row.clienteNombre || '—' },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) => <Badge variant={row.estado === 'ATENDIDA' ? 'success' : 'neutral'}>{row.estado}</Badge>,
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
                  await actualizarEstadoSolicitud(row.id, 'ATENDIDA')
                  toast.success('Marcada como atendida.')
                  recargar()
                } catch (err) {
                  toast.error(mensajeError(err, 'No se pudo actualizar.'))
                }
              }}
            >
              Atender
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await actualizarEstadoSolicitud(row.id, 'CANCELADA')
                  toast.success('Solicitud cancelada.')
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
          <h2 className="text-xl font-semibold text-tinta">Solicitudes</h2>
          <p className="mt-1 text-sm text-secundario">Pedidos de productos no disponibles (apoyo a reposición).</p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva solicitud
        </Button>
      </header>

      <Select label="Estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
        <option value="">Todos</option>
        <option value="PENDIENTE">Pendiente</option>
        <option value="ATENDIDA">Atendida</option>
        <option value="CANCELADA">Cancelada</option>
      </Select>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando solicitudes…">
          <Skeleton className="h-48" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert variant="error" title="No se pudo cargar solicitudes" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Verifique sesión y permisos.
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState icon={NotePencilIcon} title="Sin solicitudes" description="Registre una solicitud de producto." />
      ) : (
        <Table caption="Solicitudes" columns={columnas} rows={items} getRowKey={(row) => row.id} />
      )}

      {creando && (
        <FormularioSolicitud
          clientes={clientes}
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await crearSolicitud(datos)
            toast.success('Solicitud creada.')
            setCreando(false)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioSolicitud({
  clientes,
  onClose,
  onSubmit,
}: {
  clientes: Cliente[]
  onClose: () => void
  onSubmit: (datos: {
    descripcionProducto: string
    cantidad: number
    observaciones?: string
    idCliente?: string
  }) => Promise<void>
}) {
  const [descripcion, setDescripcion] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [observaciones, setObservaciones] = useState('')
  const [idCliente, setIdCliente] = useState(clientes[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({
        descripcionProducto: descripcion,
        cantidad: Number(cantidad),
        observaciones: observaciones || undefined,
        idCliente: idCliente || undefined,
      })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la solicitud.'))
      setOcupado(false)
    }
  }

  return (
    <Modal title="Nueva solicitud" onClose={onClose} busy={ocupado} footer={<Button type="submit" form="form-solicitud" loading={ocupado}>Crear</Button>}>
      <form id="form-solicitud" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        {clientes.length > 0 && (
          <Select label="Cliente" value={idCliente} onChange={(e) => setIdCliente(e.target.value)}>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        )}
        <Input label="Producto solicitado" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <Input label="Cantidad" type="number" min="0.0001" step="any" required value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <Input label="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      </form>
    </Modal>
  )
}
