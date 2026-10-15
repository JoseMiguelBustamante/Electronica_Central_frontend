import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { PlusIcon, TagIcon } from '@phosphor-icons/react'
import Alert from '../components/Alert'
import Button from '../components/Button'
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
import { crearCategoria, listarCategorias } from '../services/catalogoService'
import type { Categoria } from '../types/domain'

const columnas: Column<Categoria>[] = [
  { key: 'nombre', header: 'Nombre', primary: true, cell: (categoria) => categoria.nombre },
  { key: 'descripcion', header: 'Descripción', className: 'break-words', cell: (categoria) => categoria.descripcion || '—' },
]

export default function Categorias() {
  const toast = useToast()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [intento, setIntento] = useState(0)
  const [creando, setCreando] = useState(false)
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-tinta">Categorías</h2>
          <p className="mt-1 text-sm text-secundario">
            Altas de categoría. La API no guarda categoría padre ni permite editar o desactivar.
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
    </div>
  )
}

function FormularioCategoria({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (nombre: string, descripcion: string) => Promise<void>
}) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await onSubmit(nombre, descripcion)
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la categoría.'))
      setOcupado(false)
    }
  }

  return (
    <Modal title="Nueva categoría" onClose={onClose} busy={ocupado} footer={<Button type="submit" form="form-categoria" loading={ocupado}>Crear</Button>}>
      <form id="form-categoria" onSubmit={enviar} className="space-y-4">
        {error && <p className="text-sm text-peligro">{error}</p>}
        <Input label="Nombre" name="nombre" required value={nombre} onChange={(event) => setNombre(event.target.value)} />
        <Textarea label="Descripción" name="descripcion" value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
      </form>
    </Modal>
  )
}
