import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { PencilSimpleIcon, PlusIcon, TagIcon, TrashIcon } from '@phosphor-icons/react'
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
import type { EstadoCarga } from '../hooks/estadoCarga'
import { useToast } from '../hooks/useToast'
import { mensajeError } from '../lib/errors'
import { crearMarca, editarMarca, eliminarMarca, listarMarcas } from '../services/catalogoService'
import type { Marca } from '../types/domain'

export default function Marcas() {
  const toast = useToast()
  const [items, setItems] = useState<Marca[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Marca | null>(null)
  const [eliminando, setEliminando] = useState<Marca | null>(null)

  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    listarMarcas().then(
      (lista) => {
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
  }, [intento])

  const columnas: Column<Marca>[] = [
    { key: 'nombre', header: 'Nombre', primary: true, cell: (row) => row.nombre },
    {
      key: 'acciones',
      header: 'Acciones',
      actions: true,
      cell: (row) => (
        <ActionMenu
          label={`Acciones de ${row.nombre}`}
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
          <h2 className="text-xl font-semibold text-tinta">Marcas</h2>
          <p className="mt-1 text-sm text-secundario">
            Alta, edición y eliminación de marcas. No se puede eliminar una marca con productos o modelos asociados.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva marca
        </Button>
      </header>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando marcas…">
          <Skeleton className="h-48" />
        </LoadingState>
      ) : estado === 'error' ? (
        <Alert variant="error" title="No se pudo cargar marcas" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Se requiere permiso de catálogo.
        </Alert>
      ) : items.length === 0 ? (
        <EmptyState icon={TagIcon} title="Sin marcas" description="Cree la primera marca." />
      ) : (
        <Table caption="Marcas" columns={columnas} rows={items} getRowKey={(row) => row.id} />
      )}

      {creando && (
        <FormularioMarca
          onClose={() => setCreando(false)}
          onSubmit={async (nombre) => {
            await crearMarca(nombre)
            toast.success('Marca creada.')
            setCreando(false)
            recargar()
          }}
        />
      )}

      {editando && (
        <FormularioMarca
          inicial={editando}
          onClose={() => setEditando(null)}
          onSubmit={async (nombre) => {
            await editarMarca(editando.id, nombre)
            toast.success('Marca actualizada.')
            setEditando(null)
            recargar()
          }}
        />
      )}

      {eliminando && (
        <ConfirmDialog
          title="Eliminar marca"
          message={`Se eliminará la marca «${eliminando.nombre}».`}
          confirmLabel="Eliminar"
          variant="danger"
          onCancel={() => setEliminando(null)}
          onConfirm={async () => {
            await eliminarMarca(eliminando.id)
            toast.success('Marca eliminada.')
            setEliminando(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioMarca({
  inicial,
  onClose,
  onSubmit,
}: {
  inicial?: Marca
  onClose: () => void
  onSubmit: (nombre: string) => Promise<void>
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit(nombre)
    } catch (err) {
      setError(mensajeError(err, inicial ? 'No se pudo guardar la marca.' : 'No se pudo crear la marca.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title={inicial ? 'Editar marca' : 'Nueva marca'}
      onClose={onClose}
      busy={ocupado}
      footer={<Button type="submit" form="form-marca" loading={ocupado}>{inicial ? 'Guardar' : 'Crear'}</Button>}
    >
      <form id="form-marca" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </form>
    </Modal>
  )
}
