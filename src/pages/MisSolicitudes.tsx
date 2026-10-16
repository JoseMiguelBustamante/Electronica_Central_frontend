import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { NotePencilIcon, PlusIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import type { EstadoCarga } from '../hooks/estadoCarga'
import { useToast } from '../hooks/useToast'
import { mensajeError } from '../lib/errors'
import { leerToken } from '../lib/session'
import { crearSolicitud, listarSolicitudes } from '../services/solicitudService'
import type { SolicitudProducto } from '../types/domain'
import { formatDateTime } from '../utils/formatters'
import { ROUTES } from '../utils/navigation'

export default function MisSolicitudes() {
  const toast = useToast()
  const conSesion = Boolean(leerToken())
  const [items, setItems] = useState<SolicitudProducto[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!conSesion) {
      setEstado('listo')
      return
    }
    let vigente = true
    listarSolicitudes({ limite: 50 }).then(
      ({ items: lista }) => {
        if (!vigente) return
        setItems(lista)
        setEstado('listo')
      },
      () => {
        if (vigente) setEstado('error')
      },
    )
    return () => {
      vigente = false
    }
  }, [intento, conSesion])

  if (!conSesion) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-tinta">Mis solicitudes</h1>
        <Alert variant="info" title="Necesitás una cuenta">
          <Link to={ROUTES.login} className="font-semibold text-mascara underline">
            Ingresá
          </Link>{' '}
          o{' '}
          <Link to={ROUTES.registro} className="font-semibold text-mascara underline">
            creá una cuenta
          </Link>{' '}
          para solicitar productos.
        </Alert>
      </div>
    )
  }

  const columnas: Column<SolicitudProducto>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (row) => (row.fechaHora ? formatDateTime(row.fechaHora) : '—'),
    },
    { key: 'desc', header: 'Producto', primary: true, cell: (row) => row.descripcionProducto },
    { key: 'cant', header: 'Cant.', cell: (row) => row.cantidad },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) => <Badge variant={row.estado === 'ATENDIDA' ? 'success' : 'neutral'}>{row.estado}</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-tinta">Mis solicitudes</h1>
          <p className="mt-1 text-sm text-secundario">
            Pedí productos que no encontraste o que querés consultar.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva solicitud
        </Button>
      </header>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando solicitudes…">
          <Skeleton className="h-40" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert
          variant="error"
          title="No se pudieron cargar"
          action={
            <Button variant="secondary" onClick={recargar}>
              Reintentar
            </Button>
          }
        >
          Revisá tu sesión e intentá de nuevo.
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState
          icon={NotePencilIcon}
          title="Sin solicitudes"
          description="Creá la primera solicitud de producto."
        />
      ) : (
        <Table caption="Mis solicitudes" columns={columnas} rows={items} getRowKey={(row) => row.id} />
      )}

      {creando && (
        <Formulario
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await crearSolicitud(datos)
            toast.success('Solicitud enviada.')
            setCreando(false)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function Formulario({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (datos: {
    descripcionProducto: string
    cantidad: number
    observaciones?: string
  }) => Promise<void>
}) {
  const [descripcion, setDescripcion] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [observaciones, setObservaciones] = useState('')
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
      })
    } catch (err) {
      setError(mensajeError(err, 'No se pudo enviar la solicitud.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title="Nueva solicitud"
      onClose={onClose}
      busy={ocupado}
      footer={
        <Button type="submit" form="form-mis-solicitud" loading={ocupado}>
          Enviar
        </Button>
      }
    >
      <form id="form-mis-solicitud" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input
          label="Producto solicitado"
          required
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <Input
          label="Cantidad"
          type="number"
          min="0.0001"
          step="any"
          required
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />
        <Input
          label="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />
      </form>
    </Modal>
  )
}
