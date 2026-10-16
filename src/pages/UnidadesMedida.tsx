import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { PencilSimpleIcon, PlusIcon, RulerIcon, TrashIcon } from '@phosphor-icons/react'
import ActionMenu from '../components/ActionMenu'
import Alert from '../components/Alert'
import Badge from '../components/Badge'
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
import { crearUnidad, editarUnidad, eliminarUnidad, listarUnidades } from '../services/catalogoService'
import type { Unidad } from '../types/domain'

export default function UnidadesMedida() {
  const toast = useToast()
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Unidad | null>(null)
  const [eliminando, setEliminando] = useState<Unidad | null>(null)
  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    listarUnidades().then(
      (datos) => {
        if (!vigente) return
        setUnidades(datos)
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

  const columnas: Column<Unidad>[] = [
    { key: 'nombre', header: 'Nombre', primary: true, cell: (unidad) => unidad.nombre },
    { key: 'simbolo', header: 'Símbolo', cell: (unidad) => unidad.simbolo },
    {
      key: 'fraccion',
      header: 'Fracción',
      cell: (unidad) => (
        <Badge variant={unidad.permiteFraccion ? 'info' : 'neutral'}>
          {unidad.permiteFraccion ? 'Permite fracción' : 'Solo enteros'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      actions: true,
      cell: (unidad) => (
        <ActionMenu
          label={`Acciones de ${unidad.nombre}`}
          items={[
            { label: 'Editar', icon: PencilSimpleIcon, onSelect: () => setEditando(unidad) },
            { label: 'Eliminar', icon: TrashIcon, onSelect: () => setEliminando(unidad) },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Unidades de medida</h2>
          <p className="mt-1 text-sm text-secundario">
            Alta, edición y eliminación de unidades. El símbolo no se puede repetir y no se puede eliminar una unidad en uso.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva unidad
        </Button>
      </header>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando unidades…"><Skeleton className="h-48" /></LoadingState>
      ) : estado === 'error' ? (
        <Alert variant="error" title="No se pudo cargar las unidades" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Se requiere permiso para gestionar el catálogo.
        </Alert>
      ) : unidades.length === 0 ? (
        <EmptyState icon={RulerIcon} title="No hay unidades" description="Cree la primera unidad de medida." />
      ) : (
        <Table caption="Unidades de medida" columns={columnas} rows={unidades} getRowKey={(unidad) => unidad.id} />
      )}

      {creando && (
        <FormularioUnidad
          onClose={() => setCreando(false)}
          onSubmit={async (datos) => {
            await crearUnidad(datos)
            toast.success('Unidad creada.')
            setCreando(false)
            recargar()
          }}
        />
      )}

      {editando && (
        <FormularioUnidad
          inicial={editando}
          onClose={() => setEditando(null)}
          onSubmit={async (datos) => {
            await editarUnidad(editando.id, datos)
            toast.success('Unidad actualizada.')
            setEditando(null)
            recargar()
          }}
        />
      )}

      {eliminando && (
        <ConfirmDialog
          title="Eliminar unidad"
          message={`Se eliminará la unidad «${eliminando.nombre}».`}
          confirmLabel="Eliminar"
          variant="danger"
          onCancel={() => setEliminando(null)}
          onConfirm={async () => {
            await eliminarUnidad(eliminando.id)
            toast.success('Unidad eliminada.')
            setEliminando(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioUnidad({
  inicial,
  onClose,
  onSubmit,
}: {
  inicial?: Unidad
  onClose: () => void
  onSubmit: (datos: { nombre: string; simbolo: string; permiteFraccion: boolean }) => Promise<void>
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [simbolo, setSimbolo] = useState(inicial?.simbolo ?? '')
  const [permiteFraccion, setPermiteFraccion] = useState(inicial?.permiteFraccion ?? false)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit({ nombre, simbolo, permiteFraccion })
    } catch (err) {
      setError(mensajeError(err, inicial ? 'No se pudo guardar la unidad.' : 'No se pudo crear la unidad.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title={inicial ? 'Editar unidad' : 'Nueva unidad'}
      onClose={onClose}
      busy={ocupado}
      footer={<Button type="submit" form="form-unidad" loading={ocupado}>{inicial ? 'Guardar' : 'Crear'}</Button>}
    >
      <form id="form-unidad" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input label="Nombre" name="nombre" required value={nombre} onChange={(event) => setNombre(event.target.value)} />
        <Input label="Símbolo" name="simbolo" required value={simbolo} onChange={(event) => setSimbolo(event.target.value)} />
        <label className="flex items-center gap-2 text-sm text-tinta">
          <input type="checkbox" checked={permiteFraccion} onChange={(event) => setPermiteFraccion(event.target.checked)} />
          Permite cantidades fraccionadas
        </label>
      </form>
    </Modal>
  )
}
