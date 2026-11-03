import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { MapPinIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import ActionMenu from '../components/ActionMenu'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Input from '../components/Input'
import LoadingState, { Skeleton } from '../components/LoadingState'
import Modal from '../components/Modal'
import Table from '../components/Table'
import type { Column } from '../components/Table'
import { useToast } from '../hooks/useToast'
import type { EstadoCarga } from '../hooks/estadoCarga'
import { mensajeError } from '../lib/errors'
import {
  crearUbicacion,
  editarUbicacion,
  eliminarUbicacion,
  listarUbicaciones,
} from '../services/catalogoService'
import type { DatosUbicacion, Ubicacion } from '../types/domain'

export default function Ubicaciones() {
  const toast = useToast()
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Ubicacion | null>(null)
  const [eliminando, setEliminando] = useState<Ubicacion | null>(null)
  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    listarUbicaciones().then(
      (datos) => {
        if (!vigente) return
        setUbicaciones(datos)
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

  const columnas: Column<Ubicacion>[] = [
    { key: 'codigo', header: 'Código', primary: true, cell: (row) => row.codigo },
    { key: 'pasillo', header: 'Pasillo', cell: (row) => row.pasillo },
    { key: 'estante', header: 'Estante', cell: (row) => row.estante },
    {
      key: 'acciones',
      header: 'Acciones',
      actions: true,
      cell: (row) => (
        <ActionMenu
          label={`Acciones de ${row.codigo}`}
          items={[
            { label: 'Editar', icon: PencilSimpleIcon, onSelect: () => setEditando(row) },
            { label: 'Eliminar', icon: TrashIcon, onSelect: () => setEliminando(row) },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Ubicaciones</h2>
          <p className="mt-1 text-sm text-secundario">
            Pasillo y estante donde se guarda cada producto. No se puede eliminar una ubicación en uso.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva ubicación
        </Button>
      </header>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando ubicaciones…">
          <Skeleton className="h-48" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert
          variant="error"
          title="No se pudo cargar las ubicaciones"
          action={
            <Button variant="secondary" onClick={recargar}>
              Reintentar
            </Button>
          }
        >
          Se requiere permiso para gestionar el catálogo.
        </Alert>
      ) : ubicaciones.length === 0 ? (
        <EmptyState
          icon={MapPinIcon}
          title="No hay ubicaciones"
          description="Cree la primera ubicación (código, pasillo y estante)."
        />
      ) : (
        <Table
          caption="Ubicaciones de almacén"
          columns={columnas}
          rows={ubicaciones}
          getRowKey={(row) => row.id}
        />
      )}

      {creando && (
        <FormularioUbicacion
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await crearUbicacion(datos)
            toast.success('Ubicación creada.')
            setCreando(false)
            recargar()
          }}
        />
      )}

      {editando && (
        <FormularioUbicacion
          inicial={editando}
          onClose={() => setEditando(null)}
          onSubmit={async (datos) => {
            await editarUbicacion(editando.id, datos)
            toast.success('Ubicación actualizada.')
            setEditando(null)
            recargar()
          }}
        />
      )}

      {eliminando && (
        <ConfirmDialog
          title="Eliminar ubicación"
          message={`Se eliminará la ubicación «${eliminando.codigo}».`}
          confirmLabel="Eliminar"
          variant="danger"
          onCancel={() => setEliminando(null)}
          onConfirm={async () => {
            await eliminarUbicacion(eliminando.id)
            toast.success('Ubicación eliminada.')
            setEliminando(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioUbicacion({
  inicial,
  onClose,
  onSubmit,
}: {
  inicial?: Ubicacion
  onClose: () => void
  onSubmit: (datos: DatosUbicacion) => Promise<void>
}) {
  const [codigo, setCodigo] = useState(inicial?.codigo ?? '')
  const [pasillo, setPasillo] = useState(inicial?.pasillo ?? '')
  const [estante, setEstante] = useState(inicial?.estante ?? '')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({ codigo, pasillo, estante })
    } catch (err) {
      setError(mensajeError(err, inicial ? 'No se pudo guardar la ubicación.' : 'No se pudo crear la ubicación.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title={inicial ? 'Editar ubicación' : 'Nueva ubicación'}
      onClose={onClose}
      busy={ocupado}
      footer={
        <Button type="submit" form="form-ubicacion" loading={ocupado}>
          {inicial ? 'Guardar' : 'Crear'}
        </Button>
      }
    >
      <form id="form-ubicacion" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input
          label="Código"
          name="codigo"
          required
          placeholder="Ej. A-01"
          value={codigo}
          onChange={(event) => setCodigo(event.target.value)}
        />
        <Input
          label="Pasillo"
          name="pasillo"
          required
          value={pasillo}
          onChange={(event) => setPasillo(event.target.value)}
        />
        <Input
          label="Estante"
          name="estante"
          required
          value={estante}
          onChange={(event) => setEstante(event.target.value)}
        />
      </form>
    </Modal>
  )
}
