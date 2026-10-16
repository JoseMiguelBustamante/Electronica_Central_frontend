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
import Textarea from '../components/Textarea'
import { useToast } from '../hooks/useToast'
import type { EstadoCarga } from '../hooks/estadoCarga'
import { mensajeError } from '../lib/errors'
import { crearCategoria, editarCategoria, eliminarCategoria, listarCategorias } from '../services/catalogoService'
import type { Categoria } from '../types/domain'

export default function Categorias() {
  const toast = useToast()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [eliminando, setEliminando] = useState<Categoria | null>(null)
  const recargar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    let vigente = true
    listarCategorias().then(
      (datos) => {
        if (!vigente) return
        setCategorias(datos)
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

  const columnas: Column<Categoria>[] = [
    { key: 'nombre', header: 'Nombre', primary: true, cell: (categoria) => categoria.nombre },
    { key: 'descripcion', header: 'Descripción', className: 'break-words', cell: (categoria) => categoria.descripcion || '—' },
    {
      key: 'acciones',
      header: 'Acciones',
      actions: true,
      cell: (categoria) => (
        <ActionMenu
          label={`Acciones de ${categoria.nombre}`}
          items={[
            { label: 'Editar', icon: PencilSimpleIcon, onSelect: () => setEditando(categoria) },
            { label: 'Eliminar', icon: TrashIcon, onSelect: () => setEliminando(categoria) },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Categorías</h2>
          <p className="mt-1 text-sm text-secundario">
            Alta, edición y eliminación de categorías. No se puede eliminar una categoría con productos asociados.
          </p>
        </div>
        <Button onClick={() => setCreando(true)}>
          <PlusIcon size={18} aria-hidden="true" />
          Nueva categoría
        </Button>
      </header>

      {estado === 'cargando' ? (
        <LoadingState label="Cargando categorías…"><Skeleton className="h-48" /></LoadingState>
      ) : estado === 'error' ? (
        <Alert variant="error" title="No se pudo cargar las categorías" action={<Button variant="secondary" onClick={recargar}>Reintentar</Button>}>
          Se requiere permiso para gestionar el catálogo.
        </Alert>
      ) : categorias.length === 0 ? (
        <EmptyState icon={TagIcon} title="No hay categorías" description="Cree la primera categoría del catálogo." />
      ) : (
        <Table caption="Categorías" columns={columnas} rows={categorias} getRowKey={(categoria) => categoria.id} />
      )}

      {creando && (
        <FormularioCategoria
          onClose={() => setCreando(false)}
          onSubmit={async (nombre, descripcion) => {
            await crearCategoria({ nombre, descripcion })
            toast.success('Categoría creada.')
            setCreando(false)
            recargar()
          }}
        />
      )}

      {editando && (
        <FormularioCategoria
          inicial={editando}
          onClose={() => setEditando(null)}
          onSubmit={async (nombre, descripcion) => {
            await editarCategoria(editando.id, { nombre, descripcion })
            toast.success('Categoría actualizada.')
            setEditando(null)
            recargar()
          }}
        />
      )}

      {eliminando && (
        <ConfirmDialog
          title="Eliminar categoría"
          message={`Se eliminará la categoría «${eliminando.nombre}».`}
          confirmLabel="Eliminar"
          variant="danger"
          onCancel={() => setEliminando(null)}
          onConfirm={async () => {
            await eliminarCategoria(eliminando.id)
            toast.success('Categoría eliminada.')
            setEliminando(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioCategoria({
  inicial,
  onClose,
  onSubmit,
}: {
  inicial?: Categoria
  onClose: () => void
  onSubmit: (nombre: string, descripcion: string) => Promise<void>
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit(nombre, descripcion)
    } catch (err) {
      setError(mensajeError(err, inicial ? 'No se pudo guardar la categoría.' : 'No se pudo crear la categoría.'))
      setOcupado(false)
    }
  }

  return (
    <Modal
      title={inicial ? 'Editar categoría' : 'Nueva categoría'}
      onClose={onClose}
      busy={ocupado}
      footer={<Button type="submit" form="form-categoria" loading={ocupado}>{inicial ? 'Guardar' : 'Crear'}</Button>}
    >
      <form id="form-categoria" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input label="Nombre" name="nombre" required value={nombre} onChange={(event) => setNombre(event.target.value)} />
        <Textarea label="Descripción" name="descripcion" value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
      </form>
    </Modal>
  )
}
